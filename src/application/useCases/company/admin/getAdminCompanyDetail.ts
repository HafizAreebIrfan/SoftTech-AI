import { ICompanyRepository } from "../../../ports/companies/register/companyregisterrepository";

export async function getCompanyDashboardDetail(repository: ICompanyRepository, companyId: string) {
  const company = await repository.findById(companyId);

  if (!company) {
    return null;
  }

  return {
    id: company._id,
    companyName: company.companyName || "Unknown Company",
    owner: company.companyName || company.email || "Unknown Owner",
    registrationDate: company.createdAt ? new Date(company.createdAt).toISOString() : null,
    plan: company.plan || "Basic",
    status: company.status || "draft",
    email: company.email,
  };
}
