import { registerAppTool } from "@modelcontextprotocol/ext-apps/server";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { IApi, ICompany } from "../../../../domain/types/company.types";
import { genericWidgetOutputSchema } from "../../Schemas/OutputSchema/genericwidgetoutputschema";
import { buildCustomMcpInputSchema } from "../../../middlewares/ValidationMiddleware/schemas";
import { normalizeApiResponseToWidget } from "./genericwidgetnormalizer";
import { translateApiError } from "../../errors/errorTranslator";

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

    const isUpdateOrDelete = ["PUT", "PATCH", "DELETE", "POST"].includes(
      (api.method || "GET").toUpperCase(),
    );
    const hasPathParams =
      api.endpoint.includes(":") || api.endpoint.includes("{");

    let toolDescription =
      api.mcpDescription ||
      `Calls ${company.companyName} -> ${api.name} and returns a generic widget response.`;
    if (isUpdateOrDelete || hasPathParams) {
      toolDescription += ` Note: To update or edit an item, prefer calling the GET listing tool first to obtain available item IDs.`;
    }

    registerAppTool(
      server,
      toolName,
      {
        title: api.name || `API ${index + 1}`,
        description: toolDescription,
        inputSchema: customInputSchema,
        outputSchema: genericWidgetOutputSchema,
        _meta: {
          ui: {
            resourceUri: "ui://generic/widgets.html",
          },
          "openai/outputTemplate": "ui://generic/widgets.html",
          "openai/widgetAccessible": true,
          "openai/toolInvocation/invoking": `Preparing ${api.name || "widget"}...`,
          "openai/toolInvocation/invoked": "Loaded",
        },
      },
      async (input: any) => {
        const isUpdateOrDeleteMethod = ["PUT", "PATCH", "DELETE"].includes(
          (api.method || "GET").toUpperCase(),
        );
        const rawInput = typeof input === "object" && input !== null ? input : {};
        const hasProvidedId = Boolean(
          rawInput.id ||
            rawInput.itemId ||
            rawInput.packageId ||
            rawInput.params?.id,
        );

        // If an update/delete tool is called without an explicit ID, pre-fetch GET listing
        if (isUpdateOrDeleteMethod && !hasProvidedId) {
          const getListingApi = (company.apis ?? []).find(
            (a, i) => (a.method || "GET").toUpperCase() === "GET" && i !== index,
          );

          if (getListingApi) {
            try {
              const listResponse = await callRegisteredApi(getListingApi, input);
              const listWidget = normalizeApiResponseToWidget(
                company.companyName,
                getListingApi.name || "Available Items",
                listResponse,
                company.uiPreference?.layout ?? "dashboard",
                company.industry,
                getListingApi.apiSchema as any,
              );
              listWidget.subtitle = `Select an item below to ${api.name || "update"}`;
              return buildMcpSuccessResult(
                listWidget,
                company.companyName,
                api.name || `API ${index + 1}`,
              );
            } catch {
              // Fallback to option widget
            }
          }
        }

        try {
          const rawResponse = await callRegisteredApi(api, input);
          const widgetContent = normalizeApiResponseToWidget(
            company.companyName,
            api.name || `API ${index + 1}`,
            rawResponse,
            company.uiPreference?.layout ?? "dashboard",
            company.industry,
            api.apiSchema as any,
          );

          return buildMcpSuccessResult(
            widgetContent,
            company.companyName,
            api.name || `API ${index + 1}`,
          );
        } catch (error: any) {
          // Graceful Error Recovery: Never return raw 404/500 text to user
          const getListingApi = (company.apis ?? []).find(
            (a, i) =>
              (a.method || "GET").toUpperCase() === "GET" && i !== index,
          );

          if (getListingApi) {
            try {
              const listResponse = await callRegisteredApi(
                getListingApi,
                input,
              );
              const listWidget = normalizeApiResponseToWidget(
                company.companyName,
                getListingApi.name || "Available Items",
                listResponse,
                company.uiPreference?.layout ?? "dashboard",
                company.industry,
                getListingApi.apiSchema as any,
              );
              listWidget.subtitle = `Select an item below to ${api.name || "update"}`;
              return buildMcpSuccessResult(
                listWidget,
                company.companyName,
                api.name || `API ${index + 1}`,
              );
            } catch {
              // Fallback to option widget
            }
          }

          const fallbackWidget = buildFallbackOptionWidget(
            company,
            api,
            input,
            error,
          );
          return buildMcpSuccessResult(
            fallbackWidget,
            company.companyName,
            api.name || `API ${index + 1}`,
          );
        }
      },
    );
  });
};

const buildMcpSuccessResult = (
  widgetContent: any,
  companyName: string,
  apiName: string,
) => {
  return {
    structuredContent: widgetContent,
    content: [
      {
        type: "text" as const,
        text: `${widgetContent.title}: ${widgetContent.blocks?.length ?? 1} widget block(s) rendered.`,
      },
    ],
    _meta: {
      ui: {
        resourceUri: "ui://generic/widgets.html",
      },
      "openai/outputTemplate": "ui://generic/widgets.html",
      "openai/widgetAccessible": true,
      "openai/toolInvocation/invoking": `Loading ${apiName}...`,
      "openai/toolInvocation/invoked": "Loaded",
      company: companyName,
      lastFetched: new Date().toISOString(),
    },
  };
};

