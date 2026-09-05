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
  detectFilterParams,
  buildRelaxedQueries,
  toggleNumber,
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

  // Step 2: Try singular/plural variants of path parameter values.
  // Many APIs use singular endpoints (/api/vehicle) but the model sends
  // plural values (/api/vehicles). Try toggling path param values between
  // singular and plural before falling back to query relaxation.
  const singularResult = await trySingularPathParams(api, input, companyId, apiId, req);
  if (singularResult !== undefined) {
    if (recovery) {
      recovery.recovered = true;
      recovery.effectiveQuery = "(singular/plural path variant)";
    }
    return singularResult;
  }

  // Step 3: Try dropping filter/category params when a filter-only API
  // returns empty. E.g. category="vehicles" returns nothing → try without
  // the category filter to get the full catalog. Also tries singular form
  // of the filter value (vehicles → vehicle) and promoting the filter value
  // to a search query if the API has a search param.
  const filters = detectFilterParams(api, input);
  const search = detectSearchParam(api, input);
  if (filters.length > 0) {
    for (const filter of filters) {
      // 3a: Try singular form of the filter value
      const singular = toggleNumber(filter.value);
      if (singular && singular !== filter.value) {
        console.log(
          `[API Handler] Trying singular filter: ${filter.key}="${filter.value}" → "${singular}"`,
        );
        const singularResult = await executeApiCall(
          companyId,
          apiId,
          api,
          withFilterValue(input, filter, singular),
          req,
        );
        if (isUserAuthRequiredNotice(singularResult)) return singularResult;
        if (!isEmptyResult(singularResult)) {
          if (recovery) {
            recovery.recovered = true;
            recovery.effectiveQuery = `(singular filter: ${filter.key}=${singular})`;
          }
          return singularResult;
        }
      }

      // 3b: Drop the filter entirely → return full catalog
      console.log(
        `[API Handler] Dropping filter: ${filter.key}="${filter.value}" → (empty)`,
      );
      const dropResult = await executeApiCall(
        companyId,
        apiId,
        api,
        withFilterValue(input, filter, ""),
        req,
      );
      if (isUserAuthRequiredNotice(dropResult)) return dropResult;
      if (!isEmptyResult(dropResult)) {
        if (recovery) {
          recovery.recovered = true;
          recovery.effectiveQuery = `(dropped filter: ${filter.key})`;
        }
        return dropResult;
      }

      // 3c: If API also has a search param, promote filter value to search query
      if (search) {
        console.log(
          `[API Handler] Promoting filter value to search: ${search.key}="${filter.value}"`,
        );
        const promotedResult = await executeApiCall(
          companyId,
          apiId,
          api,
          withSearchValue(input, search, filter.value),
          req,
        );
        if (isUserAuthRequiredNotice(promotedResult)) return promotedResult;
        if (!isEmptyResult(promotedResult)) {
          if (recovery) {
            recovery.recovered = true;
            recovery.effectiveQuery = `(promoted filter to search: ${search.key}=${filter.value})`;
          }
          return promotedResult;
        }
      }
    }
  }

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

/**
 * Returns a shallow copy of the tool input with the detected filter parameter
 * overridden. An empty string omits the parameter (buildApiUrl skips blank
 * values), which asks the upstream API for the full list without the filter.
 */
