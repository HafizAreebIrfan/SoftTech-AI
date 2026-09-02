import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from "recharts";
import styles from "../../../../styles/chartsblock.module.css";
import type {
  ChartRendererProps,
  ChartDataPoint,
} from "../../../../interfaces/mcp/chartblock.interface";

export const ChartRenderer: React.FC<ChartRendererProps> = ({
  type,
  dataPoints = [],
  title,
  xLabel,
  yLabel,
}) => {
  if (!dataPoints || dataPoints.length === 0) {
    return null;
  }

  // Preferred user/theme color from company registration / metadata / CSS
  const themeColor =
    (window as any).__WIDGET_METADATA__?.themeColor ||
    (window as any).__WIDGET_DATA__?.themeColor ||
    "#6366f1";

  const colorPalette = [
    themeColor,
    "#38bdf8",
    "#34d399",
    "#f59e0b",
    "#ec4899",
    "#8b5cf6",
    "#a855f7",
    "#10b981",
  ];

  const chartData = useMemo(() => {
    return dataPoints.map((pt) => ({
      name: pt.formattedX || pt.label,
      value: pt.rawY,
      formattedY: pt.formattedY,
      formattedX: pt.formattedX,
      x: pt.rawX,
      y: pt.rawY,
    }));
  }, [dataPoints]);

  const isWide = dataPoints.length > 4;
  const calculatedWidth = isWide ? Math.max(520, dataPoints.length * 75) : 0;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div
          style={{
            background: "rgba(15, 23, 42, 0.95)",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            borderRadius: "8px",
            padding: "8px 12px",
            backdropFilter: "blur(8px)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
            color: "#f8fafc",
            fontSize: "12px",
          }}
        >
          <div style={{ fontWeight: 600, color: "#94a3b8", marginBottom: "4px" }}>
            {label || data.name}
          </div>
          <div style={{ fontWeight: 700, color: themeColor }}>
            {data.payload?.formattedY || Number(data.value).toLocaleString()}
          </div>
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    switch (type) {
      case "bar":
        return (
          <BarChart data={chartData} margin={{ top: 15, right: 20, left: 10, bottom: 25 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" vertical={false} />
            <XAxis
              dataKey="name"
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              interval={0}
              angle={isWide ? -30 : 0}
              textAnchor={isWide ? "end" : "middle"}
            />
            <YAxis
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v)}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" fill={themeColor} radius={[6, 6, 0, 0]}>
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={colorPalette[index % colorPalette.length]} />
              ))}
            </Bar>
          </BarChart>
        );

      case "pie":
        return (
          <PieChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: "11px", color: "#94a3b8", paddingTop: "10px" }}
            />
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={80}
              paddingAngle={3}
            >
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={colorPalette[index % colorPalette.length]} />
              ))}
            </Pie>
          </PieChart>
        );

      case "scatter":
        return (
          <ScatterChart margin={{ top: 15, right: 20, left: 10, bottom: 25 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" />
            <XAxis dataKey="x" name={xLabel || "X"} stroke="#94a3b8" fontSize={11} />
            <YAxis dataKey="y" name={yLabel || "Y"} stroke="#94a3b8" fontSize={11} />
            <Tooltip content={<CustomTooltip />} />
            <Scatter name="Data" data={chartData} fill={themeColor} />
          </ScatterChart>
        );

      case "line":
      default:
        return (
          <AreaChart data={chartData} margin={{ top: 15, right: 20, left: 10, bottom: 25 }}>
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={themeColor} stopOpacity={0.4} />
                <stop offset="95%" stopColor={themeColor} stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" vertical={false} />
            <XAxis
              dataKey="name"
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              interval={0}
              angle={isWide ? -30 : 0}
              textAnchor={isWide ? "end" : "middle"}
            />
            <YAxis
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v)}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="value"
              stroke={themeColor}
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#chartGradient)"
              activeDot={{ r: 6, fill: themeColor, stroke: "#ffffff", strokeWidth: 2 }}
            />
          </AreaChart>
        );
    }
  };

  return (
    <div className={styles.card}>
      <header className={styles.header}>
        <h3 className={styles.title}>{title || yLabel || "Data Trend"}</h3>
        <span className={styles.typeBadge}>{type}</span>
      </header>

      <div
        style={{
          width: "100%",
          overflowX: "auto",
          overflowY: "hidden",
          WebkitOverflowScrolling: "touch",
          paddingBottom: "8px",
          display: "block",
        }}
      >
        <div
          style={{
            width: isWide ? `${calculatedWidth}px` : "100%",
            minWidth: isWide ? `${calculatedWidth}px` : "100%",
            height: 260,
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
