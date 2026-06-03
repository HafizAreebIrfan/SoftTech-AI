import { LoginCredentials, LoginResponse, User } from "../../domain/entities/CompanyLogin";
import { ApisInformation, CompanyUIInformation, SignupResonse } from "../../domain/entities/CompanyRegister";
import { env } from "../../infrastructure/config/env";
import { get, post } from "./httpClient";

const LOGIN_URL = `${env.apiBaseUrl}/api/company/login`;

const toUser = (response: LoginResponse | { _id?: string; user?: User } | any): User | null => {
  if (response?.user) {
    return response.user;
  }

  if (response?._id) {
    return {
      id: response._id,
      name: response.companyName || response.name || "",
      email: response.email || "",
    };
  }

  return null;
};

export const login = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  const response = await post(LOGIN_URL, credentials);
  const user = toUser(response);

  return user ? { user } : response;
};

export const registerCompanyInfo = async (payload: any): Promise<{ success: boolean; message: string; data: SignupResonse }> => {
  const url = `${env.apiBaseUrl}/api/companies/registerstep`;
  return post(url, payload);
};

export const saveCompanyApiDetails = async (companyId: string, apis: ApisInformation[]): Promise<{ success: boolean; message: string; data: SignupResonse }> => {
  const url = `${env.apiBaseUrl}/api/companies/${companyId}/apidetailsstep`;
  return post(url, { apis });
};

export const saveCompanyUiSelection = async (companyId: string, uiPreference: CompanyUIInformation): Promise<{ success: boolean; message: string; data: SignupResonse; token?: string }> => {
  const url = `${env.apiBaseUrl}/api/companies/${companyId}/uiselectionstep`;
  return post(url, { uiPreference });
};

export const verifySession = async (): Promise<{ user?: User }> => {
  const url = `${env.apiBaseUrl}/api/company/login`;
  return get(url, { skipRedirect: true });
};
