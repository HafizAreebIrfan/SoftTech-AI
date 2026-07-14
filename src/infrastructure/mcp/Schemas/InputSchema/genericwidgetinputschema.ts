import { z } from "zod";

export const genericWidgetInputSchema = z.object({
  query: z
    .string()
    .optional()
    .describe("General search keyword, lookup value, or text prompt"),
  itemId: z
    .string()
    .optional()
    .describe("Unique ID of a specific item, record, transaction, or entity to retrieve"),
  limit: z
    .number()
    .optional()
    .describe("Maximum number of records to return for pagination (default is usually 10)"),
  page: z
    .number()
    .optional()
    .describe("Page number or offset for pagination"),
  startDate: z
    .string()
    .optional()
    .describe("Start date filter in ISO 8601 or YYYY-MM-DD format"),
  endDate: z
    .string()
    .optional()
    .describe("End date filter in ISO 8601 or YYYY-MM-DD format"),
  status: z
    .string()
    .optional()
    .describe("Filter records by state or status category (e.g. active, completed, pending)"),
  location: z
    .string()
    .optional()
    .describe("Geographic location, city, state, country, or coordinate string if required by the API"),
  city: z
    .string()
    .optional()
    .describe("City name lookup parameter (alias for location in weather or local services)"),
  params: z
    .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
    .optional()
    .describe("Arbitrary key-value overrides for additional API-specific parameters"),
});
