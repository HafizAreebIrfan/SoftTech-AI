import { ICompanyRepository } from "../../../ports/companies/register/companyregisterrepository";
import { ICompany } from "../../../../domain/types/company.types";

export async function saveCompanyUiSelection(
  companyRepository: ICompanyRepository,
  companyId: string,
  payload: any
): Promise<ICompany | null> {
  if (!companyId) {
    throw new Error("companyId is required");
  }

  if (!payload.uiPreference) {
    throw new Error("uiPreference is required");
  }

  return await companyRepository.update(companyId, {
    uiPreference: payload.uiPreference,
    onboardingStep: 3,
    status: "ready-for-testing",
    updatedAt: new Date(),
  });
}
