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
  endpointurl: string;
  authtype: string;
  samplequery: any;
}

export interface CompanyUIInformation {
  layout: string;
}

export interface SignupResonse {
  _id: string;
  companyName: string;
  industry: string;
  email: string;
  phone: string;
  apis: ApisInformation[] | null;
  uiPreference: {} | string | null;
  onboardingStep: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}