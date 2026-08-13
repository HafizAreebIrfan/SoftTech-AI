import { IOAuth } from "../../../domain/types/company.types";
import { IOAuthConnection } from "../../../domain/types/oauthConnection.types";
import {
  findUserConnection,
  saveUserConnection,
} from "../../../adapters/persistence/mongo/oauth/oauthConnectionRepository";

export interface TokenCacheEntry {
  accessToken: string;
  tokenType: string;
  expiresAt: number;
}

export interface ExchangeCodeOptions {
  tokenUrl: string;
  clientId: string;
  clientSecret?: string;
  code: string;
  redirectUri: string;
  codeVerifier: string;
  companyId: string;
  apiId: string;
  userId: string;
}

export interface GetUserAccessTokenOptions {
  companyId: string;
  apiId: string;
  userId: string;
  oauth?: IOAuth;
  forceRefresh?: boolean;
}

const tokenCache: Map<string, TokenCacheEntry> = new Map();
const SAFETY_BUFFER_MS = 60 * 1000; // 60 seconds

/**
 * Generates a cache key based strictly on tokenUrl and clientId.
 * Never uses clientSecret directly as a cache key.
 */
const getCacheKey = (tokenUrl: string, clientId: string): string => {
  return `${tokenUrl.trim()}::${clientId.trim()}`;
};

/**
 * Validates that the OAuth configuration contains all required parameters.
 */
export const validateConfig = (oauth?: IOAuth, apiName?: string): void => {
  const name = apiName || "API";

  if (!oauth) {
    throw new Error(
      `OAuth authentication is configured for "${name}", but OAuth credentials are missing.`,
    );
  }

  const { tokenUrl, clientId, clientSecret } = oauth;

  if (!tokenUrl || !String(tokenUrl).trim()) {
    throw new Error(
      `OAuth authentication is configured for "${name}", but tokenUrl is missing.`,
    );
  }

  try {
    new URL(tokenUrl.trim());
  } catch {
    throw new Error(
      `OAuth authentication is configured for "${name}", but tokenUrl is invalid.`,
    );
  }

  if (!clientId || !String(clientId).trim()) {
    throw new Error(
      `OAuth authentication is configured for "${name}", but clientId is missing.`,
    );
  }

  if (!clientSecret || !String(clientSecret).trim()) {
    throw new Error(
      `OAuth authentication is configured for "${name}", but clientSecret is missing.`,
    );
  }
};

/**
 * Performs the HTTP request to obtain a client_credentials token.
 */
