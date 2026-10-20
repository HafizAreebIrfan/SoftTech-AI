import React, { FC } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  SparklesIcon,
  CheckIcon,
  RocketIcon,
  LeftArrowIcon,
  ShieldLockIcon,
  CodeIcon,
  BoltIcon,
} from "../../../../assets/icons";
import { useThemeStore } from "../../../../infrastructure/store/themeStore";
import { useAuthStore } from "../../../../infrastructure/store/authStore";
import { showToast } from "../../../../utils/toast";
import styles from "../../../../styles/upgrade.module.css";

interface UpgradeProps {
  isEmbeddedInDashboard?: boolean;
  onGoBack?: () => void;
}

const Upgrade: FC<UpgradeProps> = ({
  isEmbeddedInDashboard = false,
  onGoBack,
}) => {
  const navigate = useNavigate();
  const { colors } = useThemeStore();
  const { user } = useAuthStore();

  const handleUpgradeClick = (tier: string) => {
    showToast(
      `Redirecting to checkout for ${tier} protocol tier...`,
      "info",
    );
    navigate({ to: "/plans" });
  };

  const handleGoBack = () => {
    if (onGoBack) {
      onGoBack();
      return;
    }
    if (window.history.length > 1) {
      window.history.back();
    } else {
      navigate({ to: "/company-dashboard" });
    }
  };

  return (
    <div
      className={styles.upgradeContainer}
      style={
        isEmbeddedInDashboard
          ? {
              padding: "1rem 0",
              minHeight: "auto",
              background: "transparent",
            }
          : undefined
      }
    >
      <div className={styles.upgradeInner}>
        {/* Top Navigation Bar */}
        <div className={styles.topBar}>
          <button
            type="button"
            onClick={handleGoBack}
            className={styles.backBtn}
          >
            <LeftArrowIcon size={16} color="currentColor" />
            <span>Back to Dashboard</span>
          </button>
        </div>

        {/* Header Section */}
        <div className={styles.headerSection}>
          <div className={styles.badge}>
            <SparklesIcon size={14} color="currentColor" />
            <span>ENTERPRISE CAPABILITIES</span>
          </div>
          <h1 className={styles.title}>
            Custom Layouts &amp; Interactive ChatGPT Canvas
          </h1>
          <p className={styles.subtitle}>
            Unlock custom UI component injection, dedicated edge routing, and
            unlimited high-concurrency Model Context Protocol throughput for your organization.
          </p>
        </div>

        {/* Plans Grid */}
        <div className={styles.plansGrid}>
          {/* Current Tier */}
          <div className={styles.planCard}>
            <div className={styles.planHeader}>
              <span className={styles.planName}>Developer / Standard</span>
              <p className={styles.planDesc}>
                Everything you need to test and deploy standard data-driven MCP tools into ChatGPT.
              </p>
            </div>

            <div className={styles.priceRow}>
              <span className={styles.priceAmount}>Free</span>
              <span className={styles.pricePeriod}>/ included in setup</span>
            </div>

            <div className={styles.featuresList}>
              <div className={styles.featureItem}>
                <span className={styles.featureIcon}>
                  <CheckIcon size={16} color="currentColor" />
                </span>
                <span>Auto data-driven response widgets in ChatGPT</span>
              </div>
              <div className={styles.featureItem}>
                <span className={styles.featureIcon}>
                  <CheckIcon size={16} color="currentColor" />
                </span>
                <span>Standard OpenAPI 3.1 &amp; MCP SSE endpoint</span>
              </div>
              <div className={styles.featureItem}>
                <span className={styles.featureIcon}>
                  <CheckIcon size={16} color="currentColor" />
                </span>
                <span>Up to 10 connected API endpoints</span>
              </div>
              <div className={styles.featureItem}>
                <span className={styles.featureIcon}>
                  <CheckIcon size={16} color="currentColor" />
                </span>
                <span>Standard community support</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoBack}
              className={`${styles.planCta} ${styles.ctaSecondary}`}
            >
              <span>Current Plan (Active)</span>
            </button>
          </div>

          {/* Enterprise Custom Tier */}
          <div className={`${styles.planCard} ${styles.planCardFeatured}`}>
            <span className={styles.featuredRibbon}>Recommended for Custom UI</span>

            <div className={styles.planHeader}>
              <span className={styles.planName}>Enterprise Custom Protocol</span>
              <p className={styles.planDesc}>
                Full UI freedom with custom React components, white-label branding, and dedicated edge proxies.
              </p>
            </div>

            <div className={styles.priceRow}>
              <span className={styles.priceAmount}>$149</span>
              <span className={styles.pricePeriod}>/ month</span>
            </div>

            <div className={styles.featuresList}>
              <div className={styles.featureItem}>
                <span className={styles.featureIcon}>
                  <CheckIcon size={16} color="currentColor" />
                </span>
                <strong className="text-white">Custom Layout Builder &amp; Component Canvas</strong>
              </div>
              <div className={styles.featureItem}>
                <span className={styles.featureIcon}>
                  <CheckIcon size={16} color="currentColor" />
                </span>
                <span>Interactive React forms, tables &amp; charts inside ChatGPT</span>
              </div>
              <div className={styles.featureItem}>
                <span className={styles.featureIcon}>
                  <CheckIcon size={16} color="currentColor" />
                </span>
                <span>Sub-15ms dedicated MCP edge tunnel clusters</span>
              </div>
              <div className={styles.featureItem}>
                <span className={styles.featureIcon}>
                  <CheckIcon size={16} color="currentColor" />
                </span>
                <span>Unlimited monthly API execution quota</span>
              </div>
              <div className={styles.featureItem}>
                <span className={styles.featureIcon}>
                  <CheckIcon size={16} color="currentColor" />
                </span>
                <span>Custom CNAME domain &amp; OAuth 2.0 PKCE gateway</span>
              </div>
              <div className={styles.featureItem}>
                <span className={styles.featureIcon}>
                  <CheckIcon size={16} color="currentColor" />
                </span>
                <span>99.99% SLA &amp; dedicated protocol engineer</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleUpgradeClick("Enterprise Custom Protocol")}
              className={`${styles.planCta} ${styles.ctaPrimary}`}
            >
              <RocketIcon size={16} color="currentColor" />
              <span>Upgrade to Enterprise Custom</span>
            </button>
          </div>
        </div>

        {/* Why Custom Layout Section */}
        <div className={styles.whyCustomSection}>
          <div className={styles.whyHeader}>
            <h3 className={styles.whyTitle}>
              Why Upgrade to Custom Layouts?
            </h3>
            <p className={styles.whyDesc}>
              Standard Auto layouts inspect your response JSON and dynamically synthesize cards and tables. Custom layouts give your engineers full control over what ChatGPT renders.
            </p>
          </div>

          <div className={styles.whyGrid}>
            <div className={styles.whyCard}>
              <span className={styles.whyCardTitle}>
                <CodeIcon size={18} color="var(--app-text-highlighted-heading)" />
                Bespoke Component Sandboxes
              </span>
              <p className={styles.whyCardDesc}>
                Render rich interactive widgets—from live real-time booking calendars and car selectors to dynamic portfolio graphs—directly inside OpenAI Canvas.
              </p>
            </div>

            <div className={styles.whyCard}>
              <span className={styles.whyCardTitle}>
                <BoltIcon size={18} color="var(--app-text-highlighted-heading)" />
                Ultra-Low Edge Latency
              </span>
              <p className={styles.whyCardDesc}>
                Route ChatGPT tool executions through dedicated edge instances nearest to OpenAI data centers for instant conversational responses.
              </p>
            </div>

            <div className={styles.whyCard}>
              <span className={styles.whyCardTitle}>
                <ShieldLockIcon size={18} color="var(--app-text-highlighted-heading)" />
                Enterprise Security &amp; Audit
              </span>
              <p className={styles.whyCardDesc}>
                Role-based access control, cryptographic signature verification, and automated SOC2-ready request audit logging.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Upgrade;
