import { ICompanyRepository } from "../../../ports/companies/register/companyregisterrepository";
import { analyzeApiResponse } from "../../../../infrastructure/mcp/schema_analyzer/analyzer";
import { isStaleOrInvalidDescription } from "../../../../infrastructure/mcp/tools/RegisterCompanyTools/mcpDescriptionGenerator";
import { buildInputFieldMap, buildOutputFieldMap } from "./companyapidetails";

export async function analyzeSingleApi(
  companyRepository: ICompanyRepository,
  companyId: string,
  apiIndex: number,
  sampleResponse?: any
): Promise<any> {
  const company = await companyRepository.findById(companyId);
  if (!company || !company.apis || !company.apis[apiIndex]) {
    throw new Error(`API at index ${apiIndex} not found for company ${companyId}`);
  }

  const targetApi = company.apis[apiIndex];
  let sample = sampleResponse || (targetApi as any).sampleResponse || (targetApi as any).sampleresponse;

  if (!sample && (targetApi.method || "GET").toUpperCase() === "GET" && targetApi.baseUrl && targetApi.endpoint) {
    try {
      const fullUrl = targetApi.baseUrl.replace(/\/+$/, "") + "/" + targetApi.endpoint.replace(/^\/+/, "").replace(/\{[^}]+\}/g, "1");
      const resp = await fetch(fullUrl, {
        headers: {
          ...(targetApi.authHeader ? { Authorization: targetApi.authHeader } : {}),
          ...(targetApi.bearerToken ? { Authorization: `Bearer ${targetApi.bearerToken}` } : {}),
          ...(targetApi.apiKey ? { "x-api-key": targetApi.apiKey } : {}),
        },
      });
      if (resp.ok) {
        sample = await resp.json();
      }
    } catch (fetchErr) {
      console.warn("Live fetch for sample response failed:", fetchErr);
    }
  }

  if (!sample) {
    throw new Error("No sample response provided or stored to analyze.");
  }

  const parsedSample = typeof sample === "string" ? JSON.parse(sample) : sample;
  (company.apis[apiIndex] as any).sampleresponse = parsedSample;
  (company.apis[apiIndex] as any).sampleResponse = parsedSample;

  const generatedSchema = await analyzeApiResponse(parsedSample, {
    apiName: targetApi.name,
    endpoint: targetApi.endpoint,
    industry: (company as any).industry,
  });

  company.apis[apiIndex].apiSchema = generatedSchema as any;
  company.apis[apiIndex].inputFieldMap = buildInputFieldMap(company.apis[apiIndex]);
  company.apis[apiIndex].outputFieldMap = buildOutputFieldMap({
    ...company.apis[apiIndex],
    apiSchema: generatedSchema,
  });

  if (
    (generatedSchema as any)?.toolDescription &&
    !isStaleOrInvalidDescription((generatedSchema as any).toolDescription)
  ) {
    company.apis[apiIndex].mcpDescription = (generatedSchema as any).toolDescription;
  }
  (company.apis[apiIndex] as any).isAnalyzed = true;
  (company.apis[apiIndex] as any).isTested = true;

  await companyRepository.update(companyId, {
    apis: company.apis,
    updatedAt: new Date(),
  });

  return {
    apiIndex,
    apiSchema: generatedSchema,
    api: company.apis[apiIndex],
  };
}
