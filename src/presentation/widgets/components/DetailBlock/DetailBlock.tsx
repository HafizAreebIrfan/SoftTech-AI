import React, { useMemo, useState, useEffect } from "react";
import { getFieldValue } from "../../../../utils/schema/getValue";
import { renderImage } from "../../helper/RenderImage";
import { renderCurrency } from "../../helper/RenderCurrency";
import { renderStatus } from "../../helper/RenderStatus";
import { callMcpTool, requestDisplayMode } from "../../../../utils/mcpBridge";
import { addToCartAndSync } from "../../../../utils/cartFlow";
import { extractTieredPrices } from "../../helper/TieredPriceHelper/tieredPriceHelper";
import { findCartAction } from "../../../../infrastructure/store/cartStore";
import { DetailField } from "./DetailField";
import styles from "../../../../styles/detailblock.module.css";
import pd from "../../../../styles/productdetail.module.css";
import type { DetailBlockProps } from "../../../../interfaces/mcp/detailblock.interface";
import { classifyAction, getPermissions } from "../../helper/AudienceHelper";

const sectionTitleStyle: React.CSSProperties = {
  margin: "0 0 8px 0",
  fontSize: "13px",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  color: "var(--app-text-secondary, #94a3b8)",
};

export const DetailBlock: React.FC<DetailBlockProps> = ({
  block,
  records = [],
  fields = [],
  collection,
  actions = [],
  audience,
}) => {
  const targetRecord = records.length > 0 ? (records[0] as any) : null;
  const [selectedImgIdx, setSelectedImgIdx] = useState<number>(0);
  const [selectedTierIdx, setSelectedTierIdx] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);
  const [addedToast, setAddedToast] = useState<boolean>(false);
  const [imgExpanded, setImgExpanded] = useState<boolean>(false);

  const {
    images,
    title,
    subtitle,
    description,
    price,
    status,
    metric,
    detailFields,
    arrayFields,
    optionGroups,
    tieredResult,
  } = useMemo(() => {
    if (!targetRecord) {
      return {
        images: [],
        title: null,
        subtitle: null,
        description: null,
        price: undefined,
        status: null,
        metric: null,
        detailFields: [],
        arrayFields: [],
        optionGroups: [],
        tieredResult: { hasTiers: false, options: [] },
      };
    }

    const activeFields =
      block?.fields && block.fields.length > 0 ? block.fields : fields;

    // 1. Collect all images generically (from $image, image fields, and URL lists)
    const collectedImages: string[] = [];
    if (targetRecord.$image && typeof targetRecord.$image === "string") {
      collectedImages.push(targetRecord.$image);
    }

    activeFields.forEach((f) => {
      const val = getFieldValue(targetRecord, f);
      if (typeof val === "string" && val.trim()) {
        // Handle comma-separated list of image URLs (e.g. from dummyjson)
        if (val.includes(",") && val.includes("http")) {
          const parts = val
            .split(",")
            .map((s) => s.trim())
            .filter((s) => /^https?:\/\//i.test(s));
          collectedImages.push(...parts);
        } else if (
          f.type === "image" ||
          /^https?:\/\/.*\.(jpe?g|png|webp|gif|svg)(\?.*)?$/i.test(val)
        ) {
          collectedImages.push(val.trim());
        }
      } else if (Array.isArray(val)) {
        val.forEach((item) => {
          if (typeof item === "string" && /^https?:\/\//i.test(item.trim())) {
            collectedImages.push(item.trim());
          }
        });
      }
    });

    // Second pass: scan ALL string values in the record for image URLs.
    // This catches images in fields that don't have type: "image" annotation
    // and in the sub-view path where collection schema may not be detailed.
    if (collectedImages.length === 0) {
      for (const [key, val] of Object.entries(targetRecord)) {
        if (key.startsWith("$")) continue;
        if (typeof val === "string" && /^https?:\/\/.*\.(jpe?g|png|webp|gif|svg)(\?.*)?$/i.test(val.trim())) {
          collectedImages.push(val.trim());
        } else if (Array.isArray(val)) {
          val.forEach((item) => {
            if (typeof item === "string" && /^https?:\/\/.*\.(jpe?g|png|webp|gif|svg)(\?.*)?$/i.test(item.trim())) {
              collectedImages.push(item.trim());
            }
          });
        }
      }
    }

    const dedupedImages = Array.from(new Set(collectedImages));

    // 2. Extract tiered pricing options
    const tiers = extractTieredPrices(targetRecord, activeFields);

    // 3. Extract hero properties
    const itemTitle = targetRecord.$title || collection?.entity || "Details";
    const itemDesc = targetRecord.$description || null;
    const itemPrice = targetRecord.$price;
    const itemStatus = targetRecord.$status;
    const itemMetric = targetRecord.$metric;

    // 4. Filter scalar fields for specs (exclude fields shown in hero or bare ID)
    const primaryRoles = [
      "title",
      "description",
      "price",
      "image",
      "status",
      "metric",
    ];
    const detailFieldsList = activeFields.filter((f) => {
      if (f.hidden) return false;
      if (f.type === "array" || f.type === "object" || f.type === "image")
        return false;
      if (primaryRoles.includes(f.uiRole as string)) return false;

      const keyLower = f.key.toLowerCase();
      const labelLower = (f.label || "").toLowerCase();

      // Suppress status (already in hero) and audit timestamps
      if (
        f.type === "status" ||
        keyLower.includes("status") ||
        keyLower === "createdat" ||
        keyLower === "updatedat" ||
        keyLower === "created_at" ||
        keyLower === "updated_at" ||
        keyLower === "__v"
      ) {
        return false;
      }

      // Suppress bare ID fields without uiRole
      if (
        (keyLower === "id" || keyLower === "_id" || labelLower === "id") &&
        !f.uiRole
      ) {
        return false;
      }

      // Filter out redundant imperial duplicates
      if (
        keyLower.endsWith("_f") ||
        keyLower.endsWith("_mph") ||
        keyLower.endsWith("_in") ||
        keyLower.endsWith("_miles")
      ) {
        return false;
      }
      return true;
    });

    // 5. Extract array / collection fields (e.g. reviews, features)
    const arrayFieldsList = activeFields.filter((f) => {
      if (f.hidden) return false;
      const val = getFieldValue(targetRecord, f);
      return Array.isArray(val) && val.length > 0;
    });

    // 6. Extract selectable scalar-array option groups (e.g. sizes, colors, variants)
    const optionGroupsList: Array<{
      key: string;
      label: string;
      options: Array<string | number>;
    }> = [];

    activeFields.forEach((f) => {
      if (f.hidden) return;
      const val = getFieldValue(targetRecord, f);
      if (
        Array.isArray(val) &&
        val.length > 1 &&
        val.length <= 16 &&
        val.every((item) => typeof item === "string" || typeof item === "number") &&
        !val.some((item) => typeof item === "string" && /^https?:\/\//i.test(item))
      ) {
        optionGroupsList.push({
          key: f.key,
          label: f.label || f.key.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
          options: val,
        });
      }
    });

    for (const [key, val] of Object.entries(targetRecord)) {
      if (key.startsWith("$")) continue;
      if (
        Array.isArray(val) &&
        val.length > 1 &&
        val.length <= 16 &&
        val.every((item) => typeof item === "string" || typeof item === "number") &&
        !val.some((item) => typeof item === "string" && /^https?:\/\//i.test(item)) &&
        !optionGroupsList.some((og) => og.key.toLowerCase() === key.toLowerCase())
      ) {
        const kLower = key.toLowerCase();
        if (
          kLower.includes("size") ||
          kLower.includes("color") ||
          kLower.includes("shade") ||
          kLower.includes("variant") ||
          kLower.includes("tag")
        ) {
          optionGroupsList.push({
            key,
            label: key.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
            options: val,
          });
        }
      }
    }

    return {
      images: dedupedImages,
      title: itemTitle,
      subtitle: itemDesc,
      description: itemDesc,
      price: itemPrice,
      status: itemStatus,
      metric: itemMetric,
      detailFields: detailFieldsList,
      arrayFields: arrayFieldsList,
      optionGroups: optionGroupsList,
      tieredResult: tiers,
    };
  }, [targetRecord, block?.fields, fields, collection?.entity]);

  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, string | number>
  >({});

  useEffect(() => {
    if (optionGroups && optionGroups.length > 0) {
      const defaults: Record<string, string | number> = {};
      optionGroups.forEach((og) => {
        if (og.options.length > 0 && selectedOptions[og.key] === undefined) {
          defaults[og.key] = og.options[0];
        }
      });
      setSelectedOptions((prev) => ({ ...defaults, ...prev }));
    }
  }, [optionGroups]);

  // A "rich product" (has a gallery) opens as a true-fullscreen product page via
  // the Apps SDK; inline is restored when the detail closes. Feature-detected —
  // a no-op where the host lacks requestDisplayMode, so the same layout simply
  // renders inline. Generic: the gate is data-driven (image count), never names.
  useEffect(() => {
    if (images.length === 0) return;
    requestDisplayMode("fullscreen");
    return () => {
      requestDisplayMode("inline");
    };
  }, [images.length]);

  if (!targetRecord) return null;

  const permissions = getPermissions(audience, undefined, actions as any);
  const cartAction = findCartAction(actions as any);
  // Show mutations only to admins, and drop the detected cart/order tool from
  // the button row (it is already surfaced as the Add-to-Cart CTA).
  const visibleActions = (actions || []).filter(
    (a: any) =>
      (classifyAction(a) !== "mutate" || permissions.canMutate) &&
      a !== cartAction,
  );

  const activeTier = tieredResult.hasTiers
    ? tieredResult.options[selectedTierIdx]
    : null;
  const effectivePrice = activeTier ? activeTier.price : price;

  const canAddToCart =
    audience !== "admin" &&
    effectivePrice !== undefined &&
    effectivePrice !== null;

  const handleAddToCart = () => {
    addToCartAndSync({
      item: {
        id: targetRecord.id || targetRecord._id || title,
        title: title || "Product",
        price: effectivePrice ?? 0,
        image: images[0] || null,
        tier: activeTier ? activeTier.label : undefined,
        options: selectedOptions,
      },
      quantity,
      actions,
      recordId: targetRecord.id || targetRecord._id,
    });

    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 3000);
  };

  const activeMainImage = images[selectedImgIdx] || images[0] || null;
  const hasGallery = images.length > 0;

  return (
    <section
      className={`${styles.container} ${hasGallery ? pd.pageWide : ""}`}
    >
      <div
        className={styles.card}
        style={{
          background: "var(--WidgetCardBg, rgba(22, 24, 38, 0.75))",
          border: "1px solid var(--WidgetCardBorder, rgba(255, 255, 255, 0.08))",
          borderRadius: "16px",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          gap: "0",
        }}
      >
        {/* Hero: gallery + about (left) / buy box (right). Two columns when a
            gallery exists AND the viewport is wide (fullscreen); one column
            otherwise (inline, or a non-product record such as an order). */}
        <div
          className={`${pd.heroGrid} ${hasGallery ? pd.heroGridTwoCol : ""}`}
        >
          {/* LEFT COLUMN — gallery + description */}
          <div className={pd.leftCol}>
            {hasGallery && (
              <div
                style={{ display: "flex", flexDirection: "column", gap: "12px" }}
              >
                {/* Main image — inline expand (no fixed overlay, iframe-safe) */}
                <div
                  onClick={() => setImgExpanded((v) => !v)}
                  title={imgExpanded ? "Click to shrink" : "Click to enlarge"}
                  style={{
                    width: "100%",
                    height: imgExpanded ? "560px" : "360px",
                    borderRadius: "12px",
                    overflow: "hidden",
                    background: imgExpanded
                      ? "rgba(0,0,0,0.6)"
                      : "rgba(0,0,0,0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: imgExpanded ? "zoom-out" : "zoom-in",
                    position: "relative",
                    transition: "height 0.2s ease",
                  }}
                >
                  <span
                    style={{
                      pointerEvents: "none",
                      display: "flex",
                      width: "100%",
                      height: "100%",
                    }}
                  >
                    {renderImage(
                      activeMainImage,
                      title || "Item Preview",
                      imgExpanded ? "contain" : "cover",
                    )}
                  </span>
                  <span
                    style={{
                      position: "absolute",
                      top: "10px",
                      right: "10px",
                      background: "rgba(0,0,0,0.5)",
                      padding: "4px 8px",
                      borderRadius: "6px",
                      fontSize: "12px",
                      color: "#fff",
                    }}
                  >
                    {imgExpanded ? "🔍 Close" : "🔍 Zoom"}
                  </span>
                </div>

                {/* Thumbnail selector — switches the main image (Fix #1) */}
                {images.length > 1 && (
                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      overflowX: "auto",
                      paddingBottom: "4px",
                    }}
                  >
                    {images.map((imgUrl, idx) => (
                      <button
                        key={`thumb-${idx}`}
                        type="button"
                        onClick={() => {
                          setSelectedImgIdx(idx);
                          setImgExpanded(false);
                        }}
                        style={{
                          width: "64px",
                          height: "64px",
                          borderRadius: "8px",
                          overflow: "hidden",
                          border:
                            selectedImgIdx === idx
                              ? "2px solid var(--widget-accent, #6366f1)"
                              : "1px solid rgba(255,255,255,0.12)",
                          background: "rgba(0,0,0,0.3)",
                          padding: 0,
                          cursor: "pointer",
                          flexShrink: 0,
                          transition: "all 0.15s ease",
                        }}
                      >
                        <span
                          style={{
                            pointerEvents: "none",
                            display: "flex",
                            width: "100%",
                            height: "100%",
                          }}
                        >
                          {renderImage(imgUrl, `Thumb ${idx + 1}`, "cover")}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* About / Description */}
            {description && (
              <div>
                <h4 style={sectionTitleStyle}>About</h4>
                <p
                  style={{
                    margin: 0,
                    fontSize: "14px",
                    lineHeight: 1.6,
                    color: "var(--WidgetHeaderSubtitle, #cbd5e1)",
                  }}
                >
                  {description}
                </p>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN — buy box (title, status, price, tier, cart, actions) */}
          <aside
            className={hasGallery ? pd.buyBoxSticky : undefined}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "14px",
              background: "var(--WidgetCardBg, rgba(22, 24, 38, 0.6))",
              border:
                "1px solid var(--WidgetCardBorder, rgba(255, 255, 255, 0.08))",
              borderRadius: "14px",
              padding: "18px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: "12px",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: "22px",
                  fontWeight: 700,
                  color: "var(--WidgetHeaderTitle, #f8fafc)",
                  lineHeight: 1.3,
                }}
              >
                {title}
              </h2>
              {status && <div>{renderStatus(status)}</div>}
            </div>

            {/* Price & rating */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              {effectivePrice !== undefined && effectivePrice !== null && (
                <span
                  style={{
                    fontSize: "26px",
                    fontWeight: 800,
                    color: "var(--app-text-heading, #ffffff)",
                  }}
                >
                  {renderCurrency(effectivePrice)}
                </span>
              )}

              {metric !== undefined && metric !== null && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    background: "rgba(245, 158, 11, 0.15)",
                    color: "#f59e0b",
                    padding: "4px 8px",
                    borderRadius: "6px",
                    fontSize: "13px",
                    fontWeight: 700,
                  }}
                >
                  ⭐ {String(metric)}
                </span>
              )}
            </div>

            {/* Tiered option selector */}
            {tieredResult.hasTiers && (
              <div>
                <label
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "var(--app-text-secondary, #94a3b8)",
                    display: "block",
                    marginBottom: "4px",
                  }}
                >
                  Select Option / Tier:
                </label>
                <select
                  value={selectedTierIdx}
                  onChange={(e) => setSelectedTierIdx(Number(e.target.value))}
                  style={{
                    width: "100%",
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: "8px",
                    color: "#f8fafc",
                    padding: "8px 12px",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {tieredResult.options.map((opt) => (
                    <option
                      key={`tier-${opt.index}`}
                      value={opt.index}
                      style={{ background: "#0f172a", color: "#f8fafc" }}
                    >
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {canAddToCart && optionGroups && optionGroups.length > 0 && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  margin: "8px 0",
                }}
              >
                {optionGroups.map((og) => {
                  const currentSelected =
                    selectedOptions[og.key] ?? og.options[0];
                  return (
                    <div
                      key={`og-${og.key}`}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "12px",
                          color: "var(--app-text-secondary, #94a3b8)",
                          fontWeight: 600,
                        }}
                      >
                        {og.label}:{" "}
                        <strong style={{ color: "#ffffff" }}>
                          {String(currentSelected)}
                        </strong>
                      </span>
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "8px",
                        }}
                      >
                        {og.options.map((opt, optIdx) => {
                          const isSelected = currentSelected === opt;
                          return (
                            <button
                              key={`opt-${optIdx}`}
                              type="button"
                              onClick={() =>
                                setSelectedOptions((prev) => ({
                                  ...prev,
                                  [og.key]: opt,
                                }))
                              }
                              style={{
                                background: isSelected
                                  ? "var(--widget-accent, #6366f1)"
                                  : "rgba(255,255,255,0.06)",
                                color: isSelected
                                  ? "var(--widget-accent-contrast, #ffffff)"
                                  : "var(--app-text-primary, #f8fafc)",
                                border: isSelected
                                  ? "1px solid var(--widget-accent, #6366f1)"
                                  : "1px solid rgba(255,255,255,0.15)",
                                borderRadius: "8px",
                                padding: "6px 14px",
                                fontSize: "12px",
                                fontWeight: isSelected ? 700 : 500,
                                cursor: "pointer",
                                transition: "all 0.15s ease",
                              }}
                            >
                              {String(opt)}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Quantity stepper & Add to Cart */}
            {canAddToCart && (
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: "8px",
                    overflow: "hidden",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#fff",
                      padding: "8px 12px",
                      cursor: "pointer",
                      fontSize: "16px",
                      fontWeight: "bold",
                    }}
                  >
                    −
                  </button>
                  <span
                    style={{
                      padding: "0 8px",
                      fontSize: "14px",
                      fontWeight: 600,
                      minWidth: "24px",
                      textAlign: "center",
                    }}
                  >
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#fff",
                      padding: "8px 12px",
                      cursor: "pointer",
                      fontSize: "16px",
                      fontWeight: "bold",
                    }}
                  >
                    +
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleAddToCart}
                  style={{
                    flex: 1,
                    minWidth: "140px",
                    background: "var(--widget-accent, #6366f1)",
                    color: "var(--widget-accent-contrast, #ffffff)",
                    border: "none",
                    borderRadius: "8px",
                    padding: "12px 20px",
                    fontSize: "14px",
                    fontWeight: 700,
                    cursor: "pointer",
                    boxShadow: "0 4px 14px rgba(99, 102, 241, 0.3)",
                    transition: "all 0.15s ease",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                  }}
                >
                  🛒 {addedToast ? "Added to Cart ✓" : "Add to Cart"}
                </button>
              </div>
            )}

            {/* Visible actions (admin mutations / custom / URL actions) */}
            {visibleActions.length > 0 && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                {visibleActions.map((act: any) => (
                  <button
                    key={act.id || act.tool}
                    type="button"
                    style={{
                      width: "100%",
                      background: "var(--widget-accent, #6366f1)",
                      color: "var(--widget-accent-contrast, #ffffff)",
                      border: "none",
                      borderRadius: "8px",
                      padding: "10px 16px",
                      fontWeight: "600",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                    onClick={async () => {
                      const url =
                        act.url || (act.type === "url" ? act.href : undefined);
                      if (url) {
                        console.log(
                          `[DetailBlock] Opening URL action "${act.label}":`,
                          url,
                        );
                        window.open(url, "_blank", "noopener,noreferrer");
                        return;
                      }
                      console.log(
                        `[DetailBlock] Action "${act.label}" → calling MCP tool "${act.tool}" for record id=${targetRecord?.id || targetRecord?._id}`,
                      );
                      try {
                        const result = await callMcpTool(act.tool, {
                          id: targetRecord?.id || targetRecord?._id,
                        });
                        console.log(
                          `[DetailBlock] ✓ Tool "${act.tool}" succeeded:`,
                          result,
                        );
                      } catch (err: any) {
                        console.error(
                          `[DetailBlock] ✗ Tool "${act.tool}" failed:`,
                          err,
                        );
                      }
                    }}
                  >
                    {act.label}
                  </button>
                ))}
              </div>
            )}
          </aside>
        </div>

        {/* Specifications / Detail Fields (full width) */}
        {detailFields.length > 0 && (
          <div
            className={styles.grid}
            style={{
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              borderTop: "1px solid var(--TableDivider, rgba(255,255,255,0.08))",
            }}
          >
            <h4 style={sectionTitleStyle}>Product Details &amp; Specs</h4>
            {detailFields.map((field) => (
              <DetailField key={field.key} field={field} record={targetRecord} />
            ))}
          </div>
        )}

        {/* Collections / Array Data (e.g. Reviews, Specs Lists) */}
        {arrayFields.length > 0 && (
          <div
            style={{
              padding: "0 20px 20px 20px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            {arrayFields.map((field) => {
              const rawArray = getFieldValue(targetRecord, field);
              if (!Array.isArray(rawArray) || rawArray.length === 0) return null;

              const isObjectArray = rawArray.every(
                (item) => item && typeof item === "object",
              );

              return (
                <div
                  key={field.key}
                  style={{ display: "flex", flexDirection: "column", gap: "8px" }}
                >
                  <h4 style={{ ...sectionTitleStyle, marginBottom: 0 }}>
                    {field.label} ({rawArray.length})
                  </h4>

                  {isObjectArray ? (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                      }}
                    >
                      {rawArray.slice(0, 5).map((objItem: any, idx: number) => {
                        const reviewRating =
                          objItem.rating || objItem.score || objItem.stars;
                        const reviewComment =
                          objItem.comment ||
                          objItem.review ||
                          objItem.text ||
                          objItem.message;
                        const reviewerName =
                          objItem.reviewerName ||
                          objItem.user ||
                          objItem.author ||
                          objItem.name;
                        const reviewDate = objItem.date || objItem.createdAt;

                        return (
                          <div
                            key={`arr-item-${idx}`}
                            style={{
                              background: "rgba(255,255,255,0.03)",
                              border: "1px solid rgba(255,255,255,0.06)",
                              borderRadius: "8px",
                              padding: "10px 12px",
                              fontSize: "13px",
                              display: "flex",
                              flexDirection: "column",
                              gap: "4px",
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
                                  fontWeight: 600,
                                  color: "var(--app-text-heading, #fff)",
                                }}
                              >
                                {reviewerName || `Item #${idx + 1}`}
                              </span>
                              {reviewRating !== undefined && (
                                <span
                                  style={{
                                    color: "#f59e0b",
                                    fontSize: "12px",
                                    fontWeight: 700,
                                  }}
                                >
                                  ⭐ {reviewRating}
                                </span>
                              )}
                            </div>
                            {reviewComment && (
                              <p
                                style={{
                                  margin: 0,
                                  color: "var(--app-text-secondary, #94a3b8)",
                                  fontSize: "12px",
                                  lineHeight: 1.4,
                                }}
                              >
                                &ldquo;{reviewComment}&rdquo;
                              </p>
                            )}
                            {reviewDate && (
                              <span
                                style={{
                                  fontSize: "11px",
                                  color: "#64748b",
                                  alignSelf: "flex-end",
                                }}
                              >
                                {String(reviewDate).slice(0, 10)}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div
                      style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}
                    >
                      {rawArray.map((tag: any, idx: number) => (
                        <span
                          key={`tag-${idx}`}
                          style={{
                            background: "rgba(255,255,255,0.06)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            padding: "3px 8px",
                            borderRadius: "6px",
                            fontSize: "12px",
                            color: "var(--app-text-secondary, #cbd5e1)",
                          }}
                        >
                          {String(tag)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
