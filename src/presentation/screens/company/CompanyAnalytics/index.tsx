import { FC } from "react";
import { useNavigate } from "@tanstack/react-router";
import { CheckIcon, ServerIcon, SlidersIcon, TrendingUpIcon } from "../../../../assets/icons";
import { useThemeStore } from "../../../../hooks";
import styles from "../../../../styles/companyflow.module.css";
import CompanyShell from "../CompanyShell";

const CompanyAnalytics: FC = () => {
  const navigate = useNavigate();
  const { colors } = useThemeStore();

  return (
    <CompanyShell active="analytics">
      <div className={styles.content}>
        <section className={styles.pageHeader}>
          <h1 className={styles.title}>Analytics</h1>
          <p className={styles.subtitle}>
            Real-time telemetry and protocol performance across the interstellar API grid.
          </p>
        </section>

        <section className={styles.statsGrid}>
          {[
            ["This Month", "84.2K", "+12.5%", TrendingUpIcon],
            ["Avg Response", "142ms", "-8ms", SlidersIcon],
            ["Uptime", "99.7%", "Optimal", CheckIcon],
            ["GPT Usage", "12.4K", "High", ServerIcon],
          ].map(([label, value, badge, Icon]) => (
            <article className={styles.statCard} key={label as string}>
              <div className={styles.statTop}>
                <Icon size={22} color={colors.TextGradientOne} />
                <span className={styles.badge}>{badge as string}</span>
              </div>
              <p className={styles.statLabel}>{label as string}</p>
              <h3 className={styles.statValue}>{value as string}</h3>
            </article>
          ))}
        </section>

        <section className={styles.chartsGrid}>
          <article className={styles.panel}>
            <div className={styles.panelPad}>
              <h3 className={styles.panelTitle}>API Calls - Last 30 Days</h3>
              <p className={styles.subtitle}>Aggregate request volume across all protocols.</p>
              <div className={styles.chartBox}>
                <svg viewBox="0 0 1000 300" width="100%" height="100%">
                  <defs>
                    <linearGradient id="companyAnalyticsGrad" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="5%" stopColor={colors.TextGradientOne} stopOpacity="0.3" />
                      <stop offset="95%" stopColor={colors.TextGradientOne} stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d="M0,250 Q100,200 200,230 T400,150 T600,180 T800,100 T1000,140 V300 H0 Z" fill="url(#companyAnalyticsGrad)" />
                  <path d="M0,250 Q100,200 200,230 T400,150 T600,180 T800,100 T1000,140" fill="none" stroke={colors.TextGradientOne} strokeLinecap="round" strokeWidth="4" />
                </svg>
              </div>
            </div>
          </article>
          <article className={styles.panel}>
            <div className={styles.panelPad}>
              <h3 className={styles.panelTitle}>Success Rate</h3>
              <p className={styles.subtitle}>Transaction health status.</p>
              <div className={styles.donutWrap}>
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" fill="transparent" r="40" stroke={colors.BackgroundSecondary} strokeWidth="8" />
                  <circle cx="50" cy="50" fill="transparent" r="40" stroke={colors.TextGradientTwo} strokeDasharray="251.2" strokeDashoffset="17.3" strokeLinecap="round" strokeWidth="8" />
                </svg>
                <div className={styles.donutCenter}>
                  <span className={styles.statValue}>93.1%</span>
                  <span className={styles.statLabel}>Efficiency</span>
                </div>
              </div>
              <button className={styles.primaryButton} onClick={() => navigate({ to: "/company_profile" })} type="button">
                Open Profile
              </button>
            </div>
          </article>
        </section>
      </div>
    </CompanyShell>
  );
};

export default CompanyAnalytics;
