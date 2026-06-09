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

const forecastDaySchema = z.object({
  date: z.string(),
  maxtemp_c: z.number(),
  mintemp_c: z.number(),
  maxwind_kph: z.number(),
  avghumidity: z.number(),
  condition: z.string(),
  condition_icon: z.string(),
  uv: z.number(),
  sunrise: z.string(),
  sunset: z.string(),
  moonrise: z.string(),
  moonset: z.string(),
  moon_phase: z.string(),
  moon_illumination: z.number(),
});

export const getForecastOutputSchema = z.object({
  city: z.string(),
  forecast: z.array(forecastDaySchema).min(1),
});

export const getAirQualityOutputSchema = z.object({
  city: z.string(),
  aqi: z.number(),
  aqi_category: z.string(),
  aqi_co: z.number(),
  aqi_no: z.number(),
  aqi_no2: z.number(),
  aqi_o3: z.number(),
  aqi_so2: z.number(),
  aqi_pm2_5: z.number(),
  aqi_pm10: z.number(),
  aqi_nh3: z.number(),
});
