import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ICompany } from "../../../domain/types/company.types";
import { registerWeatherWidgetResources } from "../resources/WeatherDomain/currentweatherwidgetresource";
import { registerCompanyApiTools } from "../tools/DynamicDomain/registercompanyapitools";

export const createCompanyMcpServer = (company: ICompany) => {
  const server = new McpServer(
    {
      name: `${company.companyName} MCP Server`,
      version: "1.0.0",
    },
    {
      instructions:
        `You are an MCP server for ${company.companyName}. ` +
        "Use the registered tools to call company APIs and return generic widget data.",
    },
  );

  registerWeatherWidgetResources(server);
  registerCompanyApiTools(server, company);

  return server;
};