const buildFallbackOptionWidget = (
  company: ICompany,
  api: IApi,
  input: any,
  rawError?: any,
) => {
  const status = rawError?.status || (rawError?.message?.includes("404") ? 404 : undefined);
  const translation = translateApiError(status, rawError?.message, api.name || "service");

  return {
    title: api.name || "Manage Item",
    subtitle: translation.userMessage,
    layout: company.uiPreference?.layout ?? "dashboard",
    industry: company.industry ?? "general",
    blocks: [
      {
        type: "form",
        title: `Configure ${api.name || "Update"}`,
        fields: [
          {
            id: "itemId",
            name: "itemId",
            label: "Item / Package ID",
            type: "text",
            required: true,
          },
          {
            id: "fieldToUpdate",
            name: "fieldToUpdate",
            label: "Field to Update (e.g. Price, Status, Name)",
            type: "text",
            required: false,
          },
          {
            id: "newValue",
            name: "newValue",
            label: "New Value",
            type: "text",
            required: false,
          },
        ],
        submitAction: api.name || "submit",
      },
      {
        type: "keyValue",
        title: "Status & Next Step",
        keyValueItems: [
          { key: "Status", value: "Awaiting selection" },
          { key: "Action Required", value: translation.actionSuggestion },
        ],
      },
    ],
    metadata: {
      companyName: company.companyName,
      apiName: api.name,
      generatedAt: new Date().toISOString(),
      version: "1.0",
    },
  };
};

const callRegisteredApi = async (api: IApi, input: any) => {
  const url = buildApiUrl(api, input);

  const decodedPath = decodeURIComponent(url.pathname);
  if (
    decodedPath.includes(":id") ||
    decodedPath.includes("{id}") ||
    decodedPath.includes("%7bid%7d")
  ) {
    throw new Error(`Missing required ID parameter for ${api.name}`);
  }

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
  let endpoint = decodeURIComponent((api.endpoint || "").replace(/^\//, ""));

  const rawInput = typeof input === "object" && input !== null ? input : {};
  const queryOrLocation =
    rawInput.city ||
    rawInput.location ||
    rawInput.query ||
    rawInput.q ||
    rawInput.search;

  // 1. Extract static configured parameters from api.params
  const configuredStaticParams: Record<string, string> = {};
  if (Array.isArray(api.params)) {
    api.params.forEach((paramItem: any) => {
      if (!paramItem) return;
      if (typeof paramItem === "object" && paramItem.key) {
        if (paramItem.value !== undefined && paramItem.value !== null) {
          configuredStaticParams[paramItem.key.trim()] = String(
            paramItem.value,
          ).trim();
        }
      } else if (typeof paramItem === "string" && paramItem.trim()) {
        try {
          const parsed = JSON.parse(paramItem.trim());
          if (Array.isArray(parsed)) {
            parsed.forEach((p: any) => {
              if (p?.key && p?.value !== undefined)
                configuredStaticParams[p.key.trim()] = String(p.value).trim();
            });
          } else if (typeof parsed === "object" && parsed !== null) {
            Object.entries(parsed).forEach(([k, v]) => {
              if (v !== undefined)
                configuredStaticParams[k.trim()] = String(v).trim();
            });
          }
        } catch {
          // ignore invalid json string
        }
      }
    });
  }

  const allParams: Record<string, any> = {
    ...configuredStaticParams,
    ...(rawInput.params ?? {}),
    ...rawInput,
  };

  if (queryOrLocation) {
    allParams.q = queryOrLocation;
    allParams.city = queryOrLocation;
    allParams.location = queryOrLocation;
    allParams.query = queryOrLocation;
  }

  // Aliases for common variations (days vs day)
  if (allParams.days !== undefined && allParams.day === undefined) {
    allParams.day = allParams.days;
  } else if (allParams.day !== undefined && allParams.days === undefined) {
    allParams.days = allParams.day;
  }

  const authTypeUpper = (api.authType || "").toUpperCase();
  const authHeaderName = (api.authHeader || "").trim();

  // If Auth Type is API Key, check if authHeader is intended as a URL parameter (e.g. key, appid)
  if (
    (authTypeUpper === "API_KEY" || authTypeUpper === "API KEY") &&
    api.apiKey
  ) {
    const isQueryParamKey = ["key", "appid"].includes(
      authHeaderName.toLowerCase(),
    );
    if (isQueryParamKey) {
      allParams[authHeaderName] = api.apiKey;
    }
  }

  // 2. Replace template placeholders in path/query (e.g., {city}, {location}, {q}, :city)
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

  // 3. Attach query parameters (both configured static params and dynamic params)
  if ((api.method || "GET").toUpperCase() === "GET") {
    // Attach configured static params from api.params
    Object.entries(configuredStaticParams).forEach(([k, v]) => {
      if (v) url.searchParams.set(k, v);
    });

    // Attach dynamic input params
    Object.entries(allParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null && key !== "params") {
        url.searchParams.set(key, String(value));
      }
    });

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

  (api.headers ?? []).forEach((header: any) => {
    if (typeof header === "string") {
      const [key, ...rest] = header.split(":");
      const value = rest.join(":").trim();
      if (key && value) {
        headers[key.trim()] = value;
      }
    } else if (typeof header === "object" && header !== null && header.key) {
      headers[header.key.trim()] = String(header.value ?? "").trim();
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
    const authHeaderName = (api.authHeader || "x-api-key").trim();
    const isQueryParamKey = ["key", "appid"].includes(
      authHeaderName.toLowerCase(),
    );
    if (!isQueryParamKey) {
      headers[authHeaderName] = api.apiKey;
    }
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
