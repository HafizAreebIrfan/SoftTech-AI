import React from "react";
import styles from "../../../../styles/fieldrenderer.module.css";

export const renderStatus = (value: unknown): React.ReactNode => {
  const status = String(value);

  const normalized = status.toLowerCase();

  let statusClass = styles.statusDefault;

  if (
    [
      "completed",
      "complete",
      "approved",
      "active",
      "success",
      "paid",
      "in stock",
      "instock",
      "available",
    ].includes(normalized)
  ) {
    statusClass = styles.statusSuccess;
  }

  if (
    ["pending", "processing", "in_progress", "waiting", "low stock"].includes(
      normalized,
    )
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
      "out of stock",
      "outofstock",
      "sold out",
    ].includes(normalized)
  ) {
    statusClass = styles.statusError;
  }

  return <span className={`${styles.status} ${statusClass}`}>{status}</span>;
};
