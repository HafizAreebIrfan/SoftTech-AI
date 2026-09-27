import { LoginCredentials, User } from "../../domain/entities/CompanyLogin";
import {
  ApisInformation,
  CompanyUIInformation,
  SignupResonse,
} from "../../domain/entities/CompanyRegister";
import { env } from "../../infrastructure/config/env";
import { get, post } from "./httpClient";

const isDev = env.isDev ? env.apiBaseUrlLocal : env.apiBaseUrl;
const LOGIN_URL = `${isDev}/api/company/login`;

export const login = async (credentials: LoginCredentials): Promise<any> => {
  return post(LOGIN_URL, credentials);
};

export const registerCompanyInfo = async (
  payload: any,
): Promise<{ success: boolean; message: string; data: SignupResonse }> => {
  const url = `${isDev}/api/companies/registerstep`;
  return post(url, payload);
};

export const saveCompanyApiDetails = async (
  companyId: string,
  apis: ApisInformation[],
): Promise<{ success: boolean; message: string; data: SignupResonse }> => {
  const url = `${isDev}/api/companies/${companyId}/apidetailsstep`;
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
  const url = `${isDev}/api/companies/${companyId}/uiselectionstep`;
  return post(url, { uiPreference });
};

export const verifySession = async (): Promise<{ user?: User }> => {
  const url = `${isDev}/api/company/login`;
  return get(url, { skipRedirect: true });
};

export const logout = async (): Promise<any> => {
  return post(`${isDev}/api/company/logout`, {});
};

// --- Forgot Password API routes ---
export const requestPasswordResetOtp = async (
  email: string,
): Promise<{ success: boolean; message: string }> => {
  const url = `${isDev}/api/company/forgot-password`;
  return post(url, { email });
};

export const verifyPasswordResetOtp = async (
  email: string,
  otp: string,
): Promise<{ success: boolean; message: string }> => {
  const url = `${isDev}/api/company/forgot-password/verify`;
  return post(url, { email, otp });
};

export const resetPassword = async (payload: {
  email: string;
  otp: string;
  newPassword: string;
}): Promise<{ success: boolean; message: string }> => {
  const url = `${isDev}/api/company/forgot-password/reset`;
  return post(url, {
    email: payload.email,
    otp: payload.otp,
    password: payload.newPassword,
    newPassword: payload.newPassword,
  });
};
