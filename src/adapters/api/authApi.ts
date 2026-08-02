import { LoginCredentials, User } from "../../domain/entities/CompanyLogin";
import {
  ApisInformation,
  CompanyUIInformation,
  SignupResonse,
} from "../../domain/entities/CompanyRegister";
import { env } from "../../infrastructure/config/env";
import { get, post } from "./httpClient";

const LOGIN_URL = `${env.apiBaseUrl}/api/company/login`;

export const login = async (credentials: LoginCredentials): Promise<any> => {
  return post(LOGIN_URL, credentials);
};

export const registerCompanyInfo = async (
  payload: any,
): Promise<{ success: boolean; message: string; data: SignupResonse }> => {
  const url = `${env.apiBaseUrl}/api/companies/registerstep`;
  return post(url, payload);
};

export const saveCompanyApiDetails = async (
  companyId: string,
  apis: ApisInformation[],
): Promise<{ success: boolean; message: string; data: SignupResonse }> => {
  const url = `${env.apiBaseUrl}/api/companies/${companyId}/apidetailsstep`;
  return post(url, { apis });
};

export const saveCompanyUiSelection = async (
  companyId: string,
  uiPreference: CompanyUIInformation,
): Promise<{
  success: boolean;
  message: string;
  data: SignupResonse;
  token?: string;
}> => {
  const url = `${env.apiBaseUrl}/api/companies/${companyId}/uiselectionstep`;
  return post(url, { uiPreference });
};

export const verifySession = async (): Promise<{ user?: User }> => {
  const url = `${env.apiBaseUrl}/api/company/login`;
  return get(url, { skipRedirect: true });
};

export const logout = async (): Promise<any> => {
  return post(`${env.apiBaseUrl}/api/company/logout`, {});
};

// --- Forgot Password (demo/mock flow) ---
// TODO: Replace these mock implementations with real endpoints once the
// backend exposes forgot-password routes, e.g.
//   POST `${env.apiBaseUrl}/api/company/forgot-password/request-otp`
//   POST `${env.apiBaseUrl}/api/company/forgot-password/verify-otp`
//   POST `${env.apiBaseUrl}/api/company/forgot-password/reset`
// The Stitch design ships with a hardcoded "Demo OTP: 12345" for preview
// purposes, so the mock below mirrors that behavior until the real API
// is ready.
export const DEMO_OTP = "12345";

export const requestPasswordResetOtp = async (
  email: string,
): Promise<{ success: boolean; message: string }> => {
  await new Promise((resolve) => setTimeout(resolve, 600));
  return {
    success: true,
    message: `A verification code was sent to ${email}.`,
  };
};

export const verifyPasswordResetOtp = async (
  otp: string,
): Promise<{ success: boolean; message: string }> => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  if (otp === DEMO_OTP) {
    return { success: true, message: "Verified successfully!" };
  }
  return { success: false, message: "Invalid code, please try again." };
};

export const resetPassword = async (
  _payload: { email: string; otp: string; newPassword: string },
): Promise<{ success: boolean; message: string }> => {
  await new Promise((resolve) => setTimeout(resolve, 700));
  return { success: true, message: "Password updated successfully!" };
};
