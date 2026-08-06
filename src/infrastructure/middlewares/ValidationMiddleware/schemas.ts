import { z } from "zod";

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address"),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address"),
    otp: z.string().min(4, "OTP is required"),
    password: z.string().min(6, "Password must be at least 6 characters"),
  }),
});

export function buildCustomMcpInputSchema(configuredParams: any[] = []): z.ZodObject<any> {
  const schemaShape: Record<string, any> = {};

  const cleanKeys: string[] = [];

  (configuredParams ?? []).forEach((paramItem) => {
    if (!paramItem) return;
    if (typeof paramItem === "object" && paramItem !== null && paramItem.key) {
      const sanitized = String(paramItem.key).trim().replace(/[^a-zA-Z0-9_-]/g, "");
      if (sanitized && sanitized.length <= 40) {
        cleanKeys.push(sanitized);
      }
    } else if (typeof paramItem === "string" && paramItem.trim()) {
      const str = paramItem.trim();

      // If rawKey is accidentally a stringified JSON response or object
      if (str.startsWith("{") || str.startsWith("[")) {
        try {
          const parsed = JSON.parse(str);
          if (Array.isArray(parsed)) {
            parsed.forEach((p: any) => {
              if (p?.key) {
                const s = String(p.key).trim().replace(/[^a-zA-Z0-9_-]/g, "");
                if (s) cleanKeys.push(s);
              }
            });
          } else if (typeof parsed === "object" && parsed !== null) {
            Object.keys(parsed).forEach((k) => {
              const s = k.trim().replace(/[^a-zA-Z0-9_-]/g, "");
              if (s) cleanKeys.push(s);
            });
          }
        } catch {
          // ignore invalid json string
        }
      } else {
        // Clean parameter name - only alphanumeric, dash, underscore
        const sanitized = str.replace(/[^a-zA-Z0-9_-]/g, "");
        if (sanitized && sanitized.length <= 40) {
          cleanKeys.push(sanitized);
        }
      }
    }
  });

  const uniqueKeys = Array.from(new Set(cleanKeys));

  if (uniqueKeys.length > 0) {
    uniqueKeys.forEach((paramKey) => {
      const lower = paramKey.toLowerCase();
      if (lower === "query" || lower === "q" || lower === "search") {
        schemaShape.query = z
          .string()
          .optional()
          .describe("General search keyword, lookup value, or text prompt");
      } else if (
        lower === "itemid" ||
        lower === "id" ||
        lower === "uuid" ||
        lower === "packageid"
      ) {
        schemaShape[paramKey] = z
          .string()
          .optional()
          .describe(
            "Unique ID of a specific item, package, record, or entity to target",
          );
      } else if (
        lower === "limit" ||
        lower === "count" ||
        lower === "size"
      ) {
        schemaShape.limit = z
          .number()
          .optional()
          .describe("Maximum number of records to return for pagination");
      } else if (lower === "page" || lower === "offset") {
        schemaShape.page = z
          .number()
          .optional()
          .describe("Page number or offset for pagination");
      } else if (
        lower === "startdate" ||
        lower === "fromdate" ||
        lower === "start"
      ) {
        schemaShape.startDate = z
          .string()
          .optional()
          .describe("Start date filter in ISO 8601 or YYYY-MM-DD format");
      } else if (
        lower === "enddate" ||
        lower === "todate" ||
        lower === "end"
      ) {
        schemaShape.endDate = z
          .string()
          .optional()
          .describe("End date filter in ISO 8601 or YYYY-MM-DD format");
      } else if (
        lower === "status" ||
        lower === "filter" ||
        lower === "state" ||
        lower === "packagestatus"
      ) {
        schemaShape[paramKey] = z
          .string()
          .optional()
          .describe("Filter records by state, status category, or package availability");
      } else if (lower === "location") {
        schemaShape.location = z
          .string()
          .optional()
          .describe("Geographic location string");
      } else if (lower === "city") {
        schemaShape.city = z
          .string()
          .optional()
          .describe("City name lookup parameter");
      } else {
        schemaShape[paramKey] = z
          .union([z.string(), z.number(), z.boolean()])
          .optional()
          .describe(`API parameter: ${paramKey}`);
      }
    });
  }

  schemaShape.params = z
    .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
    .optional()
    .describe(
      "Arbitrary key-value overrides for additional API-specific parameters",
    );

  return z.object(schemaShape);
}
