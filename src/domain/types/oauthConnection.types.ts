export type NormalizedAuthType =
  | "BEARER"
  | "API_KEY"
  | "OAUTH"
  | "OAUTH_USER"
  | "NONE";

export interface IUserAuthRequiredNotice {
  isAuthRequired: true;
  companyId: string;
  apiId: string;
  connectUrl: string;
  message: string;
}

export interface IOAuthConnection {
  _id?: string;
  companyId: string;
  apiId: string;
  userId: string;
  accessToken: string;
  refreshToken?: string | null;
  tokenType?: string;
  expiresAt?: Date | null;
  scopes?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IOAuthTransaction {
  _id?: string;
  state: string;
  companyId: string;
  apiId: string;
  userId: string;
  codeVerifier: string;
  redirectUri: string;
  expiresAt: Date;
  createdAt?: Date;
}
