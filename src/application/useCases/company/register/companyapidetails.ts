import { ICompanyRepository } from "../../../ports/companies/register/companyregisterrepository";
import { ICompany } from "../../../../domain/types/company.types";
import {
  generateMcpDescription,
  isStaleOrInvalidDescription,
} from "../../../../infrastructure/mcp/tools/RegisterCompanyTools/mcpDescriptionGenerator";

const toToolName = (name: string, index: number): string => {
  const normalized = (name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return normalized ? `call_${normalized}` : `call_api_${index + 1}`;
};

const parseParams = (api: any): any[] => {
  if (Array.isArray(api.params) && api.params.length > 0) {
    return api.params;
  }
  if (typeof api.apiQueryParams === "string" && api.apiQueryParams.trim()) {
    try {
      const parsed = JSON.parse(api.apiQueryParams.trim());
      if (Array.isArray(parsed)) return parsed;
      if (typeof parsed === "object" && parsed !== null) {
        return Object.entries(parsed).map(([key, value]) => ({
          key,
          value,
          isDynamic: true,
        }));
      }
    } catch {
      // Fallback text parsing if not raw JSON
    }
  }
  return [];
};

const parseHeaders = (api: any): any[] => {
  if (Array.isArray(api.headers) && api.headers.length > 0) {
    return api.headers;
  }
  if (typeof api.apiHeaders === "string" && api.apiHeaders.trim()) {
    try {
      const parsed = JSON.parse(api.apiHeaders.trim());
      if (Array.isArray(parsed)) return parsed;
      if (typeof parsed === "object" && parsed !== null) {
        return Object.entries(parsed).map(([key, value]) => ({ key, value }));
      }
    } catch {
      // Fallback text parsing
    }
  }
  return [];
};

export const buildInputFieldMap = (api: any): any[] => {
  const map: any[] = [];
  const seenKeys = new Set<string>();

  // 1. Path parameters from endpoint (e.g. /cars/{id}, /users/:userId)
  const endpoint = String(api.endpoint || api.apiEndpoint || "");
  const pathParamMatches =
    endpoint.match(/\{([^}]+)\}|:([a-zA-Z0-9_-]+)|%7B([^%]+)%7D/gi) || [];
  for (const match of pathParamMatches) {
    const rawKey = match.replace(/[{}:]|%7B|%7D/gi, "").trim();
    if (rawKey && !seenKeys.has(rawKey.toLowerCase())) {
      seenKeys.add(rawKey.toLowerCase());
      map.push({
        key: rawKey,
        label:
          rawKey.charAt(0).toUpperCase() +
          rawKey.slice(1).replace(/([A-Z])/g, " $1").trim(),
        location: "path",
        type: "string",
        required: true,
      });
    }
  }

  // 2. Query / Configured parameters
  const params = Array.isArray(api.params) ? api.params : parseParams(api);
  for (const p of params) {
    if (!p) continue;
    const key = String(p.key || p.name || "").replace(/[{}]/g, "").trim();
    if (key && !seenKeys.has(key.toLowerCase())) {
      seenKeys.add(key.toLowerCase());
      map.push({
        key,
        label:
          p.label ||
          key.charAt(0).toUpperCase() +
            key.slice(1).replace(/([A-Z])/g, " $1").trim(),
        location: p.location || "query",
        type: p.type || "string",
        required: Boolean(p.required),
        description: p.description || "",
      });
    }
  }

  // 3. Body fields
  const body = Array.isArray(api.body) ? api.body : [];
  for (const b of body) {
    if (!b) continue;
    const key = String(b.key || b.name || "").replace(/[{}]/g, "").trim();
    if (key && !seenKeys.has(key.toLowerCase())) {
      seenKeys.add(key.toLowerCase());
      map.push({
        key,
        label:
          b.label ||
          key.charAt(0).toUpperCase() +
            key.slice(1).replace(/([A-Z])/g, " $1").trim(),
        location: "body",
        type: b.type || "string",
        required: Boolean(b.required),
        description: b.description || "",
      });
    }
  }

  // 4. Headers
  const headers = Array.isArray(api.headers) ? api.headers : parseHeaders(api);
  for (const h of headers) {
    if (!h) continue;
    const key = String(h.key || h.name || "").trim();
    if (
      key &&
      !seenKeys.has(key.toLowerCase()) &&
      !/^(authorization|content-type|accept)$/i.test(key)
    ) {
      seenKeys.add(key.toLowerCase());
      map.push({
        key,
        label: h.label || key,
        location: "header",
        type: "string",
        required: Boolean(h.required),
      });
    }
  }

  return map;
};

