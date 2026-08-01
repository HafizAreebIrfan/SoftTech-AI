import { registerAppTool } from "@modelcontextprotocol/ext-apps/server";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { IApi, ICompany } from "../../../../domain/types/company.types";
import { genericWidgetOutputSchema } from "../../Schemas/OutputSchema/genericwidgetoutputschema";
import { buildCustomMcpInputSchema } from "../../../middlewares/ValidationMiddleware/schemas";
import { normalizeApiResponseToWidget } from "./genericwidgetnormalizer";

export const registerCompanyApiTools = (
  server: McpServer,
  company: ICompany,
) => {
  const apis = company.apis ?? [];

  apis.forEach((api, index) => {
    const toolName = toToolName(
      api.mcpToolName || api.name || `api_${index + 1}`,
      index,
    );

    const customInputSchema = buildCustomMcpInputSchema(api.params ?? []);

    registerAppTool(
      server,
      toolName,
      {
        title: api.name || `API ${index + 1}`,
        description:
          api.mcpDescription ||
          `Calls ${company.companyName} -> ${api.name} and returns a generic widget response.`,
        inputSchema: customInputSchema,
        outputSchema: genericWidgetOutputSchema,
        _meta: {
          ui: {
            resourceUri: "ui://generic/widgets.html",
          },
        },
      },
      async (input: any) => {
        try {
          const rawResponse = await callRegisteredApi(api, input);
          const widgetContent = normalizeApiResponseToWidget(
            company.companyName,
            api.name || `API ${index + 1}`,
            rawResponse,
            company.uiPreference?.layout ?? "dashboard",
            company.industry,
          );

          const result = {
            structuredContent: widgetContent,
            content: [
              {
                type: "text" as const,
                text: `${widgetContent.title}: ${widgetContent.blocks.length} widget block(s) returned.`,
              },
            ],
            _meta: {
              ui: {
                resourceUri: "ui://generic/widgets.html",
              },
              company: company.companyName,
              lastFetched: new Date().toISOString(),
            },
          };
          return result;
        } catch (error: any) {
          throw error;
        }
      },
    );
  });
};

const callRegisteredApi = async (api: IApi, input: any) => {
  const url = buildApiUrl(api, input);
  const method = (api.method || "GET").toUpperCase();

  const headers = buildHeaders(api);
  const options: RequestInit = {
    method,
    headers,
  };

  const rawInput = typeof input === "object" && input !== null ? input : {};
  const allParams: Record<string, any> = {
    ...(rawInput.params ?? {}),
    ...rawInput,
  };

  if (["POST", "PUT", "PATCH"].includes(method)) {
    headers["Content-Type"] = "application/json";

    const bodyPayload = { ...allParams };
    delete bodyPayload.params; // Clean utility params

    options.body = JSON.stringify(bodyPayload);
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(
      `Registered API "${api.name}" failed with status ${response.status}`,
    );
  }

  return response.json();
};

const buildApiUrl = (api: IApi, input: any) => {
  const baseUrl = api.baseUrl.endsWith("/") ? api.baseUrl : `${api.baseUrl}/`;
  let endpoint = api.endpoint.replace(/^\//, "");

  const rawInput = typeof input === "object" && input !== null ? input : {};
  const queryOrLocation =
    rawInput.city ||
    rawInput.location ||
    rawInput.query ||
    rawInput.q ||
    rawInput.search;

  const allParams: Record<string, any> = {
    ...(rawInput.params ?? {}),
    ...rawInput,
  };

  if (queryOrLocation) {
    allParams.q = queryOrLocation;
    allParams.city = queryOrLocation;
    allParams.location = queryOrLocation;
    allParams.query = queryOrLocation;
  }

  // 1. Replace template placeholders in path/query (e.g., {city}, {location}, {q}, :city)
  Object.entries(allParams).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    const valStr = encodeURIComponent(String(value));
    endpoint = endpoint
      .replace(new RegExp(`:${escapeRegExp(key)}\\b`, "gi"), valStr)
      .replace(new RegExp(`\\{${escapeRegExp(key)}\\}`, "gi"), valStr);
  });

  // Global placeholder fallback if input didn't match exact key name
  if (queryOrLocation) {
    const valStr = encodeURIComponent(String(queryOrLocation));
    endpoint = endpoint
      .replace(/\{city\}/gi, valStr)
      .replace(/\{location\}/gi, valStr)
      .replace(/\{q\}/gi, valStr)
      .replace(/\{query\}/gi, valStr)
      .replace(/:city\b/gi, valStr)
      .replace(/:location\b/gi, valStr)
      .replace(/:q\b/gi, valStr);
  }

  const url = new URL(endpoint, baseUrl);

  // 2. Overwrite existing search parameters if passed dynamically
  if (queryOrLocation) {
    if (url.searchParams.has("q"))
      url.searchParams.set("q", String(queryOrLocation));
    if (url.searchParams.has("city"))
      url.searchParams.set("city", String(queryOrLocation));
    if (url.searchParams.has("location"))
      url.searchParams.set("location", String(queryOrLocation));
    if (url.searchParams.has("query"))
      url.searchParams.set("query", String(queryOrLocation));
  }

  // 3. Attach any configured parameters if GET method
  if ((api.method || "GET").toUpperCase() === "GET") {
    const cleanKeys: string[] = [];
    (api.params ?? []).forEach((rawKey) => {
      if (typeof rawKey !== "string" || !rawKey.trim()) return;
      const str = rawKey.trim();
      if (str.startsWith("{") || str.startsWith("[")) {
        try {
          const parsed = JSON.parse(str);
          if (parsed && typeof parsed === "object") {
            Object.keys(parsed).forEach((k) => cleanKeys.push(k));
          }
        } catch {}
      } else {
        cleanKeys.push(str);
      }
    });

    // Also automatically append standard filter/pagination query parameters if present
    const standardKeys = [
      "limit",
      "count",
      "size",
      "page",
      "offset",
      "status",
      "state",
      "filter",
      "query",
      "q",
      "search",
      "sort",
      "orderBy",
      "sortDir",
      "order",
    ];
    standardKeys.forEach((key) => {
      if (!cleanKeys.includes(key)) {
        cleanKeys.push(key);
      }
    });

    cleanKeys.forEach((key) => {
      const value = allParams[key];
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    });
    // Fallback search param if no location query key was set on url
    if (
      queryOrLocation &&
      !url.searchParams.has("q") &&
      !url.searchParams.has("city") &&
      !url.searchParams.has("location")
    ) {
      url.searchParams.set("q", String(queryOrLocation));
    }
  }

  return url;
};

const buildHeaders = (api: IApi) => {
  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  (api.headers ?? []).forEach((header) => {
    const [key, ...rest] = header.split(":");
    const value = rest.join(":").trim();

    if (key && value) {
      headers[key.trim()] = value;
    }
  });

  const authTypeUpper = (api.authType || "").toUpperCase();

  if (
    (authTypeUpper === "BEARER" || authTypeUpper === "BEARER TOKEN") &&
    api.bearerToken
  ) {
    headers.Authorization = `Bearer ${api.bearerToken}`;
  }

  if (
    (authTypeUpper === "API_KEY" || authTypeUpper === "API KEY") &&
    api.apiKey
  ) {
    headers[api.authHeader || "x-api-key"] = api.apiKey;
  }

  return headers;
};

const toToolName = (name: string, index: number) => {
  const normalized = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return normalized ? `call_${normalized}` : `call_api_${index + 1}`;
};

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
