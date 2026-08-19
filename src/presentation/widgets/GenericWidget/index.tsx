import React, { useMemo } from "react";
import { useMcpToolResult } from "../../../infrastructure/store/mcpWidgetStore";
import { useApplyGlobalThemeVars } from "../../../infrastructure/store/themeStore";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { CatalogLayout } from "../layouts/CatalogLayout";
import { TableLayout } from "../layouts/TableLayout";
import { GeneralLayout } from "../layouts/GeneralLayout";
import { EmptyStateBlock } from "../components/EmptyStateBlock";
import { WeatherBlock } from "../components/WeatherBlock/WeatherBlock";
import { getValue } from "../../../utils";
import type { NormalizedWidgetData } from "../../../interfaces/mcp/normalizedwidget.interface";
import styles from "../../../styles/genericwidgetrenderer.module.css";
import { buildPresentationPlan } from "../helper/WidgetDeciderHelper";

export const GenericWidgetRenderer: React.FC = () => {
  useApplyGlobalThemeVars();
  let toolResult: unknown = null;
  let hasLoadError = false;

  try {
    toolResult = useMcpToolResult();
  } catch (e) {
    console.error("Cannot Load UI Widget:", e);
    hasLoadError = true;
  }

  const structuredContent =
    (toolResult as Record<string, unknown>)?.structuredContent ?? toolResult;

  const normalizedData = useMemo<NormalizedWidgetData | null>(() => {
    const content = structuredContent as Record<string, unknown>;

    if (!content || typeof content !== "object") {
      return null;
    }

    const title = (content.title as string) || "Widget";
    const subtitle = content.subtitle as string | undefined;

    let rawData: unknown = content.data;
    if (
      rawData &&
      typeof rawData === "object" &&
      "data" in (rawData as Record<string, unknown>)
    ) {
      rawData = (rawData as Record<string, unknown>).data;
    }

    const collection = content.collection as any;
    const capabilities = content.capabilities as any;
    const pagination = content.pagination as any;
    const actions = content.actions as any;
    const metadata = content.metadata as any;

    const dataPath = collection?.dataPath;

    let targetData: unknown = rawData;
    if (dataPath) {
      targetData = getValue(rawData, dataPath);
    }

    let records: unknown[] = [];
    if (Array.isArray(targetData)) {
      records = targetData;
    } else if (
      targetData &&
      typeof targetData === "object" &&
      !Array.isArray(targetData)
    ) {
      records = [targetData];
    } else if (
      rawData &&
      typeof rawData === "object" &&
      !Array.isArray(rawData)
    ) {
      records = [rawData];
    }

    const fields = collection?.fields || [];

    return {
      content: {
        title,
        subtitle,
        data: rawData as any,
        capabilities,
        pagination,
        actions,
        metadata,
        audience: (content.audience || metadata?.audience) as any,
      },
      collection,
      fields,
      records,
      rawData: rawData as any,
    };
  }, [structuredContent]);

  const presentationPlan = useMemo(() => {
    if (!normalizedData) {
      return null;
    }

    return buildPresentationPlan({
      collection: normalizedData.collection,
      fields: normalizedData.fields,
      records: normalizedData.records,
      capabilities: normalizedData.content.capabilities,
      pagination: normalizedData.content.pagination,
      audience: (normalizedData.content.audience ||
        normalizedData.content.metadata?.audience) as any,
    });
  }, [normalizedData]);

  if (hasLoadError) {
    return <div className={styles.errorState}>Failed to load UI.</div>;
  }

  if (!structuredContent || !normalizedData || !presentationPlan) {
    return <EmptyStateBlock />;
  }

  const { content, collection, fields, records, rawData } = normalizedData;

  if (!collection && !rawData) {
    return <EmptyStateBlock />;
  }

  const entityName = String(
    collection?.entity || content.metadata?.apiName || content.title || "",
  ).toLowerCase();
  const isWeather =
    /weather|forecast|temperature|climate/.test(entityName) ||
    Boolean(
      rawData &&
        typeof rawData === "object" &&
        ("current" in (rawData as object) ||
          "location" in (rawData as object) ||
          "forecast" in (rawData as object)),
    );

  const normalizedLayout = presentationPlan.layout;

  const renderLayout = () => {
    if (isWeather) {
      return (
        <WeatherBlock
          data={rawData}
          records={records}
          title={content.title}
          subtitle={content.subtitle}
        />
      );
    }

    switch (normalizedLayout) {
      case "dashboard":
        return (
          <DashboardLayout
            title={content.title}
            subtitle={content.subtitle}
            data={rawData}
            records={records}
            fields={fields}
            collection={collection}
            capabilities={content.capabilities}
            pagination={content.pagination}
            actions={content.actions}
            presentationPlan={presentationPlan}
          />
        );

      case "catalog":
        return (
          <CatalogLayout
            title={content.title}
            subtitle={content.subtitle}
            data={rawData}
            records={records}
            fields={fields}
            collection={collection}
            capabilities={content.capabilities}
            pagination={content.pagination}
            actions={content.actions}
            presentationPlan={presentationPlan}
          />
        );

      case "table":
        return (
          <TableLayout
            title={content.title}
            subtitle={content.subtitle}
            data={rawData}
            records={records}
            fields={fields}
            collection={collection}
            capabilities={content.capabilities}
            pagination={content.pagination}
            actions={content.actions}
            presentationPlan={presentationPlan}
          />
        );

      case "general":
      default:
        return (
          <GeneralLayout
            title={content.title}
            subtitle={content.subtitle}
            data={rawData}
            records={records}
            fields={fields}
            collection={collection}
            capabilities={content.capabilities}
            pagination={content.pagination}
            actions={content.actions}
            presentationPlan={presentationPlan}
          />
        );
    }
  };

  return <div className={styles.container}>{renderLayout()}</div>;
};
