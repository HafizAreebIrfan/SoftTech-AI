import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../../config/env";
import { createActivityLogRepository } from "../../../adapters/persistence/mongo/admin/activitylogrepository";

const repo = createActivityLogRepository();

function sanitizeBody(body: any) {
  if (!body || typeof body !== "object") return body;
  const copy: any = { ...body };
  if (copy.password) delete copy.password;
  if (copy.token) delete copy.token;
  if (copy.jwt) delete copy.jwt;
  return copy;
}

export const adminAuditMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.jwt || req.headers?.authorization?.split?.(" ")?.[1];
    let actorId: any = undefined;
    if (token) {
      try {
        const decoded: any = jwt.verify(token, env.JWT_SECRET);
        actorId = decoded?.id;
      } catch (e) {
        // ignore invalid token
      }
    }

    const payload = {
      action: `${req.method} ${req.originalUrl}`,
      actorId,
      actorType: actorId ? "company" : "anonymous",
      meta: {
        body: sanitizeBody(req.body),
        query: req.query,
      },
      ip: req.ip,
      userAgent: req.get("user-agent") || undefined,
    };

    // fire and forget to avoid blocking request handling
    repo.create(payload).catch((err: any) => console.error("ActivityLog error:", err));
  } catch (e) {
    console.error("adminAuditMiddleware error:", e);
  }

  next();
};

export default adminAuditMiddleware;
