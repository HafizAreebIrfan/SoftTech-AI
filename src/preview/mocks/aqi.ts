import type { McpToolResultPayload } from "../../domain/entities/GenericWidget";

/**
 * Air-quality fixture — OpenWeather air_pollution shape (`data.list` + `coord`).
 * The renderer detects AQI from the entity name and/or the `list`+`coord` shape
 * and renders AQIBlock. `main.aqi` is 1–5; components are the pollutant map.
 */
export const aqiPayload: McpToolResultPayload = {
  structuredContent: {
    title: "Air Quality — New York",
    subtitle: "Current air pollution index",
    data: {
      coord: { lon: -74.006, lat: 40.7128 },
      list: [
        {
          main: { aqi: 3 },
          components: {
            co: 233.65,
            no: 0.03,
            no2: 18.27,
            o3: 64.37,
            so2: 6.44,
            pm2_5: 12.62,
            pm10: 15.9,
            nh3: 1.86,
          },
          dt: 1789900000,
        },
      ],
    },
    collection: { entity: "air_quality", layout: "general" },
    audience: "customer",
  },
};
