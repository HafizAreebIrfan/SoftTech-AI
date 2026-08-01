import test from "node:test";
import assert from "node:assert/strict";
import { getTopCompaniesForAdmin } from "../src/application/useCases/company/admin/getTopCompanies";
import { getCompanyDashboardDetail } from "../src/application/useCases/company/admin/getAdminCompanyDetail";
import { getAllCompaniesForAdmin } from "../src/application/useCases/company/admin/getAllCompanies";
import { getDashboardStats } from "../src/application/useCases/company/admin/getDashboardStats";

class FakeCompanyRepository {
  private companies: any[];

  constructor(companies: any[] = []) {
    this.companies = companies;
  }

  async findLatestCompanies(limit: number) {
    return this.companies.slice(0, limit);
  }

  async findAllCompanies() {
    return this.companies;
  }

  async findById(companyId: string) {
    return this.companies.find((company) => company._id === companyId) || null;
  }
}

test("getTopCompaniesForAdmin returns the latest companies with sensible defaults", async () => {
  const companies = Array.from({ length: 12 }, (_, index) => ({
    _id: `company-${index}`,
    companyName: `Company ${index}`,
    email: `company${index}@example.com`,
    industry: "Fintech",
    apis: [{ name: "Weather API" }],
    uiPreference: { layout: "dashboard" },
    createdAt: new Date(2024, 0, index + 1),
    status: index % 2 === 0 ? "active" : "draft",
    onBoarding: index % 2 === 0,
  }));

  const result = await getTopCompaniesForAdmin(new FakeCompanyRepository(companies) as any, 12);

  assert.equal(result.length, 10);
  assert.equal(result[0].companyName, "Company 0");
  assert.equal(result[0].owner, "Company 0");
  assert.equal(result[0].plan, "Basic");
  assert.equal(result[0].status, "active");
  assert.deepEqual(result[0].apis, [{ name: "Weather API" }]);
  assert.deepEqual(result[0].ui, { layout: "dashboard" });
  assert.equal(result[0].email, "company0@example.com");
  assert.equal(result[0].industry, "Fintech");
});

test("getAllCompaniesForAdmin returns all mapped companies with the full admin payload", async () => {
  const companies = [
    {
      _id: "company-1",
      companyName: "Acme",
      email: "owner@acme.com",
      industry: "Retail",
      apis: [{ name: "Catalog API" }],
      uiPreference: { layout: "dashboard" },
      createdAt: new Date("2024-01-15"),
      status: "active",
      phone: "1234567890",
      mcpSlug: "acme",
      onboardingStep: 2,
      plan: "Pro",
      onBoarding: true,
      currentPlan: "pro",
      totalSpent: 120,
    },
  ];

  const result = await getAllCompaniesForAdmin(new FakeCompanyRepository(companies) as any);

  assert.equal(result.length, 1);
  assert.equal(result[0].companyName, "Acme");
  assert.equal(result[0].email, "owner@acme.com");
  assert.equal(result[0].industry, "Retail");
  assert.equal(result[0].mcpSlug, "acme");
  assert.equal(result[0].phone, "1234567890");
  assert.deepEqual(result[0].apis, [{ name: "Catalog API" }]);
  assert.deepEqual(result[0].ui, { layout: "dashboard" });
  assert.equal(result[0].onBoarding, true);
  assert.equal(result[0].currentPlan, "pro");
  assert.equal(result[0].totalSpent, 120);
});

test("getDashboardStats aggregates lifetime and year-based company revenue", async () => {
  const companies = [
    {
      _id: "company-1",
      companyName: "Acme",
      email: "owner@acme.com",
      totalSpent: 1200,
      status: "published",
      onBoarding: true,
      createdAt: new Date("2026-02-10"),
    },
    {
      _id: "company-2",
      companyName: "Beta",
      email: "owner@beta.com",
      totalSpent: 800,
      status: "pending",
      onBoarding: false,
      createdAt: new Date("2025-06-10"),
    },
  ];

  const result = await getDashboardStats(new FakeCompanyRepository(companies) as any);

  assert.equal(result.lifetimeEarnings, 2000);
  assert.equal(result.publishedCompanies, 1);
  assert.equal(result.onboardingCompanies, 1);
  assert.equal(result.statusBreakdown.published, 1);
  assert.equal(result.statusBreakdown.pending, 1);
  assert.equal(result.revenueThisYear, 1200);
  assert.equal(result.revenueByYear[2026], 1200);
  assert.equal(result.revenueByYear[2025], 800);
});

test("getCompanyDashboardDetail returns a mapped company detail", async () => {
  const company = {
    _id: "company-1",
    companyName: "Acme",
    email: "owner@acme.com",
    createdAt: new Date("2024-01-15"),
    status: "active",
  };

  const result = await getCompanyDashboardDetail(new FakeCompanyRepository([company]) as any, "company-1");

  assert.ok(result);
  assert.equal(result?.companyName, "Acme");
  assert.equal(result?.owner, "Acme");
  assert.equal(result?.status, "active");
});
