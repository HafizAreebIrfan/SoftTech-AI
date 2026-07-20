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

  // Parse industry from toolResult or default to "ecommerce"
  const payloadIndustry =
    toolResult?.structuredContent?.industry?.toLowerCase() || "";
  let defaultPreviewKey = "ecommerce";
  if (payloadIndustry.includes("commerce")) defaultPreviewKey = "ecommerce";
  else if (
    payloadIndustry.includes("saas") ||
    payloadIndustry.includes("developer")
  )
    defaultPreviewKey = "saas";
  else if (
    payloadIndustry.includes("fintech") ||
    payloadIndustry.includes("finance")
  )
    defaultPreviewKey = "fintech";
  else if (
    payloadIndustry.includes("ai") ||
    payloadIndustry.includes("automation")
  )
    defaultPreviewKey = "ai";
  else if (payloadIndustry.includes("logistics"))
    defaultPreviewKey = "logistics";
  else if (payloadIndustry.includes("health")) defaultPreviewKey = "health";
  else if (
    payloadIndustry.includes("food") ||
    payloadIndustry.includes("hospitality")
  )
    defaultPreviewKey = "food";
  else if (
    payloadIndustry.includes("transport") ||
    payloadIndustry.includes("mobility")
  )
    defaultPreviewKey = "transport";
  else if (
    payloadIndustry.includes("travel") ||
    payloadIndustry.includes("booking")
  )
    defaultPreviewKey = "travel";
  else if (
    payloadIndustry.includes("forecasting") ||
    payloadIndustry.includes("data")
  )
    defaultPreviewKey = "forecasting";
  else if (payloadIndustry.includes("general")) defaultPreviewKey = "general";

  const [previewIndustry, setPreviewIndustry] =
    useState<string>(defaultPreviewKey);

  // If payloadIndustry changes, sync the state
  useEffect(() => {
    if (defaultPreviewKey) {
      setPreviewIndustry(defaultPreviewKey);
    }
  }, [defaultPreviewKey]);

  // Is this running in default preview fallback?
  const isPreview =
    !toolResult || (toolResult as any)._meta?.isPreview === true;

  // Decide content to show: real API result or simulated interactive industry template
  const activeContent = isPreview
    ? MOCK_INDUSTRY_DATA[previewIndustry] || MOCK_INDUSTRY_DATA.ecommerce
    : toolResult?.structuredContent;

  if (!activeContent) {
    return (
      <div className={styles.emptyState}>
        <h3 className={styles.emptyTitle}>No interface loaded</h3>
      </div>
    );
  }

  const { title, subtitle, blocks = [] } = activeContent;
  const activeIndustryKey = isPreview ? previewIndustry : defaultPreviewKey;

  // Render developer simulate dropdown
  const renderPreviewControls = (
    previewInd: string,
    setPreviewInd: (v: string) => void,
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
            Simulate Industry Layout Preview
          </span>
        </div>
        <select
          value={previewInd}
          onChange={(e) => setPreviewInd(e.target.value)}
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
          <option value="ecommerce">E-Commerce (Grid catalog cards)</option>
          <option value="saas">
            SaaS / Developer Tools (Log lines & Metrics)
          </option>
          <option value="fintech">
            FinTech (Portfolio table & Change badges)
          </option>
          <option value="ai">AI & Automation (Worker nodes)</option>
          <option value="logistics">Logistics (Stepped parcel tracking)</option>
          <option value="health">HealthTech (Telehealth consultation & EHR)</option>
          <option value="food">Food & Hospitality (Kitchen orders list)</option>
          <option value="transport">Mobility & Transport (Fleet dispatch & rides)</option>
          <option value="travel">
            Travel & Booking (Available flight options)
          </option>
          <option value="forecasting">
            Data & Forecasting (Predictive telemetry matrix)
          </option>
          <option value="general">General Business (Corporate stats)</option>
        </select>
      </div>
    );
  };

  // Route rendering to specific modular components
  switch (activeIndustryKey) {
    case "ecommerce":
      return (
        <EcommerceScreen
          title={title}
          subtitle={subtitle}
          isPreview={isPreview}
          previewIndustry={previewIndustry}
          setPreviewIndustry={setPreviewIndustry}
          renderPreviewControls={renderPreviewControls}
        />
      );
    case "fintech":
      return (
        <FintechScreen
          title={title}
          subtitle={subtitle}
          blocks={blocks}
          isPreview={isPreview}
          previewIndustry={previewIndustry}
          setPreviewIndustry={setPreviewIndustry}
          renderPreviewControls={renderPreviewControls}
        />
      );
    case "forecasting":
      return (
        <ForecastingScreen
          title={title}
          subtitle={subtitle}
          blocks={blocks}
          isPreview={isPreview}
          previewIndustry={previewIndustry}
          setPreviewIndustry={setPreviewIndustry}
          renderPreviewControls={renderPreviewControls}
        />
      );
    case "logistics":
      return (
        <LogisticsScreen
          title={title}
          subtitle={subtitle}
          blocks={blocks}
          isPreview={isPreview}
          previewIndustry={previewIndustry}
          setPreviewIndustry={setPreviewIndustry}
          renderPreviewControls={renderPreviewControls}
        />
      );
    case "saas":
      return (
        <SaasScreen
          title={title}
          subtitle={subtitle}
          blocks={blocks}
          isPreview={isPreview}
          previewIndustry={previewIndustry}
          setPreviewIndustry={setPreviewIndustry}
          renderPreviewControls={renderPreviewControls}
        />
      );
    case "ai":
      return (
        <AiScreen
          title={title}
          subtitle={subtitle}
          blocks={blocks}
          isPreview={isPreview}
          previewIndustry={previewIndustry}
          setPreviewIndustry={setPreviewIndustry}
          renderPreviewControls={renderPreviewControls}
        />
      );
    case "health":
    case "healthtech":
      return (
        <HealthScreen
          title={title}
          subtitle={subtitle}
          blocks={blocks}
          isPreview={isPreview}
          previewIndustry={previewIndustry}
          setPreviewIndustry={setPreviewIndustry}
          renderPreviewControls={renderPreviewControls}
        />
      );
    case "food":
      return (
        <FoodScreen
          title={title}
          subtitle={subtitle}
          blocks={blocks}
          isPreview={isPreview}
          previewIndustry={previewIndustry}
          setPreviewIndustry={setPreviewIndustry}
          renderPreviewControls={renderPreviewControls}
        />
      );
    case "transport":
      return (
        <TransportScreen
          title={title}
          subtitle={subtitle}
          blocks={blocks}
          isPreview={isPreview}
          previewIndustry={previewIndustry}
          setPreviewIndustry={setPreviewIndustry}
          renderPreviewControls={renderPreviewControls}
        />
      );
    case "travel":
      return (
        <TravelScreen
          title={title}
          subtitle={subtitle}
          blocks={blocks}
          isPreview={isPreview}
          previewIndustry={previewIndustry}
          setPreviewIndustry={setPreviewIndustry}
          renderPreviewControls={renderPreviewControls}
        />
      );
    case "general":
    default:
      return (
        <GeneralScreen
          title={title}
          subtitle={subtitle}
          blocks={blocks}
          isPreview={isPreview}
          previewIndustry={previewIndustry}
          setPreviewIndustry={setPreviewIndustry}
          renderPreviewControls={renderPreviewControls}
        />
      );
  }
};

