import React, { FC, useCallback, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { CheckIcon, RightArrowIcon, TerminalIcon } from "../../../../assets/icons";
import { useThemeStore } from "../../../../hooks";
import { getIntegrationThemeVars } from "../ProcessingIntegration";
import styles from "../../../../styles/integrationflow.module.css";

const IntegrationSuccess: FC = () => {
  const navigate = useNavigate();
  const { colors } = useThemeStore();
  const themeVars = getIntegrationThemeVars(colors);

  const goToDashboard = useCallback(() => {
    navigate({ to: "/onboarding_dashboard", replace: true });
  }, [navigate]);

  useEffect(() => {
    const timer = window.setTimeout(goToDashboard, 3000);
    return () => window.clearTimeout(timer);
  }, [goToDashboard]);

  return (
    <div className={styles.successShell} style={themeVars}>
      <div className={styles.successGlow} />
      <div className={styles.softOrbOne} />
      <div className={styles.softOrbTwo} />

      <main className={styles.successMain}>
        <section className={styles.successCard}>
          <div className={styles.successIconWrap}>
            <div className={styles.successIcon}>
              <CheckIcon size={50} color={colors.TextGradientOne} />
            </div>
          </div>

          <div className={styles.successCopy}>
            <h1 className={styles.title}>Integration Complete!</h1>
            <p className={styles.successSubtitle}>
              Your MCP configuration has been generated. Redirecting to dashboard
              in 3 seconds...
            </p>
          </div>

          <div className={styles.successAction}>
            <button className={styles.dashboardButton} onClick={goToDashboard}>
              <span>Go to Dashboard</span>
              <RightArrowIcon size={18} color={colors.TextOverlay} />
            </button>
          </div>

          <div className={styles.metaRow}>
            <div className={styles.metaItem}>
              <TerminalIcon
                size={12}
                color="var(--integration-meta)"
              />
              <span>Protocol V.4.2</span>
            </div>
            <div className={styles.metaItem}>
              <CheckIcon size={12} color="var(--integration-meta)" />
              <span>SSL Encrypted</span>
            </div>
          </div>
        </section>
      </main>

      <div className={styles.networkBand} />
    </div>
  );
};

export default IntegrationSuccess;
