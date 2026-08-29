import { IApi } from "../../../../domain/types/company.types";
import {
  NormalizedAuthType,
  IUserAuthRequiredNotice,
} from "../../../../domain/types/oauthConnection.types";
import {
  getAccessToken,
  getUserAccessToken,
  invalidateToken,
} from "../../../../application/services/oauth/OAuthTokenService";
import { env } from "../../../../infrastructure/config/env";
import { resolveMcpUserId } from "../../../../adapters/http/middlewares/mcpUserAuthMiddleware";
import {
  SearchRecoveryInfo,
  isEmptyResult,
  detectSearchParam,
  buildRelaxedQueries,
} from "./searchrecovery";

const HTTP_METHODS_WITH_BODY = ["POST", "PUT", "PATCH", "DELETE"];

export const createUserAuthRequiredNotice = (
  companyId: string,
  apiId: string,
  connectUrl: string,
): IUserAuthRequiredNotice => ({
  isAuthRequired: true,
  companyId,
  apiId,
  connectUrl,
  message: "User authorization is required to access this API.",
});

export const isUserAuthRequiredNotice = (
  error: any,
): error is IUserAuthRequiredNotice => {
  return error && typeof error === "object" && error.isAuthRequired === true;
};

export const normalizeAuthType = (
  authType?: string,
  flow?: string,
): NormalizedAuthType => {
  if (!authType) return "NONE";
  const normalized = authType
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

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

export const sanitizeResponseBody = (body: string): string => {
  if (!body) return "";

  return body
    .replace(/"access_token"\s*:\s*"[^"]+"/gi, '"access_token":"[REDACTED]"')
    .replace(/"client_secret"\s*:\s*"[^"]+"/gi, '"client_secret":"[REDACTED]"')
    .replace(/Bearer\s+[A-Za-z0-9._~+/-]+=*/gi, "Bearer [REDACTED]");
};

/**
 * Public entry point. Executes the registered API and, for read-only (GET)
 * searches that come back empty, transparently retries with progressively
 * relaxed query terms (see searchrecovery.ts). Generic for every company and
 * entity type — nothing here is product-specific.
 *
 * When `recovery` is supplied it is populated so the caller can tell the model
 * what happened (exact hit, relaxed match, or genuinely empty).
 */
export const callRegisteredApi = async (
  companyId: string,
  apiId: string,
  api: IApi,
  input: any,
  req?: any,
  recovery?: SearchRecoveryInfo,
) => {
  const method = (api.method || "GET").toUpperCase();

  // First attempt: exactly what the model asked for.
  const firstResult = await executeApiCall(companyId, apiId, api, input, req);

  // Only relax read-only searches. Auth notices, write ops, and non-empty
  // results all pass straight through untouched.
  if (
    method !== "GET" ||
    isUserAuthRequiredNotice(firstResult) ||
    !isEmptyResult(firstResult)
  ) {
    return firstResult;
  }

  const search = detectSearchParam(api, input);
  if (!search) {
    // Empty, but there is no free-text query to loosen (e.g. a pure filter).
    if (recovery) recovery.empty = true;
    return firstResult;
  }

  for (const candidate of buildRelaxedQueries(search.value)) {
    const relaxedResult = await executeApiCall(
      companyId,
      apiId,
      api,
      withSearchValue(input, search, candidate),
      req,
    );

    if (isUserAuthRequiredNotice(relaxedResult)) return relaxedResult;

    if (!isEmptyResult(relaxedResult)) {
      if (recovery) {
        recovery.recovered = true;
        recovery.originalQuery = search.value;
        recovery.effectiveQuery = candidate; // "" => query dropped, full list
      }
      return relaxedResult;
    }
  }

  // Even dropping the query entirely returned nothing.
  if (recovery) {
    recovery.empty = true;
    recovery.originalQuery = search.value;
  }
  return firstResult;
};

/**
 * Returns a shallow copy of the tool input with the detected search parameter
 * overridden. An empty string omits the parameter (buildApiUrl skips blank
 * values), which asks the upstream API for the full list/catalog.
 */
const withSearchValue = (
  input: any,
  search: { key: string; inputName: string },
  value: string,
): any => {
  const base = input && typeof input === "object" ? { ...input } : {};
  base[search.inputName] = value;
  base[search.key] = value;

  if (base.params && typeof base.params === "object") {
    base.params = {
      ...base.params,
      [search.inputName]: value,
      [search.key]: value,
    };
  }
  return base;
};

const executeApiCall = async (
  companyId: string,
  apiId: string,
  api: IApi,
  input: any,
  req?: any,
) => {
  const url = buildApiUrl(api, input);
  const method = (api.method || "GET").toUpperCase();

  const headerResult = await buildHeaders(companyId, apiId, api, false, req);

  if (isUserAuthRequiredNotice(headerResult)) {
    return headerResult;
  }

  const headers = headerResult as Record<string, string>;

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
    response = await fetch(url.toString(), options);
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
  if (
    response.status === 401 &&
    (authType === "OAUTH" || authType === "OAUTH_USER")
  ) {
    if (authType === "OAUTH") {
      invalidateToken(api.oauth?.tokenUrl, api.oauth?.clientId);
    }

    try {
      const refreshedHeaderResult = await buildHeaders(
        companyId,
        apiId,
        api,
        true,
        req,
      );

      if (isUserAuthRequiredNotice(refreshedHeaderResult)) {
        return refreshedHeaderResult;
      }

      const refreshedHeaders = refreshedHeaderResult as Record<string, string>;

      const retryOptions: RequestInit = {
        ...options,
        headers: { ...refreshedHeaders },
      };

      if (options.body) {
        (retryOptions.headers as Record<string, string>)["Content-Type"] =
          "application/json";
        retryOptions.body = options.body;
      }

      response = await fetch(url.toString(), retryOptions);
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
    if (value === undefined || value === null || value === "") continue;

    const encodedValue = encodeURIComponent(String(value));
    endpoint = endpoint
      .replace(new RegExp(`\\{${escapeRegExp(key)}\\}`, "gi"), encodedValue)
      .replace(new RegExp(`:${escapeRegExp(key)}\\b`, "gi"), encodedValue);
  }

  // Widget fallback: the ChatGPT widget always invokes get-by-id style tools
  // with `{ id }` (see the action buttons). If exactly one path placeholder is
  // still unfilled and an id was supplied, use it — so a detail tool works no
  // matter how the company named its path param (/x/{id}, /x/{productId},
  // /x/:uuid). Skipped when a configured param already filled the id.
  const fallbackId =
    allInputValues.id ??
    allInputValues._id ??
    allInputValues.packageId ??
    allInputValues.productId ??
    allInputValues.itemId;
  if (
    fallbackId !== undefined &&
    fallbackId !== null &&
    String(fallbackId) !== ""
  ) {
    const remaining = endpoint.match(/\{[^}]+\}|:[a-zA-Z0-9_-]+/g) || [];
    if (remaining.length === 1) {
      endpoint = endpoint.replace(
        /\{[^}]+\}|:[a-zA-Z0-9_-]+/,
        encodeURIComponent(String(fallbackId)),
      );
    }
  }

  if (/{[^}]+}/.test(endpoint) || /:[a-zA-Z0-9_-]+/.test(endpoint)) {
    throw new Error(`Missing required path parameter for ${api.name || "API"}`);
  }

  const url = new URL(endpoint, baseUrl);

  for (const parameter of configuredParams) {
    const key = cleanParameterKey(parameter.key);
    if (!key) continue;

    const isPathParameter = endpointContainsParameter(api.endpoint, key);
    if (isPathParameter) continue;

    const value = resolveParameterValue(parameter, allInputValues);
    if (value === undefined || value === null || String(value).trim() === "")
      continue;

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

      const value = coerceJsonValue(
        resolveParameterValue(field, {
          ...inputParams,
          ...rawInput,
        }),
      );

      if (value !== undefined && value !== null) {
        body[key] = value;
      }
    }
    return body;
  }

  // Fallback: If no body fields were explicitly configured, pass through the clean input data
  const systemKeys = [
    "user_raw_prompt",
    "inferred_intent",
    "platformtype",
    "platformType",
    "params",
  ];
  const fallbackBody: Record<string, any> = {};
  for (const [k, v] of Object.entries(rawInput)) {
    if (!systemKeys.includes(k) && v !== undefined && v !== null) {
      fallbackBody[k] = coerceJsonValue(v);
    }
  }
  return fallbackBody;
};

