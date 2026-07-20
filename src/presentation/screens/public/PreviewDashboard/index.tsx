import React from "react";
import styles from "../../../../styles/dashboardpreview.module.css";
import { useThemeStore } from "../../../../infrastructure/store/themeStore";
import CardWidget from "../../../widgets/card";

const DashboardPreview: React.FC = () => {
  const { colors } = useThemeStore();
  return (
    <div className={styles.previewContainer}>
      <div className={styles.glassBlob1} />
      <div className={styles.glassBlob2} />
      <div className={styles.glassBlob3} />
      <div className={styles.workspaceCard}>
        <CardWidget />
      </div>
    </div>
  );
};

export default DashboardPreview;
