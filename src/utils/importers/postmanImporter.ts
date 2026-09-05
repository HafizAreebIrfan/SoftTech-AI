import { ApiConnection } from "../../interfaces/auth/signup.interface";
import { WidgetAudience } from "../../domain/entities/GenericWidget";
import { isInternalAuthPath } from "./openApiImporter";

export interface ExtendedPostmanApiConnection extends ApiConnection {
  isInternalAuthRoute?: boolean;
}

export interface ParsedPostmanResult {
  success: boolean;
  apis: ExtendedPostmanApiConnection[];
  collectionName?: string;
  description?: string;
  globalAuthType?: string;
  globalAuthHeader?: string;
  globalCredentials?: string;
  warnings: string[];
  error?: string;
}

/**
 * Replaces Postman {{variable}} placeholders with values from variables dictionary.
 */
function replacePostmanVariables(text: string, varMap: Record<string, string>): string {
  if (!text || typeof text !== "string") return text;
  return text.replace(/\{\{([^{}]+)\}\}/g, (match, varName) => {
    const trimmed = varName.trim();
    if (trimmed in varMap && varMap[trimmed] !== undefined) {
      return varMap[trimmed];
    }
    return match;
  });
}

/**
 * Extracts and formats URL from Postman request URL representation.
 */
function extractPostmanUrl(
  urlField: any,
  varMap: Record<string, string>
): {
  fullUrl: string;
  queryParams: Array<{ key: string; value: string; isDynamic: boolean }>;
} {
  const queryParams: Array<{ key: string; value: string; isDynamic: boolean }> = [];

  if (!urlField) {
    return { fullUrl: "", queryParams };
  }

  if (typeof urlField === "string") {
    const replaced = replacePostmanVariables(urlField, varMap);
    try {
      const urlObj = new URL(replaced.startsWith("http") ? replaced : `https://${replaced}`);
      urlObj.searchParams.forEach((val, key) => {
        queryParams.push({ key, value: val, isDynamic: true });
      });
      return { fullUrl: replaced.split("?")[0], queryParams };
    } catch {
      return { fullUrl: replaced, queryParams };
    }
  }

  if (typeof urlField === "object") {
    let raw = urlField.raw || "";
    raw = replacePostmanVariables(raw, varMap);

    if (Array.isArray(urlField.query)) {
      urlField.query.forEach((q: any) => {
        if (!q.disabled && q.key) {
          queryParams.push({
            key: replacePostmanVariables(String(q.key), varMap),
            value: replacePostmanVariables(String(q.value ?? ""), varMap),
            isDynamic: true,
          });
        }
      });
    }

    const cleanRaw = raw.split("?")[0];
    return { fullUrl: cleanRaw, queryParams };
  }

  return { fullUrl: "", queryParams };
}

/**
 * Resolves auth details and credential values from Postman auth configuration.
 */
