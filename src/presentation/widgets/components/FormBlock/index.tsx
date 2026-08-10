import React, { useState } from "react";
import styles from "../../../../styles/formblock.module.css";

export const FormBlock: React.FC = () => {
  return (
    <div className={styles.successOverlay}>
      <div className={styles.successIcon}></div>
    </div>
  );
};
