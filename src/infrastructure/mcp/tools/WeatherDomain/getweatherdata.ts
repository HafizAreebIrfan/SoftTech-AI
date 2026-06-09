import { registerAppTool } from "@modelcontextprotocol/ext-apps/server";
import { env } from "../../../config/env";
import { WeatherServer } from "../../server/mcpserver";
import { WeatherApiResponse } from "../../../../domain/interface/weatherinterface";
import { getWeatherInputSchema } from "../../Schemas/InputSchema/weatherinputschema";
import { getWeatherOutputSchema } from "../../Schemas/OutputSchema/weatheroutputschema";

registerAppTool(
  WeatherServer,
  "get_weather_data",
  {
    title: "Show Weather Data",
    description: "Returns current weather details for a city in Celsius.",
    inputSchema: getWeatherInputSchema,
    outputSchema: getWeatherOutputSchema,
    _meta: {
      ui: {
        resourceUri: "ui://weather/current-weather.html",
      },
    },
  },
  async ({ city }) => {
    const weatherData = await loadWeatherData(city);
    return {
      structuredContent: weatherData,
      content: [
        {
          type: "text",
          text: `${weatherData.city}: ${weatherData.temperature}C, ${weatherData.condition}, humidity ${weatherData.humidity}%`,
        },
      ],
      _meta: {
        lastFetched: new Date().toISOString(),
        source: "weatherapi.com",
      },
    };
  },
);

async function loadWeatherData(city: string) {
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

  const summary = (await response.json()) as WeatherApiResponse;
  const today = summary.forecast?.forecastday?.[0]?.day;
  const current = summary.current;

  return getWeatherOutputSchema.parse({
    city: summary.location?.name || city,
    temperature: current?.temp_c,
    condition: current?.condition?.text,
    windDirection: current?.wind_dir,
    windSpeed: current?.wind_kph,
    high: today?.maxtemp_c,
    low: today?.mintemp_c,
    feelsLike: current?.feelslike_c,
    humidity: current?.humidity,
  });
}
