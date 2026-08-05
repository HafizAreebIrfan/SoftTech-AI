import { ICompanyRepository } from "../../../ports/companies/register/companyregisterrepository";
import { ICompany } from "../../../../domain/types/company.types";
import { analyzeApiResponse } from "../../../../infrastructure/mcp/schema_analyzer/analyzer";

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
        return Object.entries(parsed).map(([key, value]) => ({ key, value, isDynamic: true }));
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

const resolveApiSchema = async (api: any): Promise<any> => {
  const existingSchema = api.apiSchema || api.schema;
  if (existingSchema) return existingSchema;

  const rawSample = api.sampleResponse || api.sampleresponse;
  if (!rawSample) return null;

  try {
    const parsedSample = typeof rawSample === "string" ? JSON.parse(rawSample) : rawSample;
    return await analyzeApiResponse(parsedSample, {
      apiName: api.name || api.apiName,
      endpoint: api.endpoint || api.apiEndpoint,
      industry: api.industry,
    });
  } catch (err) {
    console.error("[saveCompanyApiDetails] Gemini Schema Analysis Error:", err);
    return null;
  }
};

const transformApiEntry = async (api: any, index: number): Promise<any> => {
  const params = parseParams(api);
  const headers = parseHeaders(api);
  const body = Array.isArray(api.body) ? api.body : [];
  const apiSchema = await resolveApiSchema(api);

  const oauth =
    api.oauth || (api.oauthTokenUrl || api.oauthClientId
      ? {
          tokenUrl: api.oauthTokenUrl || "",
          clientId: api.oauthClientId || "",
          clientSecret: api.oauthClientSecret || api.apiKey || "",
        }
      : undefined);

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
    webCheckoutUrl: api.webCheckoutUrl || api.checkoutTemplate || undefined,
    mobileDeepLink: api.mobileDeepLink || undefined,
    apiSchema: apiSchema || null,
    mcpToolName: api.mcpToolName || toToolName(api.name || api.apiName || "", index),
    mcpDescription:
      api.mcpDescription ||
      `Calls ${api.name || api.apiName || "a registered company API"} and returns a generic widget response.`,
    mcpResourceUri: api.mcpResourceUri || "ui://generic/widgets.html",
    inputFieldMap: Array.isArray(api.inputFieldMap) ? api.inputFieldMap : [],
    outputFieldMap: Array.isArray(api.outputFieldMap) ? api.outputFieldMap : [],
    fallbackWidget: api.fallbackWidget || "",
    testedonregister: Boolean(api.testedonregister),
  };
};

export async function saveCompanyApiDetails(
  companyRepository: ICompanyRepository,
  companyId: string,
  payload: any
): Promise<ICompany | null> {
  if (!companyId) throw new Error("companyId is required");
  if (!payload.apis || !Array.isArray(payload.apis) || payload.apis.length === 0) {
    throw new Error("apis must be a non-empty array");
  }

  const apis: any[] = [];
  for (let i = 0; i < payload.apis.length; i++) {
    const transformed = await transformApiEntry(payload.apis[i], i);
    apis.push(transformed);
  }

  return await companyRepository.update(companyId, {
    apis,
    onboardingStep: 2,
    updatedAt: new Date(),
  });
}
