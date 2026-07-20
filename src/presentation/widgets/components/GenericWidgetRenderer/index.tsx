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

  // Is this running in default preview fallback?
  const isPreview =
    !toolResult || (toolResult as any)._meta?.isPreview === true;

  // Parse layout preference or industry from toolResult
  const payloadLayout =
    toolResult?.structuredContent?.layout?.toLowerCase() || "";
  const payloadIndustry =
    toolResult?.structuredContent?.industry?.toLowerCase() || "";
  const payloadTitle =
    toolResult?.structuredContent?.title?.toLowerCase() || "";

  // Heuristic: If it is a data-oriented view like customers/orders/invoices/history/packages,
  // we override layout to 'general' to prevent rendering catalog cards with 'Book Now' buttons.
  const isDataView =
    payloadTitle.includes("customer") ||
    payloadTitle.includes("order") ||
    payloadTitle.includes("invoice") ||
    payloadTitle.includes("user") ||
    payloadTitle.includes("history") ||
    payloadTitle.includes("transaction") ||
    payloadTitle.includes("ledger") ||
    payloadTitle.includes("log");

  let defaultPreviewLayout = "dashboard";
  if (!isPreview && isDataView) {
    defaultPreviewLayout = "general";
  } else if (payloadLayout) {
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
    case "catalog": {
      const isTravel = payloadIndustry.includes("travel") || payloadIndustry.includes("booking");
      const isFood = payloadIndustry.includes("food") || payloadIndustry.includes("restaurant") || payloadIndustry.includes("dine");

      if (isTravel) {
        return (
          <TravelScreen
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
      if (isFood) {
        return (
          <FoodScreen
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
    }
    case "table": {
      const isFintech = payloadIndustry.includes("fintech") || payloadIndustry.includes("finance") || payloadIndustry.includes("bank");
      if (isFintech) {
        return (
          <FintechScreen
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
    }
    case "timeline": {
      const isTransport = payloadIndustry.includes("transport") || payloadIndustry.includes("mobility") || payloadIndustry.includes("ride");
      if (isTransport) {
        return (
          <TransportScreen
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
    }
    case "general": {
      return (
        <GeneralScreen
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
    case "dashboard":
    default: {
      const isHealth = payloadIndustry.includes("health") || payloadIndustry.includes("med") || payloadIndustry.includes("clinic");
      const isAi = payloadIndustry.includes("ai") || payloadIndustry.includes("agent") || payloadIndustry.includes("auto");
      
      if (isHealth) {
        return (
          <HealthScreen
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
      if (isAi) {
        return (
          <AiScreen
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
  }
};