function extractPostmanAuth(
  authObj: any,
  varMap: Record<string, string>
): {
  apiAuthType: string;
  apiAuthHeader?: string;
  apiCredentials?: string;
  isUserOAuth?: boolean;
  oauthAuthorizationUrl?: string;
  oauthTokenUrl?: string;
  oauthClientId?: string;
} {
  if (!authObj || typeof authObj !== "object") {
    return { apiAuthType: "No Auth" };
  }

  const type = (authObj.type || "").toLowerCase();

  if (type === "bearer") {
    let tokenVal = "";
    if (Array.isArray(authObj.bearer)) {
      const tokenEntry = authObj.bearer.find((item: any) => item.key === "token");
      if (tokenEntry?.value) {
        tokenVal = replacePostmanVariables(String(tokenEntry.value), varMap);
      }
    } else if (typeof authObj.bearer === "string") {
      tokenVal = replacePostmanVariables(authObj.bearer, varMap);
    }

    // If empty, check if variable {{token}} or {{bearerToken}} exists
    if (!tokenVal && varMap["token"]) {
      tokenVal = varMap["token"];
    } else if (!tokenVal && varMap["bearerToken"]) {
      tokenVal = varMap["bearerToken"];
    }

    return {
      apiAuthType: "Bearer Token",
      apiAuthHeader: "Authorization",
      apiCredentials: tokenVal,
    };
  }

  if (type === "apikey") {
    let keyName = "X-API-KEY";
    let keyVal = "";
    if (Array.isArray(authObj.apikey)) {
      const keyEntry = authObj.apikey.find((item: any) => item.key === "key");
      const valEntry = authObj.apikey.find((item: any) => item.key === "value");
      if (keyEntry?.value) {
        keyName = replacePostmanVariables(String(keyEntry.value), varMap);
      }
      if (valEntry?.value) {
        keyVal = replacePostmanVariables(String(valEntry.value), varMap);
      }
    }

    if (!keyVal && varMap["apiKey"]) {
      keyVal = varMap["apiKey"];
    }

    return {
      apiAuthType: "API Key",
      apiAuthHeader: keyName,
      apiCredentials: keyVal,
    };
  }

  if (type === "oauth2") {
    let authUrl = "";
    let tokenUrl = "";
    let clientId = "";
    if (Array.isArray(authObj.oauth2)) {
      const authEntry = authObj.oauth2.find((item: any) => item.key === "authUrl");
      const tokenEntry = authObj.oauth2.find((item: any) => item.key === "accessTokenUrl");
      const clientEntry = authObj.oauth2.find((item: any) => item.key === "clientId");
      if (authEntry?.value) authUrl = replacePostmanVariables(String(authEntry.value), varMap);
      if (tokenEntry?.value) tokenUrl = replacePostmanVariables(String(tokenEntry.value), varMap);
      if (clientEntry?.value) clientId = replacePostmanVariables(String(clientEntry.value), varMap);
    }
    return {
      apiAuthType: "OAuth 2.0",
      isUserOAuth: true,
      oauthAuthorizationUrl: authUrl,
      oauthTokenUrl: tokenUrl,
      oauthClientId: clientId,
    };
  }

  if (type === "basic") {
    let user = "";
    let pass = "";
    if (Array.isArray(authObj.basic)) {
      const u = authObj.basic.find((item: any) => item.key === "username");
      const p = authObj.basic.find((item: any) => item.key === "password");
      if (u?.value) user = replacePostmanVariables(String(u.value), varMap);
      if (p?.value) pass = replacePostmanVariables(String(p.value), varMap);
    }
    return {
      apiAuthType: "Basic Auth",
      apiAuthHeader: "Authorization",
      apiCredentials: user && pass ? `${user}:${pass}` : user,
    };
  }

  return { apiAuthType: "No Auth" };
}

/**
 * Parses a Postman Collection (v2.0 or v2.1) JSON file into a list of SoftTech ApiConnection objects.
 */
