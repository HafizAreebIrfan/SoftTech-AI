import type { FieldSchema, CollectionResult } from "../../domain/entities/GenericWidget";
import type { PresentationBlock } from "./widgetdecider.interface";

export interface DetailFieldProps {
  field: FieldSchema;
  record: unknown;
}

export interface DetailBlockProps {
  block?: PresentationBlock;
  records?: unknown[];
  fields?: FieldSchema[];
  collection?: CollectionResult;
}
