import React from "react";
import styles from "../../../../styles/fieldrenderer.module.css";

export const renderObject = (value: unknown): React.ReactNode => {
  if (value === null || typeof value !== "object") {
    return String(value);
  }

  return (
    <pre className={styles.jsonValue}>{JSON.stringify(value, null, 2)}</pre>
  );
};
