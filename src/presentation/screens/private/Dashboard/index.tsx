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

  // Mock telemetry data representing cosmic systems/data curator entries
  const mockCuratorItems = [
    {
      id: "SYS-091",
      name: "Astrometry Feed Decoder",
      status: "Active",
      throughput: "128 kb/s",
      latency: "24ms",
      type: "Telemetry",
    },
    {
      id: "SYS-092",
      name: "Solar Wind Array Monitor",
      status: "Syncing",
      throughput: "512 kb/s",
      latency: "42ms",
      type: "Sensor Grid",
    },
    {
      id: "SYS-093",
      name: "Nebula Core Reactor",
      status: "Active",
      throughput: "1,024 kb/s",
      latency: "12ms",
      type: "Core Protocol",
    },
    {
      id: "SYS-094",
      name: "Quantum Beacon Receiver",
      status: "Active",
      throughput: "64 kb/s",
      latency: "185ms",
      type: "Quantum Stream",
    },
  ];

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
              Curator Command Console
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
            {/* Stats Telemetry Row */}
            <div className={styles.statsGrid}>
              <div
                className={styles.statCard}
                style={{
                  background: colors.BackgroundSecondary,
                  borderColor: colors.Border,
                }}
              >
                <div className={styles.statHeader}>
                  <span className={styles.statTitle}>Curator Protocol</span>
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                </div>
                <div
                  className={styles.statValue}
                  style={{ color: colors.TextHeading }}
                >
                  ONLINE
                </div>
                <span className="text-xs text-slate-500 font-semibold">
                  Active & sync verified
                </span>
              </div>

              <div
                className={styles.statCard}
                style={{
                  background: colors.BackgroundSecondary,
                  borderColor: colors.Border,
                }}
              >
                <div className={styles.statHeader}>
                  <span className={styles.statTitle}>API Streams</span>
                  <DatabaseIcon
                    size={16}
                    color={colors.TextHighlightedHeading}
                  />
                </div>
                <div
                  className={styles.statValue}
                  style={{ color: colors.TextHeading }}
                >
                  {apisList.length} Connected
                </div>
                <span className="text-xs text-slate-500 font-semibold">
                  Primary Method: {apisList[0]?.apiMethod || "GET"}
                </span>
              </div>

              <div
                className={styles.statCard}
                style={{
                  background: colors.BackgroundSecondary,
                  borderColor: colors.Border,
                }}
              >
                <div className={styles.statHeader}>
                  <span className={styles.statTitle}>Curator Layout</span>
                  <SlidersIcon
                    size={16}
                    color={colors.TextHighlightedHeading}
                  />
                </div>
                <div
                  className={styles.statValue}
                  style={{
                    color: colors.TextHeading,
                    textTransform: "capitalize",
                  }}
                >
                  {selectedLayout}
                </div>
                <div className={styles.layoutToggle}>
                  {(["grid", "list", "cards", "table"] as const).map((lay) => (
                    <button
                      key={lay}
                      onClick={() => setSelectedLayout(lay)}
                      className={`${styles.layoutToggleBtn} ${selectedLayout === lay ? styles.layoutToggleBtnActive : ""}`}
                    >
                      {lay}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Layout Visualizer Workspace Card */}
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
                    GPT Interface Visualizer
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Simulation of GPT widget UI according to
                    selected layout preference.
                  </p>
                </div>
              </div>

              {/* Dynamic rendering based on selected preference */}
              <div className="mt-2" style={{width: "400px"}}>
                 <CardWidget/>
                {/* {selectedLayout === "grid" && (
                  <div className={styles.bentoGrid}>
                    {mockCuratorItems.map((item, index) => (
                      <div
                        key={item.id}
                        className={
                          index % 3 === 0
                            ? styles.bentoItemLarge
                            : styles.bentoItem
                        }
                        style={{
                          background: colors.Background,
                          borderColor: colors.Border,
                        }}
                      >
                        <div className="flex justify-between items-start">
                          <span className="text-[10px] font-mono font-bold tracking-wider text-slate-500">
                            {item.id}
                          </span>
                          <span
                            className={`text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full ${item.status === "Active" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}
                          >
                            {item.status}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-bold text-sm mb-1 text-slate-200">
                            {item.name}
                          </h4>
                          <div className="flex gap-4 text-xs text-slate-400 mt-2">
                            <span>Throughput: {item.throughput}</span>
                            <span>Latency: {item.latency}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {selectedLayout === "list" && (
                  <div className={styles.listLayout}>
                    {mockCuratorItems.map((item) => (
                      <div
                        key={item.id}
                        className={styles.listItem}
                        style={{
                          background: colors.Background,
                          borderColor: colors.Border,
                        }}
                      >
                        <div className="flex items-center gap-4">
                          <span className="text-[10px] font-mono font-bold text-indigo-400">
                            {item.id}
                          </span>
                          <span className="font-bold text-sm text-slate-200">
                            {item.name}
                          </span>
                          <span className="text-xs text-slate-500">
                            ({item.type})
                          </span>
                        </div>
                        <div className="flex items-center gap-6">
                          <span className="text-xs font-semibold text-slate-400">
                            TP: {item.throughput}
                          </span>
                          <span className="text-xs font-semibold text-slate-400">
                            LT: {item.latency}
                          </span>
                          <span
                            className={`text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded ${item.status === "Active" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}
                          >
                            {item.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {selectedLayout === "cards" && (
                  <div className={styles.cardsLayout}>
                    {mockCuratorItems.map((item) => (
                      <div
                        key={item.id}
                        className={styles.cardItem}
                        style={{
                          background: colors.Background,
                          borderColor: colors.Border,
                        }}
                      >
                        <div className="flex justify-between items-center pb-2 border-b border-white/5">
                          <h4 className="font-bold text-sm text-slate-200">
                            {item.name}
                          </h4>
                          <span className="text-[10px] font-mono font-bold text-indigo-400">
                            {item.id}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-xs text-slate-400 py-2">
                          <div>
                            <span className="block text-[10px] uppercase tracking-wider text-slate-500">
                              Status
                            </span>
                            <span className="font-semibold text-slate-300">
                              {item.status}
                            </span>
                          </div>
                          <div>
                            <span className="block text-[10px] uppercase tracking-wider text-slate-500">
                              Type
                            </span>
                            <span className="font-semibold text-slate-300">
                              {item.type}
                            </span>
                          </div>
                          <div>
                            <span className="block text-[10px] uppercase tracking-wider text-slate-500">
                              Throughput
                            </span>
                            <span className="font-semibold text-slate-300">
                              {item.throughput}
                            </span>
                          </div>
                          <div>
                            <span className="block text-[10px] uppercase tracking-wider text-slate-500">
                              Latency
                            </span>
                            <span className="font-semibold text-slate-300">
                              {item.latency}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {selectedLayout === "table" && (
                  <div className="overflow-x-auto">
                    <table className={styles.tableLayout}>
                      <thead>
                        <tr>
                          <th
                            className={styles.tableTh}
                            style={{ color: colors.TextHeading }}
                          >
                            ID
                          </th>
                          <th
                            className={styles.tableTh}
                            style={{ color: colors.TextHeading }}
                          >
                            System Name
                          </th>
                          <th
                            className={styles.tableTh}
                            style={{ color: colors.TextHeading }}
                          >
                            Type
                          </th>
                          <th
                            className={styles.tableTh}
                            style={{ color: colors.TextHeading }}
                          >
                            Throughput
                          </th>
                          <th
                            className={styles.tableTh}
                            style={{ color: colors.TextHeading }}
                          >
                            Latency
                          </th>
                          <th
                            className={styles.tableTh}
                            style={{ color: colors.TextHeading }}
                          >
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {mockCuratorItems.map((item) => (
                          <tr key={item.id}>
                            <td
                              className={styles.tableTd}
                              style={{ borderBottomColor: colors.Border }}
                            >
                              <span className="font-mono text-indigo-400">
                                {item.id}
                              </span>
                            </td>
                            <td
                              className={styles.tableTd}
                              style={{ borderBottomColor: colors.Border }}
                            >
                              <span className="font-bold text-slate-200">
                                {item.name}
                              </span>
                            </td>
                            <td
                              className={styles.tableTd}
                              style={{ borderBottomColor: colors.Border }}
                            >
                              <span className="text-slate-400">
                                {item.type}
                              </span>
                            </td>
                            <td
                              className={styles.tableTd}
                              style={{ borderBottomColor: colors.Border }}
                            >
                              <span className="text-slate-400">
                                {item.throughput}
                              </span>
                            </td>
                            <td
                              className={styles.tableTd}
                              style={{ borderBottomColor: colors.Border }}
                            >
                              <span className="text-slate-400">
                                {item.latency}
                              </span>
                            </td>
                            <td
                              className={styles.tableTd}
                              style={{ borderBottomColor: colors.Border }}
                            >
                              <span
                                className={`text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded ${item.status === "Active" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}
                              >
                                {item.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )} */}
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
              {(["grid", "list", "cards", "table"] as const).map((lay) => (
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
                      {lay === "grid" && (
                        <LayoutGridIcon
                          size={20}
                          color={colors.TextHighlightedHeading}
                        />
                      )}
                      {lay === "list" && (
                        <TerminalIcon
                          size={20}
                          color={colors.TextHighlightedHeading}
                        />
                      )}
                      {lay === "cards" && (
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
                    </div>
                    {selectedLayout === lay && (
                      <span className="text-xs font-bold text-indigo-400">
                        SELECTED
                      </span>
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-base mb-1 text-slate-200 capitalize">
                      {lay}
                    </h4>
                    <p className="text-xs text-slate-500">
                      {lay === "grid" &&
                        "Bento-style layout optimized for rich information grids."}
                      {lay === "list" &&
                        "Console line log flow for developers."}
                      {lay === "cards" &&
                        "Expanded summaries highlighting key telemetry attributes."}
                      {lay === "table" &&
                        "Condensed rows for handling massive data grids."}
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
