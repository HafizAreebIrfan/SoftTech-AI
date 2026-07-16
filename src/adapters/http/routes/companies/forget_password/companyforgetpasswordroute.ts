import express from "express";
import { validateRequest } from "../../../../../infrastructure/middlewares/ValidationMiddleware/validation";
import { forgotPasswordSchema, resetPasswordSchema } from "../../../../../infrastructure/middlewares/ValidationMiddleware/schemas";
import {
  resetCompanyPasswordController,
  sendForgotPasswordOtpController,
  sendForgotPasswordOtpTestController,
} from "../../../controllers/companies/forget_password/forgetPasswordController";

export const CompanyForgetPasswordRoutes = express.Router();

CompanyForgetPasswordRoutes.post(
  "/forgot-password",
  validateRequest(forgotPasswordSchema),
  sendForgotPasswordOtpController,
);

CompanyForgetPasswordRoutes.post(
  "/forgot-password/test",
  validateRequest(forgotPasswordSchema),
  sendForgotPasswordOtpTestController,
);

CompanyForgetPasswordRoutes.post(
  "/forgot-password/reset",
  validateRequest(resetPasswordSchema),
  resetCompanyPasswordController,
);
