import React from "react";
import { useThemeStore } from "../../../../../hooks/usetheme";
import s from "../../../../../styles/adminlayout.module.css";

type Tab = "dashboard" | "analytics" | "companies";

interface AdminSidebarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  isCollapsed?: boolean;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ activeTab, onTabChange, isCollapsed = false }) => {
  const { colors } = useThemeStore();

  const navItems: { id: Tab; label: string; icon: string }[] = [
    { id: "dashboard", label: "Dashboard", icon: "dashboard" },
    { id: "analytics", label: "Analytics", icon: "monitoring" },
    { id: "companies", label: "Companies", icon: "corporate_fare" },
  ];

  return (
    <aside className={`${s.sidebar} ${isCollapsed ? s.sidebarCollapsed : ""}`}>
      {/* Brand */}
      <div className={`${s.sidebarBrand} ${isCollapsed ? s.sidebarBrandCollapsed : ""}`}>
        {isCollapsed ? (
          <span className={s.sidebarBrandIcon} title="SoftTech AI">S</span>
        ) : (
          <>
            <h1 className={s.sidebarBrandTitle}>SoftTech AI</h1>
            <p className={s.sidebarBrandSub}>Interstellar Protocol</p>
          </>
        )}
      </div>

      {/* Nav */}
      <nav className={s.sidebarNav}>
        {navItems.map((item) => (
          <button
            key={item.id}
            title={isCollapsed ? item.label : undefined}
            className={`${s.navItem} ${activeTab === item.id ? s.navItemActive : ""} ${isCollapsed ? s.navItemCollapsed : ""}`}
            onClick={() => onTabChange(item.id)}
          >
            <span
              className={`material-symbols-outlined ${s.navIcon}`}
              style={{ color: activeTab === item.id ? "#818cf8" : undefined }}
            >
              {item.icon}
            </span>
            {!isCollapsed && (
              <span className={s.navLabel} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: "-0.01em" }}>
                {item.label}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className={`${s.sidebarFooter} ${isCollapsed ? s.sidebarFooterCollapsed : ""}`}>
        <button
          className={`${s.logoutBtn} ${isCollapsed ? s.logoutBtnCollapsed : ""}`}
          style={{ color: colors.WarningText }}
          title={isCollapsed ? "Logout" : undefined}
        >
          <span className="material-symbols-outlined">logout</span>
          {!isCollapsed && (
            <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Logout</span>
          )}
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
