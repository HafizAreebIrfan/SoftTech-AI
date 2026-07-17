import { ICompanyRepository } from "../../../ports/companies/register/companyregisterrepository";
import { ICompany } from "../../../../domain/types/company.types";

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

  const apis = payload.apis.map((api: any, index: number) => ({
    ...api,
    mcpToolName: api.mcpToolName || toToolName(api.name || "", index),
    mcpDescription:
      api.mcpDescription ||
      `Calls ${api.name || "a registered company API"} and returns a generic widget response.`,
    mcpResourceUri: api.mcpResourceUri || "ui://generic/widgets.html",
    inputFieldMap: api.inputFieldMap || {},
    outputFieldMap: api.outputFieldMap || {},
  }));

  return await companyRepository.update(companyId, {
    apis,
    onboardingStep: 2,
    updatedAt: new Date(),
  });
}
