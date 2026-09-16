import React from "react";
import styles from "../../../../styles/fieldrenderer.module.css";

export const renderObject = (value: unknown): React.ReactNode => {
  if (value === null || typeof value !== "object") {
    return String(value);
  }

  const entries = Object.entries(value as Record<string, unknown>).filter(
    ([, entryValue]) =>
      typeof entryValue === "string" ||
      typeof entryValue === "number" ||
      typeof entryValue === "boolean",
  );

  if (entries.length > 0) {
    return (
      <div className={styles.arrayValue}>
        {entries.slice(0, 4).map(([key, entryValue]) => (
          <span key={key} className={styles.arrayItem}>
            {`${key}: ${String(entryValue)}`}
          </span>
        ))}
        {entries.length > 4 && (
          <span className={styles.arrayItem}>
            {`+${entries.length - 4} more`}
          </span>
        )}
      </div>
    );
  }

  return (
    <pre className={styles.jsonValue}>{JSON.stringify(value, null, 2)}</pre>
  );
};
