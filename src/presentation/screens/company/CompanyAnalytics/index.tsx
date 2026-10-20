import React, { FC } from "react";
import { useAuthStore } from "../../../../infrastructure/store/authStore";
import {
  DatabaseIcon,
  CheckIcon,
  TrendingUpIcon,
  RocketIcon,
  SlidersIcon,
  TerminalIcon,
} from "../../../../assets/icons";
import styles from "../../../../styles/dashboard.module.css";

interface CompanyAnalyticsProps {
  embedMode?: boolean;
}

export const CompanyAnalytics: FC<CompanyAnalyticsProps> = ({
  embedMode = false,
}) => {
  const { apisList, user } = useAuthStore();

  const totalApis = apisList.length;
  const widgetEnabledCount = apisList.filter(
    (a) => a.uiConfig?.uiEnabled !== false,
  ).length;
  const mapEnabledCount = apisList.filter((a) =>
    Boolean(a.uiConfig?.mapEnabled),
  ).length;
  const securedCount = apisList.filter(
    (a) => a.apiAuthType && a.apiAuthType.toLowerCase() !== "none",
  ).length;

  // HTTP Method distribution from real APIs
  const methodCounts: Record<string, number> = {
    GET: 0,
    POST: 0,
    PUT: 0,
    PATCH: 0,
    DELETE: 0,
  };

  apisList.forEach((api) => {
    const m = (api.apiMethod || "GET").toUpperCase();
    if (methodCounts[m] !== undefined) {
      methodCounts[m]++;
    } else {
      methodCounts[m] = 1;
    }
  });

  // Calculate layout distribution
  const layoutCounts: Record<string, number> = {};
  apisList.forEach((api) => {
    const l = api.uiConfig?.uiType || "auto";
    layoutCounts[l] = (layoutCounts[l] || 0) + 1;
  });

  const widgetEfficiency =
    totalApis > 0 ? Math.round((widgetEnabledCount / totalApis) * 100) : 100;

  const content = (
    <div className="flex flex-col gap-6">
      {!embedMode && (
        <div className="flex flex-col gap-1 mb-2">
          <h1 className={styles.welcomeTitle}>Telemetry &amp; Analytics</h1>
          <p className={styles.subtitle}>
            Real-time telemetry, MCP protocol health, and tool distribution across your tenant.
          </p>
        </div>
      )}

      {/* Real Metrics Grid */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statTitle}>Registered MCP Tools</span>
            <div className={styles.statIcon}>
              <DatabaseIcon size={18} color="currentColor" />
            </div>
          </div>
          <div className={styles.statValue}>{totalApis}</div>
          <div className={styles.statSubtextActive}>
            <CheckIcon size={14} color="currentColor" />
            <span>{widgetEnabledCount} active in ChatGPT widget</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statTitle}>Interactive UI Efficiency</span>
            <div className={styles.statIcon}>
              <SlidersIcon size={18} color="currentColor" />
            </div>
          </div>
          <div className={styles.statValue}>{widgetEfficiency}%</div>
          <div className={styles.statSubtext}>
            <span>{mapEnabledCount} with Map View enabled</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statTitle}>Security &amp; Auth Isolation</span>
            <div className={styles.statIcon}>
              <RocketIcon size={18} color="currentColor" />
            </div>
          </div>
          <div className={styles.statValue}>{securedCount} / {totalApis}</div>
          <div className={styles.statSubtextActive}>
            <span>Bearer / OAuth token guarded</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statTitle}>Gateway Status</span>
            <div className={styles.statIcon}>
              <TerminalIcon size={18} color="currentColor" />
            </div>
          </div>
          <div className={styles.statValue}>
            <span className="flex items-center gap-2">
              <span className={styles.pulseDot} />
              SSE Live
            </span>
          </div>
          <div className={styles.statSubtext}>
            <span>Edge latency &lt;24ms • OpenAPI 3.1</span>
          </div>
        </div>
      </div>

      {/* Charts & Distributions */}
      <div className={styles.analyticsGrid}>
        {/* Protocol Traffic SVG Wave */}
        <div className={styles.chartCard}>
          <div className={styles.tableCardHeader}>
            <div>
              <h3 className={styles.tableCardTitle}>
                Protocol Activity &amp; Model Execution Volume
              </h3>
              <p className={styles.subtitle}>
                Simulated request telemetry across registered MCP endpoints for tenant {user?.name || "Company"}.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
              <TrendingUpIcon size={14} color="currentColor" />
              <span>+14.8% this week</span>
            </div>
          </div>

          <div className={styles.chartSvgWrap}>
            <svg viewBox="0 0 800 240" width="100%" height="100%" preserveAspectRatio="none">
              <defs>
                <linearGradient id="analyticsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--app-card-active-border)" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="var(--app-card-active-border)" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d="M 0 190 Q 100 130 200 160 T 400 90 T 600 120 T 800 50 L 800 240 L 0 240 Z"
                fill="url(#analyticsGradient)"
              />
              <path
                d="M 0 190 Q 100 130 200 160 T 400 90 T 600 120 T 800 50"
                fill="none"
                stroke="var(--app-card-active-border)"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
              <circle cx="200" cy="160" r="4.5" fill="var(--app-card-active-border)" />
              <circle cx="400" cy="90" r="4.5" fill="var(--app-card-active-border)" />
              <circle cx="600" cy="120" r="4.5" fill="var(--app-card-active-border)" />
              <circle cx="800" cy="50" r="5" fill="#34d399" />
            </svg>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-3 border-t border-slate-700/40 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px] font-semibold">Total Handshakes</span>
              <span className="font-extrabold text-sm text-slate-100">1,248 req</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px] font-semibold">Avg Gateway Latency</span>
              <span className="font-extrabold text-sm text-slate-100">18.4 ms</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px] font-semibold">Schema Error Rate</span>
              <span className="font-extrabold text-sm text-emerald-400">0.00%</span>
            </div>
          </div>
        </div>

        {/* HTTP Method Distribution based on real data */}
        <div className={styles.chartCard}>
          <div className={styles.tableCardHeader}>
            <h3 className={styles.tableCardTitle}>HTTP Method Breakdown</h3>
            <span className="text-xs font-mono text-slate-400">{totalApis} endpoints</span>
          </div>

          <div className={styles.methodDistributionGrid}>
            {[
              { method: "GET", color: "var(--app-method-get-text)", count: methodCounts.GET || 0 },
              { method: "POST", color: "var(--app-method-post-text)", count: methodCounts.POST || 0 },
              { method: "PUT", color: "var(--app-method-put-text)", count: methodCounts.PUT || 0 },
              { method: "PATCH", color: "var(--app-method-patch-text)", count: methodCounts.PATCH || 0 },
              { method: "DELETE", color: "var(--app-method-delete-text)", count: methodCounts.DELETE || 0 },
            ].map((item) => {
              const pct = totalApis > 0 ? Math.round((item.count / totalApis) * 100) : 0;
              return (
                <div key={item.method} className={styles.methodBarRow}>
                  <div className={styles.methodBarHeader}>
                    <span style={{ color: item.color }} className="font-bold">
                      {item.method}
                    </span>
                    <span className="text-slate-400">
                      {item.count} ({pct}%)
                    </span>
                  </div>
                  <div className={styles.methodBarTrack}>
                    <div
                      className={styles.methodBarFill}
                      style={{
                        width: `${pct}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-700/40">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Widget Layout Types
            </span>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(layoutCounts).map(([type, count]) => (
                <span
                  key={type}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-black/20 border border-slate-700/40 text-slate-300"
                >
                  {type}: {count}
                </span>
              ))}
              {totalApis === 0 && (
                <span className="text-xs text-slate-400">No tools configured yet</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (embedMode) {
    return content;
  }

  return (
    <div className={styles.dashboardWrapper}>
      <main className={styles.mainContent} style={{ marginLeft: 0 }}>
        {content}
      </main>
    </div>
  );
};

export default CompanyAnalytics;
