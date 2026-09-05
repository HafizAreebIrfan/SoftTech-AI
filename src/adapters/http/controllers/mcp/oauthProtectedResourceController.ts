import { Request, Response } from "express";
import { CompanyModel } from "../../../persistence/models/companies/register/companyinfo";

/**
 * Serves the RFC 9728 Protected Resource Metadata for ChatGPT and MCP clients.
 * Endpoint: GET /mcp/:mcpSlug/.well-known/oauth-protected-resource
 */
export const getOAuthProtectedResourceMetadata = async (
  req: Request,
  res: Response,
) => {
  try {
    const mcpSlug = String(req.params.mcpSlug || "").trim().toLowerCase();

    if (!mcpSlug) {
      return res.status(400).json({ error: "mcp_slug_required" });
    }

    const company = await CompanyModel.findOne({ mcpSlug }).lean();

    if (!company) {
      return res.status(404).json({ error: "company_not_found" });
    }

    const host = req.get("host") || "softtech-ai.onrender.com";
    const protocol = req.protocol === "https" || req.get("x-forwarded-proto") === "https" ? "https" : "http";
    const canonicalResource = `${protocol}://${host}/mcp/${mcpSlug}`;

    const authStrategy = company.authStrategy as any;
    
    // Determine the company's authorization server origin
    let authServerUrl = authStrategy?.authorizationServer || authStrategy?.authorizationEndpoint;
    
    if (!authServerUrl && company.apis && company.apis.length > 0) {
      // Fall back to first API base URL or oauth configuration
      const firstApi = company.apis[0];
      authServerUrl = firstApi?.oauth?.authorizationUrl || firstApi?.baseUrl;
    }

    if (!authServerUrl) {
      authServerUrl = canonicalResource;
    }

    // Strip path to get the authorization server base origin if it's a full URL
    try {
      const parsedUrl = new URL(authServerUrl);
      authServerUrl = parsedUrl.origin;
    } catch {
      // Keep as-is if parsing fails
    }

    const scopesSupported = Array.isArray(authStrategy?.scopes) && authStrategy.scopes.length > 0
      ? authStrategy.scopes
      : ["read", "write"];

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Access-Control-Allow-Origin", "*");

    return res.status(200).json({
      resource: canonicalResource,
      authorization_servers: [authServerUrl],
      scopes_supported: scopesSupported,
      bearer_methods_supported: ["header"],
      resource_documentation: `${protocol}://${host}`,
    });
  } catch (error) {
    console.error("[OAuth Metadata Error]", error);
    return res.status(500).json({ error: "internal_server_error" });
  }
};
