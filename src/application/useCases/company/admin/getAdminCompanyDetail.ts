import { ICompanyRepository } from "../../../ports/companies/register/companyregisterrepository";
import { mapCompanyForAdmin } from "./companyAdminMapper";

export async function getCompanyDashboardDetail(repository: ICompanyRepository, companyId: string) {
  const company = await repository.findById(companyId);

  if (!company) {
    return null;
  }

  return mapCompanyForAdmin(company);
}
