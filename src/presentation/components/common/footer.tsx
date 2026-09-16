import React from "react";
import styles from "../../../styles/footer.module.css";
import { useThemeStore } from "../../../infrastructure/store/themeStore";
import { HeartIcon } from "../../../assets/icons";

const Footer: React.FC = () => {
  const { colors } = useThemeStore();

  return (
    <footer className={styles.customFooter}>
      <div className={styles.footerContainer}>
        <div className={styles.footerGrid}>
          {/* Branding column */}
          <div className={styles.footerBranding}>
            <div>
              <div className={styles.footerLogo}>
                <span className={styles.footerLogoText}>SoftTech AI</span>
              </div>
              <p className={styles.footerBrandingDesc}>
                Build, deploy and manage secure OpenAPI App SDK integrations and Model Context Protocol servers automatically.
              </p>
            </div>
            <div className={styles.footerLegalLinks}>
              <a href="#" className={styles.footerLegalLink}>Privacy Policy</a>
              <span>&bull;</span>
              <a href="#" className={styles.footerLegalLink}>Terms of Service</a>
            </div>
          </div>

          {/* Links column 1 */}
          <div>
            <h4 className={styles.footerColHeading}>Platform</h4>
            <ul className={styles.footerLinksList}>
              <li><a href="#" className={styles.footerLink}>Documentation</a></li>
              <li><a href="#" className={styles.footerLink}>Widget Catalog</a></li>
              <li><a href="#" className={styles.footerLink}>OAuth Bridge</a></li>
              <li><a href="#" className={styles.footerLink}>Release Notes</a></li>
            </ul>
          </div>

          {/* Links column 2 */}
          <div>
            <h4 className={styles.footerColHeading}>Resources</h4>
            <ul className={styles.footerLinksList}>
              <li><a href="#" className={styles.footerLink}>MCP Protocol</a></li>
              <li><a href="#" className={styles.footerLink}>Developer Portal</a></li>
              <li><a href="#" className={styles.footerLink}>API Status</a></li>
              <li><a href="#" className={styles.footerLink}>Community Forum</a></li>
            </ul>
          </div>

          {/* Links column 3 */}
          <div>
            <h4 className={styles.footerColHeading}>Company</h4>
            <ul className={styles.footerLinksList}>
              <li><a href="#" className={styles.footerLink}>About Us</a></li>
              <li><a href="#" className={styles.footerLink}>Pricing Plans</a></li>
              <li><a href="#" className={styles.footerLink}>Security Audit</a></li>
              <li><a href="#" className={styles.footerLink}>Contact Sales</a></li>
            </ul>
          </div>
        </div>

        <div className={styles.footerDivider}></div>

        <div className={styles.footerBottomRow}>
          <div>&copy; 2026 SoftTech AI Corporation. All rights reserved.</div>
          <div className={styles.footerCreator}>
            Made with{" "}
            <span className={styles.footerHeart}>
              <HeartIcon size={14} color={colors.ButtonGradientOne} />
            </span>{" "}
            for the developer ecosystem.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
