import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../../config/env";
import { CompanyModel } from "../../../adapters/persistence/models/companies/register/companyinfo";

export const maxAge = 15 * 60; // 15 minutes in seconds

const isProduction = process.env.NODE_ENV === "production";

export const authCookieOptions = {
  httpOnly: true,
  maxAge: maxAge * 1000,
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
  return jwt.sign({ id, role }, env.JWT_SECRET, {
    expiresIn: maxAge,
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

export const GetrequireAuth = (req: AuthenticatedRequest, res: Response): any => {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({ error: "Not Authenticated: No JWT token provided" });
  }

  jwt.verify(token, env.JWT_SECRET, async (err: any, decodedToken: any) => {
    if (err) {
      return res.status(401).json({ error: "Invalid or expired Token" });
    }

    try {
      const user = await CompanyModel.findById(decodedToken.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const userRole = (user as any).role || decodedToken.role || "company";

      const secondsRemaining =
        (decodedToken as any).exp - Math.floor(Date.now() / 1000);
      if (secondsRemaining < 5 * 60) {
        const newToken = createToken(user._id, userRole);
        res.cookie("jwt", newToken, authCookieOptions);
      }

      const userObj: any = user.toObject();
      delete userObj.password;
      delete userObj.passwordResetOTP;
      delete userObj.passwordResetOTPExpires;
      userObj.role = userRole;

      return res.status(200).json({ user: userObj });
    } catch (e: any) {
      return res.status(400).json({ error: e.message });
    }
  });
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
    res.cookie("jwt", logintoken, authCookieOptions);

    const userObj: any = user.toObject();
    delete userObj.password;
    delete userObj.passwordResetOTP;
    delete userObj.passwordResetOTPExpires;
    userObj.role = userRole;

    return res.status(200).json({
      _id: user._id,
      token: logintoken,
      role: userRole,
      user: userObj,
    });
  } catch (e: any) {
    return res.status(400).json({ error: e.message });
  }
};

export const LogoutUser = (req: Request, res: Response): any => {
  res.cookie("jwt", "", {
    ...authCookieOptions,
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
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({ error: "Authentication required: Missing JWT token (Bearer or cookie)" });
  }

  jwt.verify(token, env.JWT_SECRET, async (err: any, decodedToken: any) => {
    if (err) {
      return res.status(401).json({ error: "Invalid or expired token" });
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
