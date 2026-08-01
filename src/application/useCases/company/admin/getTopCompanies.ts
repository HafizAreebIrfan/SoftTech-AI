import { ICompanyRepository } from "../../../ports/companies/register/companyregisterrepository";
import { mapCompanyForAdmin } from "./companyAdminMapper";

export async function getTopCompaniesForAdmin(repository: ICompanyRepository, limit = 5) {
  const resolvedLimit = Math.min(Math.max(limit, 5), 10);

  const companies = await (repository as any).findLatestCompanies?.(resolvedLimit) ?? [];

  return companies.map((company: any) => mapCompanyForAdmin(company));
}
