import React from "react";
import { WidgetKeyValueItem, WidgetTone } from "../../../../domain/entities/GenericWidget";
import styles from "../../../../styles/keyvalueblock.module.css";

interface KeyValueBlockProps {
  keyValueItems: WidgetKeyValueItem[];
  title?: string;
}

const toneClasses: Record<WidgetTone, string> = {
  default: styles.default,
  good: styles.good,
  warning: styles.warning,
  danger: styles.danger,
};

export const KeyValueBlock: React.FC<KeyValueBlockProps> = ({ keyValueItems, title }) => {
  if (!keyValueItems || keyValueItems.length === 0) return null;

  return (
    <div style={{ marginBottom: "1rem" }}>
      {title && <h4 style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--app-text-primary)", marginBottom: "0.5rem" }}>{title}</h4>}
      <div className={styles.keyValueContainer}>
        {keyValueItems.map((item, index) => {
          const itemTone = item.tone || "default";
          const valClass = toneClasses[itemTone] || styles.default;

          return (
            <div key={index} className={styles.keyValueRow}>
              <span className={styles.keyLabel}>{item.key}</span>
              <span className={`${styles.valueLabel} ${valClass}`}>{item.value}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