const requestNewToken = async (
  tokenUrl: string,
  clientId: string,
  clientSecret: string,
  apiName?: string,
): Promise<TokenCacheEntry> => {
  const name = apiName || "API";
  const credentials = Buffer.from(
    `${clientId}:${clientSecret}`,
    "utf-8",
  ).toString("base64");

  const bodyParams = new URLSearchParams({
    grant_type: "client_credentials",
  });

  let response: Response;

  try {
    response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${credentials}`,
        Accept: "application/json",
      },
      body: bodyParams.toString(),
    });
  } catch (error: any) {
    throw new Error(
      `OAuth token request failed for "${name}": ${error?.message || "Token endpoint unavailable."}`,
    );
  }

  const responseText = await response.text();

  if (!response.ok) {
    throw new Error(
      `OAuth token request for "${name}" failed with status ${response.status}.`,
    );
  }

  let data: any;

  try {
    data = JSON.parse(responseText);
  } catch {
    throw new Error(
      `OAuth token request for "${name}" returned malformed response.`,
    );
  }

  if (!data || typeof data !== "object" || !data.access_token) {
    throw new Error(
      `OAuth token response for "${name}" is missing access_token.`,
    );
  }

  const accessToken = String(data.access_token).trim();
  const tokenType = String(data.token_type || "Bearer").trim();
  const expiresInSeconds =
    typeof data.expires_in === "number" && data.expires_in > 0
      ? data.expires_in
      : 3600;

  const expiresAt = Date.now() + expiresInSeconds * 1000;

  return {
    accessToken,
    tokenType,
    expiresAt,
  };
};

/**
 * Retrieves a client_credentials access token, utilizing in-memory cache when valid.
 */
export const getAccessToken = async (
  oauth?: IOAuth,
  forceRefresh = false,
  apiName?: string,
): Promise<string> => {
  validateConfig(oauth, apiName);

  const tokenUrl = oauth!.tokenUrl!.trim();
  const clientId = oauth!.clientId!.trim();
  const clientSecret = oauth!.clientSecret!.trim();
  const cacheKey = getCacheKey(tokenUrl, clientId);

  if (!forceRefresh) {
    const cached = tokenCache.get(cacheKey);
    const now = Date.now();

    if (cached && cached.expiresAt > now + SAFETY_BUFFER_MS) {
      return cached.accessToken;
    }
  }

  const tokenEntry = await requestNewToken(
    tokenUrl,
    clientId,
    clientSecret,
    apiName,
  );

  tokenCache.set(cacheKey, tokenEntry);

  return tokenEntry.accessToken;
};

/**
 * Invalidates a cached client_credentials token.
 */
export const invalidateToken = (
  tokenUrl?: string,
  clientId?: string,
): void => {
  if (tokenUrl && clientId) {
    const cacheKey = getCacheKey(tokenUrl, clientId);
    tokenCache.delete(cacheKey);
  }
};

/**
 * Clears the entire in-memory token cache (primarily for testing).
 */
export const clearCache = (): void => {
  tokenCache.clear();
};

/**
 * Exchanges an authorization code at tokenUrl using PKCE code_verifier.
 * Persists the resulting IOAuthConnection record in MongoDB.
 */
export const exchangeAuthorizationCode = async (
  options: ExchangeCodeOptions,
): Promise<IOAuthConnection> => {
  const {
    tokenUrl,
    clientId,
    clientSecret,
    code,
    redirectUri,
    codeVerifier,
    companyId,
    apiId,
    userId,
  } = options;

  if (!tokenUrl || !clientId || !code || !redirectUri || !codeVerifier) {
    throw new Error("Missing required parameters for OAuth code exchange.");
  }

  const bodyParams = new URLSearchParams({
    grant_type: "authorization_code",
    code: code.trim(),
    redirect_uri: redirectUri.trim(),
    client_id: clientId.trim(),
    code_verifier: codeVerifier.trim(),
  });

  if (clientSecret && clientSecret.trim()) {
    bodyParams.set("client_secret", clientSecret.trim());
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/x-www-form-urlencoded",
    Accept: "application/json",
  };

  if (clientSecret && clientSecret.trim()) {
    const credentials = Buffer.from(
      `${clientId.trim()}:${clientSecret.trim()}`,
      "utf-8",
    ).toString("base64");
    headers.Authorization = `Basic ${credentials}`;
  }

  let response: Response;
  try {
    response = await fetch(tokenUrl.trim(), {
      method: "POST",
      headers,
      body: bodyParams.toString(),
    });
  } catch (error: any) {
    throw new Error(
      `OAuth code exchange failed: ${error?.message || "Token endpoint unavailable."}`,
    );
  }

  const responseText = await response.text();

  if (!response.ok) {
    throw new Error(
      `OAuth code exchange failed with status ${response.status}.`,
    );
  }

  let data: any;
  try {
    data = JSON.parse(responseText);
  } catch {
    throw new Error("OAuth token response is malformed JSON.");
  }

  if (!data || typeof data !== "object" || !data.access_token) {
    throw new Error("OAuth token response is missing access_token.");
  }

  const accessToken = String(data.access_token).trim();
  const refreshToken = data.refresh_token ? String(data.refresh_token).trim() : null;
  const tokenType = String(data.token_type || "Bearer").trim();
  const expiresInSeconds =
    typeof data.expires_in === "number" && data.expires_in > 0
      ? data.expires_in
      : 3600;

  const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);

  const connection: IOAuthConnection = {
    companyId,
    apiId,
    userId,
    accessToken,
    refreshToken,
    tokenType,
    expiresAt,
    scopes: data.scope ? String(data.scope).split(" ") : [],
  };

  return await saveUserConnection(connection);
};

/**
 * Performs refresh_token grant request and updates saved connection.
 */
export const refreshUserAccessToken = async (
  connection: IOAuthConnection,
  oauth: IOAuth,
): Promise<IOAuthConnection> => {
  if (!connection.refreshToken) {
    throw new Error("No refresh_token available for connection.");
  }

  const tokenUrl = oauth.tokenUrl!.trim();
  const clientId = oauth.clientId!.trim();

  const bodyParams = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: connection.refreshToken,
    client_id: clientId,
  });

  if (oauth.clientSecret) {
    bodyParams.set("client_secret", oauth.clientSecret.trim());
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/x-www-form-urlencoded",
    Accept: "application/json",
  };

  if (oauth.clientSecret) {
    const credentials = Buffer.from(
      `${clientId}:${oauth.clientSecret.trim()}`,
      "utf-8",
    ).toString("base64");
    headers.Authorization = `Basic ${credentials}`;
  }

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers,
    body: bodyParams.toString(),
  });

  if (!response.ok) {
    throw new Error(`Token refresh failed with status ${response.status}`);
  }

  const data = await response.json();

  if (!data || typeof data !== "object" || !data.access_token) {
    throw new Error("Token refresh response missing access_token");
  }

  const updatedConnection: IOAuthConnection = {
    ...connection,
    accessToken: String(data.access_token).trim(),
    refreshToken: data.refresh_token
      ? String(data.refresh_token).trim()
      : connection.refreshToken,
    tokenType: String(data.token_type || connection.tokenType || "Bearer").trim(),
    expiresAt: new Date(
      Date.now() + (Number(data.expires_in) || 3600) * 1000,
    ),
  };

  return await saveUserConnection(updatedConnection);
};

/**
 * Retrieves a valid user access token from OAuthConnection.
 * Auto-refreshes using refresh_token if expired or forceRefresh is requested.
 */
export const getUserAccessToken = async (
  options: GetUserAccessTokenOptions,
): Promise<string | null> => {
  const { companyId, apiId, userId, oauth, forceRefresh } = options;

  if (!companyId || !apiId || !userId) {
    return null;
  }

  const connection = await findUserConnection(companyId, apiId, userId);

  if (!connection || !connection.accessToken) {
    return null;
  }

  const now = Date.now();
  const isExpired =
    connection.expiresAt &&
    new Date(connection.expiresAt).getTime() <= now + SAFETY_BUFFER_MS;

  if (!forceRefresh && !isExpired) {
    return connection.accessToken;
  }

  if (connection.refreshToken && oauth?.tokenUrl && oauth?.clientId) {
    try {
      const refreshedConnection = await refreshUserAccessToken(
        connection,
        oauth,
      );
      return refreshedConnection.accessToken;
    } catch {
      if (isExpired) {
        return null;
      }
      return connection.accessToken;
    }
  }

  if (isExpired) {
    return null;
  }

  return connection.accessToken;
};

export const OAuthTokenService = {
  getAccessToken,
  validateConfig,
  invalidateToken,
  clearCache,
  exchangeAuthorizationCode,
  getUserAccessToken,
  refreshUserAccessToken,
};
