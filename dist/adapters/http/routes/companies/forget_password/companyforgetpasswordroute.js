"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompanyForgetPasswordRoutes = void 0;
const express_1 = __importDefault(require("express"));
const validation_1 = require("../../../../../infrastructure/middlewares/ValidationMiddleware/validation");
const schemas_1 = require("../../../../../infrastructure/middlewares/ValidationMiddleware/schemas");
const forgetPasswordController_1 = require("../../../controllers/companies/forget_password/forgetPasswordController");
exports.CompanyForgetPasswordRoutes = express_1.default.Router();
exports.CompanyForgetPasswordRoutes.post("/forgot-password", (0, validation_1.validateRequest)(schemas_1.forgotPasswordSchema), forgetPasswordController_1.sendForgotPasswordOtpController);
exports.CompanyForgetPasswordRoutes.post("/forgot-password/test", (0, validation_1.validateRequest)(schemas_1.forgotPasswordSchema), forgetPasswordController_1.sendForgotPasswordOtpTestController);
exports.CompanyForgetPasswordRoutes.post("/forgot-password/reset", (0, validation_1.validateRequest)(schemas_1.resetPasswordSchema), forgetPasswordController_1.resetCompanyPasswordController);
