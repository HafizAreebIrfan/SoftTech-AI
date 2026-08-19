import type { FieldSchema } from "../../domain/entities/GenericWidget";
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
  fieldMapping: CardFieldMapping;
  variant?: string;
}

export interface CardsBlockProps {
  block?: PresentationBlock;
  records?: unknown[];
  fields?: FieldSchema[];
  maxItems?: number;
  variant?: string;
}
