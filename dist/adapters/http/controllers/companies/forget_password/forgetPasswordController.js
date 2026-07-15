"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendForgotPasswordOtpController = sendForgotPasswordOtpController;
exports.sendForgotPasswordOtpTestController = sendForgotPasswordOtpTestController;
exports.resetCompanyPasswordController = resetCompanyPasswordController;
const companyforgetpasswordrepository_1 = require("../../../../persistence/mongo/companies/forgetPassword/companyforgetpasswordrepository");
const forgetPassword_1 = require("../../../../../application/useCases/company/forgetPassword/forgetPassword");
const companyRepository = (0, companyforgetpasswordrepository_1.createCompanyForgotPasswordRepository)();
async function sendForgotPasswordOtpController(req, res, next) {
    try {
        await (0, forgetPassword_1.sendForgotPasswordOtp)(companyRepository, req.body.email);
        res.status(200).json({
            success: true,
            message: "OTP sent to your email if the account exists.",
        });
    }
    catch (error) {
        next(error);
    }
}
async function sendForgotPasswordOtpTestController(req, res, next) {
    try {
        const otp = await (0, forgetPassword_1.sendForgotPasswordOtp)(companyRepository, req.body.email, { returnOtp: true });
        res.status(200).json({
            success: true,
            message: "Test OTP generated successfully.",
            otp,
        });
    }
    catch (error) {
        next(error);
    }
}
async function resetCompanyPasswordController(req, res, next) {
    try {
        await (0, forgetPassword_1.resetCompanyPassword)(companyRepository, req.body.email, req.body.otp, req.body.password);
        res.status(200).json({
            success: true,
            message: "Password updated successfully.",
        });
    }
    catch (error) {
        if (error?.message === "New password must be different from the current password") {
            res.status(400).json({
                success: false,
                message: error.message,
            });
            return;
        }
        next(error);
    }
}
