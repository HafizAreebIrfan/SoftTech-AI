import { FieldSchema } from "../../domain/entities/GenericWidget";
import { PresentationBlock } from "./widgetdecider.interface";

export interface SummaryProps {
  block: PresentationBlock;
  records: unknown[];
  fields: FieldSchema[];
}
