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
