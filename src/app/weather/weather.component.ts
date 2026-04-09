import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MetaWeatherService, ForecastResponse } from '../metaweather.service';

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

  constructor(
    private route: ActivatedRoute,
    private weatherService: MetaWeatherService
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const latParam = params.get('lat');
      const lonParam = params.get('lon');
      const lat = latParam !== null ? Number.parseFloat(latParam) : Number.NaN;
      const lon = lonParam !== null ? Number.parseFloat(lonParam) : Number.NaN;
      const city = params.get('city');
      const country = params.get('country');

      if (city) {
        this.cityName = city;
      }
      if (country) {
        this.country = country;
      }

      if (!Number.isNaN(lat) && !Number.isNaN(lon)) {
        this.loadWeather(lat, lon);
      } else {
        this.loadWeather(20.2961, 85.8245);
      }
    });
  }

  loadWeather(latitude: number, longitude: number): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.weatherService.getWeather(latitude, longitude).subscribe({
      next: (response) => {
        this.forecast = response;
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

}
