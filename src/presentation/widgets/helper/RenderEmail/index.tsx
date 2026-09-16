import React from "react";
import styles from "../../../../styles/fieldrenderer.module.css";

export const renderEmail = (value: unknown): React.ReactNode => {
  const email = String(value);

  return (
    <a href={`mailto:${email}`} className={styles.link}>
      {email}
    </a>
  );
};
