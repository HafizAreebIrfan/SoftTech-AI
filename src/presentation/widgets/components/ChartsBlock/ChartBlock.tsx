import React, { useMemo } from "react";
import { getFieldValue } from "../../../../utils/schema/getValue";
import { renderCurrency } from "../../helper/RenderCurrency";
import { renderNumber } from "../../helper/RenderNumber";
import { renderDate } from "../../helper/RenderDate";
import { ChartRenderer } from "./ChartRenderer";
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
  const { chartType, dataPoints, title, xLabel, yLabel } = useMemo(() => {
    // 0. If backend pre-calculated charts exist, use them!
    if (
      collection?.charts &&
      Array.isArray(collection.charts) &&
      collection.charts.length > 0
    ) {
      const bChart = collection.charts[0];
      const points: ChartDataPoint[] = (bChart.data || []).map((pt) => ({
        label: pt.label,
        rawX: pt.label,
        rawY: Number(pt.value),
        formattedX: pt.label,
        formattedY: `$${Number(pt.value).toLocaleString()}`,
      }));

      const rawType = String(bChart.type || "line").toLowerCase();
      const validTypes: ChartType[] = ["line", "bar", "pie", "scatter"];
      const cType: ChartType = validTypes.includes(rawType as ChartType)
        ? (rawType as ChartType)
        : "line";

      return {
        chartType: cType,
        dataPoints: points,
        title: bChart.title || "Sales Trend",
        xLabel: "Date",
        yLabel: "Amount",
      };
    }

    if (!records || records.length === 0) {
      return { chartType: "line" as ChartType, dataPoints: [], title: undefined };
    }

    const activeFields =
      block?.fields && block.fields.length > 0 ? block.fields : fields;

    const isMeaningful = (f: FieldSchema) => {
      const key = f.key.toLowerCase();
      const label = f.label.toLowerCase();
      if (key.includes("epoch") || label.includes("epoch") || key.includes("timestamp") || label.includes("timestamp")) return false;
      if (key === "code" || key === "tz_id" || key === "is_day" || key === "is_moon_up" || key === "is_sun_up") return false;
      return true;
    };

    const nonHiddenFields = activeFields.filter((f) => !f.hidden && isMeaningful(f));

    // 1. Identify Y-Axis numeric field
    const yField =
      nonHiddenFields.find((f) => f.type === "number" || f.type === "currency") ||
      nonHiddenFields.find((f) => f.type === "status");

    // 2. Identify X-Axis label / temporal field
    const xField =
      nonHiddenFields.find((f) => f.type === "date" || f.type === "datetime") ||
      nonHiddenFields.find((f) => f.primary) ||
      nonHiddenFields.find((f) => f !== yField && f.type === "text") ||
      nonHiddenFields[0];

    if (!yField) {
      return { chartType: "line" as ChartType, dataPoints: [], title: undefined };
    }

    // 3. Formulate Data Points
    const points: ChartDataPoint[] = [];

    records.forEach((record, index) => {
      const rawYVal = getFieldValue(record, yField);
      const rawXVal = xField ? getFieldValue(record, xField) : `Item ${index + 1}`;

      const numY = Number(rawYVal);
      if (Number.isNaN(numY) || !Number.isFinite(numY)) {
        return;
      }

      // Format Y
      let formattedY = "";
      if (yField.type === "currency") {
        formattedY = String(renderCurrency(numY));
      } else {
        formattedY = String(renderNumber(numY));
      }

      // Format X
      let formattedX = "";
      if (xField && (xField.type === "date" || xField.type === "datetime")) {
        formattedX = String(renderDate(rawXVal, xField.type === "datetime"));
      } else {
        formattedX = rawXVal !== undefined && rawXVal !== null ? String(rawXVal) : `Item ${index + 1}`;
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
      return { chartType: "line" as ChartType, dataPoints: [], title: undefined };
    }

    // 4. Infer chart type from variant or data characteristics
    let type: ChartType = "line";
    if (block?.variant === "bar" || block?.variant === "categorical") {
      type = "bar";
    } else if (block?.variant === "pie" || block?.variant === "donut") {
      type = "pie";
    } else if (block?.variant === "scatter") {
      type = "scatter";
    } else if (xField && xField.type !== "date" && xField.type !== "datetime" && points.length <= 8) {
      type = "bar";
    }

    return {
      chartType: type,
      dataPoints: points,
      title: `${yField.label} Trend`,
      xLabel: xField?.label,
      yLabel: yField.label,
    };
  }, [block, records, fields]);

  if (!dataPoints || dataPoints.length === 0) {
    return null;
  }

  return (
    <ChartRenderer
      type={chartType}
      dataPoints={dataPoints}
      title={title}
      xLabel={xLabel}
      yLabel={yLabel}
      variant={block?.variant}
    />
  );
};
