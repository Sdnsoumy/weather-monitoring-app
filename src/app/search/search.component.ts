import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MetaWeatherService, CityResult } from '../metaweather.service';
import { CommonModule } from '@angular/common';

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

  constructor(
    private weatherService: MetaWeatherService,
    private router: Router
  ) {}

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
    this.router.navigate(['/'], {
      queryParams: {
        city: city.name,
        lat: city.latitude,
        lon: city.longitude,
        country: city.country
      }
    });
  }

}
