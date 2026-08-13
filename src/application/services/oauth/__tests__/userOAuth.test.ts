import test, { beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  generateState,
  generateCodeVerifier,
  generateCodeChallenge,
  buildAuthorizationUrl,
} from "../OAuthPkceService";
import {
  exchangeAuthorizationCode,
  refreshUserAccessToken,
  clearCache,
} from "../OAuthTokenService";

test("User OAuth 2.0 PKCE & Authorization Code Flow Tests", async (t) => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    clearCache();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    clearCache();
  });

  await t.test("1. Generates valid PKCE state, code_verifier, and S256 code_challenge", () => {
    const state = generateState();
    const verifier = generateCodeVerifier();
    const challenge = generateCodeChallenge(verifier);

    assert.equal(typeof state, "string");
    assert.equal(state.length, 64);

    assert.equal(typeof verifier, "string");
    assert.ok(verifier.length >= 43);

    assert.equal(typeof challenge, "string");
    assert.ok(challenge.length >= 43);

    const challenge2 = generateCodeChallenge(verifier);
    assert.equal(challenge, challenge2);
  });

  await t.test("2. Builds authorization URL with safe URL parameters and PKCE S256 method", () => {
    const url = buildAuthorizationUrl({
      authorizationUrl: "https://auth.company.com/oauth/authorize",
      clientId: "client_abc_123",
      redirectUri: "https://softtech-ai.onrender.com/api/oauth/callback",
      state: "state_xyz",
      codeChallenge: "challenge_456",
      scopes: ["orders:read", "profile"],
    });

    const parsed = new URL(url);
    assert.equal(parsed.hostname, "auth.company.com");
    assert.equal(parsed.pathname, "/oauth/authorize");
    assert.equal(parsed.searchParams.get("response_type"), "code");
    assert.equal(parsed.searchParams.get("client_id"), "client_abc_123");
    assert.equal(
      parsed.searchParams.get("redirect_uri"),
      "https://softtech-ai.onrender.com/api/oauth/callback",
    );
    assert.equal(parsed.searchParams.get("state"), "state_xyz");
    assert.equal(parsed.searchParams.get("code_challenge"), "challenge_456");
    assert.equal(parsed.searchParams.get("code_challenge_method"), "S256");
    assert.equal(parsed.searchParams.get("scope"), "orders:read profile");
  });

  await t.test("3. Exchanges authorization code using PKCE code_verifier", async () => {
    let capturedBody = "";
    let capturedHeaders: Record<string, string> = {};

    globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
      if (String(url) === "https://auth.company.com/oauth/token") {
        capturedBody = String(init?.body || "");
        capturedHeaders = (init?.headers as Record<string, string>) || {};
        return new Response(
          JSON.stringify({
            access_token: "user_access_token_111",
            refresh_token: "user_refresh_token_222",
            token_type: "Bearer",
            expires_in: 3600,
            scope: "read write",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }
      return new Response("Not Found", { status: 404 });
    }) as typeof fetch;

    // Mock connection save to bypass database dependency in unit test
    const mockRepo = require("../../../../adapters/persistence/mongo/oauth/oauthConnectionRepository");
    const saveOriginal = mockRepo.saveUserConnection;
    let savedConnection: any = null;

    try {
      mockRepo.saveUserConnection = async (conn: any) => {
        savedConnection = conn;
        return conn;
      };
      if (mockRepo.OAuthConnectionRepository) {
        mockRepo.OAuthConnectionRepository.saveUserConnection = mockRepo.saveUserConnection;
      }

      const result = await exchangeAuthorizationCode({
        tokenUrl: "https://auth.company.com/oauth/token",
        clientId: "client_123",
        clientSecret: "secret_456",
        code: "auth_code_789",
        redirectUri: "https://softtech-ai.onrender.com/api/oauth/callback",
        codeVerifier: "my_code_verifier",
        companyId: "comp_1",
        apiId: "api_1",
        userId: "user_1",
      });

      assert.equal(result.accessToken, "user_access_token_111");
      assert.equal(result.refreshToken, "user_refresh_token_222");
      assert.equal(savedConnection.userId, "user_1");

      const params = new URLSearchParams(capturedBody);
      assert.equal(params.get("grant_type"), "authorization_code");
      assert.equal(params.get("code"), "auth_code_789");
      assert.equal(params.get("code_verifier"), "my_code_verifier");
      assert.equal(
        capturedHeaders["Content-Type"],
        "application/x-www-form-urlencoded",
      );
    } finally {
      if (saveOriginal) mockRepo.saveUserConnection = saveOriginal;
    }
  });

  await t.test("4. Refreshes expired user access token via refresh_token", async () => {
    let capturedBody = "";

    globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
      if (String(url) === "https://auth.company.com/oauth/token") {
        capturedBody = String(init?.body || "");
        return new Response(
          JSON.stringify({
            access_token: "new_refreshed_access_token_333",
            refresh_token: "new_refreshed_refresh_token_444",
            expires_in: 3600,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }
      return new Response("Not Found", { status: 404 });
    }) as typeof fetch;

    const mockRepo = require("../../../../adapters/persistence/mongo/oauth/oauthConnectionRepository");
    mockRepo.saveUserConnection = async (conn: any) => conn;
    if (mockRepo.OAuthConnectionRepository) {
      mockRepo.OAuthConnectionRepository.saveUserConnection = mockRepo.saveUserConnection;
    }

    const refreshed = await refreshUserAccessToken(
      {
        companyId: "comp_1",
        apiId: "api_1",
        userId: "user_1",
        accessToken: "old_expired_access_token",
        refreshToken: "old_refresh_token_555",
      },
      {
        tokenUrl: "https://auth.company.com/oauth/token",
        clientId: "client_123",
        clientSecret: "secret_456",
      },
    );

    assert.equal(refreshed.accessToken, "new_refreshed_access_token_333");
    assert.equal(refreshed.refreshToken, "new_refreshed_refresh_token_444");

    const params = new URLSearchParams(capturedBody);
    assert.equal(params.get("grant_type"), "refresh_token");
    assert.equal(params.get("refresh_token"), "old_refresh_token_555");
  });
});
