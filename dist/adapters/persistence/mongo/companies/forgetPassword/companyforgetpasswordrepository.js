"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCompanyForgotPasswordRepository = createCompanyForgotPasswordRepository;
const companyinfo_1 = require("../../../models/companies/register/companyinfo");
function createCompanyForgotPasswordRepository() {
    return {
        async findByEmail(email) {
            return await companyinfo_1.CompanyModel.findOne({ email }).lean();
        },
        async update(companyId, updates) {
            return await companyinfo_1.CompanyModel.findByIdAndUpdate(companyId, updates, {
                returnDocument: "after",
            }).lean();
        },
        async resetPassword(companyId, newPassword) {
            const company = await companyinfo_1.CompanyModel.findById(companyId);
            if (!company)
                return null;
            company.password = newPassword;
            company.passwordResetOTP = undefined;
            company.passwordResetOTPExpires = undefined;
            return await company.save();
        },
    };
}
