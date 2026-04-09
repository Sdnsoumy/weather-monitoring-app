import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MetaWeatherService, ForecastResponse } from '../metaweather.service';
import { PreferencesService, SavedCity, TemperatureUnit } from '../preferences.service';
import { Subscription } from 'rxjs';

interface ProbabilityInsight {
  title: string;
  value: number;
  color: string;
  subtitle: string;
}

interface HourlyRiskPoint {
  time: string;
  rainProbability: number;
}

type ThemeMode = 'light' | 'dark';

@Component({
  selector: 'app-weather',
  imports: [CommonModule, RouterLink],
  templateUrl: './weather.component.html',
  styleUrl: './weather.component.css'
})
export class WeatherComponent {
  cityName = 'Bhubaneswar';
  country = 'India';
  isLoading = true;
  errorMessage = '';
  forecast?: ForecastResponse;
  temperatureUnit: TemperatureUnit = 'C';
  themeMode: ThemeMode = this.loadThemeMode();
  isCurrentFavorite = false;
  probabilityInsights: ProbabilityInsight[] = [];
  hourlyRiskChart: HourlyRiskPoint[] = [];
  smartTips: string[] = [];

  private readonly subscriptions = new Subscription();
  private currentCity: SavedCity = {
    name: 'Bhubaneswar',
    country: 'India',
    latitude: 20.2961,
    longitude: 85.8245
  };

  constructor(
    private route: ActivatedRoute,
    private weatherService: MetaWeatherService,
    private preferencesService: PreferencesService
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.preferencesService.unit$.subscribe((unit) => {
        this.temperatureUnit = unit;
      })
    );

    this.subscriptions.add(
      this.preferencesService.favorites$.subscribe(() => {
        this.isCurrentFavorite = this.preferencesService.isFavorite(this.currentCity);
      })
    );