export const buildOutputFieldMap = (api: any): any[] => {
  const schema = api.apiSchema || api.schema;
  const fields = Array.isArray(schema?.fields) ? schema.fields : [];
  if (fields.length > 0) {
    return fields.map((f: any) => ({
      key: f.key,
      label: f.label || f.key,
      type: f.type || "text",
      path: f.path || f.key,
      uiRole: f.uiRole || null,
      primary: Boolean(f.primary),
      hidden: Boolean(f.hidden),
    }));
  }
  return [];
};

const transformApiEntry = (api: any, index: number, companyName?: string): any => {
  const params = parseParams(api);
  const headers = parseHeaders(api);
  const body = Array.isArray(api.body) ? api.body : [];
  const existingSchema = api.apiSchema || api.schema || null;

  const oauth =
    api.oauth ||
    (api.oauthTokenUrl || api.oauthClientId
      ? {
          tokenUrl: api.oauthTokenUrl || "",
          clientId: api.oauthClientId || "",
          clientSecret: api.oauthClientSecret || api.apiKey || "",
        }
      : undefined);

  const inputFieldMap =
    Array.isArray(api.inputFieldMap) && api.inputFieldMap.length > 0
      ? api.inputFieldMap
      : buildInputFieldMap({ ...api, params, headers, body });

  const outputFieldMap =
    Array.isArray(api.outputFieldMap) && api.outputFieldMap.length > 0
      ? api.outputFieldMap
      : buildOutputFieldMap({ ...api, apiSchema: existingSchema });

  return {
    name: api.name || api.apiName || "",
    method: api.method || api.apiMethod || "GET",
    baseUrl: api.baseUrl || "",
    endpoint: api.endpoint || api.apiEndpoint || "",
    authType: api.authType || api.authtype || api.apiAuthType || "NONE",
    params,
    headers,
    body,
    apiKey: api.apiKey || api.apiKeyVal || undefined,
    bearerToken: api.bearerToken || undefined,
    oauth,
    platformType: api.platformType || "web",
    audience: api.audience || "",
    isCheckout: Boolean(api.isCheckout),
    webCheckoutUrl: api.webCheckoutUrl || api.checkoutTemplate || undefined,
    mobileDeepLinkUrl:
      api.mobileDeepLinkUrl || api.mobileDeepLink || undefined,
    isRealtimeApi: Boolean(api.isRealtimeApi),
    streamUrl: api.streamUrl || undefined,
    apiSchema: existingSchema,
    sampleResponse: api.sampleResponse || (api as any).sampleresponse || undefined,
    mcpToolName:
      api.mcpToolName || toToolName(api.name || api.apiName || "", index),
    mcpDescription:
      api.mcpDescription && !isStaleOrInvalidDescription(api.mcpDescription)
        ? api.mcpDescription
        : (api.apiSchema?.toolDescription && !isStaleOrInvalidDescription(api.apiSchema.toolDescription))
          ? api.apiSchema.toolDescription
          : generateMcpDescription(api, { companyName: companyName || api.companyName }),
    mcpResourceUri: api.mcpResourceUri || "ui://generic/widgets.html",
    requiresAuth: Boolean(api.requiresAuth),
    inputFieldMap,
    outputFieldMap,
    fallbackWidget: api.fallbackWidget || "",
    isWidgetEnabled:
      api.isWidgetEnabled !== undefined
        ? Boolean(api.isWidgetEnabled)
        : api.uiConfig?.uiEnabled !== undefined
          ? Boolean(api.uiConfig.uiEnabled)
          : true,
    isMapViewEnabled:
      api.isMapViewEnabled !== undefined
        ? Boolean(api.isMapViewEnabled)
        : api.uiConfig?.mapEnabled !== undefined
          ? Boolean(api.uiConfig.mapEnabled)
          : false,
    uiConfig: api.uiConfig || {
      uiEnabled:
        api.isWidgetEnabled !== undefined ? Boolean(api.isWidgetEnabled) : true,
      uiType: api.uiType || "auto",
      mapEnabled:
        api.isMapViewEnabled !== undefined
          ? Boolean(api.isMapViewEnabled)
          : false,
    },
    testedonregister: Boolean(api.testedonregister),
  };
};

