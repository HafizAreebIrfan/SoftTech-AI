import {
  Capabilities,
  CollectionResult,
  FieldSchema,
  GenericWidgetContent,
  JsonValue,
  Pagination,
  WidgetAction,
} from "../../domain/entities/GenericWidget";
import { PresentationPlan } from "./widgetdecider.interface";

export interface NormalizedWidgetSection {
  title: string;
  content: any;
  collection: any;
  fields: any[];
  records: unknown[];
  rawData: unknown;
}

export interface NormalizedWidgetData {
  content: GenericWidgetContent;
  collection?: CollectionResult;
  fields: FieldSchema[];
  records: unknown[];
  rawData: JsonValue;
  sections?: NormalizedWidgetSection[];
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
  presentationPlan?: PresentationPlan;
}
