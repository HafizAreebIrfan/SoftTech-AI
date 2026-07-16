export interface WeatherApiResponse {
  location?: {
    name?: string;
  };
  current?: {
    temp_c?: number;
    wind_dir?: string;
    wind_kph?: number;
    feelslike_c?: number;
    humidity?: number;
    condition?: {
      text?: string;
    };
  };
  forecast?: {
    forecastday?: Array<{
      day?: {
        maxtemp_c?: number;
        mintemp_c?: number;
      };
    }>;
  };
}

export interface ForecastApiResponse {
  location?: {
    name?: string;
    lat?: number;
    lon?: number;
  };
  forecast?: {
    forecastday?: Array<{
      date?: string;
      day?: {
        maxtemp_c?: number;
        mintemp_c?: number;
        maxwind_kph?: number;
        avghumidity?: number;
        condition?: {
          text?: string;
          icon?: string;
        };
        uv?: number;
      };
      astro?: {
        sunrise?: string;
        sunset?: string;
        moonrise?: string;
        moonset?: string;
        moon_phase?: string;
        moon_illumination?: string;
      };
    }>;
  };
}

export interface AirQualityApiResponse {
  list?: Array<{
    main?: {
      aqi?: number;
    };
    components?: {
      co?: number;
      no?: number;
      no2?: number;
      o3?: number;
      so2?: number;
      pm2_5?: number;
      pm10?: number;
      nh3?: number;
    };
  }>;
}
