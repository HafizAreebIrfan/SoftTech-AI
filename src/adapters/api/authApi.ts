import { LoginCredentials, User } from "../../domain/entities/CompanyLogin";
import {
  ApisInformation,
  CompanyUIInformation,
  SignupResonse,
} from "../../domain/entities/CompanyRegister";
import { env } from "../../infrastructure/config/env";
import { get, post, put } from "./httpClient";

const isDev = env.isDev ? env.apiBaseUrlLocal : env.apiBaseUrl;
const LOGIN_URL = `${isDev}/api/company/login`;

export const login = async (credentials: LoginCredentials): Promise<any> => {
  return post(LOGIN_URL, credentials, { skipRedirect: true });
};

export const registerCompanyInfo = async (
  payload: any,
): Promise<{ success: boolean; message: string; data: SignupResonse; token?: string }> => {
  const url = `${isDev}/api/companies/registerstep`;
  return post(url, payload, { skipRedirect: true });
};

export const saveCompanyApiDetails = async (
  companyId: string,
  payload:
    | ApisInformation[]
    | { apis: ApisInformation[]; authStrategy?: any; MapsApiKey?: string },
): Promise<{ success: boolean; message: string; data: SignupResonse }> => {
  const url = `${isDev}/api/companies/${companyId}/apidetailsstep`;
  const body = Array.isArray(payload) ? { apis: payload } : payload;
  return post(url, body, { skipRedirect: true });
};

export const updateCompanyApis = async (
  companyId: string,
  payload: { apis: any[]; MapsApiKey?: string },
): Promise<{ success: boolean; message: string; data?: any }> => {
  const url = `${isDev}/api/companies/${companyId}/apis`;
  return put(url, payload, { skipRedirect: true });
};

export const updateCompanyApiUiSettings = async (
  companyId: string,
  payload: {
    apiIndex?: number;
    apiId?: string;
    mcpToolName?: string;
    mcpDescription?: string;
    uiConfig?: {
      uiEnabled?: boolean;
      mapEnabled?: boolean;
      layout?: string;
      uiType?: string;
    };
    isWidgetEnabled?: boolean;
    isMapViewEnabled?: boolean;
    sampleResponse?: string;
    apiName?: string;
    apiEndpoint?: string;
    apiMethod?: string;
  },
): Promise<{ success: boolean; message: string; data?: any }> => {
  const url = `${isDev}/api/companies/${companyId}/api-ui-settings`;
  return post(url, payload, { skipRedirect: true });
};

export const analyzeSingleCompanyApi = async (
  companyId: string,
  apiIndex: number,
  sampleResponse?: string,
): Promise<{
  success: boolean;
  message: string;
  data: { apiIndex: number; apiSchema: any; api: any };
}> => {
  const url = `${isDev}/api/companies/${companyId}/apis/${apiIndex}/analyze`;
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
  const url = `${isDev}/api/companies/${companyId}/uiselectionstep`;
  return post(url, { uiPreference }, { skipRedirect: true });
};

export const verifySession = async (): Promise<{ user?: User }> => {
  const url = `${isDev}/api/company/login`;
  return get(url, { skipRedirect: true, silent: true });
};

export const getCompanyApi = async (
  companyId: string,
): Promise<{ success: boolean; data?: any }> => {
  const url = `${isDev}/api/companies/${companyId}`;
  return get(url, { skipRedirect: true, silent: true });
};

export const logout = async (): Promise<any> => {
  return post(`${isDev}/api/company/logout`, {}, { skipRedirect: true });
};

// --- Forgot Password API routes ---
export const requestPasswordResetOtp = async (
  email: string,
): Promise<{ success: boolean; message: string }> => {
  const url = `${isDev}/api/company/forgot-password`;
  return post(url, { email }, { skipRedirect: true });
};

export const verifyPasswordResetOtp = async (
  email: string,
  otp: string,
): Promise<{ success: boolean; message: string }> => {
  const url = `${isDev}/api/company/forgot-password/verify`;
  return post(url, { email, otp }, { skipRedirect: true });
};

export const resetPassword = async (payload: {
  email: string;
  otp: string;
  newPassword: string;
}): Promise<{ success: boolean; message: string }> => {
  const url = `${isDev}/api/company/forgot-password/reset`;
  return post(
    url,
    {
      email: payload.email,
      otp: payload.otp,
      password: payload.newPassword,
      newPassword: payload.newPassword,
    },
    { skipRedirect: true },
  );
};

export const sendForgotPasswordOtpApi = async (
  email: string,
): Promise<{ success: boolean; message: string }> => {
  const url = `${isDev}/api/company/forgot-password`;
  return post(url, { email }, { skipRedirect: true });
};

export const resetPasswordApi = async (payload: {
  email: string;
  otp: string;
  password: string;
}): Promise<{ success: boolean; message: string }> => {
  const url = `${isDev}/api/company/forgot-password/reset`;
  return post(url, payload, { skipRedirect: true });
};

export const completeSignupOnboardingApi = async (
  companyId: string,
): Promise<{ success: boolean; message: string; data?: any }> => {
  const url = `${isDev}/api/companies/${companyId}/complete-signup-onboarding`;
  return post(url, {}, { skipRedirect: true });
};

export const updateCompanyOnboardingStepApi = async (
  companyId: string,
  step: number,
): Promise<{ success: boolean; message?: string; data?: any }> => {
  const url = `${isDev}/api/companies/${companyId}/onboarding-step`;
  return post(url, { step }, { skipRedirect: true });
};
