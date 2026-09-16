import React, { FC } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useThemeStore } from "../../../hooks";
import {
  SlidersIcon,
  DatabaseIcon,
  TerminalIcon,
  LayoutGridIcon,
} from "../../../assets/icons";
import { SimulatedWidgetPreviewProps } from "../../../interfaces/common/simulatedWidgetPreview.interface";
import styles from "../../../styles/simulatedwidgetpreview.module.css";

export const SimulatedWidgetPreview: FC<SimulatedWidgetPreviewProps> = ({
  activeAudience = "customer",
  accentColor,
  industry = "saas",
  apisList = [],
}) => {
  const { colors } = useThemeStore();
  const ind = (industry || "").toLowerCase();

  const isECommerce =
    ind.includes("e-commerce") ||
    ind.includes("ecommerce") ||
    ind.includes("retail");
  const isTravel =
    ind.includes("travel") ||
    ind.includes("booking") ||
    ind.includes("hospitality");
  const isFintech =
    ind.includes("fintech") ||
    ind.includes("banking") ||
    ind.includes("finance");
  const isLogistics =
    ind.includes("logistics") ||
    ind.includes("shipping") ||
    ind.includes("delivery");

  const hexToRgba = (hex: string, alpha: number) => {
    let c = hex.replace("#", "");
    if (c.length === 3)
      c = c
        .split("")
        .map((x) => x + x)
        .join("");
    const num = parseInt(c, 16);
    if (isNaN(num)) return `rgba(99, 102, 241, ${alpha})`;
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const primaryAccent =
    accentColor || colors.SwatchIndigo || colors.BrandIndigo;
  const bgAccentSoft = hexToRgba(primaryAccent, 0.12);
  const borderAccentSoft = hexToRgba(primaryAccent, 0.3);

  return (
    <div
      className={styles.container}
      style={{
        background: colors.Headerbackground,
        border: `1px solid ${colors.CardBorderSecondary}`,
        boxShadow: `0 10px 40px ${colors.OverlayShadow}`,
      }}
    >
      {/* ChatGPT Header Simulation */}
      <div
        className={styles.header}
        style={{ borderBottom: `1px solid ${colors.CardBorder}` }}
      >
        <div className={styles.headerLeft}>
          <div
            className={styles.pulseDot}
            style={{
              backgroundColor: primaryAccent,
              boxShadow: `0 0 10px ${primaryAccent}`,
            }}
          />
          <span
            className={styles.headerTitle}
            style={{ color: colors.TextHeading }}
          >
            ChatGPT MCP Widget Simulation
          </span>
        </div>
        <div
          className={styles.audienceBadge}
          style={{
            background: bgAccentSoft,
            color: primaryAccent,
            border: `1px solid ${borderAccentSoft}`,
          }}
        >
          {activeAudience === "customer" ? "Customer View" : "Admin View"}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeAudience === "customer" ? (
          <motion.div
            key="sim-customer"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            style={{ display: "flex", flexDirection: "column" }}
          >
            {/* User Prompt Simulation */}
            <div
              className={styles.promptBubble}
              style={{
                background: colors.UISelectionCardBackground,
                color: colors.TextHeading,
              }}
            >
              {isTravel
                ? "Find top-rated weekend getaway packages with instant booking."
                : isECommerce
                  ? "Show top selling items available for instant checkout."
                  : isFintech
                    ? "Check my account balance and recent payouts."
                    : isLogistics
                      ? "Track my recent shipment status."
                      : "Show featured choices with active discounts."}
            </div>

            {/* AI Response Widget Container */}
            <div
              className={styles.widgetCard}
              style={{
                background: colors.Card,
                border: `1px solid ${colors.CardBorder}`,
                boxShadow: `0 8px 24px ${hexToRgba(primaryAccent, 0.15)}`,
              }}
            >
              <div className={styles.cardHeader}>
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.375rem",
                    }}
                  >
                    {isFintech ? (
                      <DatabaseIcon size={14} color={primaryAccent} />
                    ) : isTravel ? (
                      <SlidersIcon size={14} color={primaryAccent} />
                    ) : isLogistics ? (
                      <TerminalIcon size={14} color={primaryAccent} />
                    ) : (
                      <LayoutGridIcon size={14} color={primaryAccent} />
                    )}
                    <h4
                      className={styles.cardTitle}
                      style={{ color: colors.TextHeading }}
                    >
                      {isTravel
                        ? "Alpine Luxury Resort & Spa"
                        : isECommerce
                          ? "Pro Wireless Headphones"
                          : isFintech
                            ? "Checking Balance & Payouts"
                            : isLogistics
                              ? "Shipment #TRK-98421"
                              : "Premium Subscription Plan"}
                    </h4>
                  </div>
                  <p
                    className={styles.cardSub}
                    style={{ color: colors.TextBody }}
                  >
                    {isTravel
                      ? "Swiss Alps • All Inclusive • 4.9 ★ (128 Reviews)"
                      : isECommerce
                        ? "In Stock • Free 2-Day Shipping"
                        : isFintech
                          ? "Verified Bank Account • Instant Transfer Ready"
                          : isLogistics
                            ? "In Transit • Estimated Delivery: Tomorrow 2 PM"
                            : "Unlimited API calls & priority support"}
                  </p>
                </div>
                <span
                  className={styles.priceTag}
                  style={{ color: primaryAccent }}
                >
                  {isTravel
                    ? "$299/night"
                    : isECommerce
                      ? "$189.99"
                      : isFintech
                        ? "$12,450.00"
                        : "$49/mo"}
                </span>
              </div>

              {/* Action Buttons styled with Brand Accent */}
              <div className={styles.actionRow}>
                <button
                  type="button"
                  className={styles.btnPrimary}
                  style={{
                    background: primaryAccent,
                    color: colors.TextOverlay,
                    boxShadow: `0 4px 12px ${hexToRgba(primaryAccent, 0.35)}`,
                  }}
                >
                  {isTravel
                    ? "Book Now"
                    : isECommerce
                      ? "Instant Checkout"
                      : isFintech
                        ? "Transfer Funds"
                        : "Upgrade Now"}
                </button>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  style={{
                    background: colors.BackgroundSecondary,
                    color: colors.TextHeading,
                    border: `1px solid ${colors.CardBorder}`,
                  }}
                >
                  View Details
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="sim-admin"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            style={{ display: "flex", flexDirection: "column" }}
          >
            {/* Admin Prompt Simulation */}
            <div
              className={styles.promptBubble}
              style={{
                background: colors.BackgroundSecondary,
                color: colors.TextHeading,
              }}
            >
              Show platform telemetry metrics, recent orders, and administrative
              actions.
            </div>

            {/* Admin Dashboard Container */}
            <div
              className={styles.widgetCard}
              style={{
                background: colors.Card,
                border: `1px solid ${colors.CardBorder}`,
                boxShadow: `0 8px 24px ${hexToRgba(primaryAccent, 0.15)}`,
              }}
            >
              {/* Telemetry Metrics Grid */}
              <div className={styles.metricsGrid}>
                {[
                  {
                    label: isFintech
                      ? "Net Processing Volume"
                      : "Active Revenue",
                    val: isFintech ? "$184,200" : "$48,250",
                    change: "+14%",
                  },
                  {
                    label: isFintech ? "Settlements" : "API Requests",
                    val: isFintech ? "98.4%" : "142.8k",
                    change: "+8%",
                  },
                  {
                    label: "System Health",
                    val: "99.98%",
                    change: "Optimal",
                  },
                ].map((metric, idx) => (
                  <div
                    key={idx}
                    className={styles.metricCard}
                    style={{
                      background: colors.Background,
                      border: `1px solid ${colors.CardBorder}`,
                    }}
                  >
                    <div
                      className={styles.metricLabel}
                      style={{ color: colors.TextBody }}
                    >
                      {metric.label}
                    </div>
                    <div
                      className={styles.metricVal}
                      style={{ color: primaryAccent }}
                    >
                      {metric.val}
                    </div>
                    <div
                      className={styles.metricChange}
                      style={{
                        color: colors.SuccessBadgeText || primaryAccent,
                      }}
                    >
                      {metric.change}
                    </div>
                  </div>
                ))}
              </div>

              {/* Data Table */}
              <div
                className={styles.tableWrapper}
                style={{
                  background: colors.Background,
                  border: `1px solid ${colors.CardBorder}`,
                }}
              >
                <div
                  className={styles.tableHeader}
                  style={{
                    color: colors.TextHeading,
                    borderBottom: `1px solid ${colors.CardBorder}`,
                  }}
                >
                  <span>Transaction ID</span>
                  <span>Amount</span>
                  <span>Status</span>
                </div>
                {[
                  {
                    id: "TX-90412 (John D.)",
                    amt: "$240.00",
                    status: "Completed",
                  },
                  {
                    id: "TX-90413 (Sarah M.)",
                    amt: "$1,120.00",
                    status: "Processing",
                  },
                ].map((row, idx) => (
                  <div
                    key={idx}
                    className={styles.tableRow}
                    style={{
                      color: colors.TextBody,
                      borderBottom: `1px solid ${colors.CardBorder}`,
                    }}
                  >
                    <span
                      style={{ fontWeight: 500, color: colors.TextHeading }}
                    >
                      {row.id}
                    </span>
                    <span>{row.amt}</span>
                    <span style={{ color: primaryAccent, fontWeight: 600 }}>
                      {row.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
