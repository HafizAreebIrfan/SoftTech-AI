import { ICompanyRepository } from "../../../ports/companies/register/companyregisterrepository";
import { ICompany } from "../../../../domain/types/company.types";

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

const transformApiEntry = (api: any, index: number): any => {
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
    mcpToolName:
      api.mcpToolName || toToolName(api.name || api.apiName || "", index),
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
  payload: any,
): Promise<ICompany | null> {
  if (!companyId) throw new Error("companyId is required");
  if (
    !payload.apis ||
    !Array.isArray(payload.apis) ||
    payload.apis.length === 0
  ) {
    throw new Error("apis must be a non-empty array");
  }

  const apis = payload.apis.map((api: any, index: number) =>
    transformApiEntry(api, index),
  );

  return await companyRepository.update(companyId, {
    apis,
    onboardingStep: 2,
    updatedAt: new Date(),
  });
}
