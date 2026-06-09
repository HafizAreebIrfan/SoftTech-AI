import { randomUUID } from "crypto";
import { Request, Response } from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { WeatherServer } from "../../../../infrastructure/mcp/server/mcpserver";

const transport = new StreamableHTTPServerTransport({
  sessionIdGenerator: () => randomUUID(),
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
    console.error("MCP transport request failed:", {
      method: req.method,
      path: req.path,
      accept: req.headers.accept,
      sessionId: req.headers["mcp-session-id"],
      requestBody: req.body,
      error,
    });

    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: "MCP transport request failed",
      });
    }
  }
};
