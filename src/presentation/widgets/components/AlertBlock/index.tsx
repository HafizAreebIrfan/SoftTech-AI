import React from "react";
import styles from "../../../../styles/alertblock.module.css";

interface AlertBlockProps {
  title?: string;
  message?: string;
  severity?: "info" | "warning" | "error" | "success";
}

export const AlertBlock: React.FC<AlertBlockProps> = ({
  title = "Notice",
  message = "",
  severity = "info",
}) => {
  const alertClass = styles[severity] || styles.info;

  return (
    <div className={`${styles.alert} ${alertClass}`}>
      {title && <h5 className={styles.title}>{title}</h5>}
      {message && <p className={styles.message}>{message}</p>}
    </div>
  );
};
