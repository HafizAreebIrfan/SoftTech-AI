import React from "react";
import { WidgetMetric, WidgetTone } from "../../../../domain/entities/GenericWidget";
import styles from "../../../../styles/metricblock.module.css";

interface MetricBlockProps {
  metrics: WidgetMetric[];
  title?: string;
}

const toneClasses: Record<WidgetTone, string> = {
  default: styles.default,
  good: styles.good,
  warning: styles.warning,
  danger: styles.danger,
};

export const MetricBlock: React.FC<MetricBlockProps> = ({ metrics, title }) => {
  if (!metrics || metrics.length === 0) return null;

  return (
    <div style={{ marginBottom: "1rem" }}>
      {title && <h4 style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--app-text-primary)", marginBottom: "0.5rem" }}>{title}</h4>}
      <div className={styles.metricsGrid}>
        {metrics.map((metric, index) => {
          const valTone = metric.tone || "default";
          const valClass = toneClasses[valTone] || styles.default;
          
          return (
            <div key={index} className={styles.metricCard}>
              <span className={styles.metricLabel}>{metric.label}</span>
              <strong className={`${styles.metricValue} ${valClass}`}>
                {metric.value}
              </strong>
              {metric.change && (
                <div className={styles.changeRow}>
                  <span className={toneClasses[metric.changeTone || "default"]}>
                    {metric.change}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
