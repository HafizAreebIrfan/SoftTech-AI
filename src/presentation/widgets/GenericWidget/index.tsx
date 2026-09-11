import React, { useMemo, useEffect } from "react";
import { useMcpToolResult } from "../../../infrastructure/store/mcpWidgetStore";
import { useApplyGlobalThemeVars } from "../../../infrastructure/store/themeStore";
import { useCartStore, buildCartDataFromItems } from "../../../infrastructure/store/cartStore";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { CatalogLayout } from "../layouts/CatalogLayout";
import { TableLayout } from "../layouts/TableLayout";
import { GeneralLayout } from "../layouts/GeneralLayout";
import { CartLayout } from "../layouts/CartLayout";
import { WeatherBlock } from "../components/WeatherBlock/WeatherBlock";
import { AQIBlock } from "../components/AQIBlock";
import { OptionPickerBlock } from "../components/OptionPickerBlock/OptionPickerBlock";
import { DetailBlock } from "../components/DetailBlock";
import { MapCatalogLayout } from "../layouts/MapCatalogLayout";
import { extractCoordinates } from "../helper/geoHelper";
import { useMcpWidgetStore } from "../../../infrastructure/store/mcpWidgetStore";
import { getValue } from "../../../utils";
import type { NormalizedWidgetData } from "../../../interfaces/mcp/normalizedwidget.interface";
import styles from "../../../styles/genericwidgetrenderer.module.css";
import { buildPresentationPlan } from "../helper/WidgetDeciderHelper";
import { setOpenInApp } from "../../../utils/mcpBridge";

