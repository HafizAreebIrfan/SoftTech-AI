import { ICompany } from "../../../types/company.types";

export function createCompany(data: ICompany): ICompany {
  return {
    companyName: data.companyName,
    mcpSlug: data.mcpSlug,
    industry: data.industry,
    email: data.email,
    password: data.password,
    phone: data.phone || "",
    apis: data.apis || [],
    uiPreference: data.uiPreference || null,
    onboardingStep: data.onboardingStep || 1,
    status: data.status || "draft",
    createdAt: data.createdAt || new Date(),
    updatedAt: data.updatedAt || new Date(),
  };
}
