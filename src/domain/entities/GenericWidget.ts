export type WidgetBlockType = "metrics" | "list" | "keyValue" | "table";
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

export interface WidgetBlock {
  type: WidgetBlockType;
  title?: string;
  image?: any;
  metrics?: WidgetMetric[];
  listItems?: WidgetListItem[];
  keyValueItems?: WidgetKeyValueItem[];
  tableHeaders?: string[];
  tableRows?: WidgetTableRow[];
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
