import React from "react";
import styles from "../../../../styles/healthtech.module.css";

interface HealthtechScreenProps {
  title: string;
  subtitle?: string;
  blocks: any[];
  isPreview?: boolean;
  previewIndustry?: string;
  setPreviewIndustry?: (val: string) => void;
  renderPreviewControls?: (
    previewIndustry: string,
    setPreviewIndustry: (v: string) => void
  ) => React.ReactNode;
}

export const HealthtechScreen: React.FC<HealthtechScreenProps> = ({
  title,
  subtitle,
  blocks,
  isPreview,
  previewIndustry,
  setPreviewIndustry,
  renderPreviewControls,
}) => {
  const metricsBlock = blocks.find((b) => b.type === "metrics");
  const vitals = metricsBlock ? metricsBlock.metrics : [];

  return (
    <div className={styles.container}>
      {isPreview && renderPreviewControls && setPreviewIndustry && previewIndustry && (
        <div style={{ marginBottom: "1rem" }}>
          {renderPreviewControls(previewIndustry, setPreviewIndustry)}
        </div>
      )}

      <header className={styles.header}>
        <h2 className={styles.title}>
          {title}
        </h2>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </header>

      {/* Grid of Vitals and Diagnostics */}
      <div className={styles.grid}>
        {vitals.map((vital: any, idx: number) => {
          const isSpO2 = String(vital.label).toLowerCase().includes("spo2") || String(vital.label).toLowerCase().includes("oxygen");
          const isHeart = String(vital.label).toLowerCase().includes("heart") || String(vital.label).toLowerCase().includes("pulse");
          const color = isSpO2 ? "#06b6d4" : isHeart ? "#f43f5e" : "#818cf8";

          return (
            <div key={idx} className={styles.card}>
              <div>
                <span className={styles.label}>
                  {vital.label}
                </span>
                <div className={styles.value}>
                  <span>{vital.value}</span>
                </div>
              </div>

              <div className={styles.statusRow}>
                <span className={styles.dot} style={{ backgroundColor: color }}></span>
                <span className={styles.statusText}>
                  {vital.change || "Healthy range"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
