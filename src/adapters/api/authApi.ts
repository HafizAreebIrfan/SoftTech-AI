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
  return post(url, payload, { skipRedirect: true });
};

export const saveCompanyApiDetails = async (
  companyId: string,
  apis: ApisInformation[],
): Promise<{ success: boolean; message: string; data: SignupResonse }> => {
  const url = `${env.apiBaseUrl}/api/companies/${companyId}/apidetailsstep`;
  return post(url, { apis }, { skipRedirect: true });
};

export const analyzeSingleCompanyApi = async (
  companyId: string,
  apiIndex: number,
  sampleResponse?: string,
): Promise<{ success: boolean; message: string; data: { apiIndex: number; apiSchema: any; api: any } }> => {
  const url = `${env.apiBaseUrl}/api/companies/${companyId}/apis/${apiIndex}/analyze`;
  return post(url, { sampleResponse }, { skipRedirect: true });
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
  return post(url, { uiPreference }, { skipRedirect: true });
};

export const verifySession = async (): Promise<{ user?: User }> => {
  const url = `${env.apiBaseUrl}/api/company/login`;
  return get(url, { skipRedirect: true });
};

export const logout = async (): Promise<any> => {
  return post(`${env.apiBaseUrl}/api/company/logout`, {});
};

export const sendForgotPasswordOtpApi = async (
  email: string,
): Promise<{ success: boolean; message: string }> => {
  const url = `${env.apiBaseUrl}/api/company/forgot-password`;
  return post(url, { email }, { skipRedirect: true });
};

export const resetPasswordApi = async (
  payload: { email: string; otp: string; password: string },
): Promise<{ success: boolean; message: string }> => {
  const url = `${env.apiBaseUrl}/api/company/forgot-password/reset`;
  return post(url, payload, { skipRedirect: true });
};
