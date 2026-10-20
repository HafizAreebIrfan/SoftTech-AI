import React, { FC, useCallback, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  CheckIcon,
  RightArrowIcon,
  TerminalIcon,
} from "../../../../assets/icons";
import { useAuthStore, useThemeStore } from "../../../../hooks";
import styles from "../../../../styles/integrationflow.module.css";

const IntegrationSuccess: FC = () => {
  const navigate = useNavigate();
  const { colors } = useThemeStore();
  const { setOnboardingStep } = useAuthStore();

  useEffect(() => {
    setOnboardingStep(4);
  }, [setOnboardingStep]);

  const goToDashboard = useCallback(() => {
    setOnboardingStep(4);
    navigate({ to: "/company-dashboard", replace: true });
  }, [navigate, setOnboardingStep]);

  useEffect(() => {
    const timer = window.setTimeout(goToDashboard, 3500);
    return () => window.clearTimeout(timer);
  }, [goToDashboard]);

  return (
    <div className={styles.successShell}>
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
              Your Model Context Protocol gateway is live and connected.
              Redirecting to your Company Console in 3 seconds...
            </p>
          </div>

          <div className={styles.successAction}>
            <button className={styles.dashboardButton} onClick={goToDashboard}>
              <span>Launch Company Console</span>
              <RightArrowIcon size={18} color={colors.TextOverlay} />
            </button>
          </div>
        </section>
      </main>

      <div className={styles.networkBand} />
    </div>
  );
};

export default IntegrationSuccess;
