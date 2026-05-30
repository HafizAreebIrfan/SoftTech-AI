"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerCompanyInfo = registerCompanyInfo;
const companyregister_1 = require("../../../../domain/entities/company/register/companyregister");
const companyregisterrepository_1 = require("../../../ports/companies/register/companyregisterrepository");
async function registerCompanyInfo(companyRepository, payload) {
    const { companyName, industry, email, password, phone } = payload;
    const repo = (0, companyregisterrepository_1.createCompanyRepositoryPort)(companyRepository);
    if (!companyName || !industry || !email || !password) {
        throw new Error("companyName, industry, email and password are required");
    }
    const company = (0, companyregister_1.createCompany)({
        companyName,
        industry,
        email,
        password,
        phone,
        onboardingStep: 1,
        status: "draft",
    });
    return await repo.create(company);
}