const GenericWidgetInner: React.FC = () => {
  const subViewHistory = useMcpWidgetStore((state) => state.subViewHistory);
  const popSubView = useMcpWidgetStore((state) => state.popSubView);
  const viewFullCart = useCartStore((state) => state.viewFullCart);
  const setViewFullCart = useCartStore((state) => state.setViewFullCart);
  const cartItems = useCartStore((state) => state.items);

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

  // Extract company authStrategy and URLs from current tool response
  const rawAuthStrategy =
    (structuredContent as any)?.authStrategy ||
    (structuredContent as any)?.metadata?.authStrategy ||
    (structuredContent as any)?.data?.authStrategy ||
    (toolResult as any)?.authStrategy;

  const rawMetadata = (structuredContent as any)?.metadata || {};

  const currentGlobalCheckoutUrl =
    rawAuthStrategy?.hasGlobalCheckout !== false && rawAuthStrategy?.globalCheckoutUrl
      ? rawAuthStrategy.globalCheckoutUrl
      : rawMetadata?.hasGlobalCheckout !== false &&
          (rawMetadata?.globalCheckoutUrl || rawMetadata?.webCheckoutUrl)
        ? rawMetadata.globalCheckoutUrl || rawMetadata.webCheckoutUrl
        : undefined;

  const currentProductItemUrlTemplate =
    rawAuthStrategy?.hasProductPages !== false &&
    rawAuthStrategy?.productItemUrlTemplate
      ? rawAuthStrategy.productItemUrlTemplate
      : rawMetadata?.hasProductPages !== false &&
          rawMetadata?.productItemUrlTemplate
        ? rawMetadata.productItemUrlTemplate
        : undefined;

  const currentShopCatalogUrl =
    rawAuthStrategy?.shopCatalogUrl || rawMetadata?.shopCatalogUrl;

  const companyName =
    rawMetadata?.companyName ||
    rawAuthStrategy?.companyName ||
    (structuredContent as any)?.companyName;

  useEffect(() => {
    if (companyName) {
      useCartStore.getState().setCompanyName(companyName);
    }
  }, [companyName]);

  // Clean, fresh metadata per tool call (prevents previous company's URLs leaking)
  const currentMetadata = useMemo(
    () => ({
      ...rawMetadata,
      authStrategy: rawAuthStrategy,
      globalCheckoutUrl: currentGlobalCheckoutUrl,
      webCheckoutUrl: currentGlobalCheckoutUrl,
      productItemUrlTemplate: currentProductItemUrlTemplate,
      shopCatalogUrl: currentShopCatalogUrl,
      companyName,
      themeColor:
        themeColor || rawMetadata?.themeColor || rawAuthStrategy?.themeColor,
    }),
    [
      rawMetadata,
      rawAuthStrategy,
      currentGlobalCheckoutUrl,
      currentProductItemUrlTemplate,
      currentShopCatalogUrl,
      companyName,
      themeColor,
    ],
  );

  if (typeof window !== "undefined") {
    (window as any).__WIDGET_METADATA__ = currentMetadata;
  }

  // Point ChatGPT fullscreen "Open in {company}" header button to current company catalog
  useEffect(() => {
    if (currentShopCatalogUrl) {
      setOpenInApp(currentShopCatalogUrl);
    }
  }, [currentShopCatalogUrl]);

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
    const meta = content.metadata as any;

    // Extract the record list generically:
    //  • prefer the backend-declared collection.dataPath (e.g. "products");
    //  • else the first array-valued property of the payload (list wrappers
    //    like { products:[...], total, skip, limit });
    //  • else treat the object itself as a single record (detail responses).
    let rawList: unknown[] = [];
    if (Array.isArray(rawData)) {
      rawList = rawData;
    } else if (rawData && typeof rawData === "object") {
      const obj = rawData as Record<string, unknown>;
      const dataPath = (collection?.dataPath as string | undefined) || undefined;
      let list: unknown;
      if (dataPath && Array.isArray(obj[dataPath])) {
        list = obj[dataPath];
      } else if (!dataPath) {
        list = Object.values(obj).find((v) => Array.isArray(v));
      }
      rawList = Array.isArray(list) ? list : [obj];
    }

    // Map primitives (e.g. array of category names ["beauty", "fragrances", ...]) into objects
    const primaryKey = collection?.fields?.[0]?.key || collection?.itemLabel || "category";
    const records = rawList.map((item, idx) => {
      if (typeof item === "object" && item !== null) {
        return item;
      }
      return {
        [primaryKey]: item,
        $title: String(item),
        id: idx + 1,
        _id: String(idx + 1),
      };
    });

    const fields = collection?.fields || [];

    return {
      content: {
        title,
        subtitle,
        data: rawData as any,
        capabilities,
        pagination,
        actions,
        metadata: meta,
        audience: (content.audience || meta?.audience) as any,
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

  // Fail-safe fallback (#1): when the tool result can't be loaded or there's
  // nothing renderable, collapse the widget to nothing rather than showing a
  // "random fallback UI". The host then falls back to the model's text answer
  // (the backend already sends text-only on service errors, so the widget
  // simply never mounts in that case).
  if (hasLoadError) {
    return null;
  }

  if (!structuredContent || !normalizedData || !presentationPlan) {
    return null;
  }

  const { content, collection, fields, records, rawData } = normalizedData;

  if (!collection && !rawData) {
    return null;
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
          <DetailBlock
            records={[activeSubView.data]}
            fields={fields}
            collection={collection}
            actions={content.actions}
            audience={content.audience}
            metadata={currentMetadata}
          />
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

    const hasUserFields = Boolean(
      rawData &&
        typeof rawData === "object" &&
        ("email" in (rawData as object) ||
          "mfaEnabled" in (rawData as object) ||
          "fullName" in (rawData as object) ||
          "role" in (rawData as object) ||
          (records.length > 0 &&
            records[0] &&
            typeof records[0] === "object" &&
            ("email" in records[0] || "fullName" in records[0]))),
    );

    const isProfile =
      /user|profile|account|member|\bme\b|customer/.test(entityName) ||
      hasUserFields;

    const isBookings =
      /booking|reservation|rental|\border\b/.test(entityName);

    if (isProfile || isBookings || normalizedLayout === "dashboard") {
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
    }

    const hasCoordinates =
      records.length > 0 &&
      records.some((r, idx) => extractCoordinates(r as Record<string, any>, idx) !== null);

    const isGeospatialEntity =
      /hotel|stay|accommodation|property|real_estate|listing|room|resort|branch|branches|location|locations|depot|clinic|office|store|venue|dealer/i.test(
        entityName,
      ) ||
      Boolean(
        collection?.itemLabel &&
          /hotel|stay|accommodation|property|real_estate|listing|room|branch|location|store/i.test(
            collection.itemLabel,
          ),
      );

    const userPrompt = String(
      (window as any).__WIDGET_METADATA__?.user_raw_prompt ||
      (window as any).__WIDGET_DATA__?.user_raw_prompt ||
      collection?.appliedQuery?.user_raw_prompt ||
      ""
    ).toLowerCase();

    const isBranchOrLocationQuery =
      hasCoordinates &&
      /branch|branches|near|location|locations|closest|mapview|map view|cheap.*branch|cheapest.*branch/i.test(
        userPrompt,
      );

    const isMapLayout =
      (normalizedLayout as string) === "map" ||
      (presentationPlan?.layout as string) === "map" ||
      (hasCoordinates && isGeospatialEntity) ||
      isBranchOrLocationQuery;

    if (isMapLayout) {
      return (
        <MapCatalogLayout
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

    // Customer-facing protection: customers should never see raw internal database tables
    // for products, branches, locations, or catalog items.
    if (
      content.audience === "customer" &&
      normalizedLayout === "table" &&
      !isBookings &&
      !isProfile
    ) {
      if (hasCoordinates) {
        return (
          <MapCatalogLayout
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
    }

    switch (normalizedLayout) {
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
    <div
      className={styles.container}
      style={
        themeColor
          ? ({ ["--widget-accent" as any]: themeColor } as React.CSSProperties)
          : undefined
      }
    >
      {viewFullCart ? (
        <div>
          <button
            type="button"
            onClick={() => setViewFullCart(false)}
            className={styles.cartBackBtn}
          >
            ← Back
          </button>
          {cartItems.length === 0 ? (
            /* Empty cart → local page only, NO tool call. */
            <div className={styles.cartEmptyState}>
              <div className={styles.cartEmptyIcon}>🛒</div>
              <h3 className={styles.cartEmptyTitle}>
                Your cart is empty
              </h3>
              <p className={styles.cartEmptyDesc}>
                Browse the catalog and add items to your cart to see them here.
              </p>
              <button
                type="button"
                onClick={() => setViewFullCart(false)}
                className={styles.cartBrowseBtn}
              >
                Browse products
              </button>
            </div>
          ) : (
            <CartLayout
              title={content.title || "Shopping Cart"}
              subtitle={content.subtitle}
              data={buildCartDataFromItems(cartItems) as any}
              records={records}
              fields={fields}
              collection={collection}
              actions={content.actions}
              audience={content.audience}
            />
          )}
        </div>
      ) : (
        renderLayout()
      )}
    </div>
  );
};

/**
 * Fail-safe boundary (#1): if anything in the widget tree throws while
 * rendering, collapse to `null` instead of surfacing a broken UI. Combined
 * with the null fallbacks in GenericWidgetInner and the backend's text-only
 * error path, an unrenderable result means the host shows the model's text.
 */
class WidgetErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("[MCP Widget] render failed, collapsing widget:", error);
  }

  render() {
    return this.state.hasError ? null : this.props.children;
  }
}

export const GenericWidgetRenderer: React.FC = () => (
  <WidgetErrorBoundary>
    <GenericWidgetInner />
  </WidgetErrorBoundary>
);

