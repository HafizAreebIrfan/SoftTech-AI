import React, { useMemo } from "react";
import { getFieldValue } from "../../../../utils/schema/getValue";
import { renderCurrency } from "../../helper/RenderCurrency";
import { renderNumber } from "../../helper/RenderNumber";
import { renderDate } from "../../helper/RenderDate";
import { SummaryCard } from "./SummaryCard";
import type { MetricCardData } from "../../../../interfaces/mcp/summarycard.interface";
import styles from "../../../../styles/summaryblock.module.css";
import type {
  FieldSchema,
  CollectionResult,
} from "../../../../domain/entities/GenericWidget";
import type { PresentationBlock } from "../../../../interfaces/mcp/widgetdecider.interface";

export interface SummaryBlockProps {
  block?: PresentationBlock;
  records?: unknown[];
  fields?: FieldSchema[];
  collection?: CollectionResult;
}

/**
 * Coerces raw unknown field values into finite numbers.
 */
const parseNumericValue = (val: unknown): number | null => {
  if (val === null || val === undefined || val === "") {
    return null;
  }

  if (typeof val === "number") {
    return Number.isFinite(val) ? val : null;
  }

  if (typeof val === "boolean") {
    return val ? 1 : 0;
  }

  if (typeof val === "string") {
    const cleaned = val.replace(/[^0-9.-]+/g, "").trim();
    if (!cleaned) return null;
    const num = Number(cleaned);
    return Number.isFinite(num) ? num : null;
  }

  return null;
};

/**
 * Derives aggregate statistic (sum, avg, count, min, max) for a field across records.
 */
const aggregateValues = (
  values: number[],
  fieldKey: string,
  fieldLabel: string,
) => {
  if (values.length === 0) return { aggregate: 0, count: 0, method: "count" };

  const keyLower = (fieldKey + " " + fieldLabel).toLowerCase();

  if (keyLower.includes("avg") || keyLower.includes("average") || keyLower.includes("rate") || keyLower.includes("score")) {
    const sum = values.reduce((acc, curr) => acc + curr, 0);
    return { aggregate: sum / values.length, count: values.length, method: "avg" };
  }

  if (keyLower.includes("min") || keyLower.includes("lowest")) {
    return { aggregate: Math.min(...values), count: values.length, method: "min" };
  }

  if (keyLower.includes("max") || keyLower.includes("highest") || keyLower.includes("peak")) {
    return { aggregate: Math.max(...values), count: values.length, method: "max" };
  }

  // Default to SUM for numeric metrics
  const sum = values.reduce((acc, curr) => acc + curr, 0);
  return { aggregate: sum, count: values.length, method: "sum" };
};

/**
 * Formats aggregate numeric value based on field type metadata.
 */
const formatMetricValue = (value: number, field?: FieldSchema): string => {
  if (field?.type === "currency") {
    return String(renderCurrency(value));
  }

  if ((field?.type as string) === "percentage" || field?.key.toLowerCase().includes("percent") || field?.label.toLowerCase().includes("%")) {
    return `${value % 1 === 0 ? value : value.toFixed(1)}%`;
  }

  if (field?.type === "date" || field?.type === "datetime") {
    return String(renderDate(value, field.type === "datetime"));
  }

  if (Number.isInteger(value)) {
    return value.toLocaleString();
  }

  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
};

export const SummaryBlock: React.FC<SummaryBlockProps> = ({
  block,
  records = [],
  fields = [],
  collection,
}) => {
  const metrics = useMemo<MetricCardData[]>(() => {
    // 1. Target fields selection
    let targetFields: FieldSchema[] = [];

    if (block?.fields && block.fields.length > 0) {
      targetFields = block.fields;
    } else {
      targetFields = fields.filter(
        (f) =>
          !f.hidden &&
          (f.type === "number" ||
            f.type === "currency" ||
            f.type === "status" ||
            f.type === "boolean"),
      );
    }

    const calculatedMetrics: MetricCardData[] = [];

    // 2. Compute metrics for target fields
    targetFields.forEach((field, idx) => {
      const extractedValues: number[] = [];
      let assetUrl: string | undefined;

      records.forEach((rec) => {
        const rawVal = getFieldValue(rec, field);
        const parsed = parseNumericValue(rawVal);
        if (parsed !== null) {
          extractedValues.push(parsed);
        }

        // Try extracting icon/asset if provided in record
        if (!assetUrl && rec && typeof rec === "object") {
          const possibleAsset = (rec as Record<string, unknown>).icon || (rec as Record<string, unknown>).image || (rec as Record<string, unknown>).avatar;
          if (typeof possibleAsset === "string" && possibleAsset.trim()) {
            assetUrl = possibleAsset;
          }
        }
      });

      if (extractedValues.length > 0) {
        const { aggregate, count, method } = aggregateValues(
          extractedValues,
          field.key,
          field.label,
        );

        const formattedValue = formatMetricValue(aggregate, field);
        const supportingText =
          records.length > 1
            ? method === "avg"
              ? `Avg across ${count} items`
              : method === "count"
              ? `${count} items`
              : `${count} records`
            : undefined;

        calculatedMetrics.push({
          id: `metric-${field.key}-${idx}`,
          label: field.label,
          value: aggregate,
          formattedValue,
          supportingText,
          assetUrl,
          field,
        });
      }
    });

    // 3. Fallback: If no numeric fields, produce a total count card
    if (calculatedMetrics.length === 0 && (records.length > 0 || collection?.total)) {
      const entityLabel = collection?.itemLabel || collection?.entity || "Records";
      const totalCount = collection?.total ?? records.length;

      calculatedMetrics.push({
        id: "metric-total-count",
        label: `Total ${entityLabel}`,
        value: totalCount,
        formattedValue: String(renderNumber(totalCount)),
        supportingText: `${records.length} displayed`,
      });
    }

    return calculatedMetrics;
  }, [block, records, fields, collection]);

  if (metrics.length === 0) {
    return null;
  }

  return (
    <section className={styles.container}>
      <div className={styles.grid}>
        {metrics.map((metric) => (
          <SummaryCard key={metric.id} metric={metric} />
        ))}
      </div>
    </section>
  );
};
