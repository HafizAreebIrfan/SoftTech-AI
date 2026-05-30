import { ICompanyRepository } from "../../../ports/companies/register/companyregisterrepository";
import { ICompany } from "../../../../domain/types/company.types";

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

  return await companyRepository.update(companyId, {
    apis: payload.apis,
    onboardingStep: 2,
    updatedAt: new Date(),
  });
}
