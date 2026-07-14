import { z } from "zod";

const widgetToneSchema = z.enum(["default", "good", "warning", "danger"]);

const widgetMetricSchema = z.object({
  label: z.string(),
  value: z.union([z.string(), z.number()]),
  tone: widgetToneSchema.optional(),
  change: z.string().optional(),
  changeTone: widgetToneSchema.optional(),
});

const widgetListItemSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  icon: z.string().optional(),
  tone: widgetToneSchema.optional(),
  meta: z.string().optional(),
});

const widgetKeyValueItemSchema = z.object({
  key: z.string(),
  value: z.union([z.string(), z.number()]),
  tone: widgetToneSchema.optional(),
});

const widgetTableCellSchema = z.object({
  value: z.union([z.string(), z.number()]),
  tone: widgetToneSchema.optional(),
});

const widgetTableRowSchema = z.array(
  z.union([z.string(), z.number(), widgetTableCellSchema]),
);

const widgetBlockSchema = z.object({
  type: z.enum(["metrics", "list", "keyValue", "table"]),
  title: z.string().optional(),
  metrics: z.array(widgetMetricSchema).optional(),
  listItems: z.array(widgetListItemSchema).optional(),
  keyValueItems: z.array(widgetKeyValueItemSchema).optional(),
  tableHeaders: z.array(z.string()).optional(),
  tableRows: z.array(widgetTableRowSchema).optional(),
});

export const genericWidgetOutputSchema = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
  blocks: z.array(widgetBlockSchema),
});
