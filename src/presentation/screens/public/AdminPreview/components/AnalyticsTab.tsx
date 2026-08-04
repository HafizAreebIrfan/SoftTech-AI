import React from "react";
import { useThemeStore } from "../../../../../hooks/usetheme";
import s from "../../../../../styles/adminlayout.module.css";

/* ──────────────────────────────────────
   Static mock data – matches the design
────────────────────────────────────── */
const STAT_CARDS = [
  {
    icon: "search_activity",
    accent: "primary",
    badge: "+12.5%",
    badgeAccent: "primary",
    label: "This Month",
    value: "84.2K",
  },
  {
    icon: "timer",
    accent: "secondary",
    badge: "-8ms",
    badgeAccent: "secondary",
    label: "Avg Response",
    value: "142ms",
  },
  {
    icon: "check_circle",
    accent: "tertiary",
    badge: "Optimal",
    badgeAccent: "tertiary",
    label: "Uptime",
    value: "99.7%",
  },
  {
    icon: "computer",
    accent: "error",
    badge: "High",
    badgeAccent: "error",
    label: "GPT Usage",
    value: "12.4K",
  },
];

/* ──────────────────────────────────────
   Component
────────────────────────────────────── */
const AnalyticsTab: React.FC = () => {
  const { colors } = useThemeStore();

  return (
    <div className={s.contentCanvas}>
      {/* ── Page heading ── */}
      <div className={s.pageHeadingRow}>
        <h2 className={s.pageHeadingTitle}>Analytics</h2>
        <p className={s.pageHeadingDesc} style={{ color: colors.TextSecondary }}>
          Real-time telemetry and protocol performance across the interstellar API grid.
        </p>
      </div>

      {/* ── 4 stat cards ── */}
      <div className={s.analyticsStatGrid}>
        {STAT_CARDS.map((card) => (
          <div key={card.label} className={s.analyticsStatCard}>
            <div className={s.analyticsStatCardTop}>
              <span className={`material-symbols-outlined ${s.analyticsStatIcon} ${s[card.accent as keyof typeof s]}`}>
                {card.icon}
              </span>
              <span className={`${s.analyticsStatBadge} ${s[card.badgeAccent as keyof typeof s]}`}>
                {card.badge}
              </span>
            </div>
            <p className={s.analyticsStatLabel}>{card.label}</p>
            <h3 className={s.analyticsStatValue}>{card.value}</h3>
          </div>
        ))}
      </div>

      {/* ── Charts: Area + Donut ── */}
      <div className={s.analyticsChartsGrid}>
        {/* Area chart – API Calls Last 30 Days */}
        <div className={s.analyticsChartCard}>
          <div className={s.analyticsChartHeader}>
            <div>
              <h4 className={s.analyticsChartTitle}>API Calls — Last 30 Days</h4>
              <p className={s.analyticsChartSub}>Aggregate request volume across all protocols.</p>
            </div>
            <button className={s.downloadBtn}>
              <span className="material-symbols-outlined" style={{ fontSize: "1rem", color: "#64748b" }}>
                download
              </span>
            </button>
          </div>

          <div className={s.fullAreaWrapper}>
            <svg viewBox="0 0 1000 300" className={s.fullAreaSvg} preserveAspectRatio="none">
              <defs>
                <linearGradient id="analyticsGrad" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="5%"  stopColor="#818cf8" stopOpacity="0.3" />
                  <stop offset="95%" stopColor="#818cf8" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M0,250 Q100,200 200,230 T400,150 T600,180 T800,100 T1000,140 V300 H0 Z"
                fill="url(#analyticsGrad)"
              />
              <path
                d="M0,250 Q100,200 200,230 T400,150 T600,180 T800,100 T1000,140"
                fill="none"
                stroke="#818cf8"
                strokeWidth="4"
                strokeLinecap="round"
              />
            </svg>
            {/* Y-axis labels */}
            <div className={s.yAxisLabels}>
              {["100K", "75K", "50K", "25K", "0"].map((l) => (
                <span key={l}>{l}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Donut – Success Rate */}
        <div className={s.donutCard}>
          <div style={{ width: "100%", textAlign: "left", marginBottom: "1.5rem" }}>
            <h4 className={s.analyticsChartTitle}>Success Rate</h4>
            <p className={s.analyticsChartSub}>Transaction health status.</p>
          </div>

          <div className={s.donutWrapper}>
            <svg viewBox="0 0 100 100" className={s.donutSvg}>
              {/* Track */}
              <circle cx="50" cy="50" r="40" fill="transparent" stroke={colors.BackgroundSecondary} strokeWidth="8" />
              {/* Fill – 93.1% of circumference (2πr ≈ 251.2) → offset ≈ 17.3 */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                stroke="#a88cfb"
                strokeWidth="8"
                strokeDasharray="251.2"
                strokeDashoffset="17.3"
                strokeLinecap="round"
              />
            </svg>
            <div className={s.donutCenter}>
              <span className={s.donutValue}>93.1%</span>
              <span className={s.donutLabel}>Efficiency</span>
            </div>
          </div>

          <div className={s.donutLegend}>
            <div className={s.donutLegendRow}>
              <div className={s.donutLegendLeft}>
                <span className={s.donutLegendDot} style={{ background: "#a88cfb" }} />
                <span className={s.donutLegendKey}>Success</span>
              </div>
              <span className={s.donutLegendVal}>2.4M</span>
            </div>
            <div className={s.donutLegendRow}>
              <div className={s.donutLegendLeft}>
                <span className={s.donutLegendDot} style={{ background: "#ff6e84" }} />
                <span className={s.donutLegendKey}>Failure</span>
              </div>
              <span className={s.donutLegendVal}>142K</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsTab;
