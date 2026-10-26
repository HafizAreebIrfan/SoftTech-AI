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
    onBoarding: data.onBoarding ?? true,
    onboardingStep: data.onboardingStep || 1,
    // Canonical four-field onboarding state — every new company starts
    // identical.
    signupOnboardingStep: data.signupOnboardingStep || 1,
    isSignupOnboardingDone: data.isSignupOnboardingDone ?? false,
    dashboardOnboardingStep: data.dashboardOnboardingStep || 1,
    isDashboardOnboardingDone: data.isDashboardOnboardingDone ?? false,
    status: data.status || "draft",
    createdAt: data.createdAt || new Date(),
    updatedAt: data.updatedAt || new Date(),
  };
}
