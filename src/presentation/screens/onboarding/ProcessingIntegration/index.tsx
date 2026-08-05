import React, { CSSProperties, FC, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { CheckIcon, SparklesIcon } from "../../../../assets/icons";
import { useThemeStore } from "../../../../hooks";
import { ThemeColors } from "../../../../utils/theme/colors";
import styles from "../../../../styles/integrationflow.module.css";

const steps = [
  { label: "Validating API endpoints", status: "done" },
  { label: "Analyzing response schema", status: "done" },
  { label: "Generating MCP tool schema", status: "active" },
  { label: "Creating UI block templates", status: "pending" },
  { label: "Running integration tests", status: "pending" },
  { label: "Finalizing deployment", status: "pending" },
];

type IntegrationThemeStyle = CSSProperties &
  Record<`--integration-${string}`, string>;

const withAlpha = (color: string, alpha: number) => {
  const hex = color.replace("#", "");

  if (color.startsWith("#") && (hex.length === 3 || hex.length === 6)) {
    const normalized =
      hex.length === 3
        ? hex
            .split("")
            .map((char) => char + char)
            .join("")
        : hex;
    const value = Number.parseInt(normalized, 16);
    const red = (value >> 16) & 255;
    const green = (value >> 8) & 255;
    const blue = value & 255;
    return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
  }

  const rgbMatch = color.match(/\d+(\.\d+)?/g);
  if (rgbMatch && rgbMatch.length >= 3) {
    return `rgba(${rgbMatch[0]}, ${rgbMatch[1]}, ${rgbMatch[2]}, ${alpha})`;
  }

  return color;
};

export const getIntegrationThemeVars = (
  colors: ThemeColors,
): IntegrationThemeStyle => ({
  "--integration-bg": colors.Card,
  "--integration-surface": colors.BackgroundSecondary,
  "--integration-surface-low": colors.Background,
  "--integration-surface-high": colors.BackgroundSecondary,
  "--integration-surface-low-faded": withAlpha(colors.Background, 0.5),
  "--integration-card": colors.Card,
  "--integration-glass": colors.GlassBg,
  "--integration-text": colors.TextPrimary,
  "--integration-heading": colors.TextOverlay,
  "--integration-muted": colors.TextBody,
  "--integration-outline": colors.FooterText,
  "--integration-primary": colors.TextGradientOne,
  "--integration-secondary": colors.TextGradientTwo,
  "--integration-primary-soft": colors.UISelectionCardBackground,
  "--integration-primary-ring": withAlpha(colors.TextGradientOne, 0.3),
  "--integration-primary-glow": withAlpha(colors.HeaderItemActiveColor, 0.15),
  "--integration-secondary-glow": withAlpha(colors.TextGradientTwo, 0.1),
  "--integration-primary-wash": withAlpha(colors.TextGradientOne, 0.05),
  "--integration-secondary-wash": withAlpha(colors.TextGradientTwo, 0.05),
  "--integration-primary-wash-strong": withAlpha(colors.TextGradientOne, 0.1),
  "--integration-secondary-wash-strong": withAlpha(colors.TextGradientTwo, 0.1),
  "--integration-outline-soft": withAlpha(colors.FooterText, 0.2),
  "--integration-subtle-border": colors.GlassBorderSecondary,
  "--integration-shadow": colors.HeaderBoxShadow,
  "--integration-row-shadow": colors.HeaderBoxShadow,
  "--integration-status-bg": colors.ButtonSecondary,
  "--integration-ghost": withAlpha(colors.TextOverlay, 0.1),
  "--integration-button-one": colors.ButtonGradientOne,
  "--integration-button-two": colors.ButtonGradientTwo,
  "--integration-button-text": colors.TextOverlay,
  "--integration-button-glow": withAlpha(colors.HeaderItemActiveColor, 0.4),
  "--integration-meta": withAlpha(colors.TextPrimary, 0.4),
  "--integration-band-fade": withAlpha(colors.Card, 0.1),
  "--integration-network-dot": withAlpha(colors.TextOverlay, 0.35),
  "--integration-network-line": withAlpha(colors.TextOverlay, 0.08),
});

const ProcessingIntegration: FC = () => {
  const navigate = useNavigate();
  const { colors } = useThemeStore();
  const themeVars = getIntegrationThemeVars(colors);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      navigate({ to: "/integration-success", replace: true });
    }, 30000);

    return () => window.clearTimeout(timer);
  }, [navigate]);

  return (
    <div className={styles.integrationShell} style={themeVars}>
      <main className={styles.processingMain}>
        <section className={styles.processingIntro}>
          <div className={styles.spinnerShell}>
            <div className={styles.spinnerInner}>
              <div className={styles.spinnerFrame}>
                <div className={styles.spinnerRing} />
                <div className={styles.spinnerSpark}>
                  <SparklesIcon size={22} color={colors.TextGradientOne} />
                </div>
              </div>
            </div>
          </div>

          <h1 className={styles.title}>Processing Integration</h1>
          <p className={styles.subtitle}>
            Generating your MCP configuration. This takes about 30 seconds.
          </p>
        </section>

        <section className={styles.stepsList} aria-label="Integration progress">
          {steps.map((step) => {
            const isDone = step.status === "done";
            const isActive = step.status === "active";
            const rowClass = [
              styles.stepRow,
              isActive ? styles.stepRowActive : "",
              step.status === "pending" ? styles.stepRowPending : "",
            ]
              .filter(Boolean)
              .join(" ");

            return (
              <div className={rowClass} key={step.label}>
                <div
                  className={[
                    styles.stepIcon,
                    isDone ? styles.stepIconDone : styles.stepIconPending,
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {isDone && (
                    <CheckIcon size={18} color={colors.TextGradientOne} />
                  )}
                  {isActive && <div className={styles.smallSpin} />}
                  {step.status === "pending" && (
                    <span style={{ color: colors.FooterText, fontWeight: 800 }}>
                      ...
                    </span>
                  )}
                </div>
                <span
                  className={[
                    styles.stepText,
                    step.status === "pending" ? styles.pendingText : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {step.label}
                </span>
                {isActive ? (
                  <span className={styles.pulseDot} aria-label="In progress" />
                ) : (
                  <span
                    className={[
                      styles.stepStatus,
                      step.status === "pending" ? styles.pendingStatus : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    {isDone ? "Done" : "Pending"}
                  </span>
                )}
              </div>
            );
          })}
        </section>

        <aside className={styles.tipCard}>
          <div className={styles.tipGlow} />
          <div className={styles.tipContent}>
            <span
              style={{
                color: colors.TextGradientOne,
                fontSize: "1.5rem",
                lineHeight: 1,
              }}
            >
              ?
            </span>
            <div>
              <h2 className={styles.tipTitle}>Pro Tip</h2>
              <p className={styles.tipText}>
                While you wait, you can review the{" "}
                <span className={styles.tipLink}>Interstellar Protocol</span>{" "}
                documentation to understand how these tools will be mapped to your
                workspace.
              </p>
            </div>
          </div>
        </aside>
      </main>

      <footer className={styles.processingFooter}>
        <div className={styles.footerInner}>
          <div className={styles.statusPill}>
            <span className={styles.pulseDot} />
            <span className={styles.statusText}>
              System Status: Optimizing Protocol
            </span>
          </div>
          <span className={styles.brandGhost}>SOFTTECH AI</span>
        </div>
      </footer>
    </div>
  );
};

export default ProcessingIntegration;
