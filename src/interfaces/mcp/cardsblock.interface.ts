import type {
  FieldSchema,
  WidgetAction,
  WidgetAudience,
  CollectionResult,
  Capabilities,
} from "../../domain/entities/GenericWidget";
import type { PresentationBlock } from "./widgetdecider.interface";

export interface CardFieldMapping {
  imageField?: FieldSchema;
  titleField?: FieldSchema;
  subtitleField?: FieldSchema;
  statusField?: FieldSchema;
  priceField?: FieldSchema;
  secondaryFields: FieldSchema[];
}

export interface CardItemProps {
  record: unknown;
  fields: FieldSchema[];
  onSelect?: (record: Record<string, any>) => void;
  variant?: string;
  actions?: WidgetAction[];
  audience?: WidgetAudience;
}

export interface CardsBlockProps {
  block?: PresentationBlock;
  records?: unknown[];
  fields?: FieldSchema[];
  maxItems?: number;
  variant?: string;
  actions?: WidgetAction[];
  collection?: CollectionResult;
  capabilities?: Capabilities;
  audience?: WidgetAudience;
}
