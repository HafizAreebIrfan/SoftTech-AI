import React, { useMemo, useEffect } from "react";
import { useMcpToolResult } from "../../../infrastructure/store/mcpWidgetStore";
import { useApplyGlobalThemeVars } from "../../../infrastructure/store/themeStore";
import { useCartStore } from "../../../infrastructure/store/cartStore";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { CatalogLayout } from "../layouts/CatalogLayout";
import { TableLayout } from "../layouts/TableLayout";
import { GeneralLayout } from "../layouts/GeneralLayout";
import { CartLayout } from "../layouts/CartLayout";
import { EmptyStateBlock } from "../components/EmptyStateBlock";
import { WeatherBlock } from "../components/WeatherBlock/WeatherBlock";
import { AQIBlock } from "../components/AQIBlock";
import { OptionPickerBlock } from "../components/OptionPickerBlock/OptionPickerBlock";
import { DetailBlock } from "../components/DetailBlock";
import { useMcpWidgetStore } from "../../../infrastructure/store/mcpWidgetStore";
import { getValue } from "../../../utils";
import type { NormalizedWidgetData } from "../../../interfaces/mcp/normalizedwidget.interface";
import styles from "../../../styles/genericwidgetrenderer.module.css";
import { buildPresentationPlan } from "../helper/WidgetDeciderHelper";

export const GenericWidgetRenderer: React.FC = () => {
  const subViewHistory = useMcpWidgetStore((state) => state.subViewHistory);
  const popSubView = useMcpWidgetStore((state) => state.popSubView);
  const viewFullCart = useCartStore((state) => state.viewFullCart);
  const setViewFullCart = useCartStore((state) => state.setViewFullCart);

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

  const themeColor =
    (structuredContent as any)?.metadata?.themeColor ||
    (structuredContent as any)?.themeColor;
  useApplyGlobalThemeVars(themeColor);

  const companyName = (structuredContent as any)?.metadata?.companyName;
  useEffect(() => {
    if (companyName) {
      useCartStore.getState().setCompanyName(companyName);
    }
  }, [companyName]);

  useEffect(() => {
    const metadata = (structuredContent as any)?.metadata;
    if (metadata) {
      (window as any).__WIDGET_METADATA__ = {
        ...((window as any).__WIDGET_METADATA__ || {}),
        ...metadata,
      };
    }
  }, [structuredContent]);

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

    // Extract the record list generically:
    //  • prefer the backend-declared collection.dataPath (e.g. "products");
    //  • else the first array-valued property of the payload (list wrappers
    //    like { products:[...], total, skip, limit });
    //  • else treat the object itself as a single record (detail responses).
    let records: unknown[] = [];
    if (Array.isArray(rawData)) {
      records = rawData;
    } else if (rawData && typeof rawData === "object") {
      const obj = rawData as Record<string, unknown>;
      const dataPath = (collection?.dataPath as string | undefined) || undefined;
      let list: unknown;
      if (dataPath && Array.isArray(obj[dataPath])) {
        list = obj[dataPath];
      } else if (!dataPath) {
        list = Object.values(obj).find((v) => Array.isArray(v));
      }
      records = Array.isArray(list) ? list : [obj];
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
    /weather|forecast|temperature|climate/.test(entityName) &&
    !/air_pollution|aqi/.test(entityName) ||
    Boolean(
      rawData &&
      typeof rawData === "object" &&
      ("current" in (rawData as object) ||
        "forecast" in (rawData as object)) &&
      !("coord" in (rawData as object) && "list" in (rawData as object)),
    );

  const isAQI =
    /air_pollution|aqi|air_quality|pollution/.test(entityName) ||
    Boolean(
      rawData &&
      typeof rawData === "object" &&
      ("list" in (rawData as object) && "coord" in (rawData as object)),
    );

  const normalizedLayout = presentationPlan.layout;

  const isCart =
    (normalizedLayout as string) === "cart" ||
    collection?.dataPath === "carts" ||
    (Boolean(collection?.entity && /^carts?$/i.test(collection.entity)) &&
      collection?.entity !== "products") ||
    collection?.itemLabel === "cart" ||
    Boolean(
      rawData &&
        typeof rawData === "object" &&
        ("carts" in (rawData as object) ||
          ("userId" in (rawData as object) &&
            "totalProducts" in (rawData as object))),
    );

  const renderLayout = () => {
    const activeSubView = subViewHistory[subViewHistory.length - 1];
    if (activeSubView) {
      if (activeSubView.blockType === "detail") {
        return (
          <div>
            <button
              type="button"
              onClick={() => popSubView()}
              style={{
                background: "transparent",
                border: "1px solid var(--WidgetCardBorder)",
                borderRadius: "8px",
                color: "var(--TextSecondary)",
                cursor: "pointer",
                padding: "6px 12px",
                fontSize: "13px",
                fontWeight: 600,
                marginBottom: "12px",
              }}
            >
              ← Back
            </button>
            <DetailBlock
              records={[activeSubView.data]}
              fields={fields}
              collection={collection}
              actions={content.actions}
              audience={content.audience}
            />
          </div>
        );
      }
      return (
        <OptionPickerBlock
          title={activeSubView.title}
          onBack={() => popSubView()}
          onSelectOption={(opt) =>
            console.log("[MCP Widget] Sub-option selected:", opt)
          }
        />
      );
    }

    const rawOptions =
      (structuredContent as any)?.options ||
      (structuredContent as any)?.recommendations;
    const isOptionPicker = Array.isArray(rawOptions) && rawOptions.length > 0;

    if (isOptionPicker) {
      return (
        <OptionPickerBlock
          title={content.title || "Select an option"}
          options={rawOptions.map((opt: any, idx: number) => ({
            id: opt.id || String(idx),
            label: opt.label || opt.name || opt.title || `Option ${idx + 1}`,
            image: opt.image || opt.thumbnail || opt.icon,
          }))}
          onSelectOption={(opt) =>
            console.log("[MCP Widget] Option selected:", opt)
          }
        />
      );
    }

    if (isAQI) {
      return (
        <AQIBlock
          title={content.title}
          subtitle={content.subtitle}
          data={rawData}
          records={records}
        />
      );
    }

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

    if (isCart) {
      return (
        <CartLayout
          title={content.title}
          subtitle={content.subtitle}
          data={rawData}
          records={records}
          fields={fields}
          collection={collection}
          actions={content.actions}
          audience={content.audience}
          presentationPlan={presentationPlan}
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
            audience={content.audience}
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
            audience={content.audience}
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
            audience={content.audience}
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
            audience={content.audience}
            presentationPlan={presentationPlan}
          />
        );
    }
  };

  return (
    <div className={styles.container}>
      {viewFullCart ? (
        <div>
          <button
            type="button"
            onClick={() => setViewFullCart(false)}
            style={{
              background: "transparent",
              border: "1px solid var(--WidgetCardBorder)",
              borderRadius: "8px",
              color: "var(--TextSecondary)",
              cursor: "pointer",
              padding: "6px 12px",
              fontSize: "13px",
              fontWeight: 600,
              marginBottom: "12px",
            }}
          >
            ← Back
          </button>
          <CartLayout
            title={content.title}
            subtitle={content.subtitle}
            data={rawData}
            records={records}
            fields={fields}
            collection={collection}
            actions={content.actions}
            audience={content.audience}
          />
        </div>
      ) : (
        renderLayout()
      )}
    </div>
  );
};

