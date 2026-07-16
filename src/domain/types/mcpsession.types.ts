import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

export type McpSession = {
  server: McpServer;
  transport: StreamableHTTPServerTransport;
  lastSeenAt: number;
};