    this.subscriptions.add(this.route.queryParamMap.subscribe((params) => {
      const latParam = params.get('lat');
      const lonParam = params.get('lon');
      const lat = latParam !== null ? Number.parseFloat(latParam) : Number.NaN;
      const lon = lonParam !== null ? Number.parseFloat(lonParam) : Number.NaN;
      const city = params.get('city');
      const country = params.get('country');

      if (!Number.isNaN(lat) && !Number.isNaN(lon)) {
        this.currentCity = {
          name: city ?? this.cityName,
          country: country ?? this.country,
          latitude: lat,
          longitude: lon
        };
      } else {
        this.currentCity = this.preferencesService.getDefaultCitySnapshot() ?? this.currentCity;
      }

      this.cityName = this.currentCity.name;
      this.country = this.currentCity.country;
      this.preferencesService.addRecentCity(this.currentCity);
      this.isCurrentFavorite = this.preferencesService.isFavorite(this.currentCity);
      this.loadWeather(this.currentCity.latitude, this.currentCity.longitude);
    }));
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  loadWeather(latitude: number, longitude: number): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.weatherService.getWeather(latitude, longitude).subscribe({
      next: (response) => {
        this.forecast = response;
        this.buildInsights(response);
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Could not load weather data. Please try again.';
        this.isLoading = false;
      }
    });
  }

  weatherLabel(code: number | undefined): string {
    if (code === undefined) {
      return 'Unknown';
    }

    if (code === 0) {
      return 'Clear sky';
    }
    if ([1, 2, 3].includes(code)) {
      return 'Partly cloudy';
    }
    if ([45, 48].includes(code)) {
      return 'Foggy';
    }
    if ([51, 53, 55, 56, 57].includes(code)) {
      return 'Drizzle';
    }
    if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
      return 'Rain';
    }
    if ([71, 73, 75, 77, 85, 86].includes(code)) {
      return 'Snow';
    }
    if ([95, 96, 99].includes(code)) {
      return 'Thunderstorm';
    }

    return 'Unstable weather';
  }

  weatherIcon(code: number | undefined): string {
    if (code === undefined) {
      return '🌤️';
    }
    if (code === 0) {
      return '☀️';
    }
    if ([1, 2, 3].includes(code)) {
      return '⛅';
    }
    if ([45, 48].includes(code)) {
      return '🌫️';
    }
    if ([51, 53, 55, 56, 57].includes(code)) {
      return '🌦️';
    }
    if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
      return '🌧️';
    }
    if ([71, 73, 75, 77, 85, 86].includes(code)) {
      return '❄️';
    }
    if ([95, 96, 99].includes(code)) {
      return '⛈️';
    }
    return '🌤️';
  }

  toggleFavorite(): void {
    this.preferencesService.toggleFavorite(this.currentCity);
  }

  setThemeMode(mode: ThemeMode): void {
    this.themeMode = mode;
    localStorage.setItem('weather.themeMode', mode);
  }

  setAsDefaultCity(): void {
    this.preferencesService.setDefaultCity(this.currentCity);
  }

  formatTemperature(valueInCelsius: number): number {
    return this.preferencesService.convertTemperature(valueInCelsius, this.temperatureUnit);
  }

  ringBackground(value: number, color: string): string {
    const safeValue = Math.max(0, Math.min(100, value));
    return `conic-gradient(${color} ${safeValue}%, #dbe5f5 ${safeValue}% 100%)`;
  }

  barOpacity(value: number): number {
    return 0.25 + Math.min(0.75, value / 100);
  }

  private buildInsights(response: ForecastResponse): void {
    const hourly = response.hourly;
    const current = response.current;

    if (!hourly || !current) {
      this.probabilityInsights = [];
      this.hourlyRiskChart = [];
      this.smartTips = [];
      return;
    }

    const rainSamples = hourly.precipitation_probability.slice(0, 24);
    const weatherSamples = hourly.weather_code.slice(0, 24);
    const windSamples = hourly.wind_speed_10m.slice(0, 24);

    const rainProbability = this.avg(rainSamples);
    const stormSignals = weatherSamples.filter((code) => [95, 96, 99].includes(code)).length;
    const stormProbability = Math.min(
      100,
      Math.round(stormSignals * 18 + this.avg(windSamples) * 1.4 + rainProbability * 0.35)
    );

    const comfortPenalty =
      Math.max(0, Math.abs(current.temperature_2m - 24) * 2.3) +
      Math.max(0, current.relative_humidity_2m - 60) * 0.6 +
      rainProbability * 0.35 +
      this.avg(windSamples) * 0.9;
    const outdoorScore = Math.max(0, Math.min(100, Math.round(100 - comfortPenalty)));

    this.probabilityInsights = [
      {
        title: 'Rain Probability',
        value: Math.round(rainProbability),
        color: '#0ea5e9',
        subtitle: 'next 24 hours'
      },
      {
        title: 'Storm Probability',
        value: stormProbability,
        color: '#f97316',
        subtitle: 'AI signal estimate'
      },
      {
        title: 'Outdoor Comfort',
        value: outdoorScore,
        color: '#22c55e',
        subtitle: 'AI activity score'
      }
    ];

    this.hourlyRiskChart = hourly.time.slice(0, 12).map((time, index) => ({
      time: new Date(time).toLocaleTimeString([], { hour: 'numeric' }),
      rainProbability: hourly.precipitation_probability[index] ?? 0
    }));

    const tips: string[] = [];
    if (rainProbability >= 50) {
      tips.push('Carry an umbrella; rain risk is elevated.');
    }
    if (stormProbability >= 45) {
      tips.push('Avoid exposed outdoor plans due to possible storm activity.');
    }
    if (outdoorScore >= 70) {
      tips.push('Great window for walking, running, or cycling.');
    }
    if (current.wind_speed_10m > 25) {
      tips.push('Wind is strong; secure loose outdoor items.');
    }
    this.smartTips = tips.length
      ? tips
      : ['Weather is fairly stable. Keep light hydration and check updates every 6 hours.'];
  }

  private avg(values: number[]): number {
    if (!values.length) {
      return 0;
    }
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  private loadThemeMode(): ThemeMode {
    const savedMode = localStorage.getItem('weather.themeMode');
    return savedMode === 'dark' ? 'dark' : 'light';
  }

}
