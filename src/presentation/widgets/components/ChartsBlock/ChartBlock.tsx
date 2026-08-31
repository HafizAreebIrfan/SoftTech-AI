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

      const promptContext = String(
        (window as any).__WIDGET_METADATA__?.user_raw_prompt ||
          (window as any).__WIDGET_DATA__?.user_raw_prompt ||
          (window as any).__WIDGET_METADATA__?.inferred_intent ||
          (window as any).__WIDGET_DATA__?.inferred_intent ||
          (window as any).openai?.widgetState?.inferred_intent ||
          (window as any).openai?.widgetState?.user_raw_prompt ||
          "",
      ).toLowerCase();

      const rawType = String(
        bChart.type || block?.variant || "line",
      ).toLowerCase();

      let cType: ChartType = "line";

      if (
        rawType.includes("bar") ||
        promptContext.includes("bar") ||
        promptContext.includes("column") ||
        chartTitle.includes("bar")
      ) {
        cType = "bar";
      } else if (
        rawType.includes("pie") ||
        rawType.includes("donut") ||
        promptContext.includes("pie") ||
        promptContext.includes("donut") ||
        chartTitle.includes("pie")
      ) {
        cType = "pie";
      } else if (
        rawType.includes("scatter") ||
        promptContext.includes("scatter")
      ) {
        cType = "scatter";
      } else if (["line", "bar", "pie", "scatter"].includes(rawType)) {
        cType = rawType as ChartType;
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

    // Try to find the explicit "metric" or "price", otherwise use the first currency/number
    const yField =
      numericFields.find(
        (f) => f.uiRole === "metric" || f.uiRole === "price",
      ) ||
      numericFields.find((f) => f.type === "currency") ||
      numericFields[0];

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
        const dateObj = new Date(rawXVal as string | number | Date);
        if (!isNaN(dateObj.getTime())) {
          formattedX = dateObj.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });
        } else {
          formattedX = String(renderDate(rawXVal, false));
        }
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
      return {
        initialType: "line" as ChartType,
        dataPoints: [],
        title: undefined,
      };
    }

    // 4. Infer chart type (Respecting user request if bar/pie was specified)
    let type: ChartType = "line";
    const promptContext = String(
      (window as any).__WIDGET_METADATA__?.user_raw_prompt ||
        (window as any).__WIDGET_DATA__?.user_raw_prompt ||
        (window as any).__WIDGET_METADATA__?.inferred_intent ||
        (window as any).__WIDGET_DATA__?.inferred_intent ||
        (window as any).openai?.widgetState?.inferred_intent ||
        (window as any).openai?.widgetState?.user_raw_prompt ||
        "",
    ).toLowerCase();

    if (
      promptContext.includes("bar") ||
      block?.variant === "bar" ||
      block?.variant === "categorical" ||
      (collection as any)?.chartType === "bar"
    ) {
      type = "bar";
    } else if (
      promptContext.includes("pie") ||
      block?.variant === "pie" ||
      block?.variant === "donut"
    ) {
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

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <ChartRenderer
        type={initialType}
        dataPoints={dataPoints}
        title={title}
        xLabel={xLabel}
        yLabel={yLabel}
        variant={block?.variant}
      />
    </div>
  );
};