const withFilterValue = (
  input: any,
  filter: { key: string; inputName: string },
  value: string,
): any => {
  const base = input && typeof input === "object" ? { ...input } : {};
  base[filter.inputName] = value;
  base[filter.key] = value;

  if (base.params && typeof base.params === "object") {
    base.params = {
      ...base.params,
      [filter.inputName]: value,
      [filter.key]: value,
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

  console.log(
    `[API Handler] ${method} ${url.toString()}`,
    options.body ? `body=${options.body}` : "(no body)",
  );

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

  console.log(
    `[API Handler] ← ${response.status} ${url.toString()}`,
    responseText.length > 500
      ? responseText.substring(0, 500) + "..."
      : responseText,
  );

  if (!response.ok) {
    // For GET requests, a 404 means "no results found" — not a fatal error.
    // Return null so search recovery and cross-tool fallback can handle it
    // gracefully instead of showing an error widget to the user.
    const method = (api.method || "GET").toUpperCase();
    if (response.status === 404 && method === "GET") {
      console.log(
        `[API Handler] GET ${url.toString()} returned 404 — treating as empty result`,
      );
      return null;
    }

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
  // Decode once so path placeholders like {id} (stored percent-encoded as
  // %7Bid%7D) are matchable both for substitution below AND for the
  // path-vs-query classification further down (endpointContainsParameter).
  // Generic — applies to any param name / any company.
  const endpointTemplate = decodeURIComponent(
    (api.endpoint || "").replace(/^\//, ""),
  );
  let endpoint = endpointTemplate;
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

    let value = resolveParameterValue(parameter, allInputValues);
    if (value === undefined || value === null || value === "") continue;

    // If this is a path parameter and contains spaces, format as slug
    const isPath = endpointContainsParameter(endpointTemplate, key);
    if (isPath && typeof value === "string" && /\s/.test(value)) {
      value = value.trim().replace(/['"]/g, "").replace(/\s+/g, "-");
    }

    const encodedValue = encodeURIComponent(String(value));
    endpoint = endpoint
      .replace(new RegExp(`\\{${escapeRegExp(key)}\\}`, "gi"), encodedValue)
      .replace(new RegExp(`:${escapeRegExp(key)}\\b`, "gi"), encodedValue)
      .replace(
        new RegExp(`(^|/)${escapeRegExp(key)}(/|$)`, "gi"),
        (_, p1, p2) => `${p1}${encodedValue}${p2}`,
      );
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
    allInputValues.itemId ??
    allInputValues.categoryname ??
    allInputValues.category ??
    allInputValues.slug;
  if (
    fallbackId !== undefined &&
    fallbackId !== null &&
    String(fallbackId) !== ""
  ) {
    const remaining = endpoint.match(/\{[^}]+\}|:[a-zA-Z0-9_-]+/g) || [];
    if (remaining.length === 1) {
      let slugVal = String(fallbackId).trim();
      if (/\s/.test(slugVal)) {
        slugVal = slugVal.replace(/['"]/g, "").replace(/\s+/g, "-");
      }
      endpoint = endpoint.replace(
        /\{[^}]+\}|:[a-zA-Z0-9_-]+/,
        encodeURIComponent(slugVal),
      );
    }
  }

  // Category fallback: If endpoint is a category path and the parameter value is "all", "all-categories",
  // or was omitted/empty, rewrite the endpoint to strip /category/ or /categories/ so it returns all records!
  if (
    /(^|\/)categor(?:y|ies)\/(?:all|all-categories|\{\w+\}|:\w+)?$/i.test(
      endpoint,
    )
  ) {
    endpoint = endpoint.replace(
      /\/?categor(?:y|ies)\/(?:all|all-categories|\{\w+\}|:\w+)?$/i,
      "",
    );
  }

  if (/{[^}]+}/.test(endpoint) || /:[a-zA-Z0-9_-]+/.test(endpoint)) {
    throw new Error(`Missing required path parameter for ${api.name || "API"}`);
  }

  const url = new URL(endpoint, baseUrl);

  for (const parameter of configuredParams) {
    const key = cleanParameterKey(parameter.key);
    if (!key) continue;

    const isPathParameter = endpointContainsParameter(endpointTemplate, key);
    if (isPathParameter) continue;

    const value = resolveParameterValue(parameter, allInputValues);
    if (value === undefined || value === null || String(value).trim() === "")
      continue;

    url.searchParams.set(key, String(value));
  }

  return url;
};

/**
 * When a GET request returns empty, try toggling path parameter values between
 * singular and plural forms, or hyphenated slug variants. Many APIs use singular
 * endpoints (/api/vehicle) or hyphenated categories (/category/womens-bags)
 * while the model sends spaces or variations (/category/women bags).
 */
const trySingularPathParams = async (
  api: IApi,
  input: any,
  companyId: string,
  apiId: string,
  req?: any,
): Promise<any | undefined> => {
  let endpoint: string;
  try {
    endpoint = decodeURIComponent(String(api.endpoint || ""));
  } catch {
    endpoint = String(api.endpoint || "");
  }
  const pathParamRegex = /\{([^}]+)\}|:([a-zA-Z0-9_-]+)/g;
  const rawInput = typeof input === "object" && input !== null ? input : {};
  const inputParams =
    rawInput.params && typeof rawInput.params === "object"
      ? rawInput.params
      : {};
  const allInputValues: Record<string, any> = {
    ...inputParams,
    ...rawInput,
  };

  let match;
  while ((match = pathParamRegex.exec(endpoint)) !== null) {
    const paramKey = match[1] || match[2];
    if (!paramKey) continue;

    const rawVal =
      allInputValues[paramKey] ??
      allInputValues[cleanParameterKey(paramKey)] ??
      (paramKey.toLowerCase().includes("category") || paramKey.toLowerCase() === "slug"
        ? allInputValues.category ??
          allInputValues.categoryname ??
          allInputValues.categoryName ??
          allInputValues.slug ??
          allInputValues.id
        : allInputValues.id);

    if (rawVal === undefined || rawVal === null || String(rawVal).trim() === "") continue;

    const strVal = String(rawVal).trim();
    const candidates = new Set<string>();

    const slugified = strVal.toLowerCase().replace(/['"]/g, "").replace(/\s+/g, "-");
    if (slugified !== strVal) candidates.add(slugified);

    if (slugified.includes("women-")) candidates.add(slugified.replace("women-", "womens-"));
    if (slugified.includes("womens-")) candidates.add(slugified.replace("womens-", "women-"));
    if (slugified.includes("men-")) candidates.add(slugified.replace("men-", "mens-"));
    if (slugified.includes("mens-")) candidates.add(slugified.replace("mens-", "men-"));

    const singular = toggleNumber(strVal);
    if (singular && singular !== strVal) {
      candidates.add(singular);
      candidates.add(singular.toLowerCase().replace(/['"]/g, "").replace(/\s+/g, "-"));
    }

    for (const candidate of candidates) {
      if (!candidate || candidate === strVal) continue;

      console.log(
        `[API Handler] Trying path parameter variant: ${paramKey}="${strVal}" → "${candidate}"`,
      );

      const modifiedInput = { ...rawInput, [paramKey]: candidate };
      if (inputParams && typeof inputParams === "object") {
        modifiedInput.params = { ...inputParams, [paramKey]: candidate };
      }

      try {
        const result = await executeApiCall(companyId, apiId, api, modifiedInput, req);
        if (isUserAuthRequiredNotice(result)) return result;
        if (!isEmptyResult(result)) {
          console.log(
            `[API Handler] Path variant "${candidate}" returned results`,
          );
          return result;
        }
      } catch {
        // Variant failed — continue
      }
    }
  }

  return undefined;
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

  // Fallback: If no body fields were explicitly configured, pass through the clean input data.
  // For DELETE requests, skip the body entirely unless the API explicitly expects one —
  // most REST DELETE endpoints only need the ID in the URL path.
  const method = (api.method || "GET").toUpperCase();
  if (method === "DELETE") {
    return {};
  }

  // Keys that must never appear in the request body:
  //  - System/internal keys managed by the MCP bridge
  //  - $-prefixed widget UI markers (e.g. $title, $price) are for display only
  //  - ID fields belong in the URL path, not in the body — sending them in the
  //    body can confuse REST APIs that derive the resource identity from the URL
  const excludedKeys = new Set([
    "user_raw_prompt",
    "inferred_intent",
    "platformtype",
    "platformType",
    "params",
    "id",
    "_id",
    "packageId",
    "package_id",
    "productId",
    "product_id",
    "itemId",
    "item_id",
  ]);

  const fallbackBody: Record<string, any> = {};
  for (const [k, v] of Object.entries(rawInput)) {
    if (v === undefined || v === null) continue;
    if (excludedKeys.has(k)) continue;
    // Strip $-prefixed widget UI markers
    if (k.startsWith("$")) continue;
    fallbackBody[k] = coerceJsonValue(v);
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
    if (
      inputValues[key] !== undefined &&
      inputValues[key] !== null &&
      String(inputValues[key]).trim() !== ""
    ) {
      return inputValues[key];
    }
    const originalKey = String(parameter.key || "").trim();
    if (
      inputValues[originalKey] !== undefined &&
      inputValues[originalKey] !== null &&
      String(inputValues[originalKey]).trim() !== ""
    ) {
      return inputValues[originalKey];
    }

    // Normalized key lookup (e.g. category_name matches categoryname and categoryName)
    const normKey = key.toLowerCase().replace(/[^a-z0-9]/g, "");
    for (const [k, v] of Object.entries(inputValues)) {
      if (
        v !== undefined &&
        v !== null &&
        String(v).trim() !== "" &&
        k.toLowerCase().replace(/[^a-z0-9]/g, "") === normKey
      ) {
        return v;
      }
    }

    // Category alias fallback: if parameter key is a category/slug field, check common category properties
    if (
      key.toLowerCase().includes("category") ||
      key.toLowerCase() === "slug" ||
      key.toLowerCase() === "genre"
    ) {
      const categoryAlias =
        inputValues.categoryname ??
        inputValues.categoryName ??
        inputValues.category_name ??
        inputValues.category ??
        inputValues.slug ??
        inputValues.name ??
        inputValues.title;
      if (
        categoryAlias !== undefined &&
        categoryAlias !== null &&
        String(categoryAlias).trim() !== ""
      ) {
        return categoryAlias;
      }
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
      if (idAlias !== undefined && idAlias !== null && String(idAlias).trim() !== "") {
        return idAlias;
      }
    }

    // The model omitted this value: fall back to a configured default so
    // company-set defaults (e.g. limit=10) actually reach the API. `value`
    // stays an example only; `defaultValue` is the intentional fallback.
    // Skip when defaultValue equals the key name itself (e.g. id="id") —
    // that's a placeholder from registration, not a real value.
    if (
      parameter.defaultValue !== undefined &&
      parameter.defaultValue !== null &&
      String(parameter.defaultValue) !== "" &&
      String(parameter.defaultValue).toLowerCase() !== key.toLowerCase()
    ) {
      return parameter.defaultValue;
    }
    return undefined;
  }

  // Static parameter: return configured value, but skip when the value is
  // just the key name itself (e.g. key="id", value="id") — that's a
  // placeholder the user entered during registration, not a real API value.
  if (
    parameter.value !== undefined &&
    parameter.value !== null &&
    String(parameter.value) !== "" &&
    String(parameter.value).toLowerCase() !== key.toLowerCase()
  ) {
    return parameter.value;
  }
  return undefined;
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
    new RegExp(`:${escapeRegExp(key)}\\b`, "i").test(endpoint) ||
    new RegExp(`(^|/)${escapeRegExp(key)}(/|$)`, "i").test(endpoint)
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

  // 1. Check for dynamic user Bearer token passed from ChatGPT / MCP Client
  const incomingAuth =
    req?.headers?.authorization ||
    req?.headers?.Authorization ||
    req?.headers?.["authorization"] ||
    req?.headers?.["Authorization"];

  if (incomingAuth) {
    headers.Authorization = String(incomingAuth).trim();
    return headers;
  }

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
  } else if (authType === "OAUTH_USER" || api.requiresAuth) {
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
