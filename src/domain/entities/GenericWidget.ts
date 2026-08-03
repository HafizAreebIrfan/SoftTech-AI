export type WidgetBlockType =
  | "metrics"
  | "table"
  | "cards"
  | "timeline"
  | "gallery"
  | "map"
  | "alert"
  | "form"
  | "list"
  | "keyValue";

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

export interface TableColumn {
  key: string;
  label: string;
  type?: "text" | "number" | "currency" | "date" | "status" | "image";
  sortable?: boolean;
}

export interface Pagination {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize?: number;
}

export interface WidgetCardItem {
  id?: string;
  title: string;
  subtitle?: string;
  image?: string;
  icon?: string;
  badge?: string;
  attributes?: { label: string; value: string | number }[];
}

export interface WidgetTimelineEvent {
  id?: string;
  title: string;
  subtitle?: string;
  date: string;
  status?: string;
  icon?: string;
}

export interface WidgetMapMarker {
  id?: string;
  lat: number;
  lng: number;
  title: string;
  description?: string;
  icon?: string;
  badge?: string;
}

export interface WidgetGalleryImage {
  url: string;
  title?: string;
}

export interface WidgetFormField {
  name: string;
  type:
    | "text"
    | "number"
    | "email"
    | "password"
    | "textarea"
    | "select"
    | "multiselect"
    | "checkbox"
    | "radio"
    | "switch"
    | "slider"
    | "date";
  label: string;
  required?: boolean;
  placeholder?: string;
  options?: string[];
  value?: string | number | string[];
}

export interface WidgetBlock {
  type: WidgetBlockType;
  title?: string;
  subtitle?: string;
  image?: any;
  severity?: "info" | "warning" | "error" | "success";
  message?: string;
  metrics?: WidgetMetric[];
  listItems?: WidgetListItem[];
  keyValueItems?: WidgetKeyValueItem[];
  columns?: TableColumn[];
  rows?: (string | number)[][];
  tableHeaders?: string[];
  tableRows?: WidgetTableRow[];
  cards?: WidgetCardItem[];
  events?: WidgetTimelineEvent[];
  markers?: WidgetMapMarker[];
  images?: WidgetGalleryImage[];
  fields?: WidgetFormField[];
  formFields?: WidgetFormField[];
  submitAction?: string;
  pagination?: Pagination;
}

export interface GenericWidgetContent {
  title: string;
  subtitle?: string;
  layout?: "dashboard" | "catalog" | "table" | "timeline" | "details" | "general" | string;
  industry?: string;
  blocks: WidgetBlock[];
  meta?: {
    source?: string;
    lastFetched?: string;
    company?: string;
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
