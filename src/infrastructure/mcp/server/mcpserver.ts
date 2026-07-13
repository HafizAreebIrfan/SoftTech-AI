import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WeatherInstructions } from "../ServerInstructions/weatherserverinstructions";
import { registerWeatherWidgetResources } from "../resources/WeatherDomain/currentweatherwidgetresource";
import { registerCurrentWeatherTool } from "../tools/WeatherDomain/getweatherdata";
import { registerForecastWeatherTool } from "../tools/WeatherDomain/getforecastdata";
import { registerAirQualityWeatherTool } from "../tools/WeatherDomain/getairqualitydata";

export const createWeatherServer = () => {
  const server = new McpServer(
    { name: "Weather Server", version: "1.0.0" },
    { instructions: WeatherInstructions },
  );

  registerWeatherWidgetResources(server);
  registerCurrentWeatherTool(server);
  registerForecastWeatherTool(server);
  registerAirQualityWeatherTool(server);

  return server;
};
