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

export interface ApiSchema {
  entity: string;
  fields: FieldMetadata[];
  analyzedAt: string;
  defaultLayout?: string;
}

export interface AnalyzerOptions {
  industry?: string;
  apiName?: string;
  endpoint?: string;
}
