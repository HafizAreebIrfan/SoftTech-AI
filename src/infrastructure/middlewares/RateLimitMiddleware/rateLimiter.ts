import rateLimit from "express-rate-limit";

// Rate limit for sensitive authentication routes (login, forgot-password, reset-password)
// Max 15 attempts per 1 minute per IP to prevent brute-force attacks and OTP flooding
// Skips CORS OPTIONS preflights and GET session-check requests so they don't consume login quota
export const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === "OPTIONS" || req.method === "GET",
  message: {
    success: false,
    error: "Too many authentication attempts from this IP, please try again in 1 minute.",
    message: "Too many authentication attempts from this IP, please try again in 1 minute.",
  },
});

// General API rate limiter for standard CRUD and collection operations
// 200 requests per 15 minutes per IP
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too many requests, please slow down and try again later.",
    message: "Too many requests, please slow down and try again later.",
  },
});

// Rate limit for MCP AI and tool execution endpoints
// 60 requests per minute
export const mcpLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Rate limit exceeded for MCP endpoints. Please throttle your tool requests.",
    message: "Rate limit exceeded for MCP endpoints. Please throttle your tool requests.",
  },
});
