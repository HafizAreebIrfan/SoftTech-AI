"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCompanyRepository = createCompanyRepository;
const companyinfo_1 = require("../../../models/companies/register/companyinfo");
function createCompanyRepository() {
    return {
        async create(companyData) {
            return await companyinfo_1.CompanyModel.create(companyData);
        },
        async findById(companyId) {
            return await companyinfo_1.CompanyModel.findById(companyId).lean();
        },
        async findByEmail(email) {
            return await companyinfo_1.CompanyModel.findOne({ email }).lean();
        },
        async update(companyId, updates) {
            return await companyinfo_1.CompanyModel.findByIdAndUpdate(companyId, updates, {
                returnDocument: "after",
            }).lean();
        },
    };
}
