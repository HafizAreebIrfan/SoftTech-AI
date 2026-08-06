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

const widgetCardSchema = z.object({
  id: z.string().optional(),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  image: z.string().optional(),
  icon: z.string().optional(),
  badge: z.string().optional(),
  attributes: z
    .array(
      z.object({
        label: z.string(),
        value: z.union([z.string(), z.number()]),
      }),
    )
    .optional(),
  actions: z
    .array(
      z.object({
        id: z.string(),
        label: z.string(),
        action: z.string(),
        variant: z.string().optional(),
      }),
    )
    .optional(),
});

const widgetTimelineEventSchema = z.object({
  id: z.string().optional(),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  date: z.string().optional(),
  status: z.string().optional(),
  icon: z.string().optional(),
});

const widgetFormFieldSchema = z.object({
  id: z.string(),
  name: z.string(),
  label: z.string(),
  type: z.string(),
  required: z.boolean().optional(),
  placeholder: z.string().optional(),
  defaultValue: z.any().optional(),
});

const widgetBlockSchema = z.object({
  type: z.enum([
    "metrics",
    "list",
    "keyValue",
    "table",
    "cards",
    "timeline",
    "form",
    "weather",
    "chart",
  ]),
  title: z.string().optional(),
  metrics: z.array(widgetMetricSchema).optional(),
  listItems: z.array(widgetListItemSchema).optional(),
  keyValueItems: z.array(widgetKeyValueItemSchema).optional(),
  tableHeaders: z.array(z.string()).optional(),
  tableRows: z.array(widgetTableRowSchema).optional(),
  cards: z.array(widgetCardSchema).optional(),
  events: z.array(widgetTimelineEventSchema).optional(),
  fields: z.array(widgetFormFieldSchema).optional(),
  submitAction: z.string().optional(),
  data: z.any().optional(),
});

export const genericWidgetOutputSchema = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
  layout: z.string().optional(),
  industry: z.string().optional(),
  blocks: z.array(widgetBlockSchema),
  metadata: z.record(z.string(), z.any()).optional(),
});
