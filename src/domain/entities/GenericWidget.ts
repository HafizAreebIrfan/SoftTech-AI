export type JsonPrimitive = string | number | boolean | null;

export type JsonValue =
  | JsonPrimitive
  | JsonValue[]
  | { [key: string]: JsonValue };

export type WidgetAudience = "admin" | "user" | "both";

export type PlatformType = "web" | "mobile" | "both";

export interface FieldSchema {
  key: string;
  label: string;
  type:
    | "text"
    | "number"
    | "currency"
    | "date"
    | "datetime"
    | "image"
    | "email"
    | "phone"
    | "status"
    | "boolean"
    | "latitude"
    | "longitude"
    | "url"
    | "object"
    | "array";
  path?: string;
  hidden?: boolean;
  primary?: boolean;
  sortable?: boolean;
  searchable?: boolean;
  filterable?: boolean;
}

export interface CollectionResult {
  entity?: string;
  dataPath?: string;
  layout?: string;
  itemLabel?: string;
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
  fields?: FieldSchema[];
}

export interface Capabilities {
  canCreate?: boolean;
  canRead?: boolean;
  canUpdate?: boolean;
  canDelete?: boolean;
  canSearch?: boolean;
  canFilter?: boolean;
  canSort?: boolean;
  canPaginate?: boolean;
  [key: string]: boolean | undefined;
}

export interface Pagination {
  page?: number;
  totalPages?: number;
  total?: number;
  limit?: number;
  hasNext?: boolean;
  hasPrevious?: boolean;
  [key: string]: JsonValue | undefined;
}

export interface GenericWidgetContent {
  title: string;
  subtitle?: string;
  data: JsonValue;
  collection?: CollectionResult;
  capabilities?: Capabilities;
  pagination?: Pagination;
  actions?: WidgetAction[];
  metadata?: Record<string, JsonValue>;
  audience?: WidgetAudience;
  platformType?: PlatformType;
  intent?: string;
}

export interface McpContentItem {
  type?: string;
  text?: string;
  [key: string]: unknown;
}

export interface McpToolResultPayload {
  structuredContent: GenericWidgetContent;

  content?: McpContentItem[];

  _meta?: Record<string, unknown>;
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

export interface McpWidgetState {
  toolResult: McpToolResultPayload | null;
  setToolResult: (payload: McpToolResultPayload | null) => void;
  resetToolResult: () => void;
}

export interface WidgetAction {
  id: string;
  label: string;
  tool: string;
  enabled?: boolean;
  requiresItem?: boolean;
  requiresConfirmation?: boolean;
  confirmationMessage?: string;
}

export type WidgetTone = "default" | "good" | "warning" | "danger";

export interface TableColumn {
  key?: string;
  label?: string;
  path?: string;
}

export interface WidgetTableCell {
  value: any;
  tone?: WidgetTone;
}

export interface WidgetTableRow {
  id?: string;
  cells?: (string | number | WidgetTableCell)[];
  [key: string]: any;
}

export interface WidgetBlock {
  type: string;
  title?: string;
  subtitle?: string;
  [key: string]: any;
}
