import path from "node:path";
import { z } from "zod";

/**
 * Primitive values that can safely travel through structuredContent.
 */
const primitiveSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
]);

/**
 * Recursive JSON value.
 */
const jsonValueSchema: z.ZodType<unknown> = z.lazy(() =>
  z.union([
    primitiveSchema,
    z.array(jsonValueSchema),
    z.record(z.string(), jsonValueSchema),
  ]),
);

/**
 * Describes one field returned by the API.
 *
 * This is metadata about the DATA, not a UI component.
 */
export const fieldTypeSchema = z.enum([
  "text",
  "number",
  "currency",
  "date",
  "datetime",
  "image",
  "email",
  "phone",
  "status",
  "boolean",
  "latitude",
  "longitude",
  "url",
  "object",
  "array",
]);

const fieldSchema = z.object({
  key: z.string(),
  label: z.string().optional(),
  type: fieldTypeSchema,
  path: z.string().optional(),
});

/**
 * Information about the collection/result.
 */
const collectionSchema = z.object({
  entity: z.string().optional(),
  dataPath: z.string().optional(),
  layout: z.string().optional(),

  /**
   * Example:
   * "products", "orders", "packages", "hotels"
   */
  itemLabel: z.string().optional(),

  /**
   * Useful when the API itself exposes these values.
   */
  total: z.number().optional(),
  page: z.number().optional(),
  limit: z.number().optional(),
  totalPages: z.number().optional(),

  /**
   * Field definitions for the returned records.
   */
  fields: z.array(fieldSchema).optional(),
  metrics: z
    .array(
      z.object({
        label: z.string(),
        value: z.string(),
        change: z.string().optional(),
      }),
    )
    .optional(),
  charts: z
    .array(
      z.object({
        type: z.string(),
        title: z.string(),
        data: z.array(
          z.object({
            label: z.string(),
            value: z.number(),
          }),
        ),
      }),
    )
    .optional(),
});

/**
 * Describes capabilities that are actually supported by the API.
 *
 * These should NOT be guessed by the frontend.
 */
const capabilitiesSchema = z.object({
  search: z.boolean().optional(),
  sort: z.boolean().optional(),
  filter: z.boolean().optional(),
  pagination: z.boolean().optional(),
  create: z.boolean().optional(),
  update: z.boolean().optional(),
  delete: z.boolean().optional(),
});

/**
 * Pagination metadata.
 */
const paginationSchema = z.object({
  page: z.number().optional(),
  limit: z.number().optional(),
  total: z.number().optional(),
  totalPages: z.number().optional(),
  hasNext: z.boolean().optional(),
  hasPrevious: z.boolean().optional(),
});

/**
 * Final generic MCP output.
 */
export const genericWidgetOutputSchema = z.object({
  /**
   * Human-readable name of the result.
   */
  title: z.string(),

  /**
   * Optional description/context.
   */
  subtitle: z.string().optional(),

  /**
   * Original/normalized API result.
   *
   * This is the important part.
   */
  data: jsonValueSchema,

  /**
   * Information about what the data represents.
   */
  collection: collectionSchema.optional(),

  /**
   * Capabilities supported by the API/tool.
   */
  capabilities: capabilitiesSchema.optional(),

  /**
   * Pagination information when available.
   */
  pagination: paginationSchema.optional(),

  /**
   * Additional non-UI metadata.
   */
  metadata: z.record(z.string(), jsonValueSchema).optional(),

  /**
   * Target audience for the widget.
   */
  audience: z.enum(["admin", "user", "customer", "both"]).optional(),

  /**
   * Target platform for the widget.
   */
  platformtype: z.enum(["web", "mobile", "both"]).optional(),
});
