import React from "react";
import styles from "../../../../../styles/adminpreview.module.css";
import { useThemeStore } from "../../../../../hooks/usetheme";
import { OnboardingStep } from "../types";

interface OnboardingTabProps {
  onboardingSteps: OnboardingStep[];
  toggleOnboardingStep: (id: number) => void;
  apisCount: number;
  enabledToolsCount: number;
  totalToolsCount: number;
  activePlan: string;
  onboardingProgress: number;
}

const OnboardingTab: React.FC<OnboardingTabProps> = ({
  onboardingSteps,
  toggleOnboardingStep,
  apisCount,
  enabledToolsCount,
  totalToolsCount,
  activePlan,
  onboardingProgress
}) => {
  const { colors, isDark } = useThemeStore();

  // Dynamic styling mapping to global theme tokens
  const statusBadgeStyle = {
    backgroundColor: isDark ? "rgba(5, 150, 105, 0.15)" : "rgba(5, 150, 105, 0.1)",
    color: colors.BrandEmerald,
    borderColor: isDark ? "rgba(5, 150, 105, 0.3)" : "rgba(5, 150, 105, 0.2)",
    borderStyle: "solid" as const,
    borderWidth: "1px"
  };

  return (
    <>
      <div className={styles.sectionCard}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>🏛️ Acme Corp Workspace Overview</h2>
          <span className={styles.badge} style={statusBadgeStyle}>
            Status: Active Developer
          </span>
        </div>

        {/* Metric Cards Row */}
        <div className={styles.metricRow}>
          <div className={styles.metricCard}>
            <span className={styles.metricValue}>{onboardingProgress}%</span>
            <span className={styles.metricLabel}>Onboarding Progress</span>
          </div>
          <div className={styles.metricCard}>
            <span className={styles.metricValue}>{apisCount}</span>
            <span className={styles.metricLabel}>Registered APIs</span>
          </div>
          <div className={styles.metricCard}>
            <span className={styles.metricValue}>
              {enabledToolsCount}/{totalToolsCount}
            </span>
            <span className={styles.metricLabel}>MCP Tools Enabled</span>
          </div>
          <div className={styles.metricCard}>
            <span
              className={styles.metricValue}
              style={{
                fontSize: "1.5rem",
                height: "48px",
                display: "flex",
                alignItems: "center"
              }}
            >
              {activePlan}
            </span>
            <span className={styles.metricLabel}>Subscription Plan</span>
          </div>
        </div>
      </div>

      {/* Onboarding Checklist */}
      <div className={styles.sectionCard}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>📋 Setup Checklist</h2>
          <p style={{ fontSize: "0.85rem", color: colors.TextSecondary }}>
            Complete these tasks to activate live MCP integration.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {onboardingSteps.map(step => (
            <div className={styles.stepItem} key={step.id}>
              <input
                type="checkbox"
                className={styles.stepCheckbox}
                checked={step.completed}
                onChange={() => toggleOnboardingStep(step.id)}
              />
              <div className={styles.stepContent}>
                <span
                  className={`${styles.stepTitle} ${step.completed ? styles.stepTitleCompleted : ""}`}
                  style={{ color: step.completed ? colors.TextSecondary : colors.TextPrimary }}
                >
                  {step.title}
                </span>
                <span className={styles.stepDesc} style={{ color: colors.TextSecondary }}>
                  {step.desc}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default OnboardingTab;
