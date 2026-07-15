"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCompanyMcpServer = void 0;
const mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
const genericWidgetResource_1 = require("../resources/GenericWidget/genericWidgetResource");
const companyserverinstructions_1 = require("../ServerInstructions/companyserverinstructions");
const registercompanyapitools_1 = require("../tools/DynamicDomain/registercompanyapitools");
const createCompanyMcpServer = (company) => {
    const server = new mcp_js_1.McpServer({
        name: `${company.companyName} MCP Server`,
        version: "1.0.0",
    }, {
        instructions: (0, companyserverinstructions_1.getCompanyMcpInstructions)(company),
    });
    (0, genericWidgetResource_1.registerGenericWidgetResources)(server);
    (0, registercompanyapitools_1.registerCompanyApiTools)(server, company);
    return server;
};
exports.createCompanyMcpServer = createCompanyMcpServer;
