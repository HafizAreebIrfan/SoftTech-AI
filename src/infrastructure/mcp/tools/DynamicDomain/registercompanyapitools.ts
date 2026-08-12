import { registerAppTool } from "@modelcontextprotocol/ext-apps/server";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { IApi, ICompany } from "../../../../domain/types/company.types";
import { genericWidgetOutputSchema } from "../../Schemas/OutputSchema/genericwidgetoutputschema";
import { normalizeApiResponseToWidget } from "./genericwidgetnormalizer";
import { translateApiError } from "../../errors/errorTranslator";
import { buildCustomMcpInputSchema } from "../../Schemas/InputSchema/genericwidgetinputschema";

const HTTP_METHODS_WITH_BODY = ["POST", "PUT", "PATCH"];

const DEFAULT_RESOURCE_URI = "ui://generic/widgets.html";

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

    const configuredInputFields = [
      ...(Array.isArray(api.params) ? api.params : []),
      ...(Array.isArray(api.body) ? api.body : []),
    ];

    const customInputSchema = buildCustomMcpInputSchema(configuredInputFields);

    const toolDescription =
      api.mcpDescription ||
      `Calls ${company.companyName} -> ${
        api.name || `API ${index + 1}`
      } and returns the API result as an interactive widget.`;

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
            resourceUri: DEFAULT_RESOURCE_URI,
          },
          "openai/outputTemplate": DEFAULT_RESOURCE_URI,
          "openai/widgetAccessible": true,
          "openai/toolInvocation/invoking": `Preparing ${api.name || "widget"}...`,
          "openai/toolInvocation/invoked": "Loaded",
        },
      },
      async (input: any) => {
        try {
          const rawResponse = await callRegisteredApi(api, input);
          const widgetContent = normalizeApiResponseToWidget(
            company.companyName,
            api.name || `API ${index + 1}`,
            rawResponse,
            company.uiPreference?.layout,
            company.industry,
            api.apiSchema as any,
            api.params ?? [],
            api.audience as any,
            api.platformType as any,
          );

          return buildMcpSuccessResult(
            widgetContent,
            company.companyName,
            api.name || `API ${index + 1}`,
          );
        } catch (error: any) {
          console.error(
            `[MCP Tool Error] ${api.name} (${api.baseUrl}${api.endpoint}):`,
            {
              status: error?.status,
              message: error?.message,
              responseBody: error?.responseBody,
            },
          );
          const translation = translateApiError(
            error?.status,
            error?.message,
            api.name || "service",
          );
          const errorWidget = {
            title: api.name || "Service Notice",
            subtitle: translation.userMessage,
            layout: company.uiPreference?.layout ?? "dashboard",
            industry: company.industry ?? "general",
            blocks: [
              {
                type: "keyValue",
                title: "Service Status",
                keyValueItems: [
                  { key: "Status", value: "Unable to retrieve records" },
                  { key: "Action", value: translation.actionSuggestion },
                ],
              },
            ],
            metadata: {
              companyName: company.companyName,
              apiName: api.name,
              generatedAt: new Date().toISOString(),
            },
          };
          return buildMcpSuccessResult(
            errorWidget,
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
        text: `${widgetContent.title} rendered`,
      },
    ],
    _meta: {
      ui: {
        resourceUri: DEFAULT_RESOURCE_URI,
      },
      "openai/outputTemplate": DEFAULT_RESOURCE_URI,
      "openai/widgetAccessible": true,
      "openai/toolInvocation/invoking": `Loading ${apiName}...`,
      "openai/toolInvocation/invoked": "Loaded",
      company: companyName,
      lastFetched: new Date().toISOString(),
    },
  };
};

const callRegisteredApi = async (api: IApi, input: any) => {
  const url = buildApiUrl(api, input);

  const method = (api.method || "GET").toUpperCase();

  const headers = buildHeaders(api);

  const options: RequestInit = {
    method,
    headers,
  };

  if (HTTP_METHODS_WITH_BODY.includes(method)) {
    const bodyPayload = buildRequestBody(api, input);

    if (Object.keys(bodyPayload).length > 0) {
      headers["Content-Type"] = "application/json";
      options.body = JSON.stringify(bodyPayload);
    }
  }

  let response: Response;

  try {
    response = await fetch(url, options);
  } catch (error: any) {
    const networkError: any = new Error(
      error?.message || `Unable to connect to ${api.name}.`,
    );

    networkError.status = undefined;
    networkError.responseBody = undefined;

    throw networkError;
  }

  const responseText = await response.text();

  if (!response.ok) {
    const error: any = new Error(
      `Registered API "${api.name}" failed with status ${response.status}`,
    );

    error.status = response.status;
    error.responseBody = responseText;

    throw error;
  }

  if (!responseText.trim()) {
    return null;
  }

  try {
    return JSON.parse(responseText);
  } catch {
    return responseText;
  }
};

