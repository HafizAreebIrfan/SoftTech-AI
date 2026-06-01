import React, { useState } from "react";
import styles from "../../../styles/navbar.module.css";
import { useThemeStore } from "../../../infrastructure/store/themeStore";
import { Link, useNavigate } from "@tanstack/react-router";
import { CloseIcon, MenuIcon, MoonIcon, SunIcon } from "../../../assets/icons";

const Navbar: React.FC = () => {
  const { isDark, colors, toggleTheme } = useThemeStore();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const navigate = useNavigate();
  const navItems = [
    { label: 'Home', to: '/' },
    { label: 'Features', to: '/features' },
    { label: 'About', to: '/about' },
    { label: 'Contact', to: '/contact' },
  ];
  const handleLogoClick = () => {
    navigate({ to: '/' });
    setIsOpen(false);
  };
  return (
    <nav className={styles.navbar} style={{ background: colors.Headerbackground, borderBottom: `1px solid ${colors.HeaderBottomBorder}`, boxShadow: `0 10px 40px ${colors.HeaderBoxShadow}` }} id="top-navbar">
      <div className={styles.container}>
        {/* Logo */}
        <div className={styles.logoText} style={{ background: `linear-gradient(135deg, ${colors.TextGradientOne}, ${colors.TextGradientTwo}, ${colors.TextGradientThree})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', cursor: 'pointer' }} onClick={handleLogoClick}>
          SoftTech AI
        </div>

        {/* Desktop Links */}
        <div className={styles.navLinks}>
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeProps={{
                className: styles.activeLink,
                style: { color: colors.HeaderItemActiveColor }
              }}
              inactiveProps={{
                className: styles.link,
                style: { color: colors.HeaderItemColor }
              }}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Actions Button / Settings */}
        <div className={styles.actionGroup}>
          <button
            onClick={toggleTheme}
            className={isDark ? styles.themeButton : styles.themeButtonLight}
            aria-label="Toggle theme"
            id="theme-toggle"
          >
            {isDark ? <SunIcon size={20} color={colors.HeaderIconColor} /> : <MoonIcon size={20} color={colors.HeaderIconColor} />}
          </button>

          <div className="hidden lg:flex items-center gap-4">
            <Link
              to="/login"
              activeProps={{ className: "text-indigo-400 font-bold text-sm" }}
              inactiveProps={{ className: styles.loginBtn }}
              style={{ color: colors.HeaderButtonSecondaryText }}
            >
              Login
            </Link>
            <Link
              to="/signup"
              className={styles.getStartedBtn}
              style={{ color: colors.HeaderButtonGradientText, background: `linear-gradient(135deg, ${colors.HeaderButtonGradientOne}, ${colors.HeaderButtonGradientTwo})` }}
            >
              Get Started
            </Link>
          </div>

          {/* Toggle Hamburger */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={styles.hamburger}
            id="menu-toggle"
            aria-label="Toggle menu"
          >
            {isOpen ? <CloseIcon size={24} /> : <MenuIcon size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isOpen && (
        <div className={isDark ? styles.mobileMenu : styles.mobileMenuLight} id="mobile-menu">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setIsOpen(false)}
              activeProps={{
                className: isDark ? styles.mobileLinkActive : styles.mobileLinkActiveLight
              }}
              inactiveProps={{
                className: isDark ? styles.mobileLink : styles.mobileLinkLight
              }}
            >
              {item.label}
            </Link>
          ))}
          <hr className={isDark ? styles.divider : styles.dividerLight} />
          <div className="flex flex-col gap-4">
            <Link
              to="/login"
              onClick={() => setIsOpen(false)}
              className={isDark ? "text-slate-400 text-left font-medium text-lg hover:text-white" : "text-slate-600 text-left font-medium text-lg hover:text-black"}
            >
              Login
            </Link>
            <Link
              to="/signup"
              onClick={() => setIsOpen(false)}
              className="w-full py-3 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-xl text-white font-bold text-center"
            >
              Get Started
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
