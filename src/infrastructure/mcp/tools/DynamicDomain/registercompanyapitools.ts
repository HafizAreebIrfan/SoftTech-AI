import { registerAppTool } from "@modelcontextprotocol/ext-apps/server";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { IApi, ICompany } from "../../../../domain/types/company.types";
import { genericWidgetOutputSchema } from "../../Schemas/OutputSchema/genericwidgetoutputschema";
import { genericWidgetInputSchema } from "../../Schemas/InputSchema/genericwidgetinputschema";
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

    registerAppTool(
      server,
      toolName,
      {
        title: api.name || `API ${index + 1}`,
        description:
          api.mcpDescription ||
          `Calls ${api.name || "a registered company API"} and returns a generic widget response.`,
        inputSchema: genericWidgetInputSchema,
        outputSchema: genericWidgetOutputSchema,
        _meta: {
          ui: {
            resourceUri: "ui://generic/widgets.html",
          },
        },
      },
      async (input) => {
        const rawResponse = await callRegisteredApi(api, input);
        console.log("Raw response", rawResponse);
        const widgetContent = normalizeApiResponseToWidget(
          api.name || company.companyName,
          rawResponse,
          company.uiPreference?.layout,
        );
        console.log("Widget content", widgetContent);

        return {
          structuredContent: widgetContent,
          content: [
            {
              type: "text",
              text: `${widgetContent.title}: ${widgetContent.blocks.length} widget block(s) returned.`,
            },
          ],
          _meta: {
            ui: {
              resourceUri: "ui://generic/widgets.html",
            },
            "openai/widgetAccessible": true,
            "openai/toolInvocation/invoking": "Loading...",
            "openai/toolInvocation/invoked": "Loaded",
            company: company.companyName,
            source: buildApiUrl(api, input).toString(),
            lastFetched: new Date().toISOString(),
          },
        };
      },
    );
  });
};

const callRegisteredApi = async (
  api: IApi,
  input: z.infer<typeof genericWidgetInputSchema>,
) => {
  const url = buildApiUrl(api, input);
  const response = await fetch(url, {
    method: (api.method || "GET").toUpperCase(),
    headers: buildHeaders(api),
  });

  if (!response.ok) {
    throw new Error(
      `Registered API "${api.name}" failed with status ${response.status}`,
    );
  }

  return response.json();
};

const buildApiUrl = (
  api: IApi,
  input: z.infer<typeof genericWidgetInputSchema>,
) => {
  const baseUrl = api.baseUrl.endsWith("/") ? api.baseUrl : `${api.baseUrl}/`;
  let endpoint = api.endpoint.replace(/^\//, "");
  const allParams = {
    ...(input.params ?? {}),
    ...(input.city ? { city: input.city, q: input.city } : {}),
    ...(input.location ? { location: input.location, q: input.location } : {}),
    ...(input.query
      ? { query: input.query, q: input.query, search: input.query }
      : {}),
    ...(input.itemId
      ? { itemId: input.itemId, id: input.itemId, uuid: input.itemId }
      : {}),
    ...(input.limit !== undefined
      ? { limit: input.limit, count: input.limit, size: input.limit }
      : {}),
    ...(input.page !== undefined
      ? { page: input.page, offset: input.page }
      : {}),
    ...(input.startDate
      ? {
          startDate: input.startDate,
          fromDate: input.startDate,
          start: input.startDate,
        }
      : {}),
    ...(input.endDate
      ? { endDate: input.endDate, toDate: input.endDate, end: input.endDate }
      : {}),
    ...(input.status
      ? { status: input.status, filter: input.status, state: input.status }
      : {}),
  };

  Object.entries(allParams).forEach(([key, value]) => {
    endpoint = endpoint
      .replace(
        new RegExp(`:${escapeRegExp(key)}\\b`, "g"),
        encodeURIComponent(String(value)),
      )
      .replace(
        new RegExp(`\\{${escapeRegExp(key)}\\}`, "g"),
        encodeURIComponent(String(value)),
      );
  });

  const url = new URL(endpoint, baseUrl);

  if ((api.method || "GET").toUpperCase() === "GET") {
    const configuredParams = api.params ?? [];

    configuredParams.forEach((key) => {
      const value = allParams[key];

      if (value !== undefined && !url.searchParams.has(key)) {
        url.searchParams.set(key, String(value));
      }
    });
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

  if (api.authType?.toUpperCase() === "BEARER" && api.bearerToken) {
    headers.Authorization = `Bearer ${api.bearerToken}`;
  }

  if (api.authType?.toUpperCase() === "API_KEY" && api.apiKey) {
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
