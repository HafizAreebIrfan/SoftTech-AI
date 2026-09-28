import { NextFunction, Request, Response } from "express";
import { createCompanyForgotPasswordRepository } from "../../../../persistence/mongo/companies/forgetPassword/companyforgetpasswordrepository";
import { resetCompanyPassword, sendForgotPasswordOtp, verifyForgotPasswordOtp } from "../../../../../application/useCases/company/forgetPassword/forgetPassword";

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
      message: "A 6-digit verification code has been sent to your email address.",
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

export async function verifyForgotPasswordOtpController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await verifyForgotPasswordOtp(companyRepository, req.body.email, req.body.otp);
    res.status(200).json({
      success: true,
      message: "OTP verified successfully.",
    });
  } catch (error: any) {
    if (error?.message === "Invalid OTP" || error?.message === "OTP has expired" || error?.message === "No password reset request is active for this account") {
      res.status(400).json({
        success: false,
        message: error.message,
      });
      return;
    }
    next(error);
  }
}

export async function resetCompanyPasswordController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const password = req.body.password || req.body.newPassword;
    await resetCompanyPassword(companyRepository, req.body.email, req.body.otp, password);
    res.status(200).json({
      success: true,
      message: "Password updated successfully.",
    });
  } catch (error: any) {
    if (
      error?.message === "New password must be different from the current password" ||
      error?.message === "Invalid OTP" ||
      error?.message === "OTP has expired" ||
      error?.message === "No password reset request is active for this account"
    ) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
      return;
    }
    next(error);
  }
}
