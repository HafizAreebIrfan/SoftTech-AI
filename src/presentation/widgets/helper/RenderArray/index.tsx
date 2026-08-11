import React from "react";
import styles from "../../../../styles/fieldrenderer.module.css";

export const renderArray = (value: unknown): React.ReactNode => {
  if (!Array.isArray(value)) {
    return String(value);
  }

  if (value.length === 0) {
    return <span className={styles.emptyValue}>Empty</span>;
  }

  return (
    <div className={styles.arrayValue}>
      {value.map((item, index) => (
        <span key={index} className={styles.arrayItem}>
          {typeof item === "object" ? JSON.stringify(item) : String(item)}
        </span>
      ))}
    </div>
  );
};
