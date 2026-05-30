import { createCompany } from "../../../../domain/entities/company/register/companyregister";
import { ICompany } from "../../../../domain/types/company.types";
import { createCompanyRepositoryPort, ICompanyRepository } from "../../../ports/companies/register/companyregisterrepository";

export async function registerCompanyInfo(companyRepository: ICompanyRepository, payload: any): Promise<ICompany> {
  const { companyName, industry, email, password, phone } = payload;
  const repo = createCompanyRepositoryPort(companyRepository);

  if (!companyName || !industry || !email || !password) {
    throw new Error("companyName, industry, email and password are required");
  }

  const company = createCompany({
    companyName,
    industry,
    email,
    password,
    phone,
    onboardingStep: 1,
    status: "draft",
  });

  return await repo.create(company);
}
