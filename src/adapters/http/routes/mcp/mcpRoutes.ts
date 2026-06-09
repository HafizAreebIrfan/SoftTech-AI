import express from "express";
import { McpTransportLayer } from "../../controllers/mcp/mcptransportlayer";

export const mcpRoutes = express.Router();

mcpRoutes.get("/weathermcp", McpTransportLayer);
mcpRoutes.post("/weathermcp", McpTransportLayer);
