export type FieldType =
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

export interface FieldMetadata {
  key: string;
  label: string;
  type: FieldType;
  hidden?: boolean;
  primary?: boolean;
  sortable?: boolean;
  searchable?: boolean;
  filterable?: boolean;
}

export interface EntityMetadata {
  entity: string;
  primaryKey?: string;
  titleKey?: string;
  subtitleKey?: string;
  imageKey?: string;
  statusKey?: string;
  dateKey?: string;
  amountKey?: string;
}

export interface UIHints {
  search?: boolean;
  sorting?: boolean;
  filters?: boolean;
  pagination?: boolean;
  bulkActions?: boolean;
  editable?: boolean;
  chart?: boolean;
  map?: boolean;
  cards?: boolean;
}

export interface ApiSchema {
  entity: string;
  defaultLayout: "table" | "cards" | "dashboard" | "timeline" | "gallery" | "map" | "chart" | "general" | string;
  fields: FieldMetadata[];
  entityMeta?: EntityMetadata;
  uiHints: UIHints;
  analyzedAt: string;
  rawSample?: unknown;
}

export interface AnalyzerOptions {
  industry?: string;
  apiName?: string;
  endpoint?: string;
}
