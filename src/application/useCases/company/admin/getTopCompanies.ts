import { ICompanyRepository } from "../../../ports/companies/register/companyregisterrepository";

export async function getTopCompaniesForAdmin(repository: ICompanyRepository, limit = 10) {
  const resolvedLimit = Math.min(Math.max(limit, 5), 10);

  const companies = await (repository as any).findLatestCompanies?.(resolvedLimit) ?? [];

  return companies.map((company: any) => ({
    id: company._id,
    companyName: company.companyName || "Unknown Company",
    owner: company.companyName || company.email || "Unknown Owner",
    registrationDate: company.createdAt ? new Date(company.createdAt).toISOString() : null,
    plan: company.plan || "Basic",
    status: company.status || "draft",
    actionUrl: `/api/admin/dashboard/${company._id}`,
  }));
}