const isInternalAuthRoute = (endpoint: string, name: string): boolean => {
  const lowerEndpoint = String(endpoint || "").toLowerCase();
  const lowerName = String(name || "").toLowerCase();

  return (
    /\/api\/auth\/(login|signin|register|signup|verify-mfa|verify_mfa|oauth|google|github|forgot-password|reset-password)/i.test(
      lowerEndpoint,
    ) ||
    /^(login|sign in|register|sign up|google oauth|github oauth|verify mfa)$/i.test(
      lowerName,
    )
  );
};

export async function saveCompanyApiDetails(
  companyRepository: ICompanyRepository,
  companyId: string,
  payload: any,
): Promise<ICompany | null> {
  if (!companyId) throw new Error("companyId is required");
  if (
    !payload.apis ||
    !Array.isArray(payload.apis)
  ) {
    throw new Error("apis must be an array");
  }

  // Filter out internal website authentication endpoints so only real business tools become MCP tools
  const businessApis = payload.apis.filter(
    (api: any) => !isInternalAuthRoute(api.endpoint || api.apiEndpoint, api.name || api.apiName),
  );

  const apisToProcess = businessApis.length > 0 ? businessApis : payload.apis;

  const company = await companyRepository.findById(companyId);
  const companyName = company?.companyName;
  const existingApis = (company?.apis || []) as any[];

  const usedMcpToolNames = new Set<string>();
  const apis = apisToProcess.map((api: any, index: number) => {
    const existing = existingApis.find(
      (e: any) =>
        (api.id && (String(e._id) === String(api.id) || String(e.id) === String(api.id))) ||
        (api._id && String(e._id) === String(api._id)) ||
        (api.mcpToolName && e.mcpToolName === api.mcpToolName) ||
        (api.endpoint && e.endpoint === (api.endpoint || api.apiEndpoint) && (api.method || "GET") === (e.method || "GET")) ||
        (api.name && e.name === (api.name || api.apiName))
    ) || existingApis[index];

    const merged = {
      ...(existing ? (typeof existing.toObject === "function" ? existing.toObject() : existing) : {}),
      ...api,
      // If incoming payload has no params/schema, retain existing
      apiSchema: api.apiSchema || api.schema || existing?.apiSchema || null,
      params: (Array.isArray(api.params) && api.params.length > 0) ? api.params : (existing?.params || []),
      headers: (Array.isArray(api.headers) && api.headers.length > 0) ? api.headers : (existing?.headers || []),
      body: (Array.isArray(api.body) && api.body.length > 0) ? api.body : (existing?.body || []),
      apiKey: api.apiKey || api.apiKeyVal || existing?.apiKey,
      bearerToken: api.bearerToken || existing?.bearerToken,
      oauth: api.oauth || existing?.oauth,
      inputFieldMap: (api.inputFieldMap && api.inputFieldMap.length > 0) ? api.inputFieldMap : (existing?.inputFieldMap || []),
      outputFieldMap: (api.outputFieldMap && api.outputFieldMap.length > 0) ? api.outputFieldMap : (existing?.outputFieldMap || []),
      fallbackWidget: api.fallbackWidget || existing?.fallbackWidget || "",
      mcpToolName: (() => {
        let base = api.mcpToolName || existing?.mcpToolName || toToolName(api.name || api.apiName || "", index);
        let candidate = base;
        let count = 2;
        if (usedMcpToolNames.has(candidate)) {
          candidate = toToolName(api.name || api.apiName || "", index);
        }
        while (usedMcpToolNames.has(candidate)) {
          candidate = `${base}_${count}`;
          count++;
        }
        usedMcpToolNames.add(candidate);
        return candidate;
      })(),
      mcpDescription:
        api.mcpDescription ||
        existing?.mcpDescription ||
        generateMcpDescription(api, { companyName: companyName || api.companyName }),
    };

    return transformApiEntry(merged, index, companyName);
  });

  const updateData: any = {
    apis,
    onboardingStep: Math.max(company?.onboardingStep || 0, 2),
    updatedAt: new Date(),
  };

  if (payload.authStrategy) {
    updateData.authStrategy = payload.authStrategy;
  }

  if (payload.googleMapsApiKey !== undefined) {
    updateData.googleMapsApiKey = payload.googleMapsApiKey;
  }

  return await companyRepository.update(companyId, updateData);
}

