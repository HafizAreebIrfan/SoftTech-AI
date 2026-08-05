import { FC } from "react";
import { useNavigate } from "@tanstack/react-router";
import { BoltIcon, HelpIcon, MoonIcon, RocketIcon, SlidersIcon } from "../../../../assets/icons";
import { useThemeStore } from "../../../../hooks";
import styles from "../../../../styles/accountflow.module.css";
import { getAccountFlowThemeVars } from "../../company/flowTheme";

const OnboardingDashboard: FC = () => {
  const navigate = useNavigate();
  const { colors } = useThemeStore();

  return (
    <div className={styles.onboardingShell} style={getAccountFlowThemeVars(colors)}>
      <header className={styles.onboardingTopbar}>
        <h1 className={styles.smallBrand}>SoftTech AI</h1>
        <div className={styles.profileShell}>
          <HelpIcon size={20} color={colors.TextBody} />
          <MoonIcon size={20} color={colors.TextBody} />
          <span className={styles.profilePlan}>PRO PLAN</span>
          <div className={styles.avatar}>AC</div>
        </div>
      </header>
      <main className={styles.onboardingMain}>
        <section className={styles.onboardingHero}>
          <h2 className={styles.title}>Welcome, Acme Corp</h2>
          <p className={styles.subtitle}>
            System status: All celestial bodies aligned. Let&apos;s finish your
            configuration.
          </p>
        </section>

        <div className={styles.sectionHeader}>
          <h3>Continue Setup</h3>
          <div className={styles.sectionRule} />
        </div>
        <section className={styles.grid}>
          <button className={`${styles.card} ${styles.optionCard}`} type="button">
            <div className={styles.iconBox}>
              <SlidersIcon size={28} color={colors.TextGradientOne} />
            </div>
            <h3 className={styles.cardTitle}>Test MCP & APIs</h3>
            <p className={styles.cardText}>
              Run isolated simulations to ensure protocol integrity before global
              deployment.
            </p>
            <span className={styles.cardAction}>Start testing -&gt;</span>
          </button>

          <button
            className={`${styles.card} ${styles.optionCard}`}
            onClick={() => navigate({ to: "/plans_softtech_ai_updated" })}
            type="button"
          >
            <div className={styles.iconBox}>
              <BoltIcon size={28} color={colors.TextGradientTwo} />
            </div>
            <h3 className={styles.cardTitle}>Choose a Plan</h3>
            <p className={styles.cardText}>
              Unlock unlimited requests and dedicated support for your enterprise
              needs.
            </p>
            <span className={styles.cardAction}>Explore pricing -&gt;</span>
          </button>

          <button className={`${styles.card} ${styles.optionCard} ${styles.deployOptionCard}`} type="button">
            <div className={styles.iconBox}>
              <RocketIcon size={28} color={colors.TextOverlay} />
            </div>
            <h3 className={styles.cardTitle}>Deploy to ChatGPT</h3>
            <p className={styles.cardText}>
              Push your protocol to the global stage and reach millions of users
              instantly.
            </p>
            <span className={styles.cardAction}>Launch now</span>
          </button>
        </section>
      </main>
    </div>
  );
};

export default OnboardingDashboard;
