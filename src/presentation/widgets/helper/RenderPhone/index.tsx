import React from "react";
import styles from "../../../../styles/fieldrenderer.module.css";

export const renderPhone = (value: unknown): React.ReactNode => {
  const phone = String(value);

  return (
    <a href={`tel:${phone}`} className={styles.link}>
      {phone}
    </a>
  );
};
