import { Request, Response, NextFunction } from "express";
import { CompanyModel } from "../../../persistence/models/companies/register/companyinfo";
import {
  generateState,
  generateCodeVerifier,
  generateCodeChallenge,
  buildAuthorizationUrl,
} from "../../../../application/services/oauth/OAuthPkceService";
import {
  createTransaction,
  consumeTransaction,
} from "../../../persistence/mongo/oauth/oauthConnectionRepository";
import { exchangeAuthorizationCode } from "../../../../application/services/oauth/OAuthTokenService";
import { env } from "../../../../infrastructure/config/env";
import { resolveMcpUserId } from "../../middlewares/mcpUserAuthMiddleware";

const TRANSACTION_TTL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Initiates the User OAuth 2.0 Authorization Code + PKCE flow.
 * GET /api/oauth/authorize?companyId=...&apiId=...
 */
export async function initiateUserOAuthController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const companyId = String(req.query.companyId || req.query.company_id || "").trim();
    const apiId = String(req.query.apiId || req.query.api_id || "").trim();
    const userId = resolveMcpUserId(req);

    if (!companyId || !apiId) {
      res.status(400).json({
        success: false,
        message: "Missing required query parameters: companyId and apiId are required.",
      });
      return;
    }

    const company = await CompanyModel.findById(companyId).lean();

    if (!company) {
      res.status(404).json({
        success: false,
        message: "Registered company not found.",
      });
      return;
    }

    const apis = (company as any).apis ?? [];
    const api = apis.find(
      (a: any, idx: number) =>
        String(a._id || "") === apiId ||
        String(a.name || "") === apiId ||
        `api_${idx + 1}` === apiId,
    );

    if (!api) {
      res.status(404).json({
        success: false,
        message: `API "${apiId}" not found for company "${company.companyName}".`,
      });
      return;
    }

    const oauth = api.oauth;

    if (!oauth || !oauth.authorizationUrl || !oauth.clientId || !oauth.tokenUrl) {
      res.status(400).json({
        success: false,
        message: `OAuth configuration for API "${api.name || apiId}" is incomplete.`,
      });
      return;
    }

    const state = generateState();
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);
    const redirectUri = env.OAUTH_CALLBACK_URL;
    const expiresAt = new Date(Date.now() + TRANSACTION_TTL_MS);

    await createTransaction({
      state,
      companyId: String((company as any)._id),
      apiId,
      userId,
      codeVerifier,
      redirectUri,
      expiresAt,
    });

    const targetUrl = buildAuthorizationUrl({
      authorizationUrl: oauth.authorizationUrl,
      clientId: oauth.clientId,
      redirectUri,
      state,
      codeChallenge,
      scopes: Array.isArray(oauth.scopes)
        ? oauth.scopes
        : typeof oauth.scope === "string"
          ? oauth.scope.split(" ")
          : [],
    });

    res.redirect(targetUrl);
  } catch (error) {
    next(error);
  }
}

/**
 * Handles the OAuth authorization callback from the company's OAuth provider.
 * GET /api/oauth/callback?code=...&state=...
 */
export async function handleOAuthCallbackController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const code = String(req.query.code || "").trim();
    const state = String(req.query.state || "").trim();
    const oauthError = req.query.error;

    if (oauthError) {
      const desc = req.query.error_description || "Authorization was declined.";
      res.status(400).send(`
        <!DOCTYPE html>
        <html>
          <head><title>Authorization Failed</title></head>
          <body style="font-family: system-ui, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
            <div style="text-align: center; max-width: 420px; padding: 2rem; background: #1e293b; border-radius: 12px;">
              <h2 style="color: #f87171;">Authorization Failed</h2>
              <p style="color: #94a3b8;">${String(desc)}</p>
            </div>
          </body>
        </html>
      `);
      return;
    }

    if (!state || !code) {
      res.status(400).send("Invalid callback request: missing code or state.");
      return;
    }

    const transaction = await consumeTransaction(state);

    if (!transaction) {
      res.status(400).send("Invalid or expired OAuth state. Please initiate authorization again.");
      return;
    }

    const company = await CompanyModel.findById(transaction.companyId).lean();

    if (!company) {
      res.status(404).send("Associated company not found.");
      return;
    }

    const apis = (company as any).apis ?? [];
    const api = apis.find(
      (a: any, idx: number) =>
        String(a._id || "") === transaction.apiId ||
        String(a.name || "") === transaction.apiId ||
        `api_${idx + 1}` === transaction.apiId,
    );

    if (!api || !api.oauth || !api.oauth.tokenUrl || !api.oauth.clientId) {
      res.status(400).send("API OAuth configuration unavailable.");
      return;
    }

    await exchangeAuthorizationCode({
      tokenUrl: api.oauth.tokenUrl,
      clientId: api.oauth.clientId,
      clientSecret: api.oauth.clientSecret,
      code,
      redirectUri: transaction.redirectUri,
      codeVerifier: transaction.codeVerifier,
      companyId: transaction.companyId,
      apiId: transaction.apiId,
      userId: transaction.userId,
    });

    res.status(200).send(`
      <!DOCTYPE html>
      <html>
        <head><title>Authorization Complete</title></head>
        <body style="font-family: system-ui, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
          <div style="text-align: center; max-width: 420px; padding: 2.5rem; background: #1e293b; border-radius: 12px; border: 1px solid #334155;">
            <div style="font-size: 3rem; margin-bottom: 1rem;">✅</div>
            <h2 style="color: #38bdf8; margin-top: 0;">Authorization Successful</h2>
            <p style="color: #94a3b8; line-height: 1.5;">Your account has been connected. You can now close this window and return to ChatGPT.</p>
          </div>
        </body>
      </html>
    `);
  } catch (error) {
    next(error);
  }
}