export function parsePostmanCollection(
  rawInput: string | object,
  defaultAudience: WidgetAudience = "customer"
): ParsedPostmanResult {
  const warnings: string[] = [];
  let collection: any = null;

  try {
    if (typeof rawInput === "string") {
      collection = JSON.parse(rawInput);
    } else {
      collection = rawInput;
    }
  } catch (err: any) {
    return {
      success: false,
      apis: [],
      warnings: [],
      error: `Invalid Postman Collection JSON: ${err.message}`,
    };
  }

  if (!collection || typeof collection !== "object") {
    return {
      success: false,
      apis: [],
      warnings: [],
      error: "Provided content is not a valid Postman Collection JSON object.",
    };
  }

  const collectionName = collection.info?.name || "Imported Postman Collection";
  const description = collection.info?.description || "";

  // Build variable dictionary
  const varMap: Record<string, string> = {};
  if (Array.isArray(collection.variable)) {
    collection.variable.forEach((v: any) => {
      if (v.key && v.value !== undefined) {
        varMap[String(v.key)] = String(v.value);
      }
    });
  }

  // Collection-level Auth fallback
  const collectionAuth = collection.auth;
  const globalAuth = extractPostmanAuth(collectionAuth, varMap);

  const apis: ExtendedPostmanApiConnection[] = [];

  function traverseItems(items: any[], folderPath: string[] = []) {
    if (!Array.isArray(items)) return;

    for (const item of items) {
      if (!item || typeof item !== "object") continue;

      if (Array.isArray(item.item)) {
        traverseItems(item.item, [...folderPath, item.name || ""]);
        continue;
      }

      const request = item.request;
      if (!request) continue;

      const rawMethod = typeof request === "string" ? "GET" : request.method || "GET";
      const upperMethod = rawMethod.toUpperCase() as "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

      const { fullUrl, queryParams } = extractPostmanUrl(
        typeof request === "string" ? request : request.url,
        varMap
      );

      const apiName = item.name || fullUrl || `${upperMethod} Request`;

      // Audience detection based on folder name / path
      const fullContext = [...folderPath, item.name || "", fullUrl].join(" ").toLowerCase();
      let audience: WidgetAudience = defaultAudience;
      if (
        fullContext.includes("admin") ||
        fullContext.includes("backoffice") ||
        fullContext.includes("manage")
      ) {
        audience = "admin";
      }

      // Internal identity / auth route detection
      const isInternalAuthRoute = isInternalAuthPath(fullUrl);

      // Headers
      const headerList: Array<{ key: string; value: string; isDynamic: boolean }> = [];
      if (request.header && Array.isArray(request.header)) {
        request.header.forEach((h: any) => {
          if (!h.disabled && h.key) {
            headerList.push({
              key: replacePostmanVariables(String(h.key), varMap),
              value: replacePostmanVariables(String(h.value ?? ""), varMap),
              isDynamic: false,
            });
          }
        });
      }

      // Request Body
      let apiRequestBody = "";
      if (request.body) {
        if (request.body.mode === "raw" && request.body.raw) {
          apiRequestBody = replacePostmanVariables(request.body.raw, varMap);
        } else if (
          request.body.mode === "urlencoded" &&
          Array.isArray(request.body.urlencoded)
        ) {
          const bodyObj: Record<string, string> = {};
          request.body.urlencoded.forEach((param: any) => {
            if (!param.disabled && param.key) {
              bodyObj[param.key] = replacePostmanVariables(String(param.value ?? ""), varMap);
            }
          });
          apiRequestBody = JSON.stringify(bodyObj, null, 2);
        } else if (
          request.body.mode === "formdata" &&
          Array.isArray(request.body.formdata)
        ) {
          const bodyObj: Record<string, string> = {};
          request.body.formdata.forEach((param: any) => {
            if (!param.disabled && param.key) {
              bodyObj[param.key] = replacePostmanVariables(String(param.value ?? ""), varMap);
            }
          });
          apiRequestBody = JSON.stringify(bodyObj, null, 2);
        }
      }

      // Sample Response (from saved examples in Postman)
      let sampleresponse = "";
      if (Array.isArray(item.response) && item.response.length > 0) {
        const firstResp = item.response[0];
        if (firstResp?.body) {
          try {
            const parsedResp = JSON.parse(firstResp.body);
            sampleresponse = JSON.stringify(parsedResp, null, 2);
          } catch {
            sampleresponse = firstResp.body;
          }
        }
      }

      // Auth details extraction
      const effectiveAuth = request.auth || collectionAuth;
      const authInfo = extractPostmanAuth(effectiveAuth, varMap);

      // Realtime Live Stream Check
      let isRealtimeApi = false;
      let streamUrl = "";
      if (
        fullContext.includes("websocket") ||
        fullContext.includes("ws://") ||
        fullContext.includes("wss://") ||
        fullContext.includes("realtime") ||
        fullContext.includes("socket.io") ||
        fullContext.includes("sse")
      ) {
        isRealtimeApi = true;
        streamUrl = fullUrl.replace(/^http/, "ws");
      }

      apis.push({
        id: `api-postman-${Date.now()}-${apis.length + 1}`,
        apiName: apiName.slice(0, 80),
        apiMethod: upperMethod,
        apiEndpoint: fullUrl,
        apiAuthType: authInfo.apiAuthType,
        apiAuthHeader: authInfo.apiAuthHeader || "Authorization",
        apiCredentials: authInfo.apiCredentials || "",
        isUserOAuth: authInfo.isUserOAuth,
        oauthAuthorizationUrl: authInfo.oauthAuthorizationUrl,
        oauthTokenUrl: authInfo.oauthTokenUrl,
        oauthClientId: authInfo.oauthClientId,
        apiQueryParams: queryParams.length > 0 ? JSON.stringify(queryParams, null, 2) : "",
        apiHeaders: headerList.length > 0 ? JSON.stringify(headerList, null, 2) : "",
        apiRequestBody: apiRequestBody || "",
        audience,
        isInternalAuthRoute,
        isRealtimeApi,
        streamUrl,
        sampleresponse: sampleresponse || undefined,
        isTested: Boolean(sampleresponse),
        isAnalyzed: false,
      });
    }
  }

  traverseItems(collection.item || []);

  if (apis.length === 0) {
    warnings.push("No API requests found inside the Postman Collection items.");
  }

  return {
    success: true,
    apis,
    collectionName,
    description,
    globalAuthType: globalAuth.apiAuthType,
    globalAuthHeader: globalAuth.apiAuthHeader,
    globalCredentials: globalAuth.apiCredentials,
    warnings,
  };
}
