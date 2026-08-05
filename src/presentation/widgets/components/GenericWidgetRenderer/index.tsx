import React from "react";
import { useMcpToolResult } from "../../../../infrastructure/store/mcpWidgetStore";
import { useThemeStore } from "../../../../hooks";
import { DashboardLayout } from "../../layouts/DashboardLayout";
import { CatalogLayout } from "../../layouts/CatalogLayout";
import { TableLayout } from "../../layouts/TableLayout";
import { TimelineLayout } from "../../layouts/TimelineLayout";
import { DetailsLayout } from "../../layouts/DetailsLayout";
import { GeneralLayout } from "../../layouts/GeneralLayout";
import { EmptyStateBlock } from "../EmptyStateBlock";
import styles from "../../../../styles/genericwidgetrenderer.module.css";

export const GenericWidgetRenderer: React.FC = () => {
  const { colors } = useThemeStore();
  let toolResult;

  try {
    toolResult = useMcpToolResult();
  } catch (e) {
    console.error("MCP Tool Result Hook crashed:", e);
    return (
      <div
        style={{
          color: colors.TextHeading || "#ffffff",
          background: colors.Background || "#0f1015",
          padding: "20px",
          borderRadius: "12px",
        }}
      >
        Failed to load tool result bridge.
      </div>
    );
  }

  const structuredContent = toolResult?.structuredContent;

  if (
    !structuredContent ||
    !structuredContent.blocks ||
    structuredContent.blocks.length === 0
  ) {
    return <EmptyStateBlock />;
  }

  const { title, subtitle, layout = "dashboard", blocks } = structuredContent;
  const normalizedLayout = String(layout).toLowerCase();

  const renderLayout = () => {
    switch (normalizedLayout) {
      case "dashboard":
        return <DashboardLayout title={title} subtitle={subtitle} blocks={blocks} />;
      case "catalog":
        return <CatalogLayout title={title} subtitle={subtitle} blocks={blocks} />;
      case "table":
        return <TableLayout title={title} subtitle={subtitle} blocks={blocks} />;
      case "timeline":
        return <TimelineLayout title={title} subtitle={subtitle} blocks={blocks} />;
      case "details":
      case "detail":
        return <DetailsLayout title={title} subtitle={subtitle} blocks={blocks} />;
      default:
        return <GeneralLayout title={title} subtitle={subtitle} blocks={blocks} />;
    }
  };

  return <div className={styles.container}>{renderLayout()}</div>;
};
