import React from "react";
import styles from "../../../../styles/fieldrenderer.module.css";

export const renderImage = (value: unknown): React.ReactNode => {
  const src = String(value);

  return (
    <img
      src={src}
      alt="Field"
      className={styles.image}
      loading="lazy"
      onError={(event) => {
        event.currentTarget.style.display = "none";
      }}
    />
  );
};
