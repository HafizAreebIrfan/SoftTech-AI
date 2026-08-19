import React from "react";
import styles from "../../../../styles/fieldrenderer.module.css";

export const renderText = (value: unknown): React.ReactNode => {
  if (typeof value === "object") {
    return (
      <pre className={styles.jsonValue}>{JSON.stringify(value, null, 2)}</pre>
    );
  }

  return String(value);
};
