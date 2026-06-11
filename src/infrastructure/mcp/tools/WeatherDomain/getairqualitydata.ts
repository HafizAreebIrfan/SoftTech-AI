import { registerAppTool } from "@modelcontextprotocol/ext-apps/server";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { env } from "../../../config/env";
import {
  AirQualityApiResponse,
  ForecastApiResponse,
} from "../../../../domain/interface/weatherinterface";
import { getAirQualityInputSchema } from "../../Schemas/InputSchema/weatherinputschema";
import { getAirQualityOutputSchema } from "../../Schemas/OutputSchema/weatheroutputschema";

export const registerAirQualityWeatherTool = (server: McpServer) => {
  registerAppTool(
    server,
    "get_airquality_data",
    {
      title: "Show Air Quality Data",
      description: "Returns air quality details for a city.",
      inputSchema: getAirQualityInputSchema,
      outputSchema: getAirQualityOutputSchema,
      _meta: {
        ui: {
          resourceUri: "ui://weather/airquality-weather.html",
        },
      },
    },
    async ({ city }) => {
      const airqualityData = await loadAirQualityData(city);
      return {
        structuredContent: airqualityData,
        content: [
          {
            type: "text",
            text: `${airqualityData.city}: AQI ${airqualityData.aqi}, ${airqualityData.aqi_category}`,
          },
        ],
        _meta: {
          lastFetched: new Date().toISOString(),
          source: "openweathermap.org",
        },
      };
    },
  );
};

async function loadAirQualityData(city: string) {
  if (!env.AIRQUALITYAPIKEY || !env.WEATHERAPIKEY) {
    throw new Error("AIRQUALITYAPIKEY or WEATHERAPIKEY is not configured");
  }

  const getlatlong = await fetch(
    `https://api.weatherapi.com/v1/forecast.json?key=${env.WEATHERAPIKEY}&q=${encodeURIComponent(city)}&days=4`,
  );

  if (!getlatlong.ok) {
    throw new Error(
      `Weather provider request failed with status ${getlatlong.status}`,
    );
  }

  const latlong = (await getlatlong.json()) as ForecastApiResponse;
  const lat = latlong.location?.lat;
  const lon = latlong.location?.lon;

  if (lat == null || lon == null) {
    throw new Error("Location not found");
  }

  const response = await fetch(
    `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${env.AIRQUALITYAPIKEY}`,
  );

  if (!response.ok) {
    throw new Error(
      `Air quality provider request failed with status ${response.status}`,
    );
  }

  const summary = (await response.json()) as AirQualityApiResponse;
  const firstEntry = summary.list?.[0];
  const aqi = firstEntry?.main?.aqi ?? 0;
  const airQuality = firstEntry?.components;
  const aqi_category =
    aqi === 1
      ? "Good"
      : aqi === 2
        ? "Fair"
        : aqi === 3
          ? "Moderate"
          : aqi === 4
            ? "Poor"
            : aqi === 5
              ? "Very Poor"
              : "Unknown";

  return getAirQualityOutputSchema.parse({
    city: latlong.location?.name || city,
    aqi,
    aqi_co: airQuality?.co ?? 0,
    aqi_no: airQuality?.no ?? 0,
    aqi_no2: airQuality?.no2 ?? 0,
    aqi_o3: airQuality?.o3 ?? 0,
    aqi_so2: airQuality?.so2 ?? 0,
    aqi_pm2_5: airQuality?.pm2_5 ?? 0,
    aqi_pm10: airQuality?.pm10 ?? 0,
    aqi_nh3: airQuality?.nh3 ?? 0,
    aqi_category,
  });
}
