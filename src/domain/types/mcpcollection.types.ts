export type FieldSchema = {
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
};

export type CollectionMetric = {
  label: string;
  value: string;
  change?: string;
};

export type CollectionChartDataPoint = {
  label: string;
  value: number;
};

export type CollectionChart = {
  type: string;
  title: string;
  data: CollectionChartDataPoint[];
};

export type CollectionFacet = {
  name: string;
  param: string;
  tool: string;
  listTool?: string;
  optionsTool?: string;
  selected?: string | number;
  options?: Array<{ label: string; value: string | number }>;
};

export type CollectionResult = {
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
  facets?: CollectionFacet[];
  appliedQuery?: Record<string, any>;
};
