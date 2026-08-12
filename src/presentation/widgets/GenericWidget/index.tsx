import React, { useMemo } from "react";
import {
  useMcpToolResult,
  useMcpWidgetStore,
} from "../../../infrastructure/store/mcpWidgetStore";
import { useThemeStore } from "../../../hooks";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { CatalogLayout } from "../layouts/CatalogLayout";
import { TableLayout } from "../layouts/TableLayout";
import { GeneralLayout } from "../layouts/GeneralLayout";
import { EmptyStateBlock } from "../components/EmptyStateBlock";
import { getValue } from "../../../utils";
import type { JsonValue } from "../../../domain/entities/GenericWidget";
import { NormalizedWidgetData } from "../../../interfaces/mcp/normalizedwidget.interface";
import styles from "../../../styles/genericwidgetrenderer.module.css";
import { buildPresentationPlan } from "../helper/WidgetDeciderHelper";
import { combineToolResults } from "../helper/WidgetDeciderHelper/combinetoolresult";

export const GenericWidgetRenderer: React.FC = () => {
  const { colors } = useThemeStore();
  let toolResult: any = null;
  let hasLoadError = false;

  const toolResults = useMcpWidgetStore((state) => state.toolResults);

  try {
    toolResult = useMcpToolResult();
  } catch (e) {
    console.error("Cannot Load UI Widget:", e);
    hasLoadError = true;
  }

  const structuredContent =
    (toolResult as any)?.structuredContent ?? toolResult;

  const combinedResult = useMemo(() => {
    if (!toolResults.length) {
      return null;
    }

    return combineToolResults(toolResults);
  }, [toolResults]);

  const normalizedData = useMemo<NormalizedWidgetData | null>(() => {
    const content = structuredContent;

    if (!content || typeof content !== "object" || !content.data) {
      return null;
    }

    const collection = content.collection;

    const fields = collection?.fields ?? [];

    /**
     * Find the actual records using dataPath.
     *
     * Example:
     *
     * data:
     * {
     *   getorder: [...]
     * }
     *
     * dataPath:
     * "getorder"
     *
     * records:
     * [...]
     */
    let records: unknown[] = [];

    if (collection?.dataPath) {
      const collectionData = getValue(content.data, collection.dataPath);

      if (Array.isArray(collectionData)) {
        records = collectionData;
      } else if (collectionData !== undefined && collectionData !== null) {
        records = [collectionData];
      }
    } else if (Array.isArray(content.data)) {
      /**
       * Root-level array response.
       */
      records = content.data;
    } else if (isRecordCollection(content.data)) {
      /**
       * Backwards/fallback detection when dataPath is unavailable.
       */
      const detectedArray = Object.values(content.data).find(Array.isArray);

      if (Array.isArray(detectedArray)) {
        records = detectedArray;
      } else {
        records = [content.data];
      }
    } else if (content.data) {
      records = [content.data];
    }

    console.log("WIDGET DEBUG", {
      data: content.data,
      dataPath: collection?.dataPath,
      fields: collection?.fields,
    });

    const sections = combinedResult?.collections.map((item) => ({
      title: item.title,

      content: item.structuredContent,

      collection: item.collection,

      fields: item.collection?.fields ?? [],

      records: item.data,

      rawData: item.structuredContent?.data,
    }));

    return {
      content,
      collection,
      fields,
      records,
      rawData: content.data,
      sections,
    };
  }, [structuredContent]);

  const presentationPlan = useMemo(() => {
    if (!normalizedData) return null;

    const { collection, fields, records, content } = normalizedData;

    return buildPresentationPlan({
      entity: collection?.entity,
      records,
      fields,
      collection,
      capabilities: content.capabilities,
      pagination: content.pagination,
      audience: content.audience,
      platformType: content.platformType,
      intent: content.intent,
    });
  }, [normalizedData]);

  if (hasLoadError) {
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

  if (!structuredContent || !normalizedData || !presentationPlan) {
    return <EmptyStateBlock />;
  }

  const { content, collection, fields, records, rawData } = normalizedData;

  console.log("[GenericWidgetRenderer] Presentation Plan:", presentationPlan);

  /**
   * At this stage, do not force the response into a UI.
   *
   * If the API returned a simple object rather than a collection,
   * we still have valid data.
   */
  if (!collection && !rawData) {
    return <EmptyStateBlock />;
  }

  const normalizedLayout = presentationPlan.layout;

  const renderLayout = () => {
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

  return (
    <div
      className={styles.container}
      style={{
        color: colors.TextHeading,
        background: colors.Background,
      }}
    >
      {renderLayout()}
    </div>
  );
};

const isRecordCollection = (
  value: JsonValue,
): value is Record<string, JsonValue> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};
