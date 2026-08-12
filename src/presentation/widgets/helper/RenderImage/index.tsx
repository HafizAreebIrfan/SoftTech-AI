import React from "react";
import styles from "../../../../styles/fieldrenderer.module.css";

export const renderImage = (value: unknown): React.ReactNode => {
  let src = String(value);

  if (src.startsWith("//")) {
    src = `https:${src}`;
  }

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
