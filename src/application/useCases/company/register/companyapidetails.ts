import { ICompanyRepository } from "../../../ports/companies/register/companyregisterrepository";
import { ICompany } from "../../../../domain/types/company.types";
import { analyzeApiResponse } from "../../../../infrastructure/mcp/schema_analyzer/analyzer";

const toToolName = (name: string, index: number) => {
  const normalized = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return normalized ? `call_${normalized}` : `call_api_${index + 1}`;
};

export async function saveCompanyApiDetails(
  companyRepository: ICompanyRepository,
  companyId: string,
  payload: any
): Promise<ICompany | null> {
  if (!companyId) {
    throw new Error("companyId is required");
  }

  if (
    !payload.apis ||
    !Array.isArray(payload.apis) ||
    payload.apis.length === 0
  ) {
    throw new Error("apis must be a non-empty array");
  }

  const apis = await Promise.all(
    payload.apis.map(async (api: any, index: number) => {
      let keys: string[] = [];
      if (Array.isArray(api.params) && api.params.length > 0) {
        keys = api.params;
      } else if (typeof api.apiQueryParams === "string" && api.apiQueryParams.trim()) {
        const raw = api.apiQueryParams.trim();
        if (raw.startsWith("{") || raw.startsWith("[")) {
          try {
            const parsed = JSON.parse(raw);
            if (typeof parsed === "object" && parsed !== null) {
              keys = Object.keys(parsed);
            }
          } catch {
            keys = ["q"];
          }
        } else if (raw.includes("=")) {
          const paramsObj = new URLSearchParams(raw);
          keys = Array.from(paramsObj.keys());
        } else {
          keys = raw.split(/[,;\s]+/).map((s: string) => s.replace(/[^a-zA-Z0-9_-]/g, '')).filter(Boolean);
        }
      }

      let headersList: string[] = [];
      if (api.apiHeaders) {
        try {
          const parsed = JSON.parse(api.apiHeaders);
          if (typeof parsed === "object" && parsed !== null) {
            headersList = Object.entries(parsed).map(([k, v]) => `${k}: ${v}`);
          }
        } catch {
          headersList = [api.apiHeaders];
        }
      }

      let apiSchema = api.apiSchema || api.schema;
      const rawSample = api.sampleResponse || api.sampleresponse;

      if (!apiSchema && rawSample) {
        try {
          const parsedSample = typeof rawSample === "string" ? JSON.parse(rawSample) : rawSample;
          apiSchema = await analyzeApiResponse(parsedSample, {
            apiName: api.name,
            endpoint: api.endpoint,
            industry: api.industry,
          });
        } catch (err) {
          console.error("[saveCompanyApiDetails] Gemini Schema Analysis Error:", err);
        }
      }

      return {
        ...api,
        apiSchema: apiSchema || null,
        schema: apiSchema || null,
        mcpToolName: api.mcpToolName || toToolName(api.name || "", index),
        mcpDescription:
          api.mcpDescription ||
          `Calls ${api.name || "a registered company API"} and returns a generic widget response.`,
        mcpResourceUri: api.mcpResourceUri || "ui://generic/widgets.html",
        inputFieldMap: api.inputFieldMap || {},
        outputFieldMap: api.outputFieldMap || {},
        params: Array.isArray(api.params) && api.params.length > 0 ? api.params : keys,
        headers: Array.isArray(api.headers) && api.headers.length > 0 ? api.headers : headersList,
        sampleResponse: undefined,
        sampleresponse: undefined,
      };
    })
  );

  return await companyRepository.update(companyId, {
    apis,
    onboardingStep: 2,
    updatedAt: new Date(),
  });
}
