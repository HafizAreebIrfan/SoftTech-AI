import React, { useEffect, useState } from "react";
import { useThemeStore } from "../../../../../hooks/usetheme";
import s from "../../../../../styles/adminlayout.module.css";
import {
  getAdminStats,
  getAdminTopCompanies,
  getAdminCharts,
  AdminDashboardStats,
  AdminCompanyItem,
} from "../../../../../adapters/api/adminApi";

const BAR_HEIGHTS = [
  { bg: "66%", fill: "50%" },
  { bg: "50%", fill: "66%" },
  { bg: "75%", fill: "33%" },
  { bg: "83%", fill: "75%" },
  { bg: "66%", fill: "50%" },
  { bg: "80%", fill: "66%" },
];

const DashboardTab: React.FC = () => {
  const { colors } = useThemeStore();
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [recentCompanies, setRecentCompanies] = useState<AdminCompanyItem[]>([]);
  const [filterQuery, setFilterQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchDashboardData = async () => {
      try {
        const [statsRes, topRes] = await Promise.allSettled([
          getAdminStats(),
          getAdminTopCompanies(6),
        ]);

        if (isMounted) {
          if (statsRes.status === "fulfilled" && statsRes.value?.success) {
            setStats(statsRes.value.data);
          }
          if (topRes.status === "fulfilled" && topRes.value?.success) {
            setRecentCompanies(topRes.value.data || []);
          }
        }
      } catch (err) {
        console.warn("Failed to load admin dashboard data:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDashboardData();
    return () => {
      isMounted = false;
    };
  }, []);

  const totalCompaniesCount = stats?.totalCompanies ?? 0;
  const publishedCount = stats?.publishedCompanies ?? 0;
  const lifetimeRevenue = stats?.lifetimeEarnings ?? stats?.revenueThisYear ?? 0;
  const revenueFormatted =
    lifetimeRevenue >= 1000
      ? `$${(lifetimeRevenue / 1000).toFixed(1)}K`
      : `$${lifetimeRevenue}`;

  const statCards = [
    {
      label: "Total Companies",
      value: loading ? "..." : String(totalCompaniesCount),
      badge: `+${stats?.onboardingCompanies ?? 0} in onboarding`,
      badgeType: "green",
      icon: "corporate_fare",
      accent: "primary",
      bar: totalCompaniesCount > 0 ? "85%" : "20%",
    },
    {
      label: "Published Tenants",
      value: loading ? "..." : String(publishedCount),
      badge: "Production Active",
      badgeType: "green",
      icon: "hub",
      accent: "secondary",
      bar: publishedCount > 0 ? "70%" : "30%",
    },
    {
      label: "Platform Revenue",
      value: loading ? "..." : revenueFormatted,
      badge: "Annualized",
      badgeType: "green",
      icon: "payments",
      accent: "tertiary",
      bar: "80%",
    },
    {
      label: "System Health",
      value: "Optimal",
      badge: "SSE & Mongo Live",
      badgeType: "green",
      icon: "memory",
      accent: "error",
      bar: "95%",
    },
  ];

  const filteredCompanies = recentCompanies.filter((co) => {
    if (!filterQuery.trim()) return true;
    const q = filterQuery.toLowerCase();
    return (
      (co.companyName || co.name || "").toLowerCase().includes(q) ||
      co.email.toLowerCase().includes(q) ||
      (co.industry || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className={s.contentCanvas}>
      {/* ── Stat Cards ── */}
      <div className={s.statGrid}>
        {statCards.map((card) => (
          <div key={card.label} className={s.statCard}>
            <div className={s.statCardTop}>
              <span className={s.statCardLabel}>{card.label}</span>
              <span
                className={`material-symbols-outlined ${s.statCardIcon} ${
                  s[card.accent as keyof typeof s]
                }`}
              >
                {card.icon}
              </span>
            </div>
            <div className={s.statCardValue}>
              <span className={s.statCardNumber}>{card.value}</span>
              <span
                className={
                  card.badgeType === "green"
                    ? s.statCardBadgeGreen
                    : s.statCardBadgeGray
                }
              >
                {card.badge}
              </span>
            </div>
            <div className={s.statCardBar}>
              <div
                className={`${s.statCardBarFill} ${
                  s[card.accent as keyof typeof s]
                }`}
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
              <p className={s.chartCardSub}>
                Tenant registrations and subscription scaling
              </p>
            </div>
            <button className={s.chartIconBtn}>
              <span
                className="material-symbols-outlined"
                style={{ fontSize: "1.25rem", color: "#94a3b8" }}
              >
                more_horiz
              </span>
            </button>
          </div>

          <div
            className={s.areaChartWrapper}
            style={{ height: "16rem", position: "relative" }}
          >
            <svg
              viewBox="0 0 400 100"
              preserveAspectRatio="none"
              className={s.areaChartSvg}
              style={{
                width: "100%",
                height: "100%",
                position: "absolute",
                inset: 0,
              }}
            >
              <defs>
                <linearGradient id="dashGrad" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#9fa7ff" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#9fa7ff" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M0,80 Q50,75 100,60 T200,40 T300,50 T400,20 V100 H0 Z"
                fill="url(#dashGrad)"
              />
              <path
                d="M0,80 Q50,75 100,60 T200,40 T300,50 T400,20"
                fill="none"
                stroke="#9fa7ff"
                strokeWidth="2"
              />
            </svg>
            <div
              className={s.chartXLabels}
              style={{ position: "absolute", bottom: 0, width: "100%" }}
            >
              {["Q1", "Q2", "Q3", "Q4"].map((l) => (
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
              <p className={s.chartCardSub}>
                Platform earnings distribution across active tenants
              </p>
            </div>
            <div className={s.revenueLegendChip}>
              <span className={s.revenueLegendDot} />
              Actual
            </div>
          </div>

          <div className={s.barChartArea}>
            {BAR_HEIGHTS.map((b, i) => (
              <div key={i} className={s.barWrapper} style={{ height: "100%" }}>
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
          <h4 className={s.tableSectionTitle}>Active Platform Tenants</h4>
          <div className={s.tableControls}>
            <div className={s.searchWrapper}>
              <span className={`material-symbols-outlined ${s.searchIcon}`}>
                search
              </span>
              <input
                type="text"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder="Filter entities..."
                className={s.searchInput}
              />
            </div>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className={s.dataTable}>
            <thead>
              <tr>
                {["Company", "Industry", "Plan", "APIs", "Status"].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredCompanies.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "2rem" }}>
                    <span style={{ color: colors.TextSecondary, fontSize: "0.85rem" }}>
                      {loading
                        ? "Loading platform tenants..."
                        : "No company records found."}
                    </span>
                  </td>
                </tr>
              ) : (
                filteredCompanies.map((co) => {
                  const cName = co.companyName || co.name || "Tenant";
                  const planName = (co.plan || co.currentPlan || "Pro").toUpperCase();
                  const apisTotal = co.apisCount ?? co.apiCount ?? co.apis?.length ?? 0;
                  const statusText = co.status || "Active";
                  const isActive =
                    statusText.toLowerCase() === "active" ||
                    statusText.toLowerCase() === "published";

                  return (
                    <tr key={co.id || co._id || cName}>
                      <td>
                        <div className={s.companyCell}>
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
                            {cName.slice(0, 2).toUpperCase()}
                          </div>
                          <span className={s.companyName}>{cName}</span>
                        </div>
                      </td>
                      <td>{co.industry || "Technology"}</td>
                      <td>
                        <span className={`${s.planBadge} ${s.enterprise}`}>
                          {planName}
                        </span>
                      </td>
                      <td style={{ color: colors.TextSecondary }}>
                        {apisTotal} Active
                      </td>
                      <td>
                        <div className={s.statusRow}>
                          <span
                            className={`${s.statusDot} ${
                              isActive ? s.active : s.overdue
                            }`}
                          />
                          <span
                            style={{
                              fontSize: "0.75rem",
                              color: colors.TextSecondary,
                            }}
                          >
                            {statusText}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DashboardTab;
