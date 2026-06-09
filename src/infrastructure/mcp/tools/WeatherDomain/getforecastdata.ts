import { registerAppTool } from "@modelcontextprotocol/ext-apps/server";
import { env } from "../../../config/env";
import { WeatherServer } from "../../server/mcpserver";
import { ForecastApiResponse } from "../../../../domain/interface/weatherinterface";
import { getForecastInputSchema } from "../../Schemas/InputSchema/weatherinputschema";
import { getForecastOutputSchema } from "../../Schemas/OutputSchema/weatheroutputschema";

registerAppTool(
  WeatherServer,
  "get_forecast_data",
  {
    title: "Show Forecast Data",
    description: "Returns forecast weather details for a city.",
    inputSchema: getForecastInputSchema,
    outputSchema: getForecastOutputSchema,
    _meta: {
      ui: {
        resourceUri: "ui://weather/forecast-weather.html",
      },
    },
  },
  async ({ city }) => {
    const forecastData = await loadForecastData(city);
    return {
      structuredContent: forecastData,
      content: [
        {
          type: "text",
          text: `${forecastData.city}: ${forecastData.maxtemp_c}C, ${forecastData.condition}, humidity ${forecastData.avghumidity}%`,
        },
      ],
      _meta: {
        lastFetched: new Date().toISOString(),
        source: "weatherapi.com",
      },
    };
  },
);

async function loadForecastData(city: string) {
  if (!env.WEATHERAPIKEY) {
    throw new Error("WEATHER_API_KEY is not configured");
  }

  const response = await fetch(
    `https://api.weatherapi.com/v1/forecast.json?key=${env.WEATHERAPIKEY}&q=${encodeURIComponent(city)}&days=4`,
  );

  if (!response.ok) {
    throw new Error(
      `Weather provider request failed with status ${response.status}`,
    );
  }

  const summary = (await response.json()) as ForecastApiResponse;
  const forecast = summary.forecast?.forecastday?.map((item) => ({
    date: item.date,
    maxtemp_c: item.day?.maxtemp_c,
    mintemp_c: item.day?.mintemp_c,
    maxwind_kph: item.day?.maxwind_kph,
    avghumidity: item.day?.avghumidity,
    condition: item.day?.condition?.text,
    conditionIcon: item.day?.condition?.icon,
    uv: item.day?.uv,
    sunrise: item.astro?.sunrise,
    sunset: item.astro?.sunset,
    moonrise: item.astro?.moonrise,
    moonset: item.astro?.moonset,
    moon_phase: item.astro?.moon_phase,
    moon_illumination: item.astro?.moon_illumination,
  }));

  return getForecastOutputSchema.parse({
    city: summary.location?.name || city,
    forecast,
  });
}
