import type { McpToolResultPayload } from "../../domain/entities/GenericWidget";

/**
 * Weather fixture — WeatherAPI.com shape. The renderer detects a weather result
 * from the entity name and/or `data.current`/`data.forecast`, and renders
 * WeatherBlock. The forecast strip needs more than one `forecastday`.
 */
export const weatherPayload: McpToolResultPayload = {
  structuredContent: {
    title: "Weather in New York",
    subtitle: "Current conditions & 3-day forecast",
    data: {
      location: { name: "New York", region: "New York", country: "United States" },
      current: {
        temp_c: 22,
        temp_f: 71.6,
        feelslike_c: 21,
        humidity: 58,
        wind_kph: 14.4,
        chance_of_rain: 10,
        uv: 5,
        condition: {
          text: "Partly cloudy",
          icon: "https://cdn.weatherapi.com/weather/64x64/day/116.png",
        },
      },
      forecast: {
        forecastday: [
          {
            date: "2026-09-12",
            day: {
              maxtemp_c: 24,
              mintemp_c: 17,
              daily_chance_of_rain: 10,
              condition: {
                text: "Sunny",
                icon: "https://cdn.weatherapi.com/weather/64x64/day/113.png",
              },
            },
          },
          {
            date: "2026-09-13",
            day: {
              maxtemp_c: 21,
              mintemp_c: 16,
              daily_chance_of_rain: 60,
              condition: {
                text: "Light rain",
                icon: "https://cdn.weatherapi.com/weather/64x64/day/296.png",
              },
            },
          },
          {
            date: "2026-09-14",
            day: {
              maxtemp_c: 23,
              mintemp_c: 15,
              daily_chance_of_rain: 20,
              condition: {
                text: "Partly cloudy",
                icon: "https://cdn.weatherapi.com/weather/64x64/day/116.png",
              },
            },
          },
        ],
      },
    },
    collection: { entity: "weather", layout: "general" },
    audience: "customer",
  },
};
