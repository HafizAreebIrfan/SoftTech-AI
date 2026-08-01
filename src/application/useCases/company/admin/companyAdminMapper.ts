export function mapCompanyForAdmin(company: any) {
  const ui = company.uiPreference && typeof company.uiPreference === "object"
    ? company.uiPreference
    : company.ui ?? null;

  return {
    id: company._id,
    companyName: company.companyName || "Unknown Company",
    owner: company.companyName || company.email || "Unknown Owner",
    registrationDate: company.createdAt ? new Date(company.createdAt).toISOString() : null,
    plan: company.plan || "Basic",
    status: company.status || "draft",
    actionUrl: `/api/admin/dashboard/${company._id}`,
    email: company.email || null,
    industry: company.industry || null,
    apis: Array.isArray(company.apis) ? company.apis : [],
    ui,
    phone: company.phone || null,
    mcpSlug: company.mcpSlug || null,
    totalSpent: company.totalSpent ?? 0,
    currentPlan: company.currentPlan ?? null,
    onBoarding: company.onBoarding ?? true,
    onboardingStep: company.onboardingStep ?? null,
  };
}
