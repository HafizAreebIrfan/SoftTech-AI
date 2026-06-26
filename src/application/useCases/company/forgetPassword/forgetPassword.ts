import { createCompanyRepositoryPort, ICompanyRepository } from "../../../ports/companies/register/companyregisterrepository";
import { comparePassword, Hashpassword } from "../../../../infrastructure/middlewares/SecurityMiddleware/bcrypt";
import { sendPasswordResetOtpEmail } from "../../../../infrastructure/services/emailService";

const OTP_TTL_MS = 5 * 60 * 1000;

const generateOtp = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export async function sendForgotPasswordOtp(
  companyRepository: ICompanyRepository,
  email: string,
  options?: { returnOtp?: boolean },
): Promise<string | void> {
  const repo = createCompanyRepositoryPort(companyRepository);
  const company = await repo.findByEmail(email);

  if (!company) {
    throw new Error("Company with this email was not found");
  }

  const otp = generateOtp();
  const hashedOtp = await Hashpassword(otp);
  const otpExpires = new Date(Date.now() + OTP_TTL_MS);

  await repo.update((company as any)._id as string, {
    passwordResetOTP: hashedOtp,
    passwordResetOTPExpires: otpExpires,
  });

  if (!options?.returnOtp) {
    await sendPasswordResetOtpEmail(email, otp);
    return;
  }

  return otp;
}

export async function resetCompanyPassword(
  companyRepository: ICompanyRepository,
  email: string,
  otp: string,
  password: string,
): Promise<void> {
  const repo = createCompanyRepositoryPort(companyRepository);
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

  const isValidOtp = await comparePassword(otp, company.passwordResetOTP);
  if (!isValidOtp) {
    throw new Error("Invalid OTP");
  }

  if (company.password && (await comparePassword(password, company.password))) {
    throw new Error("New password must be different from the current password");
  }

  const updatedCompany = await repo.resetPassword((company as any)._id as string, password);
  if (!updatedCompany) {
    throw new Error("Failed to update password");
  }
}
