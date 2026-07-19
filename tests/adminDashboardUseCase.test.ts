import test from "node:test";
import assert from "node:assert/strict";
import { getTopCompaniesForAdmin } from "../src/application/useCases/company/admin/getTopCompanies";
import { getCompanyDashboardDetail } from "../src/application/useCases/company/admin/getAdminCompanyDetail";

class FakeCompanyRepository {
  private companies: any[];

  constructor(companies: any[] = []) {
    this.companies = companies;
  }

  async findLatestCompanies(limit: number) {
    return this.companies.slice(0, limit);
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
    createdAt: new Date(2024, 0, index + 1),
    status: index % 2 === 0 ? "active" : "draft",
  }));

  const result = await getTopCompaniesForAdmin(new FakeCompanyRepository(companies) as any, 12);

  assert.equal(result.length, 10);
  assert.equal(result[0].companyName, "Company 0");
  assert.equal(result[0].owner, "Company 0");
  assert.equal(result[0].plan, "Basic");
  assert.equal(result[0].status, "active");
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
