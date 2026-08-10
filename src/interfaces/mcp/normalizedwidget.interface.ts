import {
  Capabilities,
  CollectionResult,
  FieldSchema,
  GenericWidgetContent,
  JsonValue,
  Pagination,
  WidgetAction,
} from "../../domain/entities/GenericWidget";

export interface NormalizedWidgetData {
  content: GenericWidgetContent;
  collection?: CollectionResult;
  fields: FieldSchema[];
  records: unknown[];
  rawData: JsonValue;
}

export interface WidgetLayoutProps {
  title: string;
  subtitle?: string;
  data: JsonValue;
  records: unknown[];
  fields: FieldSchema[];
  collection?: CollectionResult;
  capabilities?: Capabilities;
  pagination?: Pagination;
  actions?: WidgetAction[];
}

