export interface IOAuth {
  tokenUrl?: string;
  clientId?: string;
  clientSecret?: string;
}

export interface IApi {
  name: string;
  mcpToolName?: string;
  mcpDescription?: string;
  baseUrl: string;
  endpoint: string;
  method?: string;
  authType?: string;
  headers?: any[];
  params?: any[];
  body?: any[];
  authHeader?: string;
  apiKey?: string;
  bearerToken?: string;
  oauth?: IOAuth;
  platformType?: "web" | "mobile" | "both";
  webCheckoutUrl?: string;
  mobileDeepLink?: string;
  inputFieldMap?: any[];
  outputFieldMap?: any[];
  sampleResponse?: Record<string, unknown>;
  fallbackWidget?: string;
  mcpResourceUri?: string;
  testedonregister?: boolean;
  apiSchema?: Record<string, unknown>;
}

export interface IUiPreference {
  layout?: string;
}

export interface ICompany {
  companyName: string;
  mcpSlug?: string;
  industry: string;
  email: string;
  password?: string;
  phone?: string;
  apis?: IApi[];
  uiPreference?: IUiPreference | null;
  onboardingStep?: number;
  status?: string;
  passwordResetOTP?: string;
  passwordResetOTPExpires?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