/**
 * Some models stringify structured body fields (objects/arrays) even when the
 * input schema accepts them directly, which previously reached the upstream
 * API as a quoted JSON blob. When a value is a string that clearly encodes
 * JSON (starts with { or [), parse it so the API receives a real object/array.
 * Non-JSON strings pass through untouched. Applied only to request-body values.
 */
const coerceJsonValue = (value: any): any => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (trimmed === "") return value;
  const first = trimmed[0];
  if (first !== "{" && first !== "[") return value;
  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
};

const normalizeConfiguredParameters = (params: any): any[] => {
  if (!Array.isArray(params)) return [];

  return params
    .map((param) => {
      if (!param) return null;
      if (typeof param === "object" && param.key) return param;
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
  if (!key) return undefined;

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

    // ID alias fallback: if parameter key is an ID field, check common ID properties
    if (
      key.toLowerCase().endsWith("id") ||
      key.toLowerCase() === "id" ||
      key.toLowerCase() === "_id"
    ) {
      const idAlias =
        inputValues.id ??
        inputValues._id ??
        inputValues.packageId ??
        inputValues.package_id ??
        inputValues.productId ??
        inputValues.product_id ??
        inputValues.itemId ??
        inputValues.item_id;
      if (idAlias !== undefined && idAlias !== null) {
        return idAlias;
      }
    }

    // The model omitted this value: fall back to a configured default so
    // company-set defaults (e.g. limit=10) actually reach the API. `value`
    // stays an example only; `defaultValue` is the intentional fallback.
    if (
      parameter.defaultValue !== undefined &&
      parameter.defaultValue !== null &&
      String(parameter.defaultValue) !== ""
    ) {
      return parameter.defaultValue;
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
): Promise<Record<string, string> | IUserAuthRequiredNotice> => {
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
    const token = await getAccessToken(api.oauth, forceRefreshToken, api.name);
    headers.Authorization = `Bearer ${token}`;
  } else if (authType === "OAUTH_USER") {
    const userId = req ? resolveMcpUserId(req) : "anonymous_user";
    const token = await getUserAccessToken({
      companyId,
      apiId,
      userId,
      oauth: api.oauth,
      forceRefresh: forceRefreshToken,
    });

    if (!token) {
      const connectUrl = `${env.OAUTH_CALLBACK_URL.replace("/callback", "/authorize")}?companyId=${encodeURIComponent(companyId)}&apiId=${encodeURIComponent(apiId)}`;
      return createUserAuthRequiredNotice(companyId, apiId, connectUrl);
    }
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

const escapeRegExp = (value: string) => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};
