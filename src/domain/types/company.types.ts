import { ApiParam } from "./apiparam.types";
import { McpToolResultPayload } from "./genericWidget.types";

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
  params?: ApiParam[];
  body?: ApiParam[];
  apiKey?: string;
  authHeader?: string;
  bearerToken?: string;
  oauth?: IOAuth;
  platformType?: "web" | "mobile" | "both";
  audience?: "customer" | "admin" | "both";
  webCheckoutUrl?: string;
  mobileDeepLink?: string;
  apiSchema?: Record<string, unknown>;
  inputFieldMap?: any[];
  outputFieldMap?: any[];
  fallbackWidget?: string;
  mcpResourceUri?: string;
  testedonregister?: boolean;
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
  latestWidgetSnapshot?: McpToolResultPayload | null;
  latestWidgetSnapshotUpdatedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
