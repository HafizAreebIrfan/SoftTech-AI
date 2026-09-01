export type JsonPrimitive = string | number | boolean | null;

export type JsonValue =
  | JsonPrimitive
  | JsonValue[]
  | { [key: string]: JsonValue };

export type WidgetAudience = "admin" | "customer";

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
  uiRole?: string;
}

export interface CollectionMetric {
  label: string;
  value: string;
  change?: string;
}

export interface CollectionChartDataPoint {
  label: string;
  value: number;
}

export interface CollectionChart {
  type: string;
  title: string;
  data: CollectionChartDataPoint[];
}

export interface CollectionFacet {
  name: string;
  param: string;
  tool: string;
  optionsTool?: string;
  selected?: string | number;
  options?: Array<{ label: string; value: string | number }>;
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
  metrics?: CollectionMetric[];
  charts?: CollectionChart[];
  summary?: string;
  facets?: CollectionFacet[];
  appliedQuery?: Record<string, any>;
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
  widgetState?: Record<string, unknown> | McpToolResultPayload | null;
  setWidgetState?: (
    state: Record<string, unknown> | McpToolResultPayload | null,
  ) => void;
  callTool?: (toolName: string, args: Record<string, unknown>) => Promise<void>;
  sendFollowUpMessage?: (message: { prompt: string }) => void;
}

export interface OpenAiSetGlobalsEventDetail {
  globals?: OpenAiGlobals;
}

declare global {
  interface Window {
    openai?: OpenAiGlobals;
    __SOFTTECH_AI_WIDGET_BOOTSTRAP__?: McpToolResultPayload | null;
  }

  interface WindowEventMap {
    "openai:set_globals": CustomEvent<OpenAiSetGlobalsEventDetail>;
  }
}

export interface McpSubView {
  title: string;
  data?: unknown;
  blockType?: string;
}

export interface McpWidgetState {
  toolResult: McpToolResultPayload | null;
  subViewHistory: McpSubView[];
  setToolResult: (payload: McpToolResultPayload | null) => void;
  resetToolResult: () => void;
  pushSubView: (view: McpSubView) => void;
  popSubView: () => void;
  clearSubViews: () => void;
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
