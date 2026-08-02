import React from "react";
import styles from "../../../../../styles/adminpreview.module.css";
import { useThemeStore } from "../../../../../hooks/usetheme";

interface PlansTabProps {
  activePlan: string;
  handleSelectPlan: (plan: string) => void;
  isUpgrading: boolean;
  upgradeTarget: string;
  upgradeStatus: string;
}

const PlansTab: React.FC<PlansTabProps> = ({
  activePlan,
  handleSelectPlan,
  isUpgrading,
  upgradeTarget,
  upgradeStatus
}) => {
  const { colors, isDark } = useThemeStore();

  const emeraldBadgeStyle = {
    backgroundColor: isDark ? "rgba(5, 150, 105, 0.15)" : "rgba(5, 150, 105, 0.1)",
    color: colors.BrandEmerald,
    borderColor: isDark ? "rgba(5, 150, 105, 0.3)" : "rgba(5, 150, 105, 0.2)",
    borderStyle: "solid" as const,
    borderWidth: "1px"
  };

  return (
    <>
      <div className={styles.sectionCard}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>💳 Subscription & Plans Billing</h2>
          <span className={styles.badge} style={emeraldBadgeStyle}>
            Active Plan: {activePlan}
          </span>
        </div>

        {/* Plan Selection Cards Grid */}
        <div className={styles.planGrid}>

          {/* TIER 1: STARTER */}
          <div
            className={`${styles.planCard} ${activePlan === "Starter" ? styles.planCardActive : ""}`}
            style={{
              borderColor: activePlan === "Starter" ? colors.TextPrimary : colors.CardBorder,
              backgroundColor: isDark ? "rgba(255, 255, 255, 0.01)" : "rgba(0, 0, 0, 0.005)"
            }}
          >
            {activePlan === "Starter" && (
              <div className={styles.planRibbon} style={{ backgroundColor: colors.BrandEmerald }}>
                Current
              </div>
            )}
            <h3 className={styles.planName} style={{ color: colors.TextPrimary }}>Starter</h3>
            <div className={styles.planPrice}>
              <span className={styles.planPriceAmount} style={{ color: colors.TextPrimary }}>$49</span>
              <span className={styles.planPricePeriod} style={{ color: colors.TextSecondary }}>/mo</span>
            </div>
            <p style={{ fontSize: "0.825rem", color: colors.TextSecondary }}>
              Ideal for teams configuring initial mock REST APIs and simple AI agents.
            </p>
            <ul className={styles.planFeatures} style={{ color: colors.TextSecondary }}>
              <li className={styles.planFeatureItem}>✓ Up to 3 API Endpoints</li>
              <li className={styles.planFeatureItem}>✓ 5 Enabled MCP Tools</li>
              <li className={styles.planFeatureItem}>✓ Standard API Playground</li>
              <li className={styles.planFeatureItem} style={{ opacity: 0.5 }}>✗ Custom Visual Widget Overrides</li>
            </ul>
            <button
              className={activePlan === "Starter" ? styles.btnSecondary : styles.btnPrimary}
              style={{
                width: "100%",
                marginTop: "auto",
                backgroundColor: activePlan === "Starter" ? "transparent" : colors.TextPrimary,
                color: activePlan === "Starter" ? colors.TextSecondary : colors.Background,
                borderColor: activePlan === "Starter" ? colors.CardBorder : "transparent"
              }}
              disabled={activePlan === "Starter"}
              onClick={() => handleSelectPlan("Starter")}
            >
              {activePlan === "Starter" ? "Active Plan" : "Choose Starter"}
            </button>
          </div>

          {/* TIER 2: PRO */}
          <div
            className={`${styles.planCard} ${activePlan === "Pro" ? styles.planCardActive : ""}`}
            style={{
              borderColor: activePlan === "Pro" ? colors.TextPrimary : colors.CardBorder,
              backgroundColor: isDark ? "rgba(255, 255, 255, 0.01)" : "rgba(0, 0, 0, 0.005)"
            }}
          >
            {activePlan === "Pro" && (
              <div className={styles.planRibbon} style={{ backgroundColor: colors.BrandEmerald }}>
                Current
              </div>
            )}
            <h3 className={styles.planName} style={{ color: colors.TextPrimary }}>Developer Pro</h3>
            <div className={styles.planPrice}>
              <span className={styles.planPriceAmount} style={{ color: colors.TextPrimary }}>$149</span>
              <span className={styles.planPricePeriod} style={{ color: colors.TextSecondary }}>/mo</span>
            </div>
            <p style={{ fontSize: "0.825rem", color: colors.TextSecondary }}>
              Designed for fast-growing companies deploying dynamic widgets with security credentials.
            </p>
            <ul className={styles.planFeatures} style={{ color: colors.TextSecondary }}>
              <li className={styles.planFeatureItem}>✓ Unlimited Registered APIs</li>
              <li className={styles.planFeatureItem}>✓ 20 Enabled MCP Tools</li>
              <li className={styles.planFeatureItem}>✓ Fully Interactive Playground</li>
              <li className={styles.planFeatureItem}>✓ Custom Visual Widget Overrides</li>
            </ul>
            <button
              className={activePlan === "Pro" ? styles.btnSecondary : styles.btnPrimary}
              style={{
                width: "100%",
                marginTop: "auto",
                backgroundColor: activePlan === "Pro" ? "transparent" : colors.TextPrimary,
                color: activePlan === "Pro" ? colors.TextSecondary : colors.Background,
                borderColor: activePlan === "Pro" ? colors.CardBorder : "transparent"
              }}
              disabled={activePlan === "Pro"}
              onClick={() => handleSelectPlan("Pro")}
            >
              {activePlan === "Pro" ? "Active Plan" : "Choose Pro"}
            </button>
          </div>

          {/* TIER 3: ENTERPRISE */}
          <div
            className={`${styles.planCard} ${activePlan === "Enterprise" ? styles.planCardActive : ""}`}
            style={{
              borderColor: activePlan === "Enterprise" ? colors.TextPrimary : colors.CardBorder,
              backgroundColor: isDark ? "rgba(255, 255, 255, 0.01)" : "rgba(0, 0, 0, 0.005)"
            }}
          >
            {activePlan === "Enterprise" && (
              <div className={styles.planRibbon} style={{ backgroundColor: colors.BrandEmerald }}>
                Current
              </div>
            )}
            <h3 className={styles.planName} style={{ color: colors.TextPrimary }}>Enterprise</h3>
            <div className={styles.planPrice}>
              <span className={styles.planPriceAmount} style={{ color: colors.TextPrimary }}>$499</span>
              <span className={styles.planPricePeriod} style={{ color: colors.TextSecondary }}>/mo</span>
            </div>
            <p style={{ fontSize: "0.825rem", color: colors.TextSecondary }}>
              For high-volume transaction architectures requiring specialized SLA support.
            </p>
            <ul className={styles.planFeatures} style={{ color: colors.TextSecondary }}>
              <li className={styles.planFeatureItem}>✓ Unlimited Endpoints & Tools</li>
              <li className={styles.planFeatureItem}>✓ Premium Dedicated Hosting Bridge</li>
              <li className={styles.planFeatureItem}>✓ Custom OAuth SSO Integration</li>
              <li className={styles.planFeatureItem}>✓ 24/7 Priority Support & SLA</li>
            </ul>
            <button
              className={activePlan === "Enterprise" ? styles.btnSecondary : styles.btnPrimary}
              style={{
                width: "100%",
                marginTop: "auto",
                backgroundColor: activePlan === "Enterprise" ? "transparent" : colors.TextPrimary,
                color: activePlan === "Enterprise" ? colors.TextSecondary : colors.Background,
                borderColor: activePlan === "Enterprise" ? colors.CardBorder : "transparent"
              }}
              disabled={activePlan === "Enterprise"}
              onClick={() => handleSelectPlan("Enterprise")}
            >
              {activePlan === "Enterprise" ? "Active Plan" : "Choose Enterprise"}
            </button>
          </div>

        </div>
      </div>

      {/* Billing Summary Info */}
      <div className={styles.sectionCard}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle} style={{ fontSize: "1rem" }}>💳 Billing History</h3>
        </div>
        <table className={styles.customTable} style={{ fontSize: "0.8rem" }}>
          <thead>
            <tr>
              <th style={{ color: colors.TextSecondary }}>Billing Date</th>
              <th style={{ color: colors.TextSecondary }}>Billing Cycle</th>
              <th style={{ color: colors.TextSecondary }}>Payment Method</th>
              <th style={{ color: colors.TextSecondary }}>Total Invoiced</th>
              <th style={{ color: colors.TextSecondary }}>Receipt Status</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottomColor: colors.CardBorder }}>
              <td style={{ color: colors.TextPrimary }}>July 15, 2026</td>
              <td style={{ color: colors.TextPrimary }}>Monthly Renewal [Pro]</td>
              <td style={{ color: colors.TextPrimary }}>Visa ending in 4242</td>
              <td style={{ color: colors.TextPrimary }}>$149.00</td>
              <td>
                <span style={{ color: colors.BrandEmerald, fontWeight: "700" }}>PAID</span>
              </td>
            </tr>
            <tr style={{ borderBottomColor: colors.CardBorder }}>
              <td style={{ color: colors.TextPrimary }}>June 15, 2026</td>
              <td style={{ color: colors.TextPrimary }}>Monthly Renewal [Pro]</td>
              <td style={{ color: colors.TextPrimary }}>Visa ending in 4242</td>
              <td style={{ color: colors.TextPrimary }}>$149.00</td>
              <td>
                <span style={{ color: colors.BrandEmerald, fontWeight: "700" }}>PAID</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* UPGRADE LOADER OVERLAY */}
      {isUpgrading && (
        <div className={styles.modalOverlay}>
          <div
            className={styles.modalContent}
            style={{
              alignItems: "center",
              textAlign: "center",
              gap: "1.5rem",
              backgroundColor: colors.BackgroundSecondary,
              borderColor: colors.CardBorder
            }}
          >
            <div
              style={{
                width: "50px",
                height: "50px",
                border: "5px solid rgba(255, 255, 255, 0.05)",
                borderTopColor: colors.BrandEmerald,
                borderRadius: "50%",
                animation: "spin 1s linear infinite"
              }}
            />
            <style>{`
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}</style>
            <div>
              <h4 style={{ fontSize: "1.2rem", fontWeight: "800", color: colors.TextPrimary }}>
                Activating {upgradeTarget} Plan
              </h4>
              <p style={{ fontSize: "0.85rem", color: colors.TextSecondary, marginTop: "0.5rem" }}>
                {upgradeStatus}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PlansTab;
