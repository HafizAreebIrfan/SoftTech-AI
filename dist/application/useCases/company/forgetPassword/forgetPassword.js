"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendForgotPasswordOtp = sendForgotPasswordOtp;
exports.resetCompanyPassword = resetCompanyPassword;
const companyforgetpasswordrepository_1 = require("../../../ports/companies/forgetPassword/companyforgetpasswordrepository");
const bcrypt_1 = require("../../../../infrastructure/middlewares/SecurityMiddleware/bcrypt");
const emailService_1 = require("../../../../infrastructure/services/emailService");
const OTP_TTL_MS = 5 * 60 * 1000;
const generateOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};
async function sendForgotPasswordOtp(companyRepository, email, options) {
    const repo = (0, companyforgetpasswordrepository_1.createCompanyForgotPasswordRepositoryPort)(companyRepository);
    const company = await repo.findByEmail(email);
    if (!company) {
        throw new Error("Company with this email was not found");
    }
    const otp = generateOtp();
    const hashedOtp = await (0, bcrypt_1.Hashpassword)(otp);
    const otpExpires = new Date(Date.now() + OTP_TTL_MS);
    await repo.update(company._id, {
        passwordResetOTP: hashedOtp,
        passwordResetOTPExpires: otpExpires,
    });
    if (!options?.returnOtp) {
        await (0, emailService_1.sendPasswordResetOtpEmail)(email, otp);
        return;
    }
    return otp;
}
async function resetCompanyPassword(companyRepository, email, otp, password) {
    const repo = (0, companyforgetpasswordrepository_1.createCompanyForgotPasswordRepositoryPort)(companyRepository);
    const company = await repo.findByEmail(email);
    if (!company) {
        throw new Error("Company with this email was not found");
    }
    if (!company.passwordResetOTP || !company.passwordResetOTPExpires) {
        throw new Error("No password reset request is active for this account");
    }
    if (new Date(company.passwordResetOTPExpires) < new Date()) {
        throw new Error("OTP has expired");
    }
    const isValidOtp = await (0, bcrypt_1.comparePassword)(otp, company.passwordResetOTP);
    if (!isValidOtp) {
        throw new Error("Invalid OTP");
    }
    if (company.password && (await (0, bcrypt_1.comparePassword)(password, company.password))) {
        throw new Error("New password must be different from the current password");
    }
    const updatedCompany = await repo.resetPassword(company._id, password);
    if (!updatedCompany) {
        throw new Error("Failed to update password");
    }
}