export async function updateSingleApiUiSettings(
  companyRepository: ICompanyRepository,
  companyId: string,
  payload: {
    apiId?: string;
    apiIndex?: number;
    mcpToolName?: string;
    isWidgetEnabled?: boolean;
    isMapViewEnabled?: boolean;
    uiConfig?: any;
    mcpDescription?: string;
  },
): Promise<ICompany | null> {
  if (!companyId) throw new Error("companyId is required");
  const company = await companyRepository.findById(companyId);
  if (!company) throw new Error("Company not found");

  const apis = [...(company.apis || [])] as any[];
  let targetIndex = -1;

  if (payload.apiId) {
    targetIndex = apis.findIndex(
      (a: any) => String(a._id) === String(payload.apiId) || String(a.id) === String(payload.apiId),
    );
  }
  if (targetIndex === -1 && payload.mcpToolName) {
    targetIndex = apis.findIndex((a: any) => a.mcpToolName === payload.mcpToolName);
  }
  if (targetIndex === -1 && typeof payload.apiIndex === "number" && payload.apiIndex >= 0 && payload.apiIndex < apis.length) {
    targetIndex = payload.apiIndex;
  }

  if (targetIndex === -1) {
    throw new Error("Target API not found in company fleet");
  }

  const existing = apis[targetIndex];
  const isWidgetEnabled =
    payload.isWidgetEnabled !== undefined
      ? Boolean(payload.isWidgetEnabled)
      : payload.uiConfig?.uiEnabled !== undefined
        ? Boolean(payload.uiConfig.uiEnabled)
        : existing.isWidgetEnabled ?? true;

  const isMapViewEnabled =
    payload.isMapViewEnabled !== undefined
      ? Boolean(payload.isMapViewEnabled)
      : payload.uiConfig?.mapEnabled !== undefined
        ? Boolean(payload.uiConfig.mapEnabled)
        : existing.isMapViewEnabled ?? false;

  const uiConfig = payload.uiConfig || {
    uiEnabled: isWidgetEnabled,
    uiType: payload.uiConfig?.uiType || existing.uiConfig?.uiType || "auto",
    mapEnabled: isMapViewEnabled,
  };

  apis[targetIndex] = {
    ...existing,
    isWidgetEnabled,
    isMapViewEnabled,
    uiConfig,
    ...(payload.mcpDescription
      ? {
          mcpDescription: payload.mcpDescription,
          apiSchema: existing.apiSchema
            ? { ...existing.apiSchema, toolDescription: payload.mcpDescription }
            : existing.apiSchema,
        }
      : {}),
  };

  return await companyRepository.update(companyId, {
    apis,
    updatedAt: new Date(),
  });
}
