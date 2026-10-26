import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../../config/env";
import { CompanyModel } from "../../../adapters/persistence/models/companies/register/companyinfo";

export const ACCESS_TOKEN_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds (604800s)
export const REFRESH_TOKEN_MAX_AGE = 60 * 24 * 60 * 60; // 60 days in seconds (5184000s)
export const maxAge = ACCESS_TOKEN_MAX_AGE;

const isProduction = process.env.NODE_ENV === "production";

export const authCookieOptions = {
  httpOnly: true,
  maxAge: ACCESS_TOKEN_MAX_AGE * 1000,
  secure: isProduction,
  sameSite: (isProduction ? "none" : "lax") as "none" | "lax",
  path: "/",
};

export const refreshCookieOptions = {
  httpOnly: true,
  maxAge: REFRESH_TOKEN_MAX_AGE * 1000,
  secure: isProduction,
  sameSite: (isProduction ? "none" : "lax") as "none" | "lax",
  path: "/",
};

export interface AuthenticatedUserPayload {
  id: string;
  role: string;
  email?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUserPayload;
}

export const createToken = (id: any, role: string = "company"): string => {
  return jwt.sign({ id, role, tokenType: "access" }, env.JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_MAX_AGE,
  });
};

export const createRefreshToken = (id: any, role: string = "company"): string => {
  return jwt.sign({ id, role, tokenType: "refresh" }, env.JWT_SECRET, {
    expiresIn: REFRESH_TOKEN_MAX_AGE,
  });
};

const extractToken = (req: Request): string | null => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7).trim();
  }
  if (req.cookies && req.cookies.jwt) {
    return req.cookies.jwt;
  }
  return null;
};

/**
 * Canonical onboarding state — every company doc always exposes the same
 * four fields (schema defaults + this normalizer):
 *   signupOnboardingStep       1=register APIs, 2=UI selection, 3=provisioned
 *   isSignupOnboardingDone     boolean
 *   dashboardOnboardingStep    1=MCP, 2=Plans, 3=Deploy (never 4)
 *   isDashboardOnboardingDone  boolean
 *
 * Migration of companies created before these fields existed:
 *   - Legacy `onboardingStep` (1 registered / 2 APIs / 3 UI selection) >= 3
 *     implies the signup onboarding was effectively finished.
 *   - A dashboardOnboardingStep of 4+ (written by the interim convention) is
 *     converted into isDashboardOnboardingDone=true with the step clamped
 *     to 3.
 * The patch is written back to the DB so it only ever runs once per doc.
 */
const applyOnboardingMigration = async (userObj: any): Promise<void> => {
  if (!userObj) return;
  const patch: Record<string, unknown> = {};

  // ── Signup onboarding ──────────────────────────────────────────────
  let signupDone: boolean | undefined = userObj.isSignupOnboardingDone;

  if (signupDone === undefined && Number(userObj.onboardingStep) >= 3) {
    signupDone = true;
    userObj.signupOnboardingStep = 3;
    patch.signupOnboardingStep = 3;
  }
  if (signupDone === undefined) {
    signupDone = false;
    patch.isSignupOnboardingDone = false;
  }
  if (userObj.signupOnboardingStep === undefined) {
    userObj.signupOnboardingStep = signupDone ? 3 : 1;
    patch.signupOnboardingStep = userObj.signupOnboardingStep;
  }
  if (userObj.isSignupOnboardingDone === undefined) {
    userObj.isSignupOnboardingDone = signupDone;
    patch.isSignupOnboardingDone = signupDone;
  }

  // ── Dashboard onboarding ───────────────────────────────────────────
  let dashboardDone = userObj.isDashboardOnboardingDone === true;
  const rawDashStep = Number(userObj.dashboardOnboardingStep);

  if (!dashboardDone && rawDashStep >= 4) {
    dashboardDone = true;
  }
  const dashStep = dashboardDone
    ? 3
    : Math.min(Math.max(Math.floor(rawDashStep) || 1, 1), 3);

  if (userObj.isDashboardOnboardingDone === undefined) {
    userObj.isDashboardOnboardingDone = dashboardDone;
    patch.isDashboardOnboardingDone = dashboardDone;
  }
  if (
    userObj.dashboardOnboardingStep === undefined ||
    userObj.dashboardOnboardingStep !== dashStep
  ) {
    userObj.dashboardOnboardingStep = dashStep;
    patch.dashboardOnboardingStep = dashStep;
  }

  // `onBoarding` mirrors "any onboarding pending" for admin stats.
  if (userObj.onBoarding !== !dashboardDone) {
    userObj.onBoarding = !dashboardDone;
    patch.onBoarding = !dashboardDone;
  }

  const id = userObj._id || userObj.id;
  if (Object.keys(patch).length > 0 && id) {
    try {
      // Best-effort — never block authentication on the migration.
      await CompanyModel.updateOne({ _id: id }, { $set: patch });
    } catch {
      // Ignore: the normalized object is still returned to the client.
    }
  }
};

