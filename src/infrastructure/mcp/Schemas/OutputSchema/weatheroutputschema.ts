import { z } from "zod";

export const getWeatherOutputSchema = z.object({
  city: z.string(),
  temperature: z.number(),
  condition: z.string(),
  windDirection: z.string(),
  windSpeed: z.number(),
  high: z.number(),
  low: z.number(),
  feelsLike: z.number(),
  humidity: z.number(),
});

export const getForecastOutputSchema = z.object({
  city: z.string(),
  date: z.string(),
  maxtemp_c: z.number(),
  mintemp_c: z.number(),
  maxwind_kph: z.number(),
  avghumidity: z.number(),
  condition: z.string(),
  uv: z.number(),
  sunrise: z.string(),
  sunset: z.string(),
  moonrise: z.string(),
  moonset: z.string(),
  moonphase: z.string(),
  moonillumination: z.number(),
});

export const getAirQualityOutputSchema = z.object({
  city: z.string(),
  aqi: z.number(),
  aqi_category: z.string(),
  co: z.number(),
  no: z.number(),
  no2: z.number(),
  o3: z.number(),
  so2: z.number(),
  pm2_5: z.number(),
  pm10: z.number(),
  nh3: z.number(),
});
