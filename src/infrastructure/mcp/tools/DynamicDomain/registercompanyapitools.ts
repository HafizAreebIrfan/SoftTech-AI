import { registerAppTool } from "@modelcontextprotocol/ext-apps/server";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { IApi, ICompany } from "../../../../domain/types/company.types";
import { genericWidgetOutputSchema } from "../../Schemas/OutputSchema/genericwidgetoutputschema";
import { normalizeApiResponseToWidget } from "./genericwidgetnormalizer";
import { translateApiError } from "../../errors/errorTranslator";
import { buildCustomMcpInputSchema } from "../../Schemas/InputSchema/genericwidgetinputschema";
import { OAuthTokenService } from "../../../../application/services/oauth/OAuthTokenService";
import { env } from "../../../../infrastructure/config/env";
import { resolveMcpUserId } from "../../../../adapters/http/middlewares/mcpUserAuthMiddleware";

const HTTP_METHODS_WITH_BODY = ["POST", "PUT", "PATCH"];

export type NormalizedAuthType =
  | "BEARER"
  | "API_KEY"
  | "OAUTH"
  | "OAUTH_USER"
  | "NONE";

export class UserAuthRequiredError extends Error {
  public companyId: string;
  public apiId: string;
  public connectUrl: string;

  constructor(companyId: string, apiId: string, connectUrl: string) {
    super("User authorization is required to access this API.");
    this.name = "UserAuthRequiredError";
    this.companyId = companyId;
    this.apiId = apiId;
    this.connectUrl = connectUrl;
  }
}

/**
 * Robustly normalizes authType strings into standard categories.
 */
export const normalizeAuthType = (
  authType?: string,
  flow?: string,
): NormalizedAuthType => {
  if (!authType) return "NONE";
  const normalized = authType.trim().toLowerCase().replace(/[^a-z0-9]/g, "");

  if (
    normalized === "oauthuser" ||
    normalized === "useroauth" ||
    normalized === "oauthcode" ||
    normalized === "oauthpkce" ||
    flow === "authorization_code"
  ) {
    return "OAUTH_USER";
  }

  if (normalized === "bearer" || normalized === "bearertoken") {
    return "BEARER";
  }

  if (normalized === "apikey" || normalized === "api_key") {
    return "API_KEY";
  }

  if (["oauth", "oauth2", "oauth20"].includes(normalized)) {
    return "OAUTH";
  }

  return "NONE";
};

