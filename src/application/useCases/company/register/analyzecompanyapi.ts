import { ICompanyRepository } from "../../../ports/companies/register/companyregisterrepository";
import { analyzeApiResponse } from "../../../../infrastructure/mcp/schema_analyzer/analyzer";

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
  const sample = sampleResponse || (targetApi as any).sampleresponse || (targetApi as any).sampleResponse;

  if (!sample) {
    throw new Error("No sample response provided or stored to analyze.");
  }

  const parsedSample = typeof sample === "string" ? JSON.parse(sample) : sample;
  const generatedSchema = await analyzeApiResponse(parsedSample, {
    apiName: targetApi.name,
    endpoint: targetApi.endpoint,
    industry: (company as any).industry,
  });

  company.apis[apiIndex].apiSchema = generatedSchema as any;
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
