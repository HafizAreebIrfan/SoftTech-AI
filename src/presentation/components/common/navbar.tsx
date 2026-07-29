import React, { useEffect } from "react";
import styles from "../../../styles/navbar.module.css";
import { useThemeStore } from "../../../infrastructure/store/themeStore";
import { Link } from "@tanstack/react-router";
import { CloseIcon, MenuIcon, MoonIcon, SunIcon } from "../../../assets/icons";
import { useHomeState } from "../../../hooks";

const Navbar: React.FC = () => {
  const { isDark, colors, toggleTheme } = useThemeStore();
  const { isMobileMenuOpen, toggleMobileMenu, closeMobileMenu } =
    useHomeState();
  useEffect(() => {
    const globalNavbar = document.getElementById("top-navbar");

    if (globalNavbar) {
      globalNavbar.style.display = "none";
    }

    return () => {
      if (globalNavbar) {
        globalNavbar.style.display = "";
      }
    };
  }, []);
  return (
    <>
      <nav className={styles.navbar}>
        <div className={styles.navbarContainer}>
          <div className={styles.logoContainer}>
            <span className={styles.logoText}>SoftTech AI</span>
          </div>

          <div className={styles.navLinks}>
            <Link to="/" hash="scroll-track" className={styles.navLink}>
              How it works
            </Link>
            <Link to="/" hash="features-section" className={styles.navLink}>
              Features
            </Link>
            <Link
              to="/"
              hash="industry-stack-section"
              className={styles.navLink}
            >
              Industries
            </Link>
            <Link to="/" hash="pricing-section" className={styles.navLink}>
              Pricing
            </Link>
            <Link to="/" hash="faq-section" className={styles.navLink}>
              FAQ
            </Link>
          </div>

          <div className={styles.navActions}>
            <button
              id="theme-toggle"
              className={styles.actionBtn}
              onClick={toggleTheme}
              aria-label="Toggle Theme"
            >
              {isDark ? (
                <SunIcon size={16} color={colors.RatingIconColor} />
              ) : (
                <MoonIcon size={16} color={colors.HeaderIconColor} />
              )}
            </button>

            <Link to="/login" className={styles.loginLink}>
              Log in
            </Link>

            <Link to="/signup" className={styles.primaryBtn}>
              Start Building
            </Link>

            <Link to="/dashboard-preview" className={styles.primaryBtn}>
              Preview Dashboard
            </Link>

            <Link to="/admin-preview" className={styles.primaryBtn}>
              Admin Preview
            </Link>

            <button
              id="menu-toggle"
              className={styles.menuBtn}
              onClick={toggleMobileMenu}
              aria-label="Toggle Menu"
            >
              {isMobileMenuOpen ? (
                <CloseIcon size={16} color={colors.IconColor} />
              ) : (
                <MenuIcon size={16} color={colors.IconColor} />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* 2. MOBILE NAVIGATION DRAWER */}
      <div
        className={`${styles.mobileMenu} ${isMobileMenuOpen ? styles.mobileMenuOpen : ""}`}
        id="mobile-menu"
      >
        <Link
          to="/"
          hash="scroll-track"
          className={styles.mobileNavLink}
          onClick={closeMobileMenu}
        >
          How it works
        </Link>
        <Link
          to="/"
          hash="features-section"
          className={styles.mobileNavLink}
          onClick={closeMobileMenu}
        >
          Features
        </Link>
        <Link
          to="/"
          hash="industry-stack-section"
          className={styles.mobileNavLink}
          onClick={closeMobileMenu}
        >
          Industries
        </Link>
        <Link
          to="/"
          hash="pricing-section"
          className={styles.mobileNavLink}
          onClick={closeMobileMenu}
        >
          Pricing
        </Link>
        <Link
          to="/"
          hash="faq-section"
          className={styles.mobileNavLink}
          onClick={closeMobileMenu}
        >
          FAQ
        </Link>

        <div className={styles.divider}></div>

        <div className={styles.mobileActions} style={{ flexDirection: "column", gap: "0.75rem" }}>
          <div style={{ display: "flex", gap: "1rem", width: "100%" }}>
            <Link
              to="/login"
              className={styles.mobileLoginBtn}
              onClick={closeMobileMenu}
            >
              Log in
            </Link>
            <Link
              to="/signup"
              className={styles.mobilePrimaryBtn}
              onClick={closeMobileMenu}
            >
              Start Building
            </Link>
          </div>
          <div style={{ display: "flex", gap: "1rem", width: "100%" }}>
            <Link
              to="/dashboard-preview"
              className={styles.mobileLoginBtn}
              style={{ flex: 1, textAlign: "center" }}
              onClick={closeMobileMenu}
            >
              Preview Dashboard
            </Link>
            <Link
              to="/admin-preview"
              className={styles.mobilePrimaryBtn}
              style={{ flex: 1, textAlign: "center" }}
              onClick={closeMobileMenu}
            >
              Admin Preview
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;