export const registerCompanyApiTools = (
  server: McpServer,
  company: ICompany,
) => {
  const apis = company.apis ?? [];
  const companyId = String((company as any)._id || company.companyName || "");

  apis.forEach((api, index) => {
    const apiId = String((api as any)._id || api.name || `api_${index + 1}`);
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
    const resourceUri = api.mcpResourceUri;

    const method = (api.method || "GET").toUpperCase();
    let readOnlyHint = false;
    let destructiveHint = false;

    if (method === "GET") {
      readOnlyHint = true;
      destructiveHint = false;
    } else if (method === "DELETE") {
      readOnlyHint = false;
      destructiveHint = true;
    } else {
      readOnlyHint = false;
      destructiveHint = false;
    }

    registerAppTool(
      server,
      toolName,
      {
        title: api.name || `API ${index + 1}`,
        description: toolDescription,
        inputSchema: customInputSchema,
        outputSchema: genericWidgetOutputSchema,
        annotations: {
          readOnlyHint,
          destructiveHint,
        },
        _meta: {
          ui: {
            resourceUri,
          },
          "openai/outputTemplate": resourceUri,
          "openai/widgetAccessible": true,
          "openai/toolInvocation/invoking": `Preparing ${api.name || "widget"}...`,
          "openai/toolInvocation/invoked": "Loaded",
        },
      },
      async (input: any, extra: any) => {
        try {
          const req = extra?.req;
          const rawResponse = await callRegisteredApi(
            companyId,
            apiId,
            api,
            input,
            req,
          );
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
            api.name || `API ${index + 1}`,
            company,
            resourceUri,
          );
        } catch (error: any) {
          if (error instanceof UserAuthRequiredError) {
            const authWidget = {
              title: `${api.name || "API"} Connection Required`,
              subtitle: `Account authorization is required to access ${company.companyName}.`,
              layout: company.uiPreference?.layout ?? "dashboard",
              industry: company.industry ?? "general",
              blocks: [
                {
                  type: "keyValue",
                  title: "Authorization Needed",
                  keyValueItems: [
                    {
                      key: "Status",
                      value: "Account Not Connected",
                    },
                    {
                      key: "Connect Account",
                      value: error.connectUrl,
                    },
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
              authWidget,
              api.name || `API ${index + 1}`,
              company,
              resourceUri,
            );
          }

          const sanitizedErrorMessage = sanitizeResponseBody(
            error?.message || "Service Notice",
          );

          console.error(
            `[MCP Tool Error] ${api.name} (${api.baseUrl}${api.endpoint}):`,
            {
              status: error?.status,
              message: sanitizedErrorMessage,
            },
          );

          const translation = translateApiError(
            error?.status,
            sanitizedErrorMessage,
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
            api.name || `API ${index + 1}`,
            company,
            resourceUri,
          );
        }
      },
    );
  });
};

const buildMcpSuccessResult = (
  widgetContent: any,
  apiName: string,
  company: ICompany,
  resourceUri?: string,
) => {
  const metaObject: Record<string, any> = {
    ui: {
      resourceUri,
    },
    "openai/outputTemplate": resourceUri,
    "openai/widgetAccessible": true,
    "openai/toolInvocation/invoking": `Loading ${apiName}...`,
    "openai/toolInvocation/invoked": "Loaded",
    company: company.companyName,
    lastFetched: new Date().toISOString(),
  };

  const result = {
    structuredContent: widgetContent,
    content: [
      {
        type: "text" as const,
        text: `${widgetContent.title || apiName} rendered`,
      },
    ],
    _meta: metaObject,
  };

  return result;
};

const callRegisteredApi = async (
  companyId: string,
  apiId: string,
  api: IApi,
  input: any,
  req?: any,
) => {
  const url = buildApiUrl(api, input);
  const method = (api.method || "GET").toUpperCase();

  const headers = await buildHeaders(companyId, apiId, api, false, req);

  const options: RequestInit = {
    method,
    headers: { ...headers },
  };

  if (HTTP_METHODS_WITH_BODY.includes(method)) {
    const bodyPayload = buildRequestBody(api, input);

    if (Object.keys(bodyPayload).length > 0) {
      (options.headers as Record<string, string>)["Content-Type"] =
        "application/json";
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

  const authType = normalizeAuthType(api.authType, (api.oauth as any)?.flow);

  // Perform at most ONE token refresh retry on HTTP 401 for OAuth APIs
  if (response.status === 401 && (authType === "OAUTH" || authType === "OAUTH_USER")) {
    if (authType === "OAUTH") {
      OAuthTokenService.invalidateToken(
        api.oauth?.tokenUrl,
        api.oauth?.clientId,
      );
    }

    try {
      const refreshedHeaders = await buildHeaders(
        companyId,
        apiId,
        api,
        true,
        req,
      );
      const retryOptions: RequestInit = {
        ...options,
        headers: { ...refreshedHeaders },
      };

      if (options.body) {
        (retryOptions.headers as Record<string, string>)["Content-Type"] =
          "application/json";
        retryOptions.body = options.body;
      }

      response = await fetch(url, retryOptions);
    } catch (error: any) {
      const retryNetworkError: any = new Error(
        error?.message || `Unable to connect to ${api.name}.`,
      );

      retryNetworkError.status = undefined;
      retryNetworkError.responseBody = undefined;

      throw retryNetworkError;
    }
  }

  const responseText = await response.text();

  if (!response.ok) {
    const error: any = new Error(
      `Registered API "${api.name}" failed with status ${response.status}`,
    );

    error.status = response.status;
    error.responseBody = sanitizeResponseBody(responseText);

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

const buildHeaders = async (
  companyId: string,
  apiId: string,
  api: IApi,
  forceRefreshToken = false,
  req?: any,
): Promise<Record<string, string>> => {
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

  const authType = normalizeAuthType(api.authType, (api.oauth as any)?.flow);

  if (authType === "BEARER" && api.bearerToken) {
    headers.Authorization = `Bearer ${api.bearerToken}`;
  } else if (authType === "API_KEY" && api.apiKey) {
    const authHeaderName = String(api.authHeader || "x-api-key").trim();

    if (authHeaderName) {
      headers[authHeaderName] = api.apiKey;
    }
  } else if (authType === "OAUTH") {
    const token = await OAuthTokenService.getAccessToken(
      api.oauth,
      forceRefreshToken,
      api.name,
    );

    headers.Authorization = `Bearer ${token}`;
  } else if (authType === "OAUTH_USER") {
    const userId = req ? resolveMcpUserId(req) : "anonymous_user";
    const token = await OAuthTokenService.getUserAccessToken({
      companyId,
      apiId,
      userId,
      oauth: api.oauth,
      forceRefresh: forceRefreshToken,
    });

    if (!token) {
      const connectUrl = `${env.OAUTH_CALLBACK_URL.replace("/callback", "/authorize")}?companyId=${encodeURIComponent(companyId)}&apiId=${encodeURIComponent(apiId)}`;
      throw new UserAuthRequiredError(companyId, apiId, connectUrl);
    }

    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

const sanitizeResponseBody = (body: string): string => {
  if (!body) return "";

  return body
    .replace(/"access_token"\s*:\s*"[^"]+"/gi, '"access_token":"[REDACTED]"')
    .replace(/"client_secret"\s*:\s*"[^"]+"/gi, '"client_secret":"[REDACTED]"')
    .replace(/Bearer\s+[A-Za-z0-9._~+/-]+=*/gi, "Bearer [REDACTED]");
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
