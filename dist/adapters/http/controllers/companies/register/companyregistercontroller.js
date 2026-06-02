"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerCompanyInfoController = registerCompanyInfoController;
exports.saveCompanyApiDetailsController = saveCompanyApiDetailsController;
exports.saveCompanyUiSelectionController = saveCompanyUiSelectionController;
const companyregisterrepository_1 = require("../../../../persistence/mongo/companies/register/companyregisterrepository");
const registercompanyinfo_1 = require("../../../../../application/useCases/company/register/registercompanyinfo");
const companyapidetails_1 = require("../../../../../application/useCases/company/register/companyapidetails");
const companyuiselection_1 = require("../../../../../application/useCases/company/register/companyuiselection");
const authmiddleware_1 = require("../../../../../infrastructure/middlewares/AuthMiddleware/authmiddleware");
const companyRepository = (0, companyregisterrepository_1.createCompanyRepository)();
async function registerCompanyInfoController(req, res, next) {
    try {
        const result = await (0, registercompanyinfo_1.registerCompanyInfo)(companyRepository, req.body);
        res.status(200).json({
            success: true,
            message: "Company info saved successfully",
            data: result,
        });
    }
    catch (error) {
        next(error);
    }
}
async function saveCompanyApiDetailsController(req, res, next) {
    try {
        const result = await (0, companyapidetails_1.saveCompanyApiDetails)(companyRepository, req.params.companyId, req.body);
        res.status(200).json({
            success: true,
            message: "API details saved successfully",
            data: result,
        });
    }
    catch (error) {
        next(error);
    }
}
async function saveCompanyUiSelectionController(req, res, next) {
    try {
        const result = await (0, companyuiselection_1.saveCompanyUiSelection)(companyRepository, req.params.companyId, req.body);
        if (result) {
            const logintoken = (0, authmiddleware_1.createToken)(result._id);
            const isProd = process.env.NODE_ENV === "production" || req.headers["x-forwarded-proto"] === "https";
            res.cookie("jwt", logintoken, {
                httpOnly: true,
                maxAge: authmiddleware_1.maxAge * 1000,
                secure: isProd,
                sameSite: isProd ? "none" : "lax",
            });
        }
        res.status(200).json({
            success: true,
            message: "UI selection saved successfully",
            data: result,
        });
    }
    catch (error) {
        next(error);
    }
}
