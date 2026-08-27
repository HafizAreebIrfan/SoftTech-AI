import React, { useMemo, useState } from "react";
import { getFieldValue } from "../../../../utils/schema/getValue";
import { renderImage } from "../../helper/RenderImage";
import { renderCurrency } from "../../helper/RenderCurrency";
import { renderStatus } from "../../helper/RenderStatus";
import { extractTieredPrices } from "../../helper/TieredPriceHelper/tieredPriceHelper";
import { useCartStore } from "../../../../infrastructure/store/cartStore";
import { ImageLightbox } from "../ImageLightbox";
import { DetailField } from "./DetailField";
import styles from "../../../../styles/detailblock.module.css";
import type { DetailBlockProps } from "../../../../interfaces/mcp/detailblock.interface";
import { useThemeStore } from "../../../../hooks";
import { classifyAction, getPermissions } from "../../helper/AudienceHelper";

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
  const [lightboxOpen, setLightboxOpen] = useState<boolean>(false);

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

      // Suppress bare ID fields without uiRole
      const keyLower = f.key.toLowerCase();
      const labelLower = (f.label || "").toLowerCase();
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
      tieredResult: tiers,
    };
  }, [targetRecord, block?.fields, fields, collection?.entity]);

  const { colors } = useThemeStore();

  if (!targetRecord) return null;

  const permissions = getPermissions(audience, undefined, actions as any);
  const visibleActions = (actions || []).filter(
    (a: any) => classifyAction(a) !== "mutate" || permissions.canMutate,
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
    const addItem = useCartStore.getState().addItem;
    const openCart = useCartStore.getState().openCart;

    addItem(
      {
        id: targetRecord.id || targetRecord._id || title,
        title: title || "Product",
        price: effectivePrice ?? 0,
        image: images[0] || null,
        tier: activeTier ? activeTier.label : undefined,
      },
      quantity,
    );
    openCart();

    const openai = (window as any).openai;
    const tierSuffix = activeTier ? ` (${activeTier.label})` : "";
    const prompt = `Add ${quantity} × ${title}${tierSuffix} to my cart`;

    if (openai?.sendFollowUpMessage) {
      openai.sendFollowUpMessage({ prompt });
    }

    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 3000);
  };

  const activeMainImage = images[selectedImgIdx] || images[0] || null;

  return (
    <>
      <section className={styles.container}>
        <div
          className={styles.card}
          style={{
            background: "var(--WidgetCardBg, rgba(22, 24, 38, 0.75))",
            border:
              "1px solid var(--WidgetCardBorder, rgba(255, 255, 255, 0.08))",
            borderRadius: "16px",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            gap: "0",
          }}
        >
          {/* Top Product / Record Header Container */}
          <div
            style={{
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
              background: "var(--BackgroundSecondary, rgba(15, 23, 42, 0.4))",
              borderBottom:
                "1px solid var(--TableDivider, rgba(255, 255, 255, 0.08))",
            }}
          >
            {/* Main Hero Gallery (if images present) */}
            {images.length > 0 && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <div
                  onClick={() => setLightboxOpen(true)}
                  title="Click to view full image"
                  style={{
                    width: "100%",
                    height: "240px",
                    borderRadius: "12px",
                    overflow: "hidden",
                    background: "rgba(0,0,0,0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "zoom-in",
                    position: "relative",
                  }}
                >
                  {renderImage(
                    activeMainImage,
                    title || "Item Preview",
                    "cover",
                  )}
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
                    🔍 Zoom
                  </span>
                </div>

                {/* Multi-image thumbnail selector */}
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
                        onClick={() => setSelectedImgIdx(idx)}
                        style={{
                          width: "56px",
                          height: "56px",
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
                        {renderImage(imgUrl, `Thumb ${idx + 1}`, "cover")}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Hero Meta Information */}
            <div
              style={{ display: "flex", flexDirection: "column", gap: "8px" }}
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

              {/* Tiered Option Selector */}
              {tieredResult.hasTiers && (
                <div style={{ margin: "6px 0" }}>
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
                      maxWidth: "320px",
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

              {/* Price & Rating Row */}
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
                      fontSize: "24px",
                      fontWeight: 800,
                      color: "var(--widget-accent, #6366f1)",
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

              {/* Description */}
              {description && !tieredResult.hasTiers && (
                <p
                  style={{
                    margin: "6px 0 0 0",
                    fontSize: "14px",
                    lineHeight: 1.5,
                    color: "var(--WidgetHeaderSubtitle, #94a3b8)",
                  }}
                >
                  {description}
                </p>
              )}

              {/* Add to Cart Stepper & CTA */}
              {canAddToCart && (
                <div
                  style={{
                    marginTop: "16px",
                    display: "flex",
                    gap: "12px",
                    alignItems: "center",
                    flexWrap: "wrap",
                  }}
                >
                  {/* Quantity Stepper */}
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

                  {/* Add to Cart Button */}
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    style={{
                      flex: 1,
                      background: "var(--widget-accent, #6366f1)",
                      color: "var(--widget-accent-contrast, #ffffff)",
                      border: "none",
                      borderRadius: "8px",
                      padding: "10px 20px",
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
            </div>
          </div>


        {/* Specifications / Detail Fields */}
        {detailFields.length > 0 && (
          <div
            className={styles.grid}
            style={{
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            <h4
              style={{
                margin: "0 0 4px 0",
                fontSize: "13px",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "var(--app-text-secondary, #94a3b8)",
              }}
            >
              Product Details & Specs
            </h4>
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

              const isObjectArray = rawArray.every((item) => item && typeof item === "object");

              return (
                <div key={field.key} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <h4
                    style={{
                      margin: 0,
                      fontSize: "13px",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      color: "var(--app-text-secondary, #94a3b8)",
                    }}
                  >
                    {field.label} ({rawArray.length})
                  </h4>

                  {isObjectArray ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {rawArray.slice(0, 5).map((objItem: any, idx: number) => {
                        const reviewRating = objItem.rating || objItem.score || objItem.stars;
                        const reviewComment = objItem.comment || objItem.review || objItem.text || objItem.message;
                        const reviewerName = objItem.reviewerName || objItem.user || objItem.author || objItem.name;
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
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span style={{ fontWeight: 600, color: "var(--app-text-heading, #fff)" }}>
                                {reviewerName || `Item #${idx + 1}`}
                              </span>
                              {reviewRating !== undefined && (
                                <span style={{ color: "#f59e0b", fontSize: "12px", fontWeight: 700 }}>
                                  ⭐ {reviewRating}
                                </span>
                              )}
                            </div>
                            {reviewComment && (
                              <p style={{ margin: 0, color: "var(--app-text-secondary, #94a3b8)", fontSize: "12px", lineHeight: 1.4 }}>
                                &ldquo;{reviewComment}&rdquo;
                              </p>
                            )}
                            {reviewDate && (
                              <span style={{ fontSize: "11px", color: "#64748b", alignSelf: "flex-end" }}>
                                {String(reviewDate).slice(0, 10)}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
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

        {/* Visible Actions Footer (Admin mutations / Custom actions) */}
        {visibleActions.length > 0 && (
          <div
            style={{
              padding: "16px 20px",
              display: "flex",
              gap: "10px",
              borderTop: "1px solid var(--TableDivider, rgba(255,255,255,0.08))",
              background: "var(--BackgroundSecondary, rgba(15, 23, 42, 0.4))",
            }}
          >
            {visibleActions.map((act: any) => (
              <button
                key={act.id || act.tool}
                type="button"
                style={{
                  background: "var(--widget-accent, #6366f1)",
                  color: "var(--widget-accent-contrast, #ffffff)",
                  border: "none",
                  borderRadius: "8px",
                  padding: "10px 16px",
                  fontWeight: "600",
                  cursor: "pointer",
                  flex: 1,
                  transition: "all 0.15s ease",
                }}
                onClick={async () => {
                  const openai = (window as any).openai;
                  const url = act.url || (act.type === "url" ? act.href : undefined);
                  if (url) {
                    window.open(url, "_blank", "noopener,noreferrer");
                    return;
                  }
                  if (openai?.callTool) {
                    await openai.callTool(act.tool, {
                      id: targetRecord?.id || targetRecord?._id,
                    });
                  } else if (openai?.sendFollowUpMessage) {
                    openai.sendFollowUpMessage({
                      prompt: `Execute ${act.label} for ${targetRecord?.$title || "item"}`,
                    });
                  }
                }}
              >
                {act.label}
              </button>
            ))}
          </div>
        )}
        </div>

        {/* Full-Screen Image Lightbox */}
        <ImageLightbox
          src={activeMainImage}
          alt={title || "Preview"}
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
        />
      </section>
    </>
  );
};



