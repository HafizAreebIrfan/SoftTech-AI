import crypto from "crypto";

export interface BuildAuthorizationUrlOptions {
  authorizationUrl: string;
  clientId: string;
  redirectUri: string;
  state: string;
  codeChallenge: string;
  scopes?: string[];
}

/**
 * Generates a cryptographically random single-use state string.
 */
export const generateState = (): string => {
  return crypto.randomBytes(32).toString("hex");
};

/**
 * Generates a cryptographically random PKCE code verifier (URL-safe base64).
 */
export const generateCodeVerifier = (): string => {
  return crypto.randomBytes(32).toString("base64url");
};

/**
 * Generates a PKCE S256 code challenge from a code verifier.
 */
export const generateCodeChallenge = (codeVerifier: string): string => {
  return crypto
    .createHash("sha256")
    .update(codeVerifier, "utf-8")
    .digest("base64url");
};

/**
 * Builds a clean, fully-encoded authorization URL with PKCE S256 parameters.
 */
export const buildAuthorizationUrl = (
  options: BuildAuthorizationUrlOptions,
): string => {
  const {
    authorizationUrl,
    clientId,
    redirectUri,
    state,
    codeChallenge,
    scopes,
  } = options;

  if (!authorizationUrl || !authorizationUrl.trim()) {
    throw new Error("Authorization URL is required.");
  }

  const url = new URL(authorizationUrl.trim());

  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", clientId.trim());
  url.searchParams.set("redirect_uri", redirectUri.trim());
  url.searchParams.set("state", state.trim());
  url.searchParams.set("code_challenge", codeChallenge.trim());
  url.searchParams.set("code_challenge_method", "S256");

  if (Array.isArray(scopes) && scopes.length > 0) {
    const scopeString = scopes.map((s) => s.trim()).filter(Boolean).join(" ");
    if (scopeString) {
      url.searchParams.set("scope", scopeString);
    }
  }

  return url.toString();
};

export const OAuthPkceService = {
  generateState,
  generateCodeVerifier,
  generateCodeChallenge,
  buildAuthorizationUrl,
};
