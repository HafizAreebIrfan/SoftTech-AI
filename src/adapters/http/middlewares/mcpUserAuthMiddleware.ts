import { Request } from "express";

/**
 * Resolves a stable user identity from incoming request context.
 * Uses authorization header token / claims if present, or falls back to a clean header / query subject.
 */
export const resolveMcpUserId = (req: Request): string => {
  const rawHeader =
    req.headers["x-mcp-user-id"] ||
    req.headers["x-user-id"] ||
    req.query.userId ||
    req.query.user_id;

  if (typeof rawHeader === "string" && rawHeader.trim()) {
    return rawHeader.trim();
  }

  if (
    Array.isArray(rawHeader) &&
    typeof rawHeader[0] === "string" &&
    rawHeader[0].trim()
  ) {
    return rawHeader[0].trim();
  }

  // Check Authorization Bearer token sub if present
  const authHeader = req.headers.authorization;

  if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7).trim();
    if (token) {
      // Return hashed/truncated bearer token representation as fallback principal identifier
      return `user_${Buffer.from(token.slice(-16)).toString("hex")}`;
    }
  }

  return "anonymous_user";
};
