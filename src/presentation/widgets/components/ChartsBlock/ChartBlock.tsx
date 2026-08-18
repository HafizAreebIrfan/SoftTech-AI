import React, { useMemo, useState } from "react";
import { ChartRenderer } from "./ChartRenderer";
import { getFieldValue } from "../../../../utils/schema/getValue";
import { renderCurrency } from "../../helper/RenderCurrency";
import { renderNumber } from "../../helper/RenderNumber";
import { renderDate } from "../../helper/RenderDate";
import type { FieldSchema } from "../../../../domain/entities/GenericWidget";
import type {
  ChartBlockProps,
  ChartDataPoint,
  ChartType,
} from "../../../../interfaces/mcp/chartblock.interface";

export const ChartBlock: React.FC<ChartBlockProps> = ({
  block,
  records = [],
  fields = [],
  collection,
}) => {
  const [selectedType, setSelectedType] = useState<ChartType | null>(null);

  const { initialType, dataPoints, title, xLabel, yLabel } = useMemo(() => {
    // 0. If backend pre-calculated charts exist, use them!
    if (
      collection?.charts &&
      Array.isArray(collection.charts) &&
      collection.charts.length > 0
    ) {
      const bChart = collection.charts[0];
      const chartTitle = (bChart.title || "").toLowerCase();
      const isCurrency =
        chartTitle.includes("amount") ||
        chartTitle.includes("sales") ||
        chartTitle.includes("price") ||
        chartTitle.includes("revenue") ||
        chartTitle.includes("cost");

      const points: ChartDataPoint[] = (bChart.data || []).map((pt) => ({
        label: pt.label,
        rawX: pt.label,
        rawY: Number(pt.value),
        formattedX: pt.label,
        formattedY: isCurrency
          ? `$${Number(pt.value).toLocaleString()}`
          : Number(pt.value).toLocaleString(),
      }));

      const rawType = String(bChart.type || block?.variant || "line").toLowerCase();
      const validTypes: ChartType[] = ["line", "bar", "pie", "scatter"];
      let cType: ChartType = validTypes.includes(rawType as ChartType)
        ? (rawType as ChartType)
        : "line";

      if (
        rawType.includes("pie") ||
        rawType.includes("donut") ||
        chartTitle.includes("pie")
      ) {
        cType = "pie";
      }

      return {
        initialType: cType,
        dataPoints: points,
        title: bChart.title || "Data Trend",
        xLabel: "Date",
        yLabel: "Value",
      };
    }

    if (!records || records.length === 0 || fields.length === 0) {
      return { initialType: "line" as ChartType, dataPoints: [] };
    }

    // 1. Identify numeric Y-axis candidate
    const activeFields = fields.filter((f) => !f.hidden);
    const numericFields = activeFields.filter(
      (f) => f.type === "currency" || f.type === "number",
    );

    if (numericFields.length === 0) {
      return { initialType: "line" as ChartType, dataPoints: [] };
    }

    const yField =
      numericFields.find((f) => f.type === "currency") || numericFields[0];

    // 2. Identify X-axis candidate
    const dateFields = activeFields.filter(
      (f) => f.type === "date" || f.type === "datetime",
    );

    const xField =
      dateFields[0] ||
      activeFields.find((f) => f !== yField && f.type === "text");

    // 3. Build data points
    const points: ChartDataPoint[] = [];

    records.forEach((record, index) => {
      const rawYVal = getFieldValue(record, yField);
      const rawXVal = xField
        ? getFieldValue(record, xField)
        : `Item ${index + 1}`;

      const numY = Number(rawYVal);
      if (Number.isNaN(numY) || !Number.isFinite(numY)) {
        return;
      }

      let formattedY = "";
      if (yField.type === "currency") {
        formattedY = String(renderCurrency(numY));
      } else {
        formattedY = String(renderNumber(numY));
      }

      let formattedX = "";
      if (xField && (xField.type === "date" || xField.type === "datetime")) {
        formattedX = String(renderDate(rawXVal, xField.type === "datetime"));
      } else {
        formattedX =
          rawXVal !== undefined && rawXVal !== null
            ? String(rawXVal)
            : `Item ${index + 1}`;
      }

      points.push({
        label: formattedX,
        rawX: rawXVal,
        rawY: numY,
        formattedY,
        formattedX,
      });
    });

    if (points.length < 2) {
      return { initialType: "line" as ChartType, dataPoints: [], title: undefined };
    }

    // 4. Infer chart type
    let type: ChartType = "line";
    if (block?.variant === "bar" || block?.variant === "categorical") {
      type = "bar";
    } else if (block?.variant === "pie" || block?.variant === "donut") {
      type = "pie";
    } else if (block?.variant === "scatter") {
      type = "scatter";
    } else if (
      xField &&
      xField.type !== "date" &&
      xField.type !== "datetime" &&
      points.length <= 8
    ) {
      type = "bar";
    }

    return {
      initialType: type,
      dataPoints: points,
      title: `${yField.label} Trend`,
      xLabel: xField?.label,
      yLabel: yField.label,
    };
  }, [block, records, fields, collection]);

  if (!dataPoints || dataPoints.length === 0) {
    return null;
  }

  const activeChartType = selectedType || initialType;

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <div
        style={{
          position: "absolute",
          top: "14px",
          right: "16px",
          zIndex: 10,
          display: "flex",
          gap: "4px",
        }}
      >
        {(["line", "bar", "pie"] as ChartType[]).map((t) => (
          <button
            key={t}
            type="button"
            style={{
              padding: "3px 8px",
              borderRadius: "6px",
              fontSize: "10px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              background:
                activeChartType === t
                  ? "var(--app-brand-accent, #34D399)"
                  : "rgba(255,255,255,0.05)",
              color:
                activeChartType === t
                  ? "#ffffff"
                  : "var(--widget-header-subtitle, #94a3b8)",
              border: "1px solid var(--widget-card-border, #334155)",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onClick={() => setSelectedType(t)}
          >
            {t}
          </button>
        ))}
      </div>

      <ChartRenderer
        type={activeChartType}
        dataPoints={dataPoints}
        title={title}
        xLabel={xLabel}
        yLabel={yLabel}
        variant={block?.variant}
      />
    </div>
  );
};
