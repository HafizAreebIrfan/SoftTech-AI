export function mapCompanyForAdmin(company: any) {
  const ui = company.uiPreference && typeof company.uiPreference === "object"
    ? company.uiPreference
    : company.ui ?? null;

  return {
    id: company._id,
    _id: company._id,
    companyName: company.companyName || "Unknown Company",
    name: company.companyName || "Unknown Company",
    owner: company.companyName || company.email || "Unknown Owner",
    registrationDate: company.createdAt ? new Date(company.createdAt).toISOString() : null,
    createdAt: company.createdAt ? new Date(company.createdAt).toISOString() : null,
    plan: company.currentPlan || company.plan || "Basic",
    currentPlan: company.currentPlan || company.plan || "Basic",
    status: company.status || "active",
    actionUrl: `/api/admin/dashboard/${company._id}`,
    email: company.email || null,
    industry: company.industry || null,
    apis: Array.isArray(company.apis) ? company.apis : [],
    apisCount: Array.isArray(company.apis) ? company.apis.length : 0,
    apiCount: Array.isArray(company.apis) ? company.apis.length : 0,
    role: company.role || "company",
    ui,
    phone: company.phone || null,
    mcpSlug: company.mcpSlug || null,
    totalSpent: company.totalSpent ?? 0,
    onBoarding: company.onBoarding ?? true,
    onboardingStep: company.onboardingStep ?? null,
    dashboardOnboardingStep: company.dashboardOnboardingStep ?? null,
    isDashboardOnboardingDone: company.isDashboardOnboardingDone ?? false,
  };
}
