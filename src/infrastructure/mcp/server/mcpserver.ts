import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WeatherInstructions } from "../ServerInstructions/weatherserverinstructions";

export const WeatherServer = new McpServer(
  { name: "Weather Server", version: "1.0.0" },
  { instructions: WeatherInstructions },
);

// Tool modules are imported after server creation so their registration side effects run.
import "../tools/WeatherDomain/getweatherdata";
import "../tools/WeatherDomain/getforecastdata";
import "../tools/WeatherDomain/getairqualitydata";
