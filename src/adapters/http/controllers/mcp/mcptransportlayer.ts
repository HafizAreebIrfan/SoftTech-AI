import { Request, Response } from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { WeatherServer } from "../../../../infrastructure/mcp/server/mcpserver";

const transport = new StreamableHTTPServerTransport({
  sessionIdGenerator: undefined,
});

let serverConnected = false;

export const McpTransportLayer = async (req: Request, res: Response) => {
  try {
    if (!serverConnected) {
      await WeatherServer.connect(transport);
      serverConnected = true;
    }

    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error("MCP transport request failed:", error);

    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: "MCP transport request failed",
      });
    }
  }
};
