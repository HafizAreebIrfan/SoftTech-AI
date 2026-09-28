import { FC } from "react";
import { useNavigate } from "@tanstack/react-router";
import { CheckIcon, RocketIcon } from "../../../../assets/icons";
import { useThemeStore } from "../../../../hooks";
import styles from "../../../../styles/accountflow.module.css";
import { getAccountFlowThemeVars } from "../flowTheme";

const Deployment: FC = () => {
  const navigate = useNavigate();
  const { colors } = useThemeStore();

  return (
    <div className={styles.flowShell} style={getAccountFlowThemeVars(colors)}>
      <header className={styles.topbar}>
        <div>
          <span className={styles.eyebrow}>Account Setup</span>
          <h1 className={styles.brand}>SoftTech AI</h1>
        </div>
        <nav className={styles.wizard}>
          <div className={styles.wizardItem}><span className={`${styles.wizardDot} ${styles.wizardDotDone}`}><CheckIcon size={16} color={colors.TextGradientOne} /></span><span className={styles.wizardCopy}><span className={styles.wizardKicker}>Step 1</span><span className={styles.wizardLabel}>MCP Test</span></span></div>
          <span className={styles.wizardLine} />
          <div className={styles.wizardItem}><span className={`${styles.wizardDot} ${styles.wizardDotDone}`}><CheckIcon size={16} color={colors.TextGradientOne} /></span><span className={styles.wizardCopy}><span className={styles.wizardKicker}>Step 2</span><span className={styles.wizardLabel}>Plan</span></span></div>
          <span className={styles.wizardLine} />
          <div className={styles.wizardItem}><span className={`${styles.wizardDot} ${styles.wizardDotDone}`}><CheckIcon size={16} color={colors.TextGradientOne} /></span><span className={styles.wizardCopy}><span className={styles.wizardKicker}>Step 3</span><span className={styles.wizardLabel}>Checkout</span></span></div>
          <span className={styles.wizardLine} />
          <div className={styles.wizardItem}><span className={`${styles.wizardDot} ${styles.wizardDotActive}`}>4</span><span className={styles.wizardCopy}><span className={`${styles.wizardKicker} ${styles.wizardKickerActive}`}>Current</span><span className={`${styles.wizardLabel} ${styles.wizardLabelActive}`}>Deployment</span></span></div>
        </nav>
      </header>
      <main className={styles.centered}>
        <section className={`${styles.card} ${styles.resultCard}`}>
          <div className={styles.largeIcon}>
            <RocketIcon size={42} color={colors.TextGradientOne} />
          </div>
          <h1 className={styles.title}>Deploy to ChatGPT</h1>
          <p className={styles.subtitle}>
            Initialize your intelligence layer and bridge your local environment
            with the ChatGPT ecosystem.
          </p>
          <div style={{ marginTop: "2.5rem" }}>
            <button
              className={styles.button}
              onClick={() => navigate({ to: "/company_dashboard" })}
              type="button"
            >
              <RocketIcon size={18} color={colors.TextOverlay} /> Start Deployment
            </button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Deployment;
