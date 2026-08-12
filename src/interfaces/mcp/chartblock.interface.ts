import type { FieldSchema } from "../../domain/entities/GenericWidget";
import type { PresentationBlock } from "./widgetdecider.interface";

export type ChartType = "line" | "bar" | "pie" | "scatter";

export interface ChartDataPoint {
  label: string;
  rawX: unknown;
  rawY: number;
  formattedY: string;
  formattedX: string;
}

export interface ChartRendererProps {
  type: ChartType;
  dataPoints: ChartDataPoint[];
  title?: string;
  xLabel?: string;
  yLabel?: string;
  variant?: string;
}

export interface ChartBlockProps {
  block?: PresentationBlock;
  records?: unknown[];
  fields?: FieldSchema[];
}
