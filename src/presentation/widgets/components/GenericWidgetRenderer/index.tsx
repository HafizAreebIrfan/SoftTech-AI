import React, { useState, useEffect } from "react";
import { useMcpToolResult } from "../../../../infrastructure/store/mcpWidgetStore";
import { WidgetBlock } from "../../../../domain/entities/GenericWidget";
import styles from "../../../../styles/genericwidgetrenderer.module.css";
import { MOCK_INDUSTRY_DATA } from "../../../../hooks/mockData/index";
import { useThemeStore } from "../../../../hooks";

// Import Modular Industry Screens
import { EcommerceScreen } from "../../Screens/Ecommerce";
import { FintechScreen } from "../../Screens/Fintech";
import { ForecastingScreen } from "../../Screens/Forecasting";
import { LogisticsScreen } from "../../Screens/Logistics";
import { SaasScreen } from "../../Screens/Saas";
import { AiScreen } from "../../Screens/Ai";
import { HealthScreen } from "../../Screens/Health";
import { FoodScreen } from "../../Screens/Food";
import { TransportScreen } from "../../Screens/Transport";
import { TravelScreen } from "../../Screens/Travel";
import { GeneralScreen } from "../../Screens/General";

export const GenericWidgetRenderer: React.FC = () => {
  const { colors } = useThemeStore();
  let toolResult;

  try {
    toolResult = useMcpToolResult();
    console.log("toolResult", toolResult);
  } catch (e) {
    console.error("HOOK FAILED", e);
    return (
      <div
        style={{
          color: colors.TextHeading,
          background: colors.Background,
          padding: "20px",
          fontSize: "24px",
        }}
      >
        Hook crashed
      </div>
    );
  }

  // Parse layout preference or industry from toolResult
  const payloadLayout =
    toolResult?.structuredContent?.layout?.toLowerCase() || "";
  const payloadIndustry =
    toolResult?.structuredContent?.industry?.toLowerCase() || "";

  let defaultPreviewLayout = "dashboard";
  if (payloadLayout) {
    if (payloadLayout.includes("dashboard") || payloadLayout.includes("metrics")) {
      defaultPreviewLayout = "dashboard";
    } else if (
      payloadLayout.includes("catalog") ||
      payloadLayout.includes("grid") ||
      payloadLayout.includes("card")
    ) {
      defaultPreviewLayout = "catalog";
    } else if (payloadLayout.includes("table") || payloadLayout.includes("list")) {
      defaultPreviewLayout = "table";
    } else if (
      payloadLayout.includes("timeline") ||
      payloadLayout.includes("step")
    ) {
      defaultPreviewLayout = "timeline";
    } else {
      defaultPreviewLayout = payloadLayout;
    }
  } else {
    // Fallback based on industry
    if (
      payloadIndustry.includes("commerce") ||
      payloadIndustry.includes("travel") ||
      payloadIndustry.includes("booking") ||
      payloadIndustry.includes("food")
    ) {
      defaultPreviewLayout = "catalog";
    } else if (
      payloadIndustry.includes("saas") ||
      payloadIndustry.includes("fintech") ||
      payloadIndustry.includes("finance")
    ) {
      defaultPreviewLayout = "table";
    } else if (
      payloadIndustry.includes("logistics") ||
      payloadIndustry.includes("transport") ||
      payloadIndustry.includes("delivery")
    ) {
      defaultPreviewLayout = "timeline";
    } else {
      defaultPreviewLayout = "dashboard";
    }
  }

  const [previewLayout, setPreviewLayout] =
    useState<string>(defaultPreviewLayout);

  // If defaults change, sync the state
  useEffect(() => {
    if (defaultPreviewLayout) {
      setPreviewLayout(defaultPreviewLayout);
    }
  }, [defaultPreviewLayout]);

  // Is this running in default preview fallback?
  const isPreview =
    !toolResult || (toolResult as any)._meta?.isPreview === true;

  // Decide content to show
  const activeContent = isPreview
    ? MOCK_INDUSTRY_DATA[previewLayout === "dashboard" ? "forecasting" : previewLayout === "catalog" ? "ecommerce" : previewLayout === "table" ? "saas" : "logistics"] || MOCK_INDUSTRY_DATA.ecommerce
    : toolResult?.structuredContent;

  if (!activeContent) {
    return (
      <div className={styles.emptyState}>
        <h3 className={styles.emptyTitle}>No interface loaded</h3>
      </div>
    );
  }

  const { title, subtitle, blocks = [] } = activeContent;
  const activeLayout = isPreview ? previewLayout : defaultPreviewLayout;

  // Render developer simulate dropdown
  const renderPreviewControls = (
    previewLay: string,
    setPreviewLay: (v: string) => void,
  ) => {
    return (
      <div
        style={{
          margin: "0 0 0 0",
          background: colors.BackgroundSecondary,
          padding: "1rem",
          borderRadius: "12px",
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontSize: "14px",
              fontWeight: "700",
              color: colors.TextHeading,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Simulate Layout Template Preview
          </span>
        </div>
        <select
          value={previewLay}
          onChange={(e) => setPreviewLay(e.target.value)}
          style={{
            background: colors.BackgroundSecondary,
            color: colors.TextBody,
            border: `1px solid ${colors.CardBorderSecondary}`,
            borderRadius: "18px",
            padding: "18px 12px",
            fontSize: "13px",
            cursor: "pointer",
            outline: "none",
          }}
        >
          <option value="dashboard">Dashboard Template (Metrics & Telemetry)</option>
          <option value="catalog">Catalog Template (Grid Catalog Cards)</option>
          <option value="table">Table Template (Structured Rows & Logs)</option>
          <option value="timeline">Timeline Template (Stepped Progress Milestones)</option>
        </select>
      </div>
    );
  };

  // Route rendering to template screens
  switch (activeLayout) {
    case "catalog":
      return (
        <EcommerceScreen
          title={title}
          subtitle={subtitle}
          blocks={blocks}
          isPreview={isPreview}
          previewIndustry={previewLayout}
          setPreviewIndustry={setPreviewLayout}
          renderPreviewControls={renderPreviewControls}
        />
      );
    case "table":
      return (
        <SaasScreen
          title={title}
          subtitle={subtitle}
          blocks={blocks}
          isPreview={isPreview}
          previewIndustry={previewLayout}
          setPreviewIndustry={setPreviewLayout}
          renderPreviewControls={renderPreviewControls}
        />
      );
    case "timeline":
      return (
        <LogisticsScreen
          title={title}
          subtitle={subtitle}
          blocks={blocks}
          isPreview={isPreview}
          previewIndustry={previewLayout}
          setPreviewIndustry={setPreviewLayout}
          renderPreviewControls={renderPreviewControls}
        />
      );
    case "dashboard":
    default:
      return (
        <ForecastingScreen
          title={title}
          subtitle={subtitle}
          blocks={blocks}
          isPreview={isPreview}
          previewIndustry={previewLayout}
          setPreviewIndustry={setPreviewLayout}
          renderPreviewControls={renderPreviewControls}
        />
      );
  }
};

