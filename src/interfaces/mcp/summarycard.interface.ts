import type { FieldSchema } from "../../domain/entities/GenericWidget";

export interface MetricCardData {
  id: string;
  label: string;
  value: unknown;
  formattedValue: string;
  supportingText?: string;
  change?: string | number;
  trend?: "up" | "down" | "neutral";
  assetUrl?: string;
  field?: FieldSchema;
}

export interface SummaryCardProps {
  metric: MetricCardData;
}
