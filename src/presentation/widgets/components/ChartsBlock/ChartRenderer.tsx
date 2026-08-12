import React, { useState } from "react";
import styles from "../../../../styles/chartsblock.module.css";
import type { ChartRendererProps, ChartDataPoint } from "../../../../interfaces/mcp/chartblock.interface";

export const ChartRenderer: React.FC<ChartRendererProps> = ({
  type,
  dataPoints,
  title,
  xLabel,
  yLabel,
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<ChartDataPoint | null>(null);

  if (!dataPoints || dataPoints.length === 0) {
    return null;
  }

  const width = 500;
  const height = 180;
  const padding = { top: 20, right: 30, bottom: 35, left: 45 };

  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  // Calculate Y min and max
  const yValues = dataPoints.map((d) => d.rawY);
  const minY = Math.min(0, ...yValues);
  const maxY = Math.max(...yValues) || 1;
  const yRange = maxY - minY || 1;

  // Helpers to convert data coords to SVG coords
  const getX = (index: number) => {
    if (dataPoints.length === 1) return padding.left + chartW / 2;
    return padding.left + (index / (dataPoints.length - 1)) * chartW;
  };

  const getY = (val: number) => {
    return padding.top + chartH - ((val - minY) / yRange) * chartH;
  };

  // Generate path string for Line Chart
  const linePoints = dataPoints.map((d, i) => `${getX(i)},${getY(d.rawY)}`).join(" ");
  const areaPoints = `${getX(0)},${padding.top + chartH} ${linePoints} ${getX(dataPoints.length - 1)},${padding.top + chartH}`;

  // Palette for Pie Chart slices
  const sliceColors = [
    "var(--widget-chart-primary)",
    "var(--widget-chart-secondary)",
    "#34D399",
    "#F59E0B",
    "#EC4899",
    "#8B5CF6",
  ];

  return (
    <div className={styles.card}>
      <header className={styles.header}>
        <h3 className={styles.title}>{title || yLabel || "Data Trend"}</h3>
        <span className={styles.typeBadge}>{type}</span>
      </header>

      <div className={styles.chartContainer}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className={styles.svgChart}
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label={title || "Chart visualization"}
        >
          {/* Grid lines */}
          <line
            x1={padding.left}
            y1={padding.top}
            x2={width - padding.right}
            y2={padding.top}
            className={styles.gridLine}
          />
          <line
            x1={padding.left}
            y1={padding.top + chartH / 2}
            x2={width - padding.right}
            y2={padding.top + chartH / 2}
            className={styles.gridLine}
          />
          <line
            x1={padding.left}
            y1={padding.top + chartH}
            x2={width - padding.right}
            y2={padding.top + chartH}
            className={styles.axisLine}
          />

          {/* Y Axis Labels */}
          <text
            x={padding.left - 8}
            y={padding.top + 4}
            textAnchor="end"
            className={styles.axisText}
          >
            {maxY > 1000 ? `${(maxY / 1000).toFixed(1)}k` : maxY.toLocaleString()}
          </text>
          <text
            x={padding.left - 8}
            y={padding.top + chartH + 4}
            textAnchor="end"
            className={styles.axisText}
          >
            {minY.toLocaleString()}
          </text>

          {/* X Axis Labels */}
          {dataPoints.map((d, i) => {
            // Show label every step to prevent overlap
            const step = Math.ceil(dataPoints.length / 6);
            if (i % step !== 0 && i !== dataPoints.length - 1) return null;

            return (
              <text
                key={`x-label-${i}`}
                x={getX(i)}
                y={height - 8}
                textAnchor="middle"
                className={styles.axisText}
              >
                {d.formattedX}
              </text>
            );
          })}

          {/* Line Chart */}
          {type === "line" && (
            <>
              <polygon points={areaPoints} className={styles.chartArea} />
              <polyline points={linePoints} className={styles.chartLine} />
              {dataPoints.map((d, i) => (
                <circle
                  key={`point-${i}`}
                  cx={getX(i)}
                  cy={getY(d.rawY)}
                  r={4}
                  className={styles.chartPoint}
                  onMouseEnter={() => setHoveredPoint(d)}
                  onMouseLeave={() => setHoveredPoint(null)}
                >
                  <title>{`${d.formattedX}: ${d.formattedY}`}</title>
                </circle>
              ))}
            </>
          )}

          {/* Bar Chart */}
          {type === "bar" && (
            <>
              {dataPoints.map((d, i) => {
                const barW = Math.max(8, Math.min(32, (chartW / dataPoints.length) * 0.6));
                const x = getX(i) - barW / 2;
                const y = getY(d.rawY);
                const h = padding.top + chartH - y;

                return (
                  <rect
                    key={`bar-${i}`}
                    x={x}
                    y={y}
                    width={barW}
                    height={Math.max(2, h)}
                    className={styles.bar}
                    onMouseEnter={() => setHoveredPoint(d)}
                    onMouseLeave={() => setHoveredPoint(null)}
                  >
                    <title>{`${d.formattedX}: ${d.formattedY}`}</title>
                  </rect>
                );
              })}
            </>
          )}

          {/* Scatter Chart */}
          {type === "scatter" && (
            <>
              {dataPoints.map((d, i) => (
                <circle
                  key={`scatter-${i}`}
                  cx={getX(i)}
                  cy={getY(d.rawY)}
                  r={6}
                  className={styles.chartPoint}
                  onMouseEnter={() => setHoveredPoint(d)}
                  onMouseLeave={() => setHoveredPoint(null)}
                >
                  <title>{`${d.formattedX}: ${d.formattedY}`}</title>
                </circle>
              ))}
            </>
          )}

          {/* Pie / Donut Chart */}
          {type === "pie" && (
            <g transform={`translate(${width / 2}, ${height / 2})`}>
              {(() => {
                const total = yValues.reduce((a, b) => a + Math.max(0, b), 0) || 1;
                let cumulativeAngle = 0;
                const radius = 60;

                return dataPoints.map((d, i) => {
                  const val = Math.max(0, d.rawY);
                  const angle = (val / total) * Math.PI * 2;
                  const startAngle = cumulativeAngle;
                  const endAngle = cumulativeAngle + angle;
                  cumulativeAngle += angle;

                  const x1 = Math.cos(startAngle) * radius;
                  const y1 = Math.sin(startAngle) * radius;
                  const x2 = Math.cos(endAngle) * radius;
                  const y2 = Math.sin(endAngle) * radius;
                  const largeArcFlag = angle > Math.PI ? 1 : 0;

                  const pathData = `M 0 0 L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

                  return (
                    <path
                      key={`pie-${i}`}
                      d={pathData}
                      fill={sliceColors[i % sliceColors.length]}
                      className={styles.pieSlice}
                      onMouseEnter={() => setHoveredPoint(d)}
                      onMouseLeave={() => setHoveredPoint(null)}
                    >
                      <title>{`${d.formattedX}: ${d.formattedY}`}</title>
                    </path>
                  );
                });
              })()}
            </g>
          )}
        </svg>
      </div>

      {/* Legend / Hovered tooltip info */}
      <div className={styles.legendList}>
        {hoveredPoint ? (
          <div className={styles.legendItem}>
            <strong>{hoveredPoint.formattedX}:</strong> {hoveredPoint.formattedY}
          </div>
        ) : (
          dataPoints.slice(0, 5).map((d, i) => (
            <div key={`legend-${i}`} className={styles.legendItem}>
              <span
                className={styles.legendColor}
                style={{
                  backgroundColor:
                    type === "pie"
                      ? sliceColors[i % sliceColors.length]
                      : "var(--widget-chart-primary)",
                }}
              />
              <span>{d.formattedX}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
