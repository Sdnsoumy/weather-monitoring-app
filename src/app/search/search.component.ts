import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MetaWeatherService, CityResult } from '../metaweather.service';
import { CommonModule } from '@angular/common';
import { PreferencesService, SavedCity } from '../preferences.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-search',
  imports: [CommonModule, FormsModule],
  templateUrl: './search.component.html',
  styleUrl: './search.component.css'
})
export class SearchComponent {
  query = '';
  isLoading = false;
  errorMessage = '';
  cities: CityResult[] = [];
  recentCities: SavedCity[] = [];
  favorites: SavedCity[] = [];

  private readonly subscriptions = new Subscription();

  constructor(
    private weatherService: MetaWeatherService,
    private router: Router,
    private preferencesService: PreferencesService
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.preferencesService.recentCities$.subscribe((cities) => {
        this.recentCities = cities;
      })
    );

    this.subscriptions.add(
      this.preferencesService.favorites$.subscribe((cities) => {
        this.favorites = cities;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  onSearch(): void {
    const term = this.query.trim();
    this.errorMessage = '';
    this.cities = [];

    if (term.length < 2) {
      this.errorMessage = 'Please enter at least 2 characters to search.';
      return;
    }

    this.isLoading = true;
    this.weatherService.searchCity(term).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.cities = response.results ?? [];
        if (!this.cities.length) {
          this.errorMessage = 'No matching city found. Try a different name.';
        }
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage = 'Could not fetch city data right now. Please try again.';
      }
    });
  }

  viewWeather(city: CityResult): void {
    this.preferencesService.addRecentCity(this.toSavedCity(city));
    this.router.navigate(['/'], {
      queryParams: {
        city: city.name,
        lat: city.latitude,
        lon: city.longitude,
        country: city.country
      }
    });
  }

  useRecentCity(city: SavedCity): void {
    this.query = city.name;
    this.preferencesService.addRecentCity(city);
    this.router.navigate(['/'], {
      queryParams: {
        city: city.name,
        lat: city.latitude,
        lon: city.longitude,
        country: city.country
      }
    });
  }

  openFavorite(city: SavedCity): void {
    this.useRecentCity(city);
  }

  removeFavorite(city: SavedCity): void {
    this.preferencesService.removeFavorite(city);
  }

  clearAllFavorites(): void {
    this.preferencesService.clearFavorites();
  }

  toggleFavorite(city: CityResult): void {
    this.preferencesService.toggleFavorite(this.toSavedCity(city));
  }

  isFavorite(city: CityResult): boolean {
    return this.preferencesService.isFavorite(this.toSavedCity(city));
  }

  private toSavedCity(city: CityResult): SavedCity {
    return {
      name: city.name,
      country: city.country,
      latitude: city.latitude,
      longitude: city.longitude,
      admin1: city.admin1
    };
  }

}
