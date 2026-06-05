export interface CompanyInformation {
  id: string;
  name: string;
  email: string;
  password: string;
  subdomain: string;
  industry: any;
}

export interface CompanyApiInformation {
  apis: ApisInformation[];
}

export interface ApisInformation {
  name: string;
  method: string;
  baseUrl: string;
  endpoint: string;
  authtype: string;
  headers: any[];
  params: any[];
  credentials?: string;
  authHeader?: string;
  oauthTokenUrl?: string;
  oauthClientId?: string;
}

export interface CompanyUIInformation {
  layout: string;
}

export interface SignupResonse {
  _id: string;
  companyName: string;
  industry: string;
  email: string;
  password: string;
  phone: string;
  apis: ApisInformation[] | null;
  uiPreference: {} | string | null;
  onboardingStep: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}
