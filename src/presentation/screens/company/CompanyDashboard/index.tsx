import { FC } from "react";
import { useNavigate } from "@tanstack/react-router";
import { CheckIcon, DatabaseIcon, RocketIcon, SearchIcon, ServerIcon } from "../../../../assets/icons";
import { useThemeStore } from "../../../../hooks";
import styles from "../../../../styles/companyflow.module.css";
import CompanyShell from "../CompanyShell";

const CompanyDashboard: FC = () => {
  const navigate = useNavigate();
  const { colors } = useThemeStore();

  return (
    <CompanyShell active="dashboard">
      <div className={styles.content}>
        <section className={styles.banner}>
          <div className={styles.bannerInner}>
            <div className={styles.rocketBadge}>
              <RocketIcon size={24} color={colors.TextGradientOne} />
            </div>
            <div>
              <h2 className={styles.panelTitle}>Congratulations! Your app is live on ChatGPT.</h2>
              <p className={styles.subtitle}>
                Interstellar protocol synchronization complete. Ready for
                interstellar requests.
              </p>
            </div>
          </div>
        </section>

        <section className={styles.pageHeader}>
          <h1 className={styles.title}>Welcome back, Acme Corp</h1>
          <p className={styles.subtitle}>System status: All celestial bodies aligned.</p>
        </section>

        <section className={styles.statsGrid}>
          {[
            ["Total Requests", "24.8K", "+12.5%", SearchIcon],
            ["Success Rate", "93.1%", "Optimal", CheckIcon],
            ["Active APIs", "5", "Running", DatabaseIcon],
            ["Uptime", "99.7%", "Live", ServerIcon],
          ].map(([label, value, badge, Icon]) => (
            <article className={styles.statCard} key={label as string}>
              <div className={styles.statTop}>
                <div className={styles.iconBadge}>
                  <Icon size={20} color={colors.TextGradientOne} />
                </div>
                <span className={styles.badge}>{badge as string}</span>
              </div>
              <p className={styles.statLabel}>{label as string}</p>
              <h3 className={styles.statValue}>{value as string}</h3>
            </article>
          ))}
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <h3 className={styles.panelTitle}>Next Step: Manage Your APIs</h3>
            <button
              className={styles.primaryButton}
              onClick={() => navigate({ to: "/api_management" })}
              type="button"
            >
              Open API Management
            </button>
          </div>
          <div className={styles.panelPad}>
            <p className={styles.subtitle}>
              Review endpoint health, latency, and registration status before
              monitoring live analytics.
            </p>
          </div>
        </section>
      </div>
    </CompanyShell>
  );
};

export default CompanyDashboard;
