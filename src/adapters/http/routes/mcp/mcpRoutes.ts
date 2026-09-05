import express from "express";
import { McpTransportLayer } from "../../controllers/mcp/mcptransportlayer";
import { getOAuthProtectedResourceMetadata } from "../../controllers/mcp/oauthProtectedResourceController";

export const mcpRoutes = express.Router();

// RFC 9728 Protected Resource Metadata for ChatGPT OAuth Discovery
mcpRoutes.get("/:mcpSlug/.well-known/oauth-protected-resource", getOAuthProtectedResourceMetadata);
mcpRoutes.get("/.well-known/oauth-protected-resource", getOAuthProtectedResourceMetadata);

mcpRoutes.get("/:mcpSlug", McpTransportLayer);
mcpRoutes.post("/:mcpSlug", McpTransportLayer);
mcpRoutes.delete("/:mcpSlug", McpTransportLayer);

