import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CityResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  admin1?: string;
  timezone?: string;
}

export interface CitySearchResponse {
  results?: CityResult[];
}

export interface ForecastResponse {
  latitude: number;
  longitude: number;
  timezone: string;
  current?: {
    time: string;
    temperature_2m: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    wind_speed_10m: number;
    weather_code: number;
  };
  daily?: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max: number[];
  };
}

@Injectable({ providedIn: 'root' })
export class MetaWeatherService {
  private readonly geocodingUrl = 'https://geocoding-api.open-meteo.com/v1/search';
  private readonly forecastUrl = 'https://api.open-meteo.com/v1/forecast';

  constructor(private http: HttpClient) {}

  searchCity(query: string): Observable<CitySearchResponse> {
    return this.http.get<CitySearchResponse>(
      `${this.geocodingUrl}?name=${encodeURIComponent(query)}&count=8&language=en&format=json`
    );
  }

  getWeather(latitude: number, longitude: number): Observable<ForecastResponse> {
    return this.http.get<ForecastResponse>(
      `${this.forecastUrl}?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&forecast_days=7&timezone=auto`
    );
  }
}
