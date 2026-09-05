import { ApiParam } from "./apiparam.types";

export interface IOAuth {
  authorizationUrl?: string;
  tokenUrl?: string;
  clientId?: string;
  clientSecret?: string;
  scopes?: string[];
}

export interface ICompanyAuthStrategy {
  strategyType?: "none" | "api_key" | "bearer" | "oauth2" | "custom_header";
  apiKey?: string;
  authHeader?: string;
  bearerToken?: string;
  // For User OAuth 2.0 (ChatGPT / MCP User OAuth)
  authorizationServer?: string;
  authorizationEndpoint?: string;
  tokenEndpoint?: string;
  clientId?: string;
  clientSecret?: string;
  scopes?: string[];
}

export interface IApi {
  name: string;
  mcpToolName?: string;
  mcpDescription?: string;
  baseUrl: string;
  endpoint: string;
  method?: string;
  authType?: string;
  requiresAuth?: boolean;
  headers?: any[];
  params?: ApiParam[];
  body?: ApiParam[];
  apiKey?: string;
  authHeader?: string;
  bearerToken?: string;
  oauth?: IOAuth;
  platformType?: "web" | "mobile" | "both";
  audience?: "customer" | "admin";
  webCheckoutUrl?: string;
  mobileDeepLink?: string;
  isRealtimeApi?: boolean;
  streamUrl?: string;
  apiSchema?: Record<string, unknown>;
  inputFieldMap?: any[];
  outputFieldMap?: any[];
  fallbackWidget?: string;
  mcpResourceUri?: string;
  testedonregister?: boolean;
}

export interface IUiPreference {
  layout?: string;
  themeColor?: string;
  audienceDefault?: string;
}

export interface ICompany {
  companyName: string;
  mcpSlug?: string;
  industry: string;
  email: string;
  password?: string;
  phone?: string;
  apis?: IApi[];
  authStrategy?: ICompanyAuthStrategy;
  uiPreference?: IUiPreference | null;
  onboardingStep?: number;
  status?: string;
  passwordResetOTP?: string;
  passwordResetOTPExpires?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
