import { z } from "zod";

export const getWeatherInputSchema = z.object({
  city: z.string().min(1).describe("The city for which to show weather data"),
});

export const getForecastInputSchema = z.object({
  city: z
    .string()
    .min(1)
    .describe("The city for which to show forecast weather data"),
});

export const getAirQualityInputSchema = z.object({
  city: z
    .string()
    .min(1)
    .describe("The city for which to show air quality data"),
});
