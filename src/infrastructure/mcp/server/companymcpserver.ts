import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ICompany } from "../../../domain/types/company.types";
import { registerGenericWidgetResources } from "../resources/GenericWidget/genericWidgetResource";
import { getCompanyMcpInstructions } from "../ServerInstructions/companyserverinstructions";
import { registerCompanyApiTools } from "../tools/DynamicDomain/registercompanyapitools";

export const createCompanyMcpServer = (company: ICompany) => {
  const server = new McpServer(
    {
      name: `${company.companyName} MCP Server`,
      version: "1.0.0",
    },
    {
      instructions: getCompanyMcpInstructions(company),
    },
  );

  registerGenericWidgetResources(server);
  registerCompanyApiTools(server, company);

  return server;
};
