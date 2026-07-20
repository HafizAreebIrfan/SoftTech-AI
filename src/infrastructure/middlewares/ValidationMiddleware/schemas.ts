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

export function buildCustomMcpInputSchema(configuredParams: string[] = []): z.ZodObject<any> {
  const schemaShape: Record<string, any> = {};

  const cleanKeys: string[] = [];

  configuredParams.forEach((rawKey) => {
    if (typeof rawKey !== "string" || !rawKey.trim()) return;
    const str = rawKey.trim();

    // If rawKey is accidentally a stringified JSON response or object
    if (str.startsWith("{") || str.startsWith("[")) {
      try {
        const parsed = JSON.parse(str);
        if (typeof parsed === "object" && parsed !== null) {
          Object.keys(parsed).forEach((k) => {
            if (/^[a-zA-Z0-9_-]+$/.test(k)) cleanKeys.push(k);
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
  });

  const uniqueKeys = Array.from(new Set(cleanKeys));

  if (uniqueKeys.length === 0) {
    schemaShape.query = z.string().optional().describe("General search query or keyword");
    schemaShape.location = z.string().optional().describe("Location or city name (e.g., Karachi, London)");
  } else {
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
        lower === "uuid"
      ) {
        schemaShape.itemId = z
          .string()
          .optional()
          .describe(
            "Unique ID of a specific item, record, transaction, or entity to retrieve",
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
        lower === "state"
      ) {
        schemaShape.status = z
          .string()
          .optional()
          .describe("Filter records by state or status category");
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
