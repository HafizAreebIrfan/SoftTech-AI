import React from "react";
import { renderImage } from "../../helper/RenderImage";
import styles from "../../../../styles/summaryblock.module.css";
import type { SummaryCardProps } from "../../../../interfaces/mcp/summarycard.interface";

export const SummaryCard: React.FC<SummaryCardProps> = ({ metric }) => {
  return (
    <div
      className={styles.summaryCard}
      role="region"
      aria-label={metric.label}
    >
      <div className={styles.cardHeader}>
        <span className={styles.label}>{metric.label}</span>

        {metric.assetUrl && (
          <div className={styles.assetWrapper}>
            {renderImage(metric.assetUrl, metric.label)}
          </div>
        )}
      </div>

      <div className={styles.cardBody}>
        <strong className={styles.value}>{metric.formattedValue}</strong>

        {metric.change !== undefined && metric.change !== null && (
          <span
            className={`${styles.trendBadge} ${
              metric.trend === "up"
                ? styles.trendUp
                : metric.trend === "down"
                ? styles.trendDown
                : styles.trendNeutral
            }`}
          >
            {metric.trend === "up" ? "▲ " : metric.trend === "down" ? "▼ " : ""}
            {metric.change}
          </span>
        )}
      </div>

      {metric.supportingText && (
        <div className={styles.supportingText}>{metric.supportingText}</div>
      )}
    </div>
  );
};
