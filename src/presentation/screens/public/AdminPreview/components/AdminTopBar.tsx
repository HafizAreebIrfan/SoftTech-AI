import React from "react";
import { useThemeStore } from "../../../../../hooks/usetheme";
import s from "../../../../../styles/adminlayout.module.css";

interface AdminTopBarProps {
  /** Optional label shown next to the avatar (e.g. "PRO PLAN") */
  planLabel?: string;
  isSidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
}

const AdminTopBar: React.FC<AdminTopBarProps> = ({ planLabel, isSidebarCollapsed = false, onToggleSidebar }) => {
  const { toggleTheme, isDark } = useThemeStore();

  return (
    <header className={s.topBar}>
      {/* Left side: Hamburger button */}
      <div className={s.topBarLeft}>
        <button
          className={s.hamburgerBtn}
          onClick={onToggleSidebar}
          title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
      </div>

      {/* Right side: Theme toggle + Profile Avatar */}
      <div className={s.topBarRight}>
        {/* Theme toggle */}
        <button
          className={s.topBarIconBtn}
          onClick={toggleTheme}
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          <span className="material-symbols-outlined">
            {isDark ? "dark_mode" : "light_mode"}
          </span>
        </button>

        <div className={s.topBarDivider} />

        {/* Avatar area */}
        <div className={s.topBarAvatarRow}>
          {planLabel && (
            <span className={s.topBarPlanLabel}>{planLabel}</span>
          )}
          {/* Initials avatar – matches design */}
          <div className={s.topBarAvatarInitials}>AC</div>
        </div>
      </div>
    </header>
  );
};

export default AdminTopBar;
