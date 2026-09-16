import React, { FC } from "react";
import { useThemeStore } from "../../../../infrastructure/store/themeStore";
import styles from "../../../../styles/serviceunavailable.module.css";

const ServiceUnavailable: FC = () => {
  const { colors } = useThemeStore();

  return (
    <div className={styles.container} style={{ backgroundColor: colors.Background }}>
      <div className={styles.content}>
        <h1 className={styles.errorCode} style={{ background: colors.TextHighlightedHeading, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>503</h1>
        <h2 className={styles.title} style={{ color: colors.TextHeading }}>Core Overload</h2>
        <p className={styles.description} style={{ color: colors.TextBody }}>
          Our neural grid is currently undergoing maintenance or experiencing heavy solar flare activity. Please check back shortly.
        </p>
        <button
          onClick={() => {
            window.location.href = "/";
          }}
          className={styles.btn}
          style={{
            background: `linear-gradient(120deg, ${colors.ButtonGradientOne}, ${colors.ButtonGradientTwo})`,
            color: colors.TextOverlay
          }}
        >
          Re-establish Connection
        </button>
      </div>
    </div>
  );
};

export default ServiceUnavailable;
