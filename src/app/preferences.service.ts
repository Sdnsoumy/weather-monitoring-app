import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type TemperatureUnit = 'C' | 'F';

export interface SavedCity {
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  admin1?: string;
}

const UNIT_KEY = 'weather.unit';
const FAVORITES_KEY = 'weather.favorites';
const RECENTS_KEY = 'weather.recents';
const DEFAULT_CITY_KEY = 'weather.defaultCity';

@Injectable({ providedIn: 'root' })
export class PreferencesService {
  private readonly unitSubject = new BehaviorSubject<TemperatureUnit>(this.loadUnit());
  readonly unit$ = this.unitSubject.asObservable();

  private readonly favoritesSubject = new BehaviorSubject<SavedCity[]>(this.loadCities(FAVORITES_KEY));
  readonly favorites$ = this.favoritesSubject.asObservable();

  private readonly recentCitiesSubject = new BehaviorSubject<SavedCity[]>(this.loadCities(RECENTS_KEY));
  readonly recentCities$ = this.recentCitiesSubject.asObservable();

  private readonly defaultCitySubject = new BehaviorSubject<SavedCity | null>(this.loadDefaultCity());
  readonly defaultCity$ = this.defaultCitySubject.asObservable();

  getUnitSnapshot(): TemperatureUnit {
    return this.unitSubject.value;
  }

  getFavoritesSnapshot(): SavedCity[] {
    return this.favoritesSubject.value;
  }

  getRecentCitiesSnapshot(): SavedCity[] {
    return this.recentCitiesSubject.value;
  }

  getDefaultCitySnapshot(): SavedCity | null {
    return this.defaultCitySubject.value;
  }

  setUnit(unit: TemperatureUnit): void {
    this.unitSubject.next(unit);
    localStorage.setItem(UNIT_KEY, unit);
  }

  toggleUnit(): void {
    this.setUnit(this.unitSubject.value === 'C' ? 'F' : 'C');
  }

  convertTemperature(celsius: number, unit = this.unitSubject.value): number {
    if (unit === 'F') {
      return Math.round((celsius * 9) / 5 + 32);
    }
    return Math.round(celsius);
  }

  addFavorite(city: SavedCity): void {
    if (this.hasCity(this.favoritesSubject.value, city)) {
      return;
    }
    const updated = [city, ...this.favoritesSubject.value];
    this.updateCities(FAVORITES_KEY, this.favoritesSubject, updated);
  }

  removeFavorite(city: SavedCity): void {
    const updated = this.favoritesSubject.value.filter((item) => !this.isSameCity(item, city));
    this.updateCities(FAVORITES_KEY, this.favoritesSubject, updated);
  }

  clearFavorites(): void {
    this.updateCities(FAVORITES_KEY, this.favoritesSubject, []);
  }

  toggleFavorite(city: SavedCity): void {
    if (this.isFavorite(city)) {
      this.removeFavorite(city);
      return;
    }
    this.addFavorite(city);
  }

  isFavorite(city: SavedCity): boolean {
    return this.hasCity(this.favoritesSubject.value, city);
  }

  addRecentCity(city: SavedCity): void {
    const withoutCurrent = this.recentCitiesSubject.value.filter((item) => !this.isSameCity(item, city));
    const updated = [city, ...withoutCurrent].slice(0, 8);
    this.updateCities(RECENTS_KEY, this.recentCitiesSubject, updated);
  }

  setDefaultCity(city: SavedCity | null): void {
    this.defaultCitySubject.next(city);
    if (city) {
      localStorage.setItem(DEFAULT_CITY_KEY, JSON.stringify(city));
      return;
    }
    localStorage.removeItem(DEFAULT_CITY_KEY);
  }

  private loadUnit(): TemperatureUnit {
    const raw = localStorage.getItem(UNIT_KEY);
    if (raw === 'F') {
      return 'F';
    }
    return 'C';
  }

  private loadDefaultCity(): SavedCity | null {
    try {
      const raw = localStorage.getItem(DEFAULT_CITY_KEY);
      if (!raw) {
        return null;
      }
      return JSON.parse(raw) as SavedCity;
    } catch {
      return null;
    }
  }

  private loadCities(key: string): SavedCity[] {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) {
        return [];
      }
      const parsed = JSON.parse(raw) as SavedCity[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private updateCities(
    key: string,
    subject: BehaviorSubject<SavedCity[]>,
    value: SavedCity[]
  ): void {
    subject.next(value);
    localStorage.setItem(key, JSON.stringify(value));
  }

  private hasCity(cities: SavedCity[], city: SavedCity): boolean {
    return cities.some((item) => this.isSameCity(item, city));
  }

  private isSameCity(a: SavedCity, b: SavedCity): boolean {
    return a.latitude === b.latitude && a.longitude === b.longitude && a.name === b.name;
  }
}
