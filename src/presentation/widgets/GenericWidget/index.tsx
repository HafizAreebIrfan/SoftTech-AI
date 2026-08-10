import React from "react";
import { useMcpToolResult } from "../../../infrastructure/store/mcpWidgetStore";
import { useThemeStore } from "../../../hooks";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { CatalogLayout } from "../layouts/CatalogLayout";
import { TableLayout } from "../layouts/TableLayout";
import { GeneralLayout } from "../layouts/GeneralLayout";
import { EmptyStateBlock } from "../components/EmptyStateBlock";
import styles from "../../../styles/genericwidgetrenderer.module.css";

export const GenericWidgetRenderer: React.FC = () => {
  const { colors } = useThemeStore();
  let toolResult;

  try {
    toolResult = useMcpToolResult();
  } catch (e) {
    console.error("Cannot Load UI Widget:", e);
    return (
      <div
        style={{
          color: colors.TextHeading,
          background: colors.Background,
        }}
      >
        Failed to load UI.
      </div>
    );
  }

  const structuredContent = toolResult?.structuredContent;
  const structuredData = structuredContent?.data;
  const structuredFields = structuredContent?.collection?.fields ?? [];

  if (
    !structuredContent ||
    !structuredContent.data ||
    structuredContent.data.length === 0
  ) {
    return <EmptyStateBlock />;
  }

  const {
    title,
    subtitle,
    data,
    collection,
    capabilities,
    actions,
    pagination,
    metadata,
  } = structuredContent;

  if (data === undefined || data === null) {
    return <EmptyStateBlock />;
  }

  const normalizedLayout = String(
    collection?.layout || "general",
  ).toLowerCase();

  const commonProps = {
    title,
    subtitle,
    data,
    collection,
    capabilities,
    actions,
    pagination,
    metadata,
  };

  const renderLayout = () => {
    switch (normalizedLayout) {
      case "dashboard":
        return <DashboardLayout />;

      case "catalog":
        return <CatalogLayout />;

      case "table":
        return <TableLayout />;

      case "general":
      default:
        return <GeneralLayout />;
    }
  };

  return <div className={styles.container}>{renderLayout()}</div>;
};
