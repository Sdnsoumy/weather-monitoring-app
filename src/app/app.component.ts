import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { PreferencesService, TemperatureUnit } from './preferences.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  temperatureUnit: TemperatureUnit = 'C';
  favoritesCount = 0;

  constructor(private preferencesService: PreferencesService) {
    this.preferencesService.unit$.subscribe((unit) => {
      this.temperatureUnit = unit;
    });

    this.preferencesService.favorites$.subscribe((favorites) => {
      this.favoritesCount = favorites.length;
    });
  }

  setUnit(unit: TemperatureUnit): void {
    this.preferencesService.setUnit(unit);
  }
}
