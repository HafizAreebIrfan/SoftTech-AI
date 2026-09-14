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
import type { ToolUiType } from "../../../../interfaces/auth/auth.interface";

const UI_TYPE_LABELS: Record<ToolUiType, string> = {
  auto: "Auto (data-driven)",
  catalog: "Catalog Grid",
  mapcatalog: "Map View",
  table: "Table",
  dashboard: "Dashboard",
  profile: "Profile",
  hidden: "Hidden (text-only)",
};

const METHOD_COLORS: Record<string, { bg: string; text: string }> = {
  GET: { bg: "#10b98115", text: "#10b981" },
  POST: { bg: "#6366f115", text: "#6366f1" },
  PUT: { bg: "#f59e0b15", text: "#f59e0b" },
  PATCH: { bg: "#f59e0b15", text: "#f59e0b" },
  DELETE: { bg: "#ef444415", text: "#ef4444" },
};

const Dashboard: FC = () => {
  const navigate = useNavigate();
  const { colors, isDark, toggleTheme } = useThemeStore();
  const { user, apisList, selectedLayout, setSelectedLayout, clearAuth, updateApiUiConfig, updateApiDescription, googleMapsApiKey, setGoogleMapsApiKey } =
    useAuthStore();
  const [activeTab, setActiveTab] = useState<"dashboard" | "apis" | "settings">(
    "dashboard",
  );
  const [expandedApi, setExpandedApi] = useState<string | null>(null);

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

  const enabledCount = apisList.filter(
    (a) => a.uiConfig?.uiEnabled !== false,
  ).length;

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
                background: `linear-gradient(135deg, ${colors.TextGradientOne}, ${colors.TextGradientTwo}, ${colors.TextGradientThree})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
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
              UI Settings
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
              {user?.name || "Company"} Console
            </h1>
            <p className={styles.subtitle}>
              Manage API connections and configure how each tool renders in the
              widget.
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
          <div className="space-y-4">
            {/* Summary bar */}
            <div
              className="p-4 rounded-2xl border flex items-center justify-between"
              style={{
                background: colors.BackgroundSecondary,
                borderColor: colors.Border,
              }}
            >
              <div>
                <h3
                  className="text-sm font-semibold"
                  style={{ color: colors.TextHeading }}
                >
                  {apisList.length} API{apisList.length !== 1 ? "s" : ""}{" "}
                  Connected
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {enabledCount} with widget UI enabled
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    apisList.forEach((api) =>
                      updateApiUiConfig(api.id, { uiEnabled: true }),
                    );
                    showToast("All APIs enabled", "success");
                  }}
                  className="text-xs px-3 py-1.5 rounded-lg border transition-colors"
                  style={{
                    borderColor: colors.Border,
                    color: colors.TextBody,
                    background: colors.Background,
                  }}
                >
                  Enable All
                </button>
                <button
                  onClick={() => {
                    apisList.forEach((api) =>
                      updateApiUiConfig(api.id, { uiEnabled: false }),
                    );
                    showToast("All APIs disabled", "success");
                  }}
                  className="text-xs px-3 py-1.5 rounded-lg border transition-colors"
                  style={{
                    borderColor: colors.Border,
                    color: colors.TextBody,
                    background: colors.Background,
                  }}
                >
                  Disable All
                </button>
              </div>
            </div>

            {/* API cards */}
            {apisList.map((api) => {
              const uiCfg = api.uiConfig || {
                uiEnabled: false,
                uiType: "auto" as ToolUiType,
                mapEnabled: false,
              };
              const isExpanded = expandedApi === api.id;
              const methodStyle = METHOD_COLORS[api.apiMethod] || METHOD_COLORS.GET;

              return (
                <div
                  key={api.id}
                  className="rounded-2xl border overflow-hidden transition-all"
                  style={{
                    background: colors.BackgroundSecondary,
                    borderColor:
                      uiCfg.uiEnabled && isExpanded
                        ? "#6366f140"
                        : colors.Border,
                  }}
                >
                  {/* Card header — always visible */}
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedApi(isExpanded ? null : api.id)
                    }
                    className="w-full p-4 flex items-center gap-4 text-left transition-colors"
                    style={{ background: "transparent" }}
                  >
                    {/* Method badge */}
                    <span
                      className="inline-flex items-center justify-center w-12 h-8 rounded-lg text-[11px] font-bold tracking-wider shrink-0"
                      style={{
                        background: methodStyle.bg,
                        color: methodStyle.text,
                      }}
                    >
                      {api.apiMethod}
                    </span>

                    {/* Name + endpoint */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4
                          className="font-semibold text-sm truncate"
                          style={{ color: colors.TextHeading }}
                        >
                          {api.apiName || "Unnamed API"}
                        </h4>
                        {/* Widget status pill */}
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0"
                          style={{
                            background: uiCfg.uiEnabled
                              ? "#10b98118"
                              : "#6b728018",
                            color: uiCfg.uiEnabled ? "#10b981" : "#6b7280",
                          }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{
                              background: uiCfg.uiEnabled ? "#10b981" : "#6b7280",
                            }}
                          />
                          {uiCfg.uiEnabled ? "Widget ON" : "Widget OFF"}
                        </span>
                      </div>
                      <p
                        className="font-mono text-[11px] mt-0.5 truncate"
                        style={{ color: "#6b7280" }}
                      >
                        {api.apiEndpoint || "No endpoint"}
                      </p>
                    </div>

                    {/* Chevron */}
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      className="shrink-0 transition-transform"
                      style={{
                        transform: isExpanded ? "rotate(180deg)" : "rotate(0)",
                        color: "#6b7280",
                      }}
                    >
                      <path
                        d="M4 6L8 10L12 6"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>

                  {/* Expanded controls */}
                  {isExpanded && (
                    <div
                      className="px-4 pb-4 pt-2 border-t"
                      style={{ borderColor: colors.Border }}
                    >
                      {/* API details row */}
                      <div
                        className="flex flex-wrap gap-x-6 gap-y-1 text-[11px] mb-4"
                        style={{ color: "#9ca3af" }}
                      >
                        <span>
                          Auth:{" "}
                          <span style={{ color: colors.TextBody }}>
                            {api.apiAuthType}
                          </span>
                        </span>
                        {api.apiAuthHeader && (
                          <span>
                            Header:{" "}
                            <span style={{ color: colors.TextBody }}>
                              {api.apiAuthHeader}
                            </span>
                          </span>
                        )}
                        {api.oauthTokenUrl && (
                          <span>
                            OAuth:{" "}
                            <span style={{ color: colors.TextBody }}>
                              Connected
                            </span>
                          </span>
                        )}
                      </div>

                      {/* Widget UI Controls */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        {/* Enable/Disable */}
                        <label className="flex items-center gap-2.5 cursor-pointer select-none">
                          <button
                            type="button"
                            role="switch"
                            aria-checked={uiCfg.uiEnabled}
                            onClick={() =>
                              updateApiUiConfig(api.id, {
                                uiEnabled: !uiCfg.uiEnabled,
                              })
                            }
                            className="relative inline-flex h-[22px] w-[40px] items-center rounded-full transition-colors"
                            style={{
                              background: uiCfg.uiEnabled ? "#6366f1" : "#374151",
                            }}
                          >
                            <span
                              className="inline-block h-[16px] w-[16px] rounded-full bg-white transition-transform"
                              style={{
                                transform: uiCfg.uiEnabled
                                  ? "translateX(20px)"
                                  : "translateX(3px)",
                              }}
                            />
                          </button>
                          <span
                            className="text-xs font-medium"
                            style={{ color: colors.TextBody }}
                          >
                            Show widget UI
                          </span>
                        </label>

                        {/* Layout selector */}
                        {uiCfg.uiEnabled && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs" style={{ color: "#9ca3af" }}>
                              Layout
                            </span>
                            <select
                              value={uiCfg.uiType}
                              onChange={(e) =>
                                updateApiUiConfig(api.id, {
                                  uiType: e.target.value as ToolUiType,
                                })
                              }
                              className="text-xs rounded-lg px-2.5 py-1.5 border outline-none"
                              style={{
                                background: colors.Background,
                                borderColor: colors.Border,
                                color: colors.TextBody,
                              }}
                            >
                              {Object.entries(UI_TYPE_LABELS).map(
                                ([value, label]) => (
                                  <option key={value} value={value}>
                                    {label}
                                  </option>
                                ),
                              )}
                            </select>
                          </div>
                        )}

                        {/* Map toggle — always visible when card expanded */}
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <button
                            type="button"
                            role="switch"
                            aria-checked={uiCfg.mapEnabled}
                            onClick={() =>
                              updateApiUiConfig(api.id, {
                                mapEnabled: !uiCfg.mapEnabled,
                              })
                            }
                            className="relative inline-flex h-[18px] w-[32px] items-center rounded-full transition-colors"
                            style={{
                              background: uiCfg.mapEnabled ? "#6366f1" : "#374151",
                            }}
                          >
                            <span
                              className="inline-block h-[12px] w-[12px] rounded-full bg-white transition-transform"
                              style={{
                                transform: uiCfg.mapEnabled
                                  ? "translateX(16px)"
                                  : "translateX(3px)",
                              }}
                            />
                          </button>
                          <span
                            className="text-xs"
                            style={{ color: "#9ca3af" }}
                          >
                            Map view
                          </span>
                        </label>
                      </div>

                      {/* MCP Tool Description */}
                      <div className="mt-4">
                        <label
                          className="block text-[11px] font-medium mb-1.5"
                          style={{ color: "#9ca3af" }}
                        >
                          MCP Tool Description{" "}
                          <span style={{ color: "#6b7280" }}>
                            (shown to ChatGPT)
                          </span>
                        </label>
                        <textarea
                          value={api.mcpDescription || ""}
                          onChange={(e) =>
                            updateApiDescription(api.id, e.target.value)
                          }
                          placeholder="Auto-generated from API schema if left empty..."
                          rows={3}
                          className="w-full text-xs rounded-lg px-3 py-2 border outline-none resize-none"
                          style={{
                            background: colors.Background,
                            borderColor: colors.Border,
                            color: colors.TextBody,
                          }}
                        />
                        <p className="text-[10px] mt-1" style={{ color: "#6b7280" }}>
                          {api.mcpDescription
                            ? `${api.mcpDescription.length} characters — custom description active`
                            : "Using auto-generated description from API schema"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {apisList.length === 0 && (
              <div
                className="p-8 rounded-2xl border text-center"
                style={{
                  background: colors.BackgroundSecondary,
                  borderColor: colors.Border,
                }}
              >
                <div className="mx-auto mb-3">
                  <DatabaseIcon size={32} color="#4b5563" />
                </div>
                <p className="text-sm" style={{ color: "#9ca3af" }}>
                  No API connections yet. Register your first API during
                  onboarding.
                </p>
              </div>
            )}
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
              {(["dashboard", "catalog", "table", "timeline"] as const).map(
                (lay) => (
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
                ),
              )}
            </div>

            {/* Google Maps API Key */}
            <div className="mt-6">
              <label className="block text-[11px] font-medium mb-1.5" style={{ color: "#9ca3af" }}>
                Google Maps API Key
              </label>
              <input
                type="password"
                value={googleMapsApiKey}
                onChange={(e) => setGoogleMapsApiKey(e.target.value)}
                placeholder="Paste your Google Maps JavaScript API key here"
                className="w-full text-xs rounded-lg px-3 py-2 outline-none border"
                style={{ background: "#0f1117", borderColor: "#2a2d35", color: "#e5e7eb" }}
              />
              <p className="text-[10px] mt-1" style={{ color: "#6b7280" }}>
                Required for map view. Get a key at{" "}
                <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: "#818cf8" }}>
                  Google Cloud Console
                </a>
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
