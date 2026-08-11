import React from "react";
import styles from "../../../../styles/fieldrenderer.module.css";

export const renderStatus = (value: unknown): React.ReactNode => {
  const status = String(value);

  const normalized = status.toLowerCase();

  let statusClass = styles.statusDefault;

  if (
    ["completed", "complete", "approved", "active", "success", "paid"].includes(
      normalized,
    )
  ) {
    statusClass = styles.statusSuccess;
  }

  if (
    ["pending", "processing", "in_progress", "waiting"].includes(normalized)
  ) {
    statusClass = styles.statusPending;
  }

  if (
    [
      "cancelled",
      "canceled",
      "rejected",
      "failed",
      "error",
      "inactive",
    ].includes(normalized)
  ) {
    statusClass = styles.statusError;
  }

  return <span className={`${styles.status} ${statusClass}`}>{status}</span>;
};