export const GetrequireAuth = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<any> => {
  const token = extractToken(req);

  if (!token && !req.user) {
    return res
      .status(401)
      .json({ error: "Not Authenticated: No JWT token provided" });
  }

  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: "Not Authenticated" });
  }

  try {
    const user = await CompanyModel.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const userRole = (user as any).role || req.user?.role || "company";
    let activeToken = token;
    if (!activeToken) {
      activeToken = createToken(user._id, userRole);
      res.cookie("jwt", activeToken, authCookieOptions);
    }

    // Ensure refreshToken cookie exists
    if (!req.cookies?.refreshToken) {
      const refreshToken = createRefreshToken(user._id, userRole);
      res.cookie("refreshToken", refreshToken, refreshCookieOptions);
    }

    const userObj: any = user.toObject();
    delete userObj.password;
    delete userObj.passwordResetOTP;
    delete userObj.passwordResetOTPExpires;
    userObj.role = userRole;

    await applyOnboardingMigration(userObj);

    const currentRefreshToken = req.cookies?.refreshToken || (req.headers["x-refresh-token"] as string) || createRefreshToken(user._id, userRole);
    return res.status(200).json({ user: userObj, token: activeToken, refreshToken: currentRefreshToken });
  } catch (e: any) {
    return res.status(400).json({ error: e.message });
  }
};

export const PostrequireAuth = async (
  req: Request,
  res: Response,
): Promise<any> => {
  const { email, password } = req.body;
  try {
    const user = await CompanyModel.login(email, password);
    const userRole = (user as any).role || "company";
    const logintoken = createToken(user._id, userRole);
    const refreshToken = createRefreshToken(user._id, userRole);

    res.cookie("jwt", logintoken, authCookieOptions);
    res.cookie("refreshToken", refreshToken, refreshCookieOptions);

    const userObj: any = user.toObject();
    delete userObj.password;
    delete userObj.passwordResetOTP;
    delete userObj.passwordResetOTPExpires;
    userObj.role = userRole;

    await applyOnboardingMigration(userObj);

    return res.status(200).json({
      _id: user._id,
      token: logintoken,
      refreshToken,
      role: userRole,
      user: userObj,
    });
  } catch (e: any) {
    return res.status(400).json({ error: e.message, message: e.message });
  }
};

export const RefreshTokenHandler = async (
  req: Request,
  res: Response,
): Promise<any> => {
  const refreshToken =
    req.cookies?.refreshToken ||
    (req.headers["x-refresh-token"] as string) ||
    req.body?.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ success: false, error: "Refresh token missing" });
  }

  try {
    const decoded: any = jwt.verify(refreshToken, env.JWT_SECRET);
    const user = await CompanyModel.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    const userRole = (user as any).role || decoded.role || "company";
    const newAccessToken = createToken(user._id, userRole);
    const newRefreshToken = createRefreshToken(user._id, userRole);

    res.cookie("jwt", newAccessToken, authCookieOptions);
    res.cookie("refreshToken", newRefreshToken, refreshCookieOptions);

    const userObj: any = user.toObject();
    delete userObj.password;
    delete userObj.passwordResetOTP;
    delete userObj.passwordResetOTPExpires;
    userObj.role = userRole;

    await applyOnboardingMigration(userObj);

    return res.status(200).json({
      success: true,
      token: newAccessToken,
      refreshToken: newRefreshToken,
      user: userObj,
    });
  } catch {
    return res.status(401).json({ success: false, error: "Invalid or expired refresh token" });
  }
};

