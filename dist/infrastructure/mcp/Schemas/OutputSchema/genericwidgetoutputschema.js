"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.genericWidgetOutputSchema = void 0;
const zod_1 = require("zod");
const widgetToneSchema = zod_1.z.enum(["default", "good", "warning", "danger"]);
const widgetMetricSchema = zod_1.z.object({
    label: zod_1.z.string(),
    value: zod_1.z.union([zod_1.z.string(), zod_1.z.number()]),
    tone: widgetToneSchema.optional(),
    change: zod_1.z.string().optional(),
    changeTone: widgetToneSchema.optional(),
});
const widgetListItemSchema = zod_1.z.object({
    title: zod_1.z.string(),
    description: zod_1.z.string().optional(),
    icon: zod_1.z.string().optional(),
    tone: widgetToneSchema.optional(),
    meta: zod_1.z.string().optional(),
});
const widgetKeyValueItemSchema = zod_1.z.object({
    key: zod_1.z.string(),
    value: zod_1.z.union([zod_1.z.string(), zod_1.z.number()]),
    tone: widgetToneSchema.optional(),
});
const widgetTableCellSchema = zod_1.z.object({
    value: zod_1.z.union([zod_1.z.string(), zod_1.z.number()]),
    tone: widgetToneSchema.optional(),
});
const widgetTableRowSchema = zod_1.z.array(zod_1.z.union([zod_1.z.string(), zod_1.z.number(), widgetTableCellSchema]));
const widgetBlockSchema = zod_1.z.object({
    type: zod_1.z.enum(["metrics", "list", "keyValue", "table"]),
    title: zod_1.z.string().optional(),
    metrics: zod_1.z.array(widgetMetricSchema).optional(),
    listItems: zod_1.z.array(widgetListItemSchema).optional(),
    keyValueItems: zod_1.z.array(widgetKeyValueItemSchema).optional(),
    tableHeaders: zod_1.z.array(zod_1.z.string()).optional(),
    tableRows: zod_1.z.array(widgetTableRowSchema).optional(),
});
exports.genericWidgetOutputSchema = zod_1.z.object({
    title: zod_1.z.string(),
    subtitle: zod_1.z.string().optional(),
    layout: zod_1.z.string().optional(),
    blocks: zod_1.z.array(widgetBlockSchema),
});
