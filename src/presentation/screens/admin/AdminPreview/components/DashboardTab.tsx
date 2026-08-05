import React from "react";
import { useThemeStore } from "../../../../../hooks/usetheme";
import s from "../../../../../styles/adminlayout.module.css";

/* ──────────────────────────────────────────────
   Static mock data (matches the design exactly)
─────────────────────────────────────────────── */
const STAT_CARDS = [
  { label: "Total Companies", value: "1,284", badge: "+12%", badgeType: "green", icon: "corporate_fare", accent: "primary", bar: "75%" },
  { label: "Active Integrations", value: "8,432", badge: "+5.4%", badgeType: "green", icon: "hub", accent: "secondary", bar: "50%" },
  { label: "Revenue MRR", value: "$847K", badge: "+22%", badgeType: "green", icon: "payments", accent: "tertiary", bar: "80%" },
  { label: "GPT Usage", value: "48.2K", badge: "tokens/hr", badgeType: "gray", icon: "memory", accent: "error", bar: "66%" },
];

const RECENT_COMPANIES = [
  { name: "NexGen Systems", industry: "Artificial Intelligence", plan: "ENTERPRISE", planClass: "enterprise", apis: "12 Active", status: "Active", statusClass: "active" },
  { name: "Vortex Analytics", industry: "Big Data", plan: "GROWTH", planClass: "growth", apis: "4 Active", status: "Active", statusClass: "active" },
  { name: "Lumina Studios", industry: "Creative Tech", plan: "BASIC", planClass: "basic", apis: "2 Active", status: "Overdue", statusClass: "overdue" },
  { name: "Quant Financial", industry: "FinTech", plan: "ENTERPRISE", planClass: "enterprise", apis: "28 Active", status: "Active", statusClass: "active" },
];

/* Fake bar chart data for Revenue Trend */
const BAR_HEIGHTS = [
  { bg: "66%", fill: "50%" },
  { bg: "50%", fill: "66%" },
  { bg: "75%", fill: "33%" },
  { bg: "83%", fill: "75%" },
  { bg: "66%", fill: "50%" },
  { bg: "80%", fill: "66%" },
];

/* ──────────────────────────────────────────────
   Component
─────────────────────────────────────────────── */
const DashboardTab: React.FC = () => {
  const { colors } = useThemeStore();

  return (
    <div className={s.contentCanvas}>
      {/* ── Stat Cards ── */}
      <div className={s.statGrid}>
        {STAT_CARDS.map((card) => (
          <div key={card.label} className={s.statCard}>
            <div className={s.statCardTop}>
              <span className={s.statCardLabel}>{card.label}</span>
              <span className={`material-symbols-outlined ${s.statCardIcon} ${s[card.accent as keyof typeof s]}`}>
                {card.icon}
              </span>
            </div>
            <div className={s.statCardValue}>
              <span className={s.statCardNumber}>{card.value}</span>
              <span className={card.badgeType === "green" ? s.statCardBadgeGreen : s.statCardBadgeGray}>
                {card.badge}
              </span>
            </div>
            <div className={s.statCardBar}>
              <div
                className={`${s.statCardBarFill} ${s[card.accent as keyof typeof s]}`}
                style={{ width: card.bar }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* ── Charts Row ── */}
      <div className={s.chartsGrid}>
        {/* Company Growth – area chart */}
        <div className={s.chartCard}>
          <div className={s.chartCardHeader}>
            <div>
              <p className={s.chartCardTitle}>Company Growth</p>
              <p className={s.chartCardSub}>Subscription scaling over last 30 days</p>
            </div>
            <button className={s.chartIconBtn}>
              <span className="material-symbols-outlined" style={{ fontSize: "1.25rem", color: "#94a3b8" }}>more_horiz</span>
            </button>
          </div>

          <div className={s.areaChartWrapper} style={{ height: "16rem", position: "relative" }}>
            <svg
              viewBox="0 0 400 100"
              preserveAspectRatio="none"
              className={s.areaChartSvg}
              style={{ width: "100%", height: "100%", position: "absolute", inset: 0 }}
            >
              <defs>
                <linearGradient id="dashGrad" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#9fa7ff" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#9fa7ff" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M0,80 Q50,75 100,60 T200,40 T300,50 T400,20 V100 H0 Z" fill="url(#dashGrad)" />
              <path d="M0,80 Q50,75 100,60 T200,40 T300,50 T400,20" fill="none" stroke="#9fa7ff" strokeWidth="2" />
            </svg>
            {/* X labels */}
            <div className={s.chartXLabels} style={{ position: "absolute", bottom: 0, width: "100%" }}>
              {["WK 1", "WK 2", "WK 3", "WK 4"].map((l) => (
                <span key={l}>{l}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Revenue Trend – bar chart */}
        <div className={s.chartCard}>
          <div className={s.chartCardHeader}>
            <div>
              <p className={s.chartCardTitle}>Revenue Trend</p>
              <p className={s.chartCardSub}>Monthly recurring revenue volume</p>
            </div>
            <div className={s.revenueLegendChip}>
              <span className={s.revenueLegendDot} />
              Actual
            </div>
          </div>

          <div className={s.barChartArea}>
            {BAR_HEIGHTS.map((b, i) => (
              <div key={i} className={s.barWrapper} style={{ height: "100%" }}>
                {/* Background bar */}
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: b.bg,
                    borderRadius: "0.5rem 0.5rem 0 0",
                    background: "rgba(168, 140, 251, 0.2)",
                  }}
                />
                {/* Fill bar */}
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: b.fill,
                    borderRadius: "0.5rem 0.5rem 0 0",
                    background: "#a88cfb",
                    transition: "height 0.3s ease",
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Recent Companies Table ── */}
      <div className={s.tableSection}>
        <div className={s.tableSectionHeader}>
          <h4 className={s.tableSectionTitle}>Recent Companies</h4>
          <div className={s.tableControls}>
            {/* Search */}
            <div className={s.searchWrapper}>
              <span className={`material-symbols-outlined ${s.searchIcon}`}>search</span>
              <input
                type="text"
                placeholder="Filter entities..."
                className={s.searchInput}
              />
            </div>
            {/* Export */}
            <button className={s.exportBtn}>
              <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>filter_list</span>
              Export
            </button>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className={s.dataTable}>
            <thead>
              <tr>
                {["Company", "Industry", "Plan", "APIs", "Status", ""].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {RECENT_COMPANIES.map((co) => (
                <tr key={co.name}>
                  <td>
                    <div className={s.companyCell}>
                      {/* Coloured initial */}
                      <div
                        style={{
                          width: "2rem",
                          height: "2rem",
                          borderRadius: "0.5rem",
                          background: colors.BackgroundSecondary,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "0.65rem",
                          fontWeight: 700,
                          color: colors.TextGradientOne,
                          flexShrink: 0,
                        }}
                      >
                        {co.name.slice(0, 2).toUpperCase()}
                      </div>
                      <span className={s.companyName}>{co.name}</span>
                    </div>
                  </td>
                  <td>{co.industry}</td>
                  <td>
                    <span className={`${s.planBadge} ${s[co.planClass as keyof typeof s]}`}>
                      {co.plan}
                    </span>
                  </td>
                  <td style={{ color: colors.TextSecondary }}>{co.apis}</td>
                  <td>
                    <div className={s.statusRow}>
                      <span className={`${s.statusDot} ${s[co.statusClass as keyof typeof s]}`} />
                      <span style={{ fontSize: "0.75rem", color: colors.TextSecondary }}>{co.status}</span>
                    </div>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <button className={s.viewBtn}>View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DashboardTab;
