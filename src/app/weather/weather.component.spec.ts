import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';

import { WeatherComponent } from './weather.component';
import { MetaWeatherService } from '../metaweather.service';

describe('WeatherComponent', () => {
  let component: WeatherComponent;
  let fixture: ComponentFixture<WeatherComponent>;

  beforeEach(async () => {
    const weatherServiceSpy = jasmine.createSpyObj<MetaWeatherService>('MetaWeatherService', ['getWeather']);
    weatherServiceSpy.getWeather.and.returnValue(
      of({
        latitude: 20.2961,
        longitude: 85.8245,
        timezone: 'auto',
        current: {
          time: '2026-04-09T10:00',
          temperature_2m: 30,
          apparent_temperature: 33,
          relative_humidity_2m: 62,
          wind_speed_10m: 11,
          weather_code: 2
        },
        daily: {
          time: ['2026-04-09'],
          weather_code: [2],
          temperature_2m_max: [34],
          temperature_2m_min: [25],
          precipitation_probability_max: [40]
        }
      })
    );

    await TestBed.configureTestingModule({
      imports: [WeatherComponent],
      providers: [
        { provide: MetaWeatherService, useValue: weatherServiceSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            queryParamMap: of(convertToParamMap({}))
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(WeatherComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
