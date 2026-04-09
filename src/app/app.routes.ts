import { Routes } from '@angular/router';
import { WeatherComponent } from './weather/weather.component';
import { SearchComponent } from './search/search.component';

export const routes: Routes = [
  { path: '', component: WeatherComponent },
  { path: 'search', component: SearchComponent }
];
