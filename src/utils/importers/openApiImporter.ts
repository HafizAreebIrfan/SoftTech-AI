import YAML from "yaml";
import { ApiConnection } from "../../interfaces/auth/signup.interface";
import { WidgetAudience } from "../../domain/entities/GenericWidget";
import { schemaToMock } from "./schemaToMock";

export interface ExtendedApiConnection extends ApiConnection {
  isInternalAuthRoute?: boolean;
}

export interface ParsedOpenApiResult {
  success: boolean;
  apis: ExtendedApiConnection[];
  title?: string;
  description?: string;
  version?: string;
  baseUrl?: string;
  globalAuthType?: string;
  globalAuthHeader?: string;
  globalCredentials?: string;
  globalOAuthDetails?: {
    authorizationUrl?: string;
    tokenUrl?: string;
    clientId?: string;
  };
  warnings: string[];
  error?: string;
}

/**
 * Checks if a route path is an internal auth / identity / session endpoint.
 */
export function isInternalAuthPath(path: string): boolean {
  const p = (path || "").toLowerCase();
  return (
    p.includes("/auth/login") ||
    p.includes("/auth/register") ||
    p.includes("/auth/signin") ||
    p.includes("/auth/signup") ||
    p.includes("/auth/mfa") ||
    p.includes("/auth/2fa") ||
    p.includes("/auth/refresh") ||
    p.includes("/auth/logout") ||
    p.includes("/auth/forgot-password") ||
    p.includes("/auth/reset-password") ||
    p.includes("/auth/verify-email") ||
    p.includes("/auth/resend-verification") ||
    p.includes("/auth/challenge")
  );
}

/**
 * Resolves local JSON schema references ($ref) in the document.
 */
