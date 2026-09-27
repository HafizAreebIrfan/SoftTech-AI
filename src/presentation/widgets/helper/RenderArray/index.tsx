import React from "react";
import styles from "../../../../styles/fieldrenderer.module.css";

const summarizeItem = (item: unknown): string => {
  if (item === null || item === undefined) {
    return "";
  }

  if (typeof item !== "object") {
    return String(item);
  }

  if (Array.isArray(item)) {
    return `${item.length} nested items`;
  }

  const record = item as Record<string, unknown>;
  const preferredKeys = [
    "name",
    "title",
    "label",
    "text",
    "value",
    "time",
    "date",
    "datetime",
    "status",
  ];

  for (const key of preferredKeys) {
    const candidate = record[key];
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate;
    }
    if (typeof candidate === "number" || typeof candidate === "boolean") {
      return String(candidate);
    }
  }

  const scalarEntry = Object.entries(record).find(([, value]) => {
    return (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    );
  });

  if (scalarEntry) {
    const [key, value] = scalarEntry;
    return `${key}: ${String(value)}`;
  }

  return `${Object.keys(record).length} fields`;
};

export const renderArray = (value: unknown): React.ReactNode => {
  if (!Array.isArray(value)) {
    return String(value);
  }

  if (value.length === 0) {
    return <span className={styles.emptyValue}>Empty</span>;
  }

  return (
    <div className={styles.arrayValue}>
      {value.slice(0, 4).map((item, index) => (
        <span key={index} className={styles.arrayItem}>
          {summarizeItem(item)}
        </span>
      ))}
      {value.length > 4 && (
        <span className={styles.arrayItem}>{`+${value.length - 4} more`}</span>
      )}
    </div>
  );
};
