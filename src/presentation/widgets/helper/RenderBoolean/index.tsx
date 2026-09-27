import React from "react";
import styles from "../../../../styles/fieldrenderer.module.css";

export const renderBoolean = (value: unknown): React.ReactNode => {
  const booleanValue = value === true || value === "true" || value === 1;

  return (
    <span className={booleanValue ? styles.booleanTrue : styles.booleanFalse}>
      {booleanValue ? "Yes" : "No"}
    </span>
  );
};
