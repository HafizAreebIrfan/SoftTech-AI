import {
  Capabilities,
  CollectionResult,
  FieldSchema,
  GenericWidgetContent,
  JsonValue,
  Pagination,
  WidgetAction,
  WidgetAudience,
} from "../../domain/entities/GenericWidget";
import { PresentationPlan } from "./widgetdecider.interface";

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
  audience?: WidgetAudience;
  presentationPlan?: PresentationPlan;
}
