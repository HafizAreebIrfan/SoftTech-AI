import React, { useState } from "react";
import { useThemeStore } from "../../../../hooks/usetheme";
import s from "../../../../styles/adminlayout.module.css";

import AdminSidebar from "./components/AdminSidebar";
import AdminTopBar from "./components/AdminTopBar";
import DashboardTab from "./components/DashboardTab";
import AnalyticsTab from "./components/AnalyticsTab";
import CompaniesTab from "./components/CompaniesTab";
import CompanyDetailScreen from "./components/CompanyDetailScreen";

/* ──────────────────────────────────────
   Types
────────────────────────────────────── */
type Tab = "dashboard" | "analytics" | "companies";
type View = { screen: "tabs" } | { screen: "company-detail"; companyId?: string };

/* ──────────────────────────────────────
   Make sure Google Fonts + Material Symbols are loaded once
────────────────────────────────────── */
function ensureFonts() {
  if (typeof document === "undefined") return;
  const fontId = "admin-preview-fonts";
  if (document.getElementById(fontId)) return;

  const link = document.createElement("link");
  link.id = fontId;
  link.rel = "stylesheet";
  link.href =
    "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Manrope:wght@400;500;600;700&family=Inter:wght@400;500;600&family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap";
  document.head.appendChild(link);

  // Inject Material Symbols font-variation-settings once
  const style = document.createElement("style");
  style.textContent = `.material-symbols-outlined {
    font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
    font-family: 'Material Symbols Outlined';
    font-size: inherit;
    line-height: 1;
    display: inline-block;
    vertical-align: middle;
    user-select: none;
    flex-shrink: 0;
  }`;
  document.head.appendChild(style);
}

ensureFonts();

/* ──────────────────────────────────────
   Root component
────────────────────────────────────── */
const AdminPreview: React.FC = () => {
  useThemeStore(); // subscribe so theme vars propagate via useApplyGlobalThemeVars in App

  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [view, setView] = useState<View>({ screen: "tabs" });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  /* Sidebar collapse toggle */
  const handleToggleSidebar = () => {
    setIsSidebarCollapsed((prev) => !prev);
  };

  /* Navigate to company detail (called from Add Company button or eye icon) */
  const handleAddCompany = () => {
    setView({ screen: "company-detail" });
  };

  const handleViewCompany = (id: string) => {
    setView({ screen: "company-detail", companyId: id });
  };

  /* Navigate back to the companies list */
  const handleBackToCompanies = () => {
    setActiveTab("companies");
    setView({ screen: "tabs" });
  };

  /* When tab changes, always return to tabs view */
  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setView({ screen: "tabs" });
  };

  return (
    <div className={s.adminShell}>
      {/* ── Fixed sidebar ── */}
      <AdminSidebar
        activeTab={view.screen === "company-detail" ? "companies" : activeTab}
        onTabChange={handleTabChange}
        isCollapsed={isSidebarCollapsed}
      />

      {/* ── Scrollable main area ── */}
      <main className={`${s.mainArea} ${isSidebarCollapsed ? s.mainAreaCollapsed : ""}`}>
        {/* Sticky top bar */}
        <AdminTopBar
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={handleToggleSidebar}
        />

        {/* Content */}
        {view.screen === "company-detail" ? (
          <CompanyDetailScreen onBack={handleBackToCompanies} />
        ) : (
          <>
            {activeTab === "dashboard"  && <DashboardTab />}
            {activeTab === "analytics"  && <AnalyticsTab />}
            {activeTab === "companies"  && (
              <CompaniesTab
                onAddCompany={handleAddCompany}
                onViewCompany={handleViewCompany}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default AdminPreview;
