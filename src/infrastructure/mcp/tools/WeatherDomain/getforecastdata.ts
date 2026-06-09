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
    const firstDay = forecastData.forecast[0];

    return {
      structuredContent: forecastData,
      content: [
        {
          type: "text",
          text: `${forecastData.city}: ${firstDay.maxtemp_c}C high, ${firstDay.condition}, humidity ${firstDay.avghumidity}%`,
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
  const forecast =
    summary.forecast?.forecastday?.map((item) => ({
      date: item.date ?? "",
      maxtemp_c: item.day?.maxtemp_c ?? 0,
      mintemp_c: item.day?.mintemp_c ?? 0,
      maxwind_kph: item.day?.maxwind_kph ?? 0,
      avghumidity: item.day?.avghumidity ?? 0,
      condition: item.day?.condition?.text ?? "Unknown",
      condition_icon: item.day?.condition?.icon ?? "",
      uv: item.day?.uv ?? 0,
      sunrise: item.astro?.sunrise ?? "",
      sunset: item.astro?.sunset ?? "",
      moonrise: item.astro?.moonrise ?? "",
      moonset: item.astro?.moonset ?? "",
      moon_phase: item.astro?.moon_phase ?? "",
      moon_illumination: Number(item.astro?.moon_illumination ?? 0),
    })) ?? [];

  return getForecastOutputSchema.parse({
    city: summary.location?.name || city,
    forecast,
  });
}
