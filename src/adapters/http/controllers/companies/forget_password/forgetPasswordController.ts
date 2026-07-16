import { NextFunction, Request, Response } from "express";
import { createCompanyForgotPasswordRepository } from "../../../../persistence/mongo/companies/forgetPassword/companyforgetpasswordrepository";
import { resetCompanyPassword, sendForgotPasswordOtp } from "../../../../../application/useCases/company/forgetPassword/forgetPassword";

const companyRepository = createCompanyForgotPasswordRepository();

export async function sendForgotPasswordOtpController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await sendForgotPasswordOtp(companyRepository, req.body.email);
    res.status(200).json({
      success: true,
      message: "OTP sent to your email if the account exists.",
    });
  } catch (error) {
    next(error);
  }
}

export async function sendForgotPasswordOtpTestController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const otp = await sendForgotPasswordOtp(companyRepository, req.body.email, { returnOtp: true });
    res.status(200).json({
      success: true,
      message: "Test OTP generated successfully.",
      otp,
    });
  } catch (error) {
    next(error);
  }
}

export async function resetCompanyPasswordController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await resetCompanyPassword(companyRepository, req.body.email, req.body.otp, req.body.password);
    res.status(200).json({
      success: true,
      message: "Password updated successfully.",
    });
  } catch (error: any) {
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