export const LogoutUser = (req: Request, res: Response): any => {
  res.cookie("jwt", "", {
    ...authCookieOptions,
    maxAge: 0,
  });
  res.cookie("refreshToken", "", {
    ...refreshCookieOptions,
    maxAge: 0,
  });
  return res
    .status(200)
    .json({ success: true, message: "Logged out successfully" });
};

// ── RBAC Middlewares ──────────────────────────────────────────────────────────

export const authenticateToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): any => {
  let token = extractToken(req);

  // Helper to attempt auto-refresh using the refreshToken cookie
  const attemptRefresh = async () => {
    const refreshToken =
      req.cookies?.refreshToken ||
      (req.headers["x-refresh-token"] as string);

    if (!refreshToken) {
      return res.status(401).json({
        error: "Authentication required: Missing or expired session (Bearer or cookie)",
      });
    }

    try {
      const decodedRefresh: any = jwt.verify(refreshToken, env.JWT_SECRET);
      const user = await CompanyModel.findById(decodedRefresh.id);
      if (!user) {
        return res.status(404).json({ error: "User account not found" });
      }

      const role = (user as any).role || decodedRefresh.role || "company";
      const newAccessToken = createToken(user._id, role);
      const newRefreshToken = createRefreshToken(user._id, role);

      res.cookie("jwt", newAccessToken, authCookieOptions);
      res.cookie("refreshToken", newRefreshToken, refreshCookieOptions);
      res.setHeader("x-new-token", newAccessToken);
      res.setHeader("x-new-refresh-token", newRefreshToken);

      req.user = {
        id: user._id.toString(),
        role,
        email: user.email,
      };

      return next();
    } catch {
      return res.status(401).json({
        error: "Authentication required: Session expired. Please login again.",
      });
    }
  };

  if (!token) {
    return attemptRefresh();
  }

  jwt.verify(token, env.JWT_SECRET, async (err: any, decodedToken: any) => {
    if (err) {
      // If token from header was invalid/expired, check if cookie has a valid jwt
      if (req.cookies?.jwt && req.cookies.jwt !== token) {
        try {
          const cookieDecoded: any = jwt.verify(req.cookies.jwt, env.JWT_SECRET);
          const user = await CompanyModel.findById(cookieDecoded.id);
          if (user) {
            const role = (user as any).role || cookieDecoded.role || "company";
            req.user = {
              id: user._id.toString(),
              role,
              email: user.email,
            };
            return next();
          }
        } catch {
          // Cookie also failed, fall through to attemptRefresh
        }
      }
      return attemptRefresh();
    }

    try {
      const user = await CompanyModel.findById(decodedToken.id);
      if (!user) {
        return res.status(404).json({ error: "User account not found" });
      }

      const role = (user as any).role || decodedToken.role || "company";
      req.user = {
        id: user._id.toString(),
        role,
        email: user.email,
      };

      next();
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });
};

export const requireRole = (...allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): any => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: "Forbidden: insufficient permissions",
        requiredRoles: allowedRoles,
        userRole: req.user.role,
      });
    }

    next();
  };
};

export const requireAdmin = [authenticateToken, requireRole("admin")];

export const requireCompanyOrAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): any => {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }

  // Admin has full access to any company
  if (req.user.role === "admin") {
    return next();
  }

  // Company user can only access/modify their own company
  const targetCompanyId = req.params.companyId;
  if (targetCompanyId && req.user.id !== targetCompanyId) {
    return res.status(403).json({
      error: "Forbidden: You do not have permission to access or modify this company",
    });
  }

  next();
};
