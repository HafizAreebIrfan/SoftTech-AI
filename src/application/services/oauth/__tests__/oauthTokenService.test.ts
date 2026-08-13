import test, { beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { OAuthTokenService } from "../OAuthTokenService";

test("OAuthTokenService Unit Tests", async (t) => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    OAuthTokenService.clearCache();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    OAuthTokenService.clearCache();
  });

  await t.test("1. Missing OAuth configuration throws sanitized error", async () => {
    await assert.rejects(
      async () => {
        await OAuthTokenService.getAccessToken(undefined, false, "Test API");
      },
      (err: any) => {
        assert.match(
          err.message,
          /OAuth authentication is configured for "Test API", but OAuth credentials are missing/,
        );
        return true;
      },
    );
  });

  await t.test("2. Incomplete credentials (missing clientSecret) throws sanitized error", async () => {
    await assert.rejects(
      async () => {
        await OAuthTokenService.getAccessToken(
          {
            tokenUrl: "https://auth.example.com/oauth/token",
            clientId: "my_client_id",
          },
          false,
          "Orders API",
        );
      },
      (err: any) => {
        assert.match(
          err.message,
          /OAuth authentication is configured for "Orders API", but clientSecret is missing/,
        );
        return true;
      },
    );
  });

  await t.test("3. Successfully requests and returns OAuth access token", async () => {
    let capturedUrl = "";
    let capturedHeaders: Record<string, string> = {};
    let capturedBody = "";

    globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
      capturedUrl = String(url);
      capturedHeaders = (init?.headers as Record<string, string>) || {};
      capturedBody = String(init?.body || "");

      return new Response(
        JSON.stringify({
          access_token: "mock_access_token_123",
          token_type: "Bearer",
          expires_in: 3600,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }) as typeof fetch;

    const token = await OAuthTokenService.getAccessToken(
      {
        tokenUrl: "https://auth.example.com/oauth/token",
        clientId: "client_id_123",
        clientSecret: "secret_456",
      },
      false,
      "Test API",
    );

    assert.equal(token, "mock_access_token_123");
    assert.equal(capturedUrl, "https://auth.example.com/oauth/token");
    assert.equal(
      capturedHeaders["Content-Type"],
      "application/x-www-form-urlencoded",
    );
    const expectedBasic = Buffer.from("client_id_123:secret_456").toString(
      "base64",
    );
    assert.equal(capturedHeaders["Authorization"], `Basic ${expectedBasic}`);
    assert.equal(capturedBody, "grant_type=client_credentials");
  });

  await t.test("4. Caches token and reuses before expiry without re-fetching", async () => {
    let fetchCount = 0;

    globalThis.fetch = (async () => {
      fetchCount++;
      return new Response(
        JSON.stringify({
          access_token: `token_${fetchCount}`,
          token_type: "Bearer",
          expires_in: 3600,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }) as typeof fetch;

    const oauthConfig = {
      tokenUrl: "https://auth.example.com/oauth/token",
      clientId: "client_id_reuse",
      clientSecret: "secret_789",
    };

    const firstToken = await OAuthTokenService.getAccessToken(oauthConfig);
    assert.equal(firstToken, "token_1");
    assert.equal(fetchCount, 1);

    const secondToken = await OAuthTokenService.getAccessToken(oauthConfig);
    assert.equal(secondToken, "token_1");
    assert.equal(fetchCount, 1);
  });

  await t.test("5. Refreshes token when forceRefresh is true or invalidated", async () => {
    let fetchCount = 0;

    globalThis.fetch = (async () => {
      fetchCount++;
      return new Response(
        JSON.stringify({
          access_token: `token_${fetchCount}`,
          token_type: "Bearer",
          expires_in: 3600,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }) as typeof fetch;

    const oauthConfig = {
      tokenUrl: "https://auth.example.com/oauth/token",
      clientId: "client_id_refresh",
      clientSecret: "secret_refresh",
    };

    const firstToken = await OAuthTokenService.getAccessToken(oauthConfig);
    assert.equal(firstToken, "token_1");

    OAuthTokenService.invalidateToken(
      oauthConfig.tokenUrl,
      oauthConfig.clientId,
    );

    const refreshedToken = await OAuthTokenService.getAccessToken(oauthConfig);
    assert.equal(refreshedToken, "token_2");
    assert.equal(fetchCount, 2);
  });

  await t.test("6. Token endpoint 400 error returns sanitized error without secrets", async () => {
    globalThis.fetch = (async () => {
      return new Response(
        JSON.stringify({
          error: "invalid_client",
          error_description: "Client authentication failed",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }) as typeof fetch;

    await assert.rejects(
      async () => {
        await OAuthTokenService.getAccessToken({
          tokenUrl: "https://auth.example.com/oauth/token",
          clientId: "my_client",
          clientSecret: "super_secret_password_123",
        });
      },
      (err: any) => {
        assert.match(
          err.message,
          /OAuth token request for "API" failed with status 400/,
        );
        assert.doesNotMatch(err.message, /super_secret_password_123/);
        return true;
      },
    );
  });

  await t.test("7. Token endpoint returning malformed response throws sanitized error", async () => {
    globalThis.fetch = (async () => {
      return new Response("Not JSON content", {
        status: 200,
        headers: { "Content-Type": "text/html" },
      });
    }) as typeof fetch;

    await assert.rejects(
      async () => {
        await OAuthTokenService.getAccessToken({
          tokenUrl: "https://auth.example.com/oauth/token",
          clientId: "my_client",
          clientSecret: "my_secret",
        });
      },
      (err: any) => {
        assert.match(
          err.message,
          /OAuth token request for "API" returned malformed response/,
        );
        return true;
      },
    );
  });
});
