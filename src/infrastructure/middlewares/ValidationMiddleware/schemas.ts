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

  if (configuredParams.length === 0) {
    schemaShape.query = z.string().optional().describe("General search query");
  } else {
    configuredParams.forEach((paramKey) => {
      if (paramKey === "query") {
        schemaShape.query = z
          .string()
          .optional()
          .describe("General search keyword, lookup value, or text prompt");
      } else if (
        paramKey === "itemId" ||
        paramKey === "id" ||
        paramKey === "uuid"
      ) {
        schemaShape.itemId = z
          .string()
          .optional()
          .describe(
            "Unique ID of a specific item, record, transaction, or entity to retrieve",
          );
      } else if (
        paramKey === "limit" ||
        paramKey === "count" ||
        paramKey === "size"
      ) {
        schemaShape.limit = z
          .number()
          .optional()
          .describe("Maximum number of records to return for pagination");
      } else if (paramKey === "page" || paramKey === "offset") {
        schemaShape.page = z
          .number()
          .optional()
          .describe("Page number or offset for pagination");
      } else if (
        paramKey === "startDate" ||
        paramKey === "fromDate" ||
        paramKey === "start"
      ) {
        schemaShape.startDate = z
          .string()
          .optional()
          .describe("Start date filter in ISO 8601 or YYYY-MM-DD format");
      } else if (
        paramKey === "endDate" ||
        paramKey === "toDate" ||
        paramKey === "end"
      ) {
        schemaShape.endDate = z
          .string()
          .optional()
          .describe("End date filter in ISO 8601 or YYYY-MM-DD format");
      } else if (
        paramKey === "status" ||
        paramKey === "filter" ||
        paramKey === "state"
      ) {
        schemaShape.status = z
          .string()
          .optional()
          .describe("Filter records by state or status category");
      } else if (paramKey === "location") {
        schemaShape.location = z
          .string()
          .optional()
          .describe("Geographic location string");
      } else if (paramKey === "city" || paramKey === "q") {
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
