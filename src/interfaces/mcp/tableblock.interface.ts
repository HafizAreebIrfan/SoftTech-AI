import type {
  FieldSchema,
  Pagination,
  Capabilities,
  WidgetAction,
} from "../../domain/entities/GenericWidget";
import type { PresentationBlock } from "./widgetdecider.interface";

export interface TableRowProps {
  record: unknown;
  fields: FieldSchema[];
  actions?: WidgetAction[];
}

export interface TableBlockProps {
  block?: PresentationBlock;
  records?: unknown[];
  fields?: FieldSchema[];
  pagination?: Pagination;
  capabilities?: Capabilities;
  actions?: WidgetAction[];
  title?: string;
}
