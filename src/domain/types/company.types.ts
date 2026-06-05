export interface IApi {
  name: string;
  baseUrl: string;
  endpoint: string;
  method?: string;
  authType?: string;
  headers?: string[];
  params?: string[];
  bearerToken?: string;
  apiKey?: string;
  oauthTokenUrl?: string;
  oauthClientId?: string;
  oauthClientSecret?: string;
}

export interface IUiPreference {
  layout?: string;
}

export interface ICompany {
  companyName: string;
  industry: string;
  email: string;
  password?: string;
  phone?: string;
  apis?: IApi[];
  uiPreference?: IUiPreference | null;
  onboardingStep?: number;
  status?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
