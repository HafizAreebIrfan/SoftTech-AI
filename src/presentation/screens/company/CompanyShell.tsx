import { FC, PropsWithChildren, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  BoltIcon,
  DatabaseIcon,
  HelpIcon,
  LayoutGridIcon,
  MenuIcon,
  MoonIcon,
  SlidersIcon,
  SunIcon,
  UserIcon,
} from "../../../assets/icons";
import { useThemeStore } from "../../../hooks";
import styles from "../../../styles/companyflow.module.css";
import { getCompanyThemeVars } from "./companyTheme";

type CompanySection = "dashboard" | "api" | "analytics" | "profile";

type CompanyShellProps = PropsWithChildren<{
  active: CompanySection;
}>;

const navItems: Array<{
  id: CompanySection;
  label: string;
  to: string;
  icon: FC<{ size: number; color: string }>;
}> = [
  { id: "dashboard", label: "Dashboard", to: "/company_dashboard", icon: LayoutGridIcon },
  { id: "api", label: "API Management", to: "/api_management", icon: DatabaseIcon },
  { id: "analytics", label: "Analytics", to: "/company_analytics", icon: SlidersIcon },
  { id: "profile", label: "Profile", to: "/company_profile", icon: UserIcon },
];

const CompanyShell: FC<CompanyShellProps> = ({ active, children }) => {
  const navigate = useNavigate();
  const { colors, isDark, toggleTheme } = useThemeStore();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className={styles.companyShell} style={getCompanyThemeVars(colors)}>
      <div className={styles.layout}>
        <aside
          className={`${styles.sidebar} ${
            isSidebarCollapsed ? styles.sidebarCollapsed : ""
          }`}
        >
          <div
            className={`${styles.brandBlock} ${
              isSidebarCollapsed ? styles.brandBlockCollapsed : ""
            }`}
          >
            {isSidebarCollapsed ? (
              <span className={styles.brandIcon} title="SoftTech AI">
                S
              </span>
            ) : (
              <>
                <h1 className={styles.brand}>SoftTech AI</h1>
                <p className={styles.brandSub}>Interstellar Protocol</p>
              </>
            )}
          </div>
          <nav className={styles.nav}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.id === active;
              return (
                <button
                  className={`${styles.navItem} ${isActive ? styles.navActive : ""} ${
                    isSidebarCollapsed ? styles.navItemCollapsed : ""
                  }`}
                  key={item.id}
                  onClick={() => navigate({ to: item.to })}
                  title={isSidebarCollapsed ? item.label : undefined}
                  type="button"
                >
                  <Icon size={20} color={isActive ? colors.TextGradientOne : colors.TextBody} />
                  {!isSidebarCollapsed && <span>{item.label}</span>}
                </button>
              );
            })}
          </nav>
          <div
            className={`${styles.logout} ${
              isSidebarCollapsed ? styles.logoutCollapsed : ""
            }`}
          >
            <button
              className={`${styles.navItem} ${
                isSidebarCollapsed ? styles.navItemCollapsed : ""
              }`}
              title={isSidebarCollapsed ? "Logout" : undefined}
              type="button"
            >
              <BoltIcon size={20} color={colors.WarningText} />
              {!isSidebarCollapsed && <span>Logout</span>}
            </button>
          </div>
        </aside>

        <main className={styles.main}>
          <header className={styles.topbar}>
            <button
              className={styles.topbarButton}
              onClick={() => setIsSidebarCollapsed((value) => !value)}
              title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              type="button"
            >
              <MenuIcon size={20} color={colors.TextBody} />
            </button>
            <div className={styles.topRight}>
              <button className={styles.topbarButton} title="Help" type="button">
                <HelpIcon size={20} color={colors.TextBody} />
              </button>
              <button
                className={styles.topbarButton}
                onClick={toggleTheme}
                title={isDark ? "Switch to light mode" : "Switch to dark mode"}
                type="button"
              >
                {isDark ? (
                  <MoonIcon size={20} color={colors.TextBody} />
                ) : (
                  <SunIcon size={20} color={colors.TextBody} />
                )}
              </button>
              <div className={styles.topbarDivider} />
              <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.14em" }}>
                PRO PLAN
              </span>
              <div className={styles.avatar}>AC</div>
            </div>
          </header>
          {children}
        </main>
      </div>
    </div>
  );
};

export default CompanyShell;
