import { PlatformType, WidgetAudience } from "./GenericWidget";

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
  authType: string;
  authtype?: string;
  headers: any[];
  params: any[];
  body?: any[];
  samplequery?: any;
  sampleresponse?: any;
  platformType?: PlatformType;
  audience?: WidgetAudience;
  webCheckoutUrl?: string;
  mobileDeepLink?: string;
  isRealtimeApi?: boolean;
  streamUrl?: string;
  apiSchema?: any;
  schema?: any;
  authHeader?: string;
  apiKey?: string;
  bearerToken?: string;
  oauth?: {
    tokenUrl?: string;
    clientId?: string;
    clientSecret?: string;
  };
}

export interface CompanyUIInformation {
  layout?: string;
  themeColor?: string;
  audienceDefault?: string;
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
