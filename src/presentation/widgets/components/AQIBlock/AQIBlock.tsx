import React from "react";
import styles from "../../../../styles/aqiblock.module.css";

export interface AQIBlockProps {
  title?: string;
  subtitle?: string;
  data?: unknown;
  records?: unknown[];
}

interface AQIConfig {
  label: string;
  color: string;
  description: string;
  icon: string;
}

const AQI_LEVELS: Record<number, AQIConfig> = {
  1: {
    label: "Good",
    color: "#10b981",
    description: "Air quality is satisfactory and poses little or no risk.",
    icon: "🟢",
  },
  2: {
    label: "Fair",
    color: "#84cc16",
    description: "Air quality is acceptable; very sensitive groups should take care.",
    icon: "🟡",
  },
  3: {
    label: "Moderate",
    color: "#f59e0b",
    description: "Sensitive groups may experience minor health effects.",
    icon: "🟠",
  },
  4: {
    label: "Poor",
    color: "#ef4444",
    description: "Everyone may begin to experience minor respiratory effects.",
    icon: "🔴",
  },
  5: {
    label: "Very Poor",
    color: "#a855f7",
    description: "Health alert: serious health effects for all populations.",
    icon: "🟣",
  },
};

const POLLUTANT_METADATA: Record<string, { label: string; unit: string }> = {
  pm2_5: { label: "PM₂.₅", unit: "μg/m³" },
  pm10: { label: "PM₁₀", unit: "μg/m³" },
  o3: { label: "Ozone (O₃)", unit: "μg/m³" },
  no2: { label: "Nitrogen (NO₂)", unit: "μg/m³" },
  so2: { label: "Sulphur (SO₂)", unit: "μg/m³" },
  co: { label: "Carbon (CO)", unit: "μg/m³" },
  nh3: { label: "Ammonia (NH₃)", unit: "μg/m³" },
  no: { label: "Nitric Oxide", unit: "μg/m³" },
};

export const AQIBlock: React.FC<AQIBlockProps> = ({
  title = "Air Quality Index",
  subtitle,
  data,
  records = [],
}) => {
  // Extract AQI value and components object generically
  const record = (records[0] || {}) as Record<string, any>;
  const dataObj = (data || {}) as Record<string, any>;

  // Check possible paths for aqi level
  let aqiVal =
    record.main?.aqi ??
    record.aqi ??
    record["main.aqi"] ??
    dataObj.list?.[0]?.main?.aqi ??
    dataObj.list?.[0]?.aqi ??
    dataObj.aqi ??
    1;

  if (typeof aqiVal === "string") {
    aqiVal = parseInt(aqiVal, 10) || 1;
  }

  const aqiIndex = Math.min(5, Math.max(1, Number(aqiVal) || 1));
  const config = AQI_LEVELS[aqiIndex] || AQI_LEVELS[1];

  // Extract components dictionary
  const rawComponents: Record<string, any> =
    record.components ||
    dataObj.list?.[0]?.components ||
    dataObj.components ||
    {};

  const pollutantEntries = Object.entries(rawComponents).filter(
    ([key, val]) => typeof val === "number" && !isNaN(val),
  );

  return (
    <section className={styles.container}>
      <div className={styles.heroCard}>
        {/* Header */}
        <div className={styles.headerRow}>
          <div className={styles.titleGroup}>
            <h3 className={styles.title}>
              {title === "Get AQI" ? "Air Quality Index" : title}
            </h3>
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
          <span style={{ fontSize: "24px" }}>🍃</span>
        </div>

        {/* AQI Gauge Display */}
        <div className={styles.gaugeSection}>
          <div
            className={styles.aqiBadge}
            style={{ background: config.color }}
          >
            <span className={styles.aqiNumber}>{aqiIndex}</span>
            <span className={styles.aqiLabelSmall}>AQI</span>
          </div>

          <div className={styles.statusInfo}>
            <div
              className={styles.statusName}
              style={{ color: config.color }}
            >
              {config.icon} {config.label}
            </div>
            <p className={styles.statusDescription}>{config.description}</p>
          </div>
        </div>

        {/* Pollutants Breakdown */}
        {pollutantEntries.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <h4 className={styles.pollutantsTitle}>Pollutant Breakdown</h4>
            <div className={styles.pollutantsGrid}>
              {pollutantEntries.map(([key, val]) => {
                const meta = POLLUTANT_METADATA[key.toLowerCase()] || {
                  label: key.toUpperCase(),
                  unit: "μg/m³",
                };
                return (
                  <div key={key} className={styles.pollutantChip}>
                    <span className={styles.pollutantName}>{meta.label}</span>
                    <span className={styles.pollutantValue}>
                      {Number(val).toFixed(1)}
                    </span>
                    <span className={styles.pollutantUnit}>{meta.unit}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
