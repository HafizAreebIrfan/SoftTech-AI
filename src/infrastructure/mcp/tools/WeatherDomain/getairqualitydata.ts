import { registerAppTool } from "@modelcontextprotocol/ext-apps/server";
import { env } from "../../../config/env";
import { WeatherServer } from "../../server/mcpserver";
import {
  AirQualityApiResponse,
  ForecastApiResponse,
} from "../../../../domain/interface/weatherinterface";
import { getAirQualityInputSchema } from "../../Schemas/InputSchema/weatherinputschema";
import { getAirQualityOutputSchema } from "../../Schemas/OutputSchema/weatheroutputschema";

registerAppTool(
  WeatherServer,
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
          text: `${airqualityData.city}: ${airqualityData.aqi}, ${airqualityData.aqi_category}`,
        },
      ],
      _meta: {
        lastFetched: new Date().toISOString(),
        source: "openweathermap.org",
      },
    };
  },
);

async function loadAirQualityData(city: string) {
  if (!env.AIRQUALITYAPIKEY || !env.WEATHERAPIKEY) {
    throw new Error("AIRQUALITYAPIKEY or WEATHERAPIKEY is not configured");
  }

  const getlatlong = await fetch(
    `https://api.weatherapi.com/v1/forecast.json?key=${env.WEATHERAPIKEY}&q=${encodeURIComponent(city)}&days=4`,
  );
  const latlong = (await getlatlong.json()) as ForecastApiResponse;
  const lat = latlong.location?.lat;
  const lon = latlong.location?.lon;

  if (!lat || !lon) {
    throw new Error("Location not found");
  }

  const response = await fetch(
    `https://api.openweathermap.org/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${env.AIRQUALITYAPIKEY}&units=metric`,
  );

  if (!response.ok) {
    throw new Error(
      `Weather provider request failed with status ${response.status}`,
    );
  }

  const summary = (await response.json()) as AirQualityApiResponse;
  const aqi = summary.aqi;
  const aqi_co = summary.air_quality.co;
  const aqi_no = summary.air_quality.no;
  const aqi_no2 = summary.air_quality.no2;
  const aqi_o3 = summary.air_quality.o3;
  const aqi_so2 = summary.air_quality.so2;
  const aqi_pm2_5 = summary.air_quality.pm2_5;
  const aqi_pm10 = summary.air_quality.pm10;
  const aqi_nh3 = summary.air_quality.nh3;
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
    city: summary.location?.name || city,
    aqi,
    aqi_co,
    aqi_no,
    aqi_no2,
    aqi_o3,
    aqi_so2,
    aqi_pm2_5,
    aqi_pm10,
    aqi_nh3,
    aqi_category,
  });
}
