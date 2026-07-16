export interface IApi {
  name: string;
  mcpToolName?: string;
  mcpDescription?: string;
  baseUrl: string;
  endpoint: string;
  method?: string;
  authType?: string;
  headers?: string[];
  params?: string[];
  authHeader?: string;
  apiKey?: string;
  oauthTokenUrl?: string;
  oauthClientId?: string;
  oauthClientSecret?: string;
  bearerToken?: string;
  inputFieldMap?: Record<string, string>;
  outputFieldMap?: Record<string, string>;
  sampleResponse?: Record<string, unknown>;
  fallbackWidget?: Record<string, unknown>;
  mcpResourceUri?: string;
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
