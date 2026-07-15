"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.genericWidgetInputSchema = void 0;
const zod_1 = require("zod");
exports.genericWidgetInputSchema = zod_1.z.object({
    query: zod_1.z
        .string()
        .optional()
        .describe("General search keyword, lookup value, or text prompt"),
    itemId: zod_1.z
        .string()
        .optional()
        .describe("Unique ID of a specific item, record, transaction, or entity to retrieve"),
    limit: zod_1.z
        .number()
        .optional()
        .describe("Maximum number of records to return for pagination (default is usually 10)"),
    page: zod_1.z
        .number()
        .optional()
        .describe("Page number or offset for pagination"),
    startDate: zod_1.z
        .string()
        .optional()
        .describe("Start date filter in ISO 8601 or YYYY-MM-DD format"),
    endDate: zod_1.z
        .string()
        .optional()
        .describe("End date filter in ISO 8601 or YYYY-MM-DD format"),
    status: zod_1.z
        .string()
        .optional()
        .describe("Filter records by state or status category (e.g. active, completed, pending)"),
    location: zod_1.z
        .string()
        .optional()
        .describe("Geographic location, city, state, country, or coordinate string if required by the API"),
    city: zod_1.z
        .string()
        .optional()
        .describe("City name lookup parameter (alias for location in weather or local services)"),
    params: zod_1.z
        .record(zod_1.z.string(), zod_1.z.union([zod_1.z.string(), zod_1.z.number(), zod_1.z.boolean()]))
        .optional()
        .describe("Arbitrary key-value overrides for additional API-specific parameters"),
});
