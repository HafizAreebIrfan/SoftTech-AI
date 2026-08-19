import type { FieldSchema, WidgetAction } from "../../domain/entities/GenericWidget";
import type { PresentationBlock } from "./widgetdecider.interface";

export interface FormFieldProps {
  field: FieldSchema;
  value: unknown;
  error?: string;
  onChange: (value: unknown) => void;
}

export interface FormBlockProps {
  block?: PresentationBlock;
  fields?: FieldSchema[];
  actions?: WidgetAction[];
  onSubmit?: (data: Record<string, unknown>) => void;
}