const buildApiUrl = (api: IApi, input: any): URL => {
  const baseUrl = api.baseUrl.endsWith("/") ? api.baseUrl : `${api.baseUrl}/`;

  let endpoint = decodeURIComponent((api.endpoint || "").replace(/^\//, ""));

  const rawInput = typeof input === "object" && input !== null ? input : {};

  const configuredParams = normalizeConfiguredParameters(api.params);

  const inputParams =
    rawInput.params && typeof rawInput.params === "object"
      ? rawInput.params
      : {};

  const allInputValues: Record<string, any> = {
    ...getStaticParameterValues(configuredParams),
    ...inputParams,
    ...rawInput,
  };

  for (const parameter of configuredParams) {
    const key = cleanParameterKey(parameter.key);

    if (!key) continue;

    const value = resolveParameterValue(parameter, allInputValues);

    if (value === undefined || value === null || value === "") {
      continue;
    }

    const encodedValue = encodeURIComponent(String(value));

    endpoint = endpoint
      .replace(new RegExp(`\\{${escapeRegExp(key)}\\}`, "gi"), encodedValue)
      .replace(new RegExp(`:${escapeRegExp(key)}\\b`, "gi"), encodedValue);
  }

  if (/{[^}]+}/.test(endpoint) || /:[a-zA-Z0-9_-]+/.test(endpoint)) {
    throw new Error(`Missing required path parameter for ${api.name || "API"}`);
  }

  const url = new URL(endpoint, baseUrl);

  for (const parameter of configuredParams) {
    const key = cleanParameterKey(parameter.key);

    if (!key) continue;

    const isPathParameter = endpointContainsParameter(api.endpoint, key);

    if (isPathParameter) {
      continue;
    }

    const value = resolveParameterValue(parameter, allInputValues);

    if (value === undefined || value === null || String(value).trim() === "") {
      continue;
    }

    url.searchParams.set(key, String(value));
  }

  return url;
};

const buildRequestBody = (api: IApi, input: any): Record<string, any> => {
  const rawInput = typeof input === "object" && input !== null ? input : {};

  const inputParams =
    rawInput.params && typeof rawInput.params === "object"
      ? rawInput.params
      : {};

  const bodyFields = normalizeConfiguredParameters(api.body);

  if (bodyFields.length > 0) {
    const body: Record<string, any> = {};

    for (const field of bodyFields) {
      const key = cleanParameterKey(field.key);

      if (!key) continue;

      const value = resolveParameterValue(field, {
        ...inputParams,
        ...rawInput,
      });

      if (value !== undefined && value !== null) {
        body[key] = value;
      }
    }

    return body;
  }

  return {};
};

const normalizeConfiguredParameters = (params: any): any[] => {
  if (!Array.isArray(params)) {
    return [];
  }

  return params
    .map((param) => {
      if (!param) {
        return null;
      }

      if (typeof param === "object" && param.key) {
        return param;
      }

      if (typeof param === "string" && param.trim()) {
        return {
          key: param.trim(),
          value: undefined,
          isDynamic: true,
        };
      }

      return null;
    })
    .filter(Boolean);
};

const getStaticParameterValues = (params: any[]): Record<string, any> => {
  const result: Record<string, any> = {};

  for (const param of params) {
    const key = cleanParameterKey(param.key);

    if (!key) continue;

    if (
      param.isDynamic === false &&
      param.value !== undefined &&
      param.value !== null
    ) {
      result[key] = param.value;
    }
  }

  return result;
};

const resolveParameterValue = (
  parameter: any,
  inputValues: Record<string, any>,
) => {
  const key = cleanParameterKey(parameter.key);

  if (!key) {
    return undefined;
  }

  if (parameter.isDynamic !== false) {
    if (inputValues[key] !== undefined && inputValues[key] !== null) {
      return inputValues[key];
    }

    const originalKey = String(parameter.key || "").trim();

    if (
      inputValues[originalKey] !== undefined &&
      inputValues[originalKey] !== null
    ) {
      return inputValues[originalKey];
    }

    return undefined;
  }

  return parameter.value;
};

const cleanParameterKey = (key: unknown): string => {
  return String(key || "")
    .trim()
    .replace(/^\{|\}$/g, "")
    .replace(/^:/, "")
    .trim();
};

const endpointContainsParameter = (endpoint: string, key: string): boolean => {
  return (
    new RegExp(`\\{${escapeRegExp(key)}\\}`, "i").test(endpoint) ||
    new RegExp(`:${escapeRegExp(key)}\\b`, "i").test(endpoint)
  );
};

const buildHeaders = (api: IApi): Record<string, string> => {
  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  (api.headers ?? []).forEach((header: any) => {
    if (typeof header === "string") {
      const [key, ...rest] = header.split(":");

      const value = rest.join(":").trim();

      if (key?.trim() && value) {
        headers[key.trim()] = value;
      }

      return;
    }

    if (typeof header === "object" && header !== null && header.key) {
      headers[String(header.key).trim()] = String(header.value ?? "").trim();
    }
  });

  const authType = String(api.authType || "").toUpperCase();

  if (["BEARER", "BEARER TOKEN"].includes(authType) && api.bearerToken) {
    headers.Authorization = `Bearer ${api.bearerToken}`;
  }

  if (["API_KEY", "API KEY"].includes(authType) && api.apiKey) {
    const authHeaderName = String(api.authHeader || "x-api-key").trim();

    if (authHeaderName) {
      headers[authHeaderName] = api.apiKey;
    }
  }

  return headers;
};

const toToolName = (name: string, index: number) => {
  const normalized = String(name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return normalized ? normalized : `api_${index + 1}`;
};

const escapeRegExp = (value: string) => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};