function resolveRef(ref: string, rootDoc: any): any {
  if (!ref || typeof ref !== "string" || !ref.startsWith("#/")) return null;
  const parts = ref.replace(/^#\//, "").split("/");
  let current = rootDoc;
  for (const part of parts) {
    if (current && typeof current === "object" && part in current) {
      current = current[part];
    } else {
      return null;
    }
  }
  return current;
}

/**
 * Recursively dereferences an object against the root OpenAPI document.
 */
function dereferenceSchema(schema: any, rootDoc: any, visited = new Set<string>()): any {
  if (!schema || typeof schema !== "object") return schema;

  if (schema.$ref && typeof schema.$ref === "string") {
    if (visited.has(schema.$ref)) {
      return { type: "object", description: "Circular reference" };
    }
    visited.add(schema.$ref);
    const resolved = resolveRef(schema.$ref, rootDoc);
    if (resolved) {
      return dereferenceSchema(resolved, rootDoc, new Set(visited));
    }
    return schema;
  }

  if (Array.isArray(schema)) {
    return schema.map((item) => dereferenceSchema(item, rootDoc, visited));
  }

  const result: Record<string, any> = {};
  for (const key of Object.keys(schema)) {
    result[key] = dereferenceSchema(schema[key], rootDoc, visited);
  }
  return result;
}

/**
 * Parses an OpenAPI 3.0 / 3.1 or Swagger 2.0 document into a list of SoftTech ApiConnection objects.
 */
export function parseOpenApiDocument(
  rawInput: string | object,
  defaultAudience: WidgetAudience = "customer"
): ParsedOpenApiResult {
  const warnings: string[] = [];
  let doc: any = null;

  try {
    if (typeof rawInput === "string") {
      const trimmed = rawInput.trim();
      if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
        doc = JSON.parse(trimmed);
      } else {
        doc = YAML.parse(trimmed);
      }
    } else {
      doc = rawInput;
    }
  } catch (err: any) {
    return {
      success: false,
      apis: [],
      warnings: [],
      error: `Failed to parse document: ${err.message || "Invalid JSON/YAML syntax"}`,
    };
  }

  if (!doc || typeof doc !== "object") {
    return {
      success: false,
      apis: [],
      warnings: [],
      error: "Provided document is empty or not a valid OpenAPI / Swagger object.",
    };
  }

  const isOpenApi3 = Boolean(doc.openapi && String(doc.openapi).startsWith("3"));
  const isSwagger2 = Boolean(doc.swagger && String(doc.swagger).startsWith("2"));

  if (!isOpenApi3 && !isSwagger2 && !doc.paths) {
    return {
      success: false,
      apis: [],
      warnings: [],
      error: "Unrecognized API specification. Document must contain 'openapi', 'swagger', or 'paths'.",
    };
  }

  const title = doc.info?.title || "Imported API Collection";
  const description = doc.info?.description || "";
  const version = doc.info?.version || "1.0.0";

  // 1. Determine Base URL
  let baseUrl = "";
  if (isOpenApi3 && Array.isArray(doc.servers) && doc.servers.length > 0) {
    let serverUrl = doc.servers[0].url || "";
    if (doc.servers[0].variables) {
      for (const [vName, vObj] of Object.entries<any>(doc.servers[0].variables)) {
        const defaultVal = vObj?.default || "";
        serverUrl = serverUrl.replace(new RegExp(`\\{${vName}\\}`, "g"), defaultVal);
      }
    }
    baseUrl = serverUrl;
  } else if (isSwagger2) {
    const scheme = (doc.schemes && doc.schemes[0]) || "https";
    const host = doc.host || "";
    const basePath = doc.basePath || "";
    if (host) {
      baseUrl = `${scheme}://${host}${basePath}`;
    } else if (basePath) {
      baseUrl = basePath;
    }
  }

  if (baseUrl.endsWith("/")) {
    baseUrl = baseUrl.slice(0, -1);
  }

  // 2. Extract Security Schemes
  const securitySchemes: Record<string, any> = {};
  if (isOpenApi3 && doc.components?.securitySchemes) {
    Object.assign(securitySchemes, doc.components.securitySchemes);
  } else if (isSwagger2 && doc.securityDefinitions) {
    Object.assign(securitySchemes, doc.securityDefinitions);
  }

  const globalSecurity = Array.isArray(doc.security) ? doc.security : [];

  let globalAuthType = "No Auth";
  let globalAuthHeader = "";
  let globalOAuthDetails: { authorizationUrl?: string; tokenUrl?: string; clientId?: string } | undefined = undefined;

  // Extract global default auth from first security scheme if available
  for (const [sKey, scheme] of Object.entries<any>(securitySchemes)) {
    const schemeType = (scheme.type || "").toLowerCase();
    if (schemeType === "http" && scheme.scheme?.toLowerCase() === "bearer") {
      globalAuthType = "Bearer Token";
      globalAuthHeader = "Authorization";
      break;
    } else if (schemeType === "apikey") {
      globalAuthType = "API Key";
      globalAuthHeader = scheme.name || "X-API-KEY";
      break;
    } else if (schemeType === "oauth2") {
      globalAuthType = "OAuth 2.0";
      const flow = scheme.flows?.authorizationCode || scheme.flows?.implicit || scheme.flows?.clientCredentials || scheme.flows?.password;
      globalOAuthDetails = {
        authorizationUrl: flow?.authorizationUrl || scheme.authorizationUrl || "",
        tokenUrl: flow?.tokenUrl || scheme.tokenUrl || "",
      };
      break;
    }
  }

  const apis: ExtendedApiConnection[] = [];
  const paths = doc.paths || {};
  const httpMethods = ["get", "post", "put", "patch", "delete"] as const;

  for (const [pathKey, pathItem] of Object.entries<any>(paths)) {
    if (!pathItem || typeof pathItem !== "object") continue;

    const pathLevelParams = Array.isArray(pathItem.parameters) ? pathItem.parameters : [];

    for (const method of httpMethods) {
      const operation = pathItem[method];
      if (!operation || typeof operation !== "object") continue;

      const upperMethod = method.toUpperCase() as "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

      const rawParams = [
        ...pathLevelParams,
        ...(Array.isArray(operation.parameters) ? operation.parameters : []),
      ];

      const parameters = rawParams.map((p) => dereferenceSchema(p, doc));

      const apiName =
        operation.summary ||
        operation.operationId ||
        operation.description ||
        `${upperMethod} ${pathKey}`;

      const formattedPath = pathKey.startsWith("/") ? pathKey : `/${pathKey}`;
      const fullEndpoint = baseUrl ? `${baseUrl}${formattedPath}` : formattedPath;

      // Determine Audience
      let audience: WidgetAudience = defaultAudience;
      const lowerTags = Array.isArray(operation.tags)
        ? operation.tags.map((t: string) => String(t).toLowerCase()).join(" ")
        : "";
      const lowerPath = pathKey.toLowerCase();
      if (
        lowerTags.includes("admin") ||
        lowerTags.includes("backoffice") ||
        lowerPath.includes("/admin") ||
        lowerPath.includes("/manage")
      ) {
        audience = "admin";
      }

      // Check if internal identity/auth route
      const isInternalAuthRoute = isInternalAuthPath(pathKey);

      // Query Parameters
      const queryParamsList = parameters.filter((p) => p && p.in === "query");
      let apiQueryParams = "";
      if (queryParamsList.length > 0) {
        const rows = queryParamsList.map((p) => {
          let defaultVal = "";
          if (p.schema) {
            defaultVal = p.schema.default !== undefined ? String(p.schema.default) : (p.schema.example !== undefined ? String(p.schema.example) : "");
          } else if (p.default !== undefined) {
            defaultVal = String(p.default);
          }
          return {
            key: p.name || "",
            value: defaultVal,
            isDynamic: true,
          };
        });
        apiQueryParams = JSON.stringify(rows, null, 2);
      }

      // Headers
      const headerParamsList = parameters.filter((p) => p && p.in === "header");
      let apiHeaders = "";
      if (headerParamsList.length > 0) {
        const rows = headerParamsList.map((p) => {
          let defaultVal = "";
          if (p.schema) {
            defaultVal = p.schema.default !== undefined ? String(p.schema.default) : (p.schema.example !== undefined ? String(p.schema.example) : "");
          }
          return {
            key: p.name || "",
            value: defaultVal,
            isDynamic: false,
          };
        });
        apiHeaders = JSON.stringify(rows, null, 2);
      }

      // Request Body
      let apiRequestBody = "";
      if (isOpenApi3 && operation.requestBody) {
        const reqBody = dereferenceSchema(operation.requestBody, doc);
        const jsonContent = reqBody?.content?.["application/json"] || reqBody?.content?.["*/*"];
        if (jsonContent?.schema) {
          const mockBody = schemaToMock(jsonContent.schema);
          apiRequestBody = JSON.stringify(mockBody, null, 2);
        } else if (jsonContent?.example) {
          apiRequestBody = JSON.stringify(jsonContent.example, null, 2);
        }
      } else if (isSwagger2) {
        const bodyParam = parameters.find((p) => p && p.in === "body");
        if (bodyParam?.schema) {
          const mockBody = schemaToMock(bodyParam.schema);
          apiRequestBody = JSON.stringify(mockBody, null, 2);
        }
      }

      // Sample Response
      let sampleresponse = "";
      if (operation.responses) {
        const successRespKey =
          Object.keys(operation.responses).find((k) => k.startsWith("2") || k === "default") ||
          "200";
        const rawResp = operation.responses[successRespKey];
        if (rawResp) {
          const resp = dereferenceSchema(rawResp, doc);
          if (isOpenApi3 && resp.content?.["application/json"]) {
            const jsonResp = resp.content["application/json"];
            if (jsonResp.example !== undefined) {
              sampleresponse = JSON.stringify(jsonResp.example, null, 2);
            } else if (jsonResp.examples && Object.keys(jsonResp.examples).length > 0) {
              const firstExKey = Object.keys(jsonResp.examples)[0];
              const exVal = jsonResp.examples[firstExKey]?.value ?? jsonResp.examples[firstExKey];
              sampleresponse = JSON.stringify(exVal, null, 2);
            } else if (jsonResp.schema) {
              const mock = schemaToMock(jsonResp.schema);
              sampleresponse = JSON.stringify(mock, null, 2);
            }
          } else if (isSwagger2 && resp.schema) {
            const mock = schemaToMock(resp.schema);
            sampleresponse = JSON.stringify(mock, null, 2);
          } else if (resp.examples?.["application/json"]) {
            sampleresponse = JSON.stringify(resp.examples["application/json"], null, 2);
          }
        }
      }

      // Auth Scheme
      let apiAuthType = globalAuthType;
      let apiAuthHeader = globalAuthHeader;
      let isUserOAuth = globalAuthType === "OAuth 2.0";
      let oauthAuthorizationUrl = globalOAuthDetails?.authorizationUrl || "";
      let oauthTokenUrl = globalOAuthDetails?.tokenUrl || "";

      const opSecurity = Array.isArray(operation.security)
        ? operation.security
        : globalSecurity;

      if (opSecurity.length > 0) {
        const firstSecObj = opSecurity[0];
        const secSchemeKey = Object.keys(firstSecObj)[0];
        if (secSchemeKey && securitySchemes[secSchemeKey]) {
          const scheme = securitySchemes[secSchemeKey];
          const schemeType = (scheme.type || "").toLowerCase();

          if (schemeType === "http" && scheme.scheme?.toLowerCase() === "bearer") {
            apiAuthType = "Bearer Token";
            apiAuthHeader = "Authorization";
          } else if (schemeType === "apikey") {
            apiAuthType = "API Key";
            apiAuthHeader = scheme.name || "X-API-KEY";
          } else if (schemeType === "oauth2") {
            apiAuthType = "OAuth 2.0";
            isUserOAuth = true;
            if (isOpenApi3 && scheme.flows) {
              const flow =
                scheme.flows.authorizationCode ||
                scheme.flows.implicit ||
                scheme.flows.clientCredentials ||
                scheme.flows.password;
              if (flow) {
                oauthAuthorizationUrl = flow.authorizationUrl || "";
                oauthTokenUrl = flow.tokenUrl || "";
              }
            } else if (isSwagger2) {
              oauthAuthorizationUrl = scheme.authorizationUrl || "";
              oauthTokenUrl = scheme.tokenUrl || "";
            }
          } else if (schemeType === "basic" || (schemeType === "http" && scheme.scheme?.toLowerCase() === "basic")) {
            apiAuthType = "Basic Auth";
            apiAuthHeader = "Authorization";
          }
        }
      }

      // Realtime Live Stream Check
      let isRealtimeApi = false;
      let streamUrl = "";
      const lowerOpText = `${pathKey} ${operation.summary || ""} ${operation.description || ""}`.toLowerCase();
      if (
        lowerOpText.includes("websocket") ||
        lowerOpText.includes("ws://") ||
        lowerOpText.includes("wss://") ||
        lowerOpText.includes("realtime") ||
        lowerOpText.includes("socket.io") ||
        lowerOpText.includes("sse")
      ) {
        isRealtimeApi = true;
        streamUrl = fullEndpoint.replace(/^http/, "ws");
      }

      apis.push({
        id: `api-import-${Date.now()}-${apis.length + 1}`,
        apiName: apiName.slice(0, 80),
        apiMethod: upperMethod,
        apiEndpoint: fullEndpoint,
        apiAuthType,
        apiAuthHeader,
        isUserOAuth,
        oauthAuthorizationUrl,
        oauthTokenUrl,
        apiQueryParams,
        apiHeaders,
        apiRequestBody,
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

  if (apis.length === 0) {
    warnings.push("Document was parsed successfully but no HTTP operations were discovered under 'paths'.");
  }

  return {
    success: true,
    apis,
    title,
    description,
    version,
    baseUrl,
    globalAuthType,
    globalAuthHeader,
    globalOAuthDetails,
    warnings,
  };
}
