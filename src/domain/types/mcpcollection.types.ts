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
};

export type CollectionResult = {
  entity: string;
  layout?: string;
  itemLabel?: string;
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
  fields?: FieldSchema[];
};
