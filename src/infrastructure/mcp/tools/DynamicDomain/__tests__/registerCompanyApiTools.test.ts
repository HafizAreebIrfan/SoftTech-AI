import test, { beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  registerCompanyApiTools,
  normalizeAuthType,
} from "../registercompanyapitools";
import { OAuthTokenService } from "../../../../../application/services/oauth/OAuthTokenService";
import { ICompany } from "../../../../../domain/types/company.types";

test("registerCompanyApiTools & OAuth Integration Tests", async (t) => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    OAuthTokenService.clearCache();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    OAuthTokenService.clearCache();
  });

  await t.test("1. normalizeAuthType correctly handles all format variations", () => {
    const oauthVariations = [
      "oauth",
      "OAuth",
      "OAUTH",
      "oauth2",
      "OAuth2",
      "OAUTH2",
      "oauth 2.0",
      "OAuth 2.0",
      "OAUTH 2.0",
      "oauth2.0",
    ];

    for (const variant of oauthVariations) {
      assert.equal(
        normalizeAuthType(variant),
        "OAUTH",
        `Expected ${variant} to normalize to OAUTH`,
      );
    }

    assert.equal(normalizeAuthType("bearer"), "BEARER");
    assert.equal(normalizeAuthType("BEARER TOKEN"), "BEARER");
    assert.equal(normalizeAuthType("api_key"), "API_KEY");
    assert.equal(normalizeAuthType("API KEY"), "API_KEY");
    assert.equal(normalizeAuthType(""), "NONE");
    assert.equal(normalizeAuthType(undefined), "NONE");
  });

  await t.test("2. Tool annotations set readOnlyHint and destructiveHint based on HTTP method", () => {
    const registeredTools: any[] = [];

    const mockServer: any = {
      registerTool: (name: string, config: any, cb: any) => {
        registeredTools.push({ name, config, cb });
      },
    };

    const company: ICompany = {
      companyName: "Acme Corp",
      industry: "Retail",
      email: "info@acme.com",
      apis: [
        {
          name: "Get Products",
          baseUrl: "https://api.acme.com",
          endpoint: "/products",
          method: "GET",
        },
        {
          name: "Create Order",
          baseUrl: "https://api.acme.com",
          endpoint: "/orders",
          method: "POST",
        },
        {
          name: "Delete Item",
          baseUrl: "https://api.acme.com",
          endpoint: "/items/{id}",
          method: "DELETE",
        },
      ],
    };

    registerCompanyApiTools(mockServer, company);

    assert.equal(registeredTools.length, 3);

    // GET tool
    assert.equal(registeredTools[0].config.annotations?.readOnlyHint, true);
    assert.equal(registeredTools[0].config.annotations?.destructiveHint, false);

    // POST tool
    assert.equal(registeredTools[1].config.annotations?.readOnlyHint, false);
    assert.equal(registeredTools[1].config.annotations?.destructiveHint, false);

    // DELETE tool
    assert.equal(registeredTools[2].config.annotations?.readOnlyHint, false);
    assert.equal(registeredTools[2].config.annotations?.destructiveHint, true);
  });

  await t.test("3. Successfully executes OAuth API call with Bearer access token", async () => {
    let oauthTokenRequestCount = 0;
    let apiCallRequestCount = 0;
    let capturedAuthorizationHeader = "";

    globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
      const urlStr = String(url);

      if (urlStr === "https://auth.acme.com/oauth/token") {
        oauthTokenRequestCount++;
        return new Response(
          JSON.stringify({
            access_token: "acme_secret_access_token_999",
            token_type: "Bearer",
            expires_in: 3600,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      if (urlStr === "https://api.acme.com/orders") {
        apiCallRequestCount++;
        capturedAuthorizationHeader =
          (init?.headers as Record<string, string>)?.["Authorization"] || "";
        return new Response(
          JSON.stringify({
            orders: [{ id: "ord_1", total: 100 }],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      return new Response("Not Found", { status: 404 });
    }) as typeof fetch;

    const registeredTools: any[] = [];

    const mockServer: any = {
      registerTool: (name: string, config: any, cb: any) => {
        registeredTools.push({ name, config, cb });
      },
    };

    const company: ICompany = {
      companyName: "Acme Corp",
      industry: "Retail",
      email: "info@acme.com",
      apis: [
        {
          name: "Get Orders",
          baseUrl: "https://api.acme.com",
          endpoint: "/orders",
          method: "GET",
          authType: "OAuth 2.0",
          oauth: {
            tokenUrl: "https://auth.acme.com/oauth/token",
            clientId: "acme_client_id",
            clientSecret: "acme_client_secret_xyz",
          },
        },
      ],
    };

    registerCompanyApiTools(mockServer, company);

    assert.equal(registeredTools.length, 1);

    const result = await registeredTools[0].cb({});

    assert.equal(oauthTokenRequestCount, 1);
    assert.equal(apiCallRequestCount, 1);
    assert.equal(
      capturedAuthorizationHeader,
      "Bearer acme_secret_access_token_999",
    );

    // Verify secrets are NOT exposed in result or metadata
    const resultStr = JSON.stringify(result);
    assert.doesNotMatch(resultStr, /acme_client_secret_xyz/);
    assert.doesNotMatch(resultStr, /acme_secret_access_token_999/);
    assert.equal(result._meta.company, "Acme Corp");
  });

  await t.test("4. HTTP 401 on OAuth API causes exactly ONE token refresh and retry", async () => {
    let tokenRequests = 0;
    let apiRequests = 0;

    globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
      const urlStr = String(url);

      if (urlStr === "https://auth.acme.com/oauth/token") {
        tokenRequests++;
        return new Response(
          JSON.stringify({
            access_token: `token_v${tokenRequests}`,
            token_type: "Bearer",
            expires_in: 3600,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      if (urlStr === "https://api.acme.com/data") {
        apiRequests++;
        const authHeader = (init?.headers as Record<string, string>)?.[
          "Authorization"
        ];

        if (apiRequests === 1) {
          assert.equal(authHeader, "Bearer token_v1");
          return new Response("Unauthorized", { status: 401 });
        }

        assert.equal(authHeader, "Bearer token_v2");
        return new Response(JSON.stringify({ status: "success" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response("Not Found", { status: 404 });
    }) as typeof fetch;

    const registeredTools: any[] = [];
    const mockServer: any = {
      registerTool: (name: string, config: any, cb: any) => {
        registeredTools.push({ name, config, cb });
      },
    };

    const company: ICompany = {
      companyName: "Acme Corp",
      industry: "Retail",
      email: "info@acme.com",
      apis: [
        {
          name: "Retryable API",
          baseUrl: "https://api.acme.com",
          endpoint: "/data",
          method: "GET",
          authType: "oauth2",
          oauth: {
            tokenUrl: "https://auth.acme.com/oauth/token",
            clientId: "acme_client",
            clientSecret: "acme_secret",
          },
        },
      ],
    };

    registerCompanyApiTools(mockServer, company);

    const result = await registeredTools[0].cb({});

    assert.equal(tokenRequests, 2);
    assert.equal(apiRequests, 2);
    assert.equal(result.structuredContent.title, "Retryable API");
  });

  await t.test("5. Static API-Key and Bearer APIs continue working cleanly", async () => {
    let capturedHeaders: Record<string, string> = {};

    globalThis.fetch = (async (_url: string | URL | Request, init?: RequestInit) => {
      capturedHeaders = (init?.headers as Record<string, string>) || {};
      return new Response(JSON.stringify({ data: "ok" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }) as typeof fetch;

    const registeredTools: any[] = [];
    const mockServer: any = {
      registerTool: (name: string, config: any, cb: any) => {
        registeredTools.push({ name, config, cb });
      },
    };

    const company: ICompany = {
      companyName: "Acme Corp",
      industry: "Retail",
      email: "info@acme.com",
      apis: [
        {
          name: "API Key API",
          baseUrl: "https://api.acme.com",
          endpoint: "/key-data",
          method: "GET",
          authType: "API_KEY",
          apiKey: "my_api_key_777",
          authHeader: "X-Custom-Key",
        },
      ],
    };

    registerCompanyApiTools(mockServer, company);

    await registeredTools[0].cb({});

    assert.equal(capturedHeaders["X-Custom-Key"], "my_api_key_777");
  });
});
