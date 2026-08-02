import React, { FC, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useThemeStore } from "../../../../infrastructure/store/themeStore";
import { useAuthStore } from "../../../../infrastructure/store/authStore";
import { showToast } from "../../../../utils/toasts";
import {
  RocketIcon,
  DatabaseIcon,
  LayoutGridIcon,
  TerminalIcon,
  SlidersIcon,
  SunIcon,
  MoonIcon,
  UserIcon,
} from "../../../../assets/icons";
import styles from "../../../../styles/dashboard.module.css";
import { logout } from "../../../../adapters/api/authApi";
import CardWidget from "../../../widgets/card";

const Dashboard: FC = () => {
  const navigate = useNavigate();
  const { colors, isDark, toggleTheme } = useThemeStore();
  const { user, apisList, selectedLayout, setSelectedLayout, clearAuth } =
    useAuthStore();
  const [activeTab, setActiveTab] = useState<"dashboard" | "apis" | "settings">(
    "dashboard",
  );

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

  return (
    <div
      className={styles.dashboardWrapper}
      style={{ background: colors.Background, color: colors.TextBody }}
    >
      {/* Sidebar Panel */}
      <aside
        className={styles.sidebar}
        style={{
          background: colors.BackgroundSecondary,
          borderColor: colors.Border,
        }}
      >
        <div className="flex flex-col gap-6">
          <div className={styles.logoArea}>
            <RocketIcon size={24} color={colors.TextHighlightedHeading} />
            <span
              className={styles.logoText}
              style={{
                backgroundImage: `linear-gradient(135deg, ${colors.TextGradientOne}, ${colors.TextGradientTwo}, ${colors.TextGradientThree})`,
              }}
            >
              SoftTech AI
            </span>
          </div>

          <nav className={styles.navLinks}>
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`${styles.navLink} ${activeTab === "dashboard" ? styles.navLinkActive : ""}`}
            >
              <LayoutGridIcon
                size={18}
                color={
                  activeTab === "dashboard"
                    ? colors.TextHighlightedHeading
                    : colors.IconColor
                }
              />
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab("apis")}
              className={`${styles.navLink} ${activeTab === "apis" ? styles.navLinkActive : ""}`}
            >
              <DatabaseIcon
                size={18}
                color={
                  activeTab === "apis"
                    ? colors.TextHighlightedHeading
                    : colors.IconColor
                }
              />
              API Connections
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`${styles.navLink} ${activeTab === "settings" ? styles.navLinkActive : ""}`}
            >
              <SlidersIcon
                size={18}
                color={
                  activeTab === "settings"
                    ? colors.TextHighlightedHeading
                    : colors.IconColor
                }
              />
              UI Curator Settings
            </button>
          </nav>
        </div>

        <div className={styles.sidebarBottom}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-xl">
              <UserIcon size={20} color={colors.TextHighlightedHeading} />
            </div>
            <div className={styles.userInfo}>
              <span
                className={styles.companyName}
                style={{ color: colors.TextHeading }}
              >
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
            <h1
              className={styles.welcomeTitle}
              style={{ color: colors.TextHeading }}
            >
              Welcome {user?.name} Console
            </h1>
            <p className={styles.subtitle}>
              Monitor, refine, and orchestrate company interface streams in
              real-time.
            </p>
          </div>
          <button
            onClick={toggleTheme}
            className={styles.themeBtn}
            aria-label="Toggle theme"
          >
            {isDark ? (
              <SunIcon size={18} color={colors.TextHeading} />
            ) : (
              <MoonIcon size={18} color={colors.TextHeading} />
            )}
          </button>
        </header>

        {activeTab === "dashboard" && (
          <>
            <div
              className={styles.workspaceCard}
              style={{
                background: colors.BackgroundSecondary,
                borderColor: colors.Border,
              }}
            >
              <div className={styles.workspaceHeader}>
                <div>
                  <h3
                    className={styles.workspaceTitle}
                    style={{ color: colors.TextHeading }}
                  >
                    Under Development
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    This page is currently under development. Please check back
                    later.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === "apis" && (
          <div
            className={styles.workspaceCard}
            style={{
              background: colors.BackgroundSecondary,
              borderColor: colors.Border,
            }}
          >
            <h3
              className={styles.workspaceTitle}
              style={{ color: colors.TextHeading }}
            >
              Connected API Connections
            </h3>
            <p className="text-xs text-slate-500">
              Your registered integration streams syncing data feeds to SoftTech
              AI.
            </p>
            <div className="mt-4 space-y-4">
              {apisList.map((api) => (
                <div
                  key={api.id}
                  className="p-5 rounded-2xl border flex flex-col md:flex-row justify-between gap-4"
                  style={{
                    background: colors.Background,
                    borderColor: colors.Border,
                  }}
                >
                  <div className="space-y-2 text-left">
                    <div className="flex items-center gap-3">
                      <span
                        className={`${styles.methodBadge} ${api.apiMethod === "GET" ? styles.methodGet : styles.methodPost}`}
                      >
                        {api.apiMethod}
                      </span>
                      <h4 className="font-bold text-base text-slate-200">
                        {api.apiName}
                      </h4>
                    </div>
                    <p className="font-mono text-xs text-slate-400 truncate max-w-lg">
                      {api.apiEndpoint}
                    </p>
                    <div className="flex gap-4 text-xs text-slate-500 mt-2">
                      <span>
                        Auth Type:{" "}
                        <strong className="text-indigo-400">
                          {api.apiAuthType}
                        </strong>
                      </span>
                      {api.apiAuthHeader && (
                        <span>
                          Header:{" "}
                          <strong className="text-slate-400">
                            {api.apiAuthHeader}
                          </strong>
                        </span>
                      )}
                      {api.oauthTokenUrl && (
                        <span>
                          OAuth Token:{" "}
                          <strong className="text-slate-400">
                            {api.oauthTokenUrl}
                          </strong>
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded bg-indigo-500/10 text-indigo-400">
                      Sync Online
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div
            className={styles.workspaceCard}
            style={{
              background: colors.BackgroundSecondary,
              borderColor: colors.Border,
            }}
          >
            <h3
              className={styles.workspaceTitle}
              style={{ color: colors.TextHeading }}
            >
              UI Curator Customizer
            </h3>
            <p className="text-xs text-slate-500">
              Redefine your structural layout preference. Changes apply
              instantly to all telemetry visualizers.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-4">
              {(["dashboard", "catalog", "table", "timeline"] as const).map((lay) => (
                <div
                  key={lay}
                  onClick={() => {
                    setSelectedLayout(lay);
                    showToast(
                      `Interface curator set to ${lay.toUpperCase()} layout.`,
                      "success",
                    );
                  }}
                  className="p-6 rounded-2xl cursor-pointer border-2 transition-all text-left flex flex-col justify-between"
                  style={
                    selectedLayout === lay
                      ? {
                          background: colors.UISelectionCardBackground,
                          borderColor: colors.CardActiveBorder,
                        }
                      : {
                          background: colors.Background,
                          borderColor: colors.Border,
                        }
                  }
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-indigo-500/10">
                      {lay === "dashboard" && (
                        <LayoutGridIcon
                          size={20}
                          color={colors.TextHighlightedHeading}
                        />
                      )}
                      {lay === "catalog" && (
                        <SlidersIcon
                          size={20}
                          color={colors.TextHighlightedHeading}
                        />
                      )}
                      {lay === "table" && (
                        <DatabaseIcon
                          size={20}
                          color={colors.TextHighlightedHeading}
                        />
                      )}
                      {lay === "timeline" && (
                        <TerminalIcon
                          size={20}
                          color={colors.TextHighlightedHeading}
                        />
                      )}
                    </div>
                    {selectedLayout === lay && (
                      <span className="text-xs font-bold text-indigo-400">
                        SELECTED
                      </span>
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-base mb-1 text-slate-200 capitalize">
                      {lay} Layout
                    </h4>
                    <p className="text-xs text-slate-500 font-sans leading-relaxed">
                      {lay === "dashboard" &&
                        "Modular bento-style layout optimized for data telemetry, analytics, and interactive metrics dashboards."}
                      {lay === "catalog" &&
                        "Grid layout optimized for item cards, product listings, travel bookings, and category catalogs."}
                      {lay === "table" &&
                        "Condensed spreadsheet-style view for power users handling massive data sets, transaction ledger list."}
                      {lay === "timeline" &&
                        "Milestone progress tracker optimized for package shipping routes, logistics, and process stages."}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
