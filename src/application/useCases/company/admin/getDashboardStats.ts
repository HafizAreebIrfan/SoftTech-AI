import { ICompanyRepository } from "../../../ports/companies/register/companyregisterrepository";
import PaymentModel from "../../../../adapters/persistence/models/companies/billing/paymentinfo";
import CompanyModel from "../../../../adapters/persistence/models/companies/register/companyinfo";

export async function getDashboardStats(repository: ICompanyRepository) {
  const companies = await (repository as any).findAllCompanies?.() ?? [];
  const payments = await PaymentModel.find({ status: "succeeded" }).lean();

  const statusBreakdown = {
    draft: 0,
    ready_for_testing: 0,
    active: 0,
    pending: 0,
    published: 0,
    not_applied: 0,
  };

  let lifetimeEarnings = 0;
  let publishedCompanies = 0;
  let onboardingCompanies = 0;
  const revenueByYear: Record<number, number> = {};

  for (const company of companies) {
    const status = (company.status || "draft").toString();
    const normalizedStatus = status.replace(/-/g, "_");

    if (statusBreakdown[normalizedStatus as keyof typeof statusBreakdown] !== undefined) {
      statusBreakdown[normalizedStatus as keyof typeof statusBreakdown] += 1;
    }

    if (status === "published") {
      publishedCompanies += 1;
    }

    if (company.onBoarding !== false) {
      onboardingCompanies += 1;
    }

    const createdAt = company.createdAt ? new Date(company.createdAt) : null;
    if (createdAt && !Number.isNaN(createdAt.getTime())) {
      const year = createdAt.getFullYear();
      revenueByYear[year] = (revenueByYear[year] ?? 0) + 0;
    }
  }

  for (const payment of payments) {
    const paymentAmount = typeof payment.amount === "number" ? payment.amount : 0;
    lifetimeEarnings += paymentAmount;

    const paidAt = payment.paidAt ? new Date(payment.paidAt) : null;
    if (paidAt && !Number.isNaN(paidAt.getTime())) {
      const year = paidAt.getFullYear();
      revenueByYear[year] = (revenueByYear[year] ?? 0) + paymentAmount;
    }
  }

  const currentYear = new Date().getFullYear();
  const revenueThisYear = revenueByYear[currentYear] ?? 0;

  return {
    lifetimeEarnings,
    publishedCompanies,
    onboardingCompanies,
    statusBreakdown,
    revenueThisYear,
    revenueByYear,
    totalCompanies: companies.length,
  };
}
