import React from "react";
import styles from "../../../../styles/emptystateblock.module.css";

interface EmptyStateBlockProps {
  title?: string;
  message?: string;
}

export const EmptyStateBlock: React.FC<EmptyStateBlockProps> = ({
  title = "No interface data loaded",
  message = "Execute an MCP tool to render dynamic business widgets.",
}) => {
  return (
    <div className={styles.container}>
      <div className={styles.iconWrapper}>📊</div>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.message}>{message}</p>
    </div>
  );
};
