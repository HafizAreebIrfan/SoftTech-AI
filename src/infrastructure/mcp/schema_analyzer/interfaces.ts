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
  path: string;
  hidden?: boolean;
  primary?: boolean;
  sortable?: boolean;
  searchable?: boolean;
  filterable?: boolean;
  uiRole?: string;
}

export interface ApiSchema {
  entity: string;
  dataPath?: string;
  fields: FieldMetadata[];
  analyzedAt: string;
  defaultLayout?: string;
}

export interface AnalyzerOptions {
  industry?: string;
  apiName?: string;
  endpoint?: string;
}
