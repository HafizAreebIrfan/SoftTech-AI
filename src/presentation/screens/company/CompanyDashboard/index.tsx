import React, { FC, useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useThemeStore } from "../../../../infrastructure/store/themeStore";
import { useAuthStore } from "../../../../infrastructure/store/authStore";
import { showToast } from "../../../../utils/toast";
import {
  RocketIcon,
  DatabaseIcon,
  LayoutGridIcon,
  TerminalIcon,
  SlidersIcon,
  SunIcon,
  MoonIcon,
  UserIcon,
  ClipboardIcon,
  SparklesIcon,
  TrendingUpIcon,
} from "../../../../assets/icons";
import { logout } from "../../../../adapters/api/authApi";
import styles from "../../../../styles/dashboard.module.css";

import ApiManagement from "../ApiManagement";
import Profile from "../Profile";
import CompanyAnalytics from "../CompanyAnalytics";
import McpSimulation from "../../onboarding/McpSimulation";
import Upgrade from "../../onboarding/Upgrade";

type ActiveTabType =
  | "dashboard"
  | "apis"
  | "simulation"
  | "analytics"
  | "settings"
  | "upgrade";

const CompanyDashboard: FC = () => {
  const navigate = useNavigate();
  const { colors, isDark, toggleTheme } = useThemeStore();
  const { user, apisList, clearAuth } = useAuthStore();

  const getTabFromUrl = (): ActiveTabType => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab") as ActiveTabType;
      if (
        tab &&
        [
          "dashboard",
          "apis",
          "simulation",
          "analytics",
          "settings",
          "upgrade",
        ].includes(tab)
      ) {
        return tab;
      }
    }
    return "dashboard";
  };

  const [activeTab, setActiveTabState] = useState<ActiveTabType>(getTabFromUrl);

  const setActiveTab = (tab: ActiveTabType) => {
    setActiveTabState(tab);
    if (typeof window !== "undefined") {
      const newUrl =
        tab === "dashboard"
          ? window.location.pathname
          : `${window.location.pathname}?tab=${tab}`;
      window.history.pushState({ tab }, "", newUrl);
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      setActiveTabState(getTabFromUrl());
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showToast("Copied to clipboard!", "info");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleLogout = () => {
    logout()
      .then(() => {
        clearAuth();
        showToast("Signed out successfully.", "success");
        navigate({ to: "/login" });
      })
      .catch((err: any) => {
        showToast(
          err.message || "Failed to sign out. Please try again.",
          "error",
        );
      });
  };

  const companyId = user?.id || "softtech-tenant";
  const openApiUrl = `https://mcp.softtech.ai/gateway/${companyId}/openapi.json`;
  const sseGatewayUrl = `https://mcp.softtech.ai/gateway/${companyId}/sse`;

  const enabledCount = apisList.filter(
    (a) => a.uiConfig?.uiEnabled !== false,
  ).length;

  const selectedThemeColor =
    (user as any)?.uiPreference?.themeColor ||
    colors.SwatchIndigo ||
    "#6366f1";

  const getMethodClass = (method: string) => {
    switch (method?.toUpperCase()) {
      case "GET":
        return styles.methodGet;
      case "POST":
        return styles.methodPost;
      case "PUT":
        return styles.methodPut;
      case "PATCH":
        return styles.methodPatch;
      case "DELETE":
        return styles.methodDelete;
      default:
        return styles.methodGet;
    }
  };

  return (
    <div className={styles.dashboardWrapper}>
      {/* Sidebar Panel */}
      <aside className={styles.sidebar}>
        <div className="flex flex-col gap-6">
          <div className={styles.logoArea}>
            <RocketIcon size={24} color={colors.TextHighlightedHeading} />
            <span className={styles.logoText}>SoftTech AI</span>
          </div>

          <nav className={styles.navLinks}>
            <a
              href="/company-dashboard"
              onClick={(e) => {
                e.preventDefault();
                setActiveTab("dashboard");
              }}
              className={`${styles.navLink} ${
                activeTab === "dashboard" ? styles.navLinkActive : ""
              }`}
            >
              <LayoutGridIcon
                size={18}
                color={
                  activeTab === "dashboard"
                    ? colors.TextHighlightedHeading
                    : colors.IconColor
                }
              />
              <span>Dashboard</span>
            </a>

            <a
              href="/company-dashboard?tab=apis"
              onClick={(e) => {
                e.preventDefault();
                setActiveTab("apis");
              }}
              className={`${styles.navLink} ${
                activeTab === "apis" ? styles.navLinkActive : ""
              }`}
            >
              <DatabaseIcon
                size={18}
                color={
                  activeTab === "apis"
                    ? colors.TextHighlightedHeading
                    : colors.IconColor
                }
              />
              <span>API Management</span>
            </a>

            <a
              href="/company-dashboard?tab=simulation"
              onClick={(e) => {
                e.preventDefault();
                setActiveTab("simulation");
              }}
              className={`${styles.navLink} ${
                activeTab === "simulation" ? styles.navLinkActive : ""
              }`}
            >
              <TerminalIcon
                size={18}
                color={
                  activeTab === "simulation"
                    ? colors.TextHighlightedHeading
                    : colors.IconColor
                }
              />
              <span>MCP Simulation</span>
            </a>

            <a
              href="/company-dashboard?tab=analytics"
              onClick={(e) => {
                e.preventDefault();
                setActiveTab("analytics");
              }}
              className={`${styles.navLink} ${
                activeTab === "analytics" ? styles.navLinkActive : ""
              }`}
            >
              <TrendingUpIcon
                size={18}
                color={
                  activeTab === "analytics"
                    ? colors.TextHighlightedHeading
                    : colors.IconColor
                }
              />
              <span>Analytics</span>
            </a>

            <a
              href="/company-dashboard?tab=settings"
              onClick={(e) => {
                e.preventDefault();
                setActiveTab("settings");
              }}
              className={`${styles.navLink} ${
                activeTab === "settings" ? styles.navLinkActive : ""
              }`}
            >
              <SlidersIcon
                size={18}
                color={
                  activeTab === "settings"
                    ? colors.TextHighlightedHeading
                    : colors.IconColor
                }
              />
              <span>Settings &amp; Profile</span>
            </a>

            <a
              href="/company-dashboard?tab=upgrade"
              onClick={(e) => {
                e.preventDefault();
                setActiveTab("upgrade");
              }}
              className={`${styles.navLink} ${
                activeTab === "upgrade" ? styles.navLinkActive : ""
              }`}
            >
              <SparklesIcon
                size={18}
                color={
                  activeTab === "upgrade"
                    ? colors.TextHighlightedHeading
                    : colors.IconColor
                }
              />
              <span>Upgrade Plan</span>
            </a>
          </nav>
        </div>

        <div className={styles.sidebarBottom}>
          <div className={styles.userCard}>
            <div className={styles.userAvatar}>
              <UserIcon size={18} color="currentColor" />
            </div>
            <div className={styles.userInfo}>
              <span className={styles.companyName}>
                {user?.name || "Nexus Corp"}
              </span>
              <span className={styles.userEmail}>
                {user?.email || "admin@company.com"}
              </span>
            </div>
          </div>

          <button onClick={handleLogout} className={styles.logoutBtn}>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={styles.mainContent}>
        {/* Top Header */}
        <header className={styles.dashboardHeader}>
          <div>
            <h1 className={styles.welcomeTitle}>
              {user?.name || "Company"} Console
            </h1>
            <p className={styles.subtitle}>
              Manage API connections, telemetry, and ChatGPT interactive widget
              configurations.
            </p>
          </div>

          <div className={styles.headerActions}>
            <button
              onClick={toggleTheme}
              className={styles.themeBtn}
              aria-label="Toggle theme"
            >
              {isDark ? (
                <SunIcon size={18} color="currentColor" />
              ) : (
                <MoonIcon size={18} color="currentColor" />
              )}
            </button>
          </div>
        </header>

        {/* Tab 1: Dashboard Overview */}
        {activeTab === "dashboard" && (
          <div className="flex flex-col gap-6">
            {/* Executive Stat Cards */}
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statHeader}>
                  <span className={styles.statTitle}>Connected MCP Tools</span>
                  <div className={styles.statIcon}>
                    <DatabaseIcon size={18} color="currentColor" />
                  </div>
                </div>
                <div className={styles.statValue}>{apisList.length}</div>
                <div className={styles.statSubtextActive}>
                  <span>✓ {enabledCount} active in ChatGPT widget</span>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statHeader}>
                  <span className={styles.statTitle}>Gateway Protocol</span>
                  <div className={styles.statIcon}>
                    <TerminalIcon size={18} color="currentColor" />
                  </div>
                </div>
                <div className={styles.statValue}>
                  <span className="flex items-center gap-2">
                    <span className={styles.pulseDot} />
                    SSE Active
                  </span>
                </div>
                <div className={styles.statSubtext}>
                  <span>Latency: &lt;24ms • OpenAPI 3.1</span>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statHeader}>
                  <span className={styles.statTitle}>Platform Plan</span>
                  <div className={styles.statIcon}>
                    <RocketIcon size={18} color="currentColor" />
                  </div>
                </div>
                <div className={styles.statValue}>
                  {(user as any)?.plan || "Neural Pro"}
                </div>
                <div className={styles.statSubtext}>
                  <span>100,000 requests / month</span>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statHeader}>
                  <span className={styles.statTitle}>Brand Accent Theme</span>
                  <button
                    type="button"
                    onClick={() => setActiveTab("settings")}
                    className={styles.tableLink}
                  >
                    Edit ↗
                  </button>
                </div>
                <div className="flex items-center gap-2.5 mt-1">
                  <div
                    className="w-6 h-6 rounded-md shadow-sm border border-white/20"
                    style={{ backgroundColor: selectedThemeColor }}
                  />
                  <span className="text-base font-mono font-bold text-slate-100">
                    {selectedThemeColor}
                  </span>
                </div>
                <div className="text-xs text-slate-400 mt-1 capitalize">
                  {((user as any)?.uiPreference?.audienceDefault as any) ||
                    "Customer"}{" "}
                  Audience Active
                </div>
              </div>
            </div>

            {/* Protocol Gateway Integration Card */}
            <div className={styles.gatewayCard}>
              <div className={styles.gatewayHeader}>
                <div>
                  <h3 className={styles.gatewayTitle}>
                    <SparklesIcon size={18} color="var(--app-card-active-border)" />
                    <span>ChatGPT Model Context Protocol Gateway</span>
                  </h3>
                  <p className={styles.gatewayDesc}>
                    Connect these live endpoints into your Custom GPT actions or
                    OpenAI Enterprise manifests.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab("simulation")}
                  className={styles.simulateBtn}
                >
                  <RocketIcon size={14} color="currentColor" />
                  <span>Test in Simulation</span>
                </button>
              </div>

              <div className={styles.gatewayGrid}>
                {/* OpenAPI URL */}
                <div className={styles.gatewayBox}>
                  <div className={styles.gatewayBoxHeader}>
                    <span className={styles.gatewayBoxTitle}>
                      OpenAPI 3.1 Specification URL
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(openApiUrl, "openapi")}
                      className={styles.copyBtn}
                    >
                      <ClipboardIcon size={13} color="currentColor" />
                      <span>
                        {copiedKey === "openapi" ? "Copied!" : "Copy URL"}
                      </span>
                    </button>
                  </div>
                  <div className={styles.codeBox}>{openApiUrl}</div>
                </div>

                {/* SSE Gateway URL */}
                <div className={styles.gatewayBox}>
                  <div className={styles.gatewayBoxHeader}>
                    <span className={styles.gatewayBoxTitle}>
                      MCP SSE Real-time Tunnel
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(sseGatewayUrl, "sse")}
                      className={styles.copyBtn}
                    >
                      <ClipboardIcon size={13} color="currentColor" />
                      <span>
                        {copiedKey === "sse" ? "Copied!" : "Copy URL"}
                      </span>
                    </button>
                  </div>
                  <div className={styles.codeBox}>{sseGatewayUrl}</div>
                </div>
              </div>
            </div>

            {/* Tools Summary Table */}
            <div className={styles.tableCard}>
              <div className={styles.tableCardHeader}>
                <div>
                  <h3 className={styles.tableCardTitle}>
                    Registered Tools &amp; Actions
                  </h3>
                  <p className={styles.subtitle}>
                    Live endpoints bridged by SoftTech AI Model Context Protocol.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab("apis")}
                  className={styles.tableLink}
                >
                  Manage All Tools ↗
                </button>
              </div>

              {apisList.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  No API tools connected yet. Connect your first API in the API
                  Management tab.
                </div>
              ) : (
                <div className={styles.tableWrapper}>
                  <table className={styles.summaryTable}>
                    <thead>
                      <tr>
                        <th className={styles.summaryTh}>Tool Name</th>
                        <th className={styles.summaryTh}>MCP Identifier</th>
                        <th className={styles.summaryTh}>Method</th>
                        <th className={styles.summaryTh}>Endpoint</th>
                        <th className={styles.summaryTh}>Widget UI</th>
                        <th className={`${styles.summaryTh} text-right`}>
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {apisList.map((api, idx) => {
                        const isWidgetOn = api.uiConfig?.uiEnabled !== false;

                        return (
                          <tr key={api.id || idx} className={styles.summaryTr}>
                            <td className={`${styles.summaryTd} ${styles.toolNameCol}`}>
                              {api.apiName || `Tool #${idx + 1}`}
                            </td>
                            <td className={`${styles.summaryTd} ${styles.toolMcpCol}`}>
                              {api.mcpToolName ||
                                api.apiName?.toLowerCase().replace(/\s+/g, "_")}
                            </td>
                            <td className={styles.summaryTd}>
                              <span
                                className={`${styles.methodBadge} ${getMethodClass(
                                  api.apiMethod,
                                )}`}
                              >
                                {api.apiMethod || "GET"}
                              </span>
                            </td>
                            <td className={`${styles.summaryTd} ${styles.endpointCol}`}>
                              {api.apiEndpoint}
                            </td>
                            <td className={styles.summaryTd}>
                              <span
                                className={
                                  isWidgetOn
                                    ? styles.widgetPillOn
                                    : styles.widgetPillOff
                                }
                              >
                                {isWidgetOn
                                  ? "Interactive Widget"
                                  : "Text Only"}
                              </span>
                            </td>
                            <td className={`${styles.summaryTd} text-right`}>
                              <button
                                type="button"
                                onClick={() => setActiveTab("simulation")}
                                className={styles.simulateSmallBtn}
                              >
                                Simulate
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: API Management Screen */}
        {activeTab === "apis" && (
          <ApiManagement
            embedMode={true}
            onNavigateToUpgrade={() => setActiveTab("upgrade")}
            onNavigateToSimulation={() => setActiveTab("simulation")}
          />
        )}

        {/* Tab 3: MCP Simulation Screen (Loaded in right side of dashboard) */}
        {activeTab === "simulation" && (
          <McpSimulation isEmbeddedInDashboard={true} />
        )}

        {/* Tab 4: Upgrade Screen (Loaded in right side of dashboard) */}
        {activeTab === "upgrade" && (
          <Upgrade
            isEmbeddedInDashboard={true}
            onGoBack={() => setActiveTab("dashboard")}
          />
        )}

        {/* Tab 5: Company Analytics Screen */}
        {activeTab === "analytics" && <CompanyAnalytics embedMode={true} />}

        {/* Tab 6: Settings & Profile Screen */}
        {activeTab === "settings" && <Profile embedMode={true} />}
      </main>
    </div>
  );
};

export default CompanyDashboard;
