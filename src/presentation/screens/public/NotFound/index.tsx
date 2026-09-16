import React, { FC } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useThemeStore } from "../../../../infrastructure/store/themeStore";
import styles from "../../../../styles/notfound.module.css";

const NotFound: FC = () => {
  const navigate = useNavigate();
  const { colors } = useThemeStore();

  return (
    <div className={styles.container} style={{ backgroundColor: colors.Background }}>
      <div className={styles.glow} />
      <div className={styles.content}>
        <h1 className={styles.errorCode} style={{ background: colors.TextHighlightedHeading, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>404</h1>
        <h2 className={styles.title} style={{ color: colors.TextHeading }}>Lost in Deep Space</h2>
        <p className={styles.description} style={{ color: colors.TextBody }}>
          The cosmic coordinates you requested do not exist. You may have mistyped the URL or the page has been moved to a different nebula.
        </p>
        <button
          onClick={() => navigate({ to: "/" })}
          className={styles.btn}
          style={{
            background: `linear-gradient(120deg, ${colors.ButtonGradientOne}, ${colors.ButtonGradientTwo})`,
            color: colors.TextOverlay
          }}
        >
          Return to Orbit
        </button>
      </div>
    </div>
  );
};

export default NotFound;
