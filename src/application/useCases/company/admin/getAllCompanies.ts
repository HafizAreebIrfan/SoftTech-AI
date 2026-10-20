import { ICompanyRepository } from "../../../ports/companies/register/companyregisterrepository";
import { mapCompanyForAdmin } from "./companyAdminMapper";

export async function getAllCompaniesForAdmin(repository: ICompanyRepository) {
  const companies = await (repository as any).findAllCompanies?.() ?? [];

  return companies.map((company: any) => mapCompanyForAdmin(company));
}
