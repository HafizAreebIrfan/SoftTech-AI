import express from "express";
import { McpTransportLayer } from "../../controllers/mcp/mcptransportlayer";

export const mcpRoutes = express.Router();

mcpRoutes.get("/:mcpSlug", McpTransportLayer);
mcpRoutes.post("/:mcpSlug", McpTransportLayer);
mcpRoutes.delete("/:mcpSlug", McpTransportLayer);
