import React from "react";
import styles from "../../../../styles/fieldrenderer.module.css";

export const renderUrl = (value: unknown): React.ReactNode => {
  const url = String(value);

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.link}
    >
      Open
    </a>
  );
};
