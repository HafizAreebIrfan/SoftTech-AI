export type WidgetBlockType = "metrics" | "list" | "keyValue" | "table" | "form";
export type WidgetTone = "default" | "good" | "warning" | "danger";

export interface WidgetMetric {
  label: string;
  value: string | number;
  tone?: WidgetTone;
  change?: string;
  changeTone?: WidgetTone;
}

export interface WidgetListItem {
  title: string;
  description?: string;
  image?: any;
  icon?: string;
  tone?: WidgetTone;
  meta?: string;
}

export interface WidgetKeyValueItem {
  key: string;
  value: string | number;
  tone?: WidgetTone;
}

export interface WidgetTableCell {
  value: string | number;
  tone?: WidgetTone;
}

export type WidgetTableRow = (string | number | WidgetTableCell)[];

export interface WidgetFormField {
  name: string;
  type: "text" | "number" | "email" | "select" | "textarea";
  label: string;
  required?: boolean;
  placeholder?: string;
  options?: string[];
}

export interface WidgetBlock {
  type: WidgetBlockType;
  title?: string;
  image?: any;
  metrics?: WidgetMetric[];
  listItems?: WidgetListItem[];
  keyValueItems?: WidgetKeyValueItem[];
  tableHeaders?: string[];
  tableRows?: WidgetTableRow[];
  formFields?: WidgetFormField[];
  submitLabel?: string;
  actionUrl?: string;
}

export interface GenericWidgetContent {
  title: string;
  subtitle?: string;
  layout?: "dashboard" | "detail" | "table" | "report";
  blocks: WidgetBlock[];
  meta?: {
    source?: string;
    lastFetched?: string;
  };
}

export interface McpToolResultPayload {
  structuredContent: GenericWidgetContent;
  content?: { type?: string; text?: string }[];
  _meta?: unknown;
}

export interface OpenAiGlobals {
  toolInput?: unknown;
  toolOutput?: McpToolResultPayload | null;
}

export interface OpenAiSetGlobalsEventDetail {
  globals?: OpenAiGlobals;
}

declare global {
  interface Window {
    openai?: OpenAiGlobals;
  }
  interface WindowEventMap {
    "openai:set_globals": CustomEvent<OpenAiSetGlobalsEventDetail>;
  }
}
