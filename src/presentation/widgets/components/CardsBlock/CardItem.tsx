import React, { useState } from "react";
import { getFieldValue } from "../../../../utils/schema/getValue";
import { renderImage } from "../../helper/RenderImage";
import { renderStatus } from "../../helper/RenderStatus";
import { renderCurrency } from "../../helper/RenderCurrency";
import { renderDate } from "../../helper/RenderDate";
import { extractTieredPrices } from "../../helper/TieredPriceHelper/tieredPriceHelper";
import { addToCartAndSync } from "../../../../utils/cartFlow";
import styles from "../../../../styles/cardsblock.module.css";
import type { CardItemProps } from "../../../../interfaces/mcp/cardsblock.interface";
import type { FieldSchema } from "../../../../domain/entities/GenericWidget";

const formatFieldValue = (
  val: unknown,
  field: FieldSchema,
): React.ReactNode => {
  if (val === null || val === undefined || val === "") return "-";
  if (field.type === "currency") return String(renderCurrency(val));
  if (field.type === "date" || field.type === "datetime")
    return String(renderDate(val, field.type === "datetime"));
  if (typeof val === "number") return val.toLocaleString();
  if (typeof val === "boolean") return val ? "Yes" : "No";
  return String(val);
};

export const CardItem: React.FC<CardItemProps> = ({
  record,
  fields,
  onSelect,
  actions,
  audience,
}) => {
  if (!record || typeof record !== "object") return null;

  const [selectedTierIdx, setSelectedTierIdx] = useState(0);

  // 1. Extract backend-mapped primary UI fields
  const { $title, $description, $price, $status, $metric, $image, id, url, link } =
    record as any;

  const titleStr = $title || "Item";
  const actionUrlStr = url || link;
  const isClickable = Boolean(actionUrlStr);

  // 2. Extract tiered pricing options (if CSV pricing exists)
  const tieredResult = extractTieredPrices(record, fields);
  const activeTier = tieredResult.hasTiers
    ? tieredResult.options[selectedTierIdx]
    : null;
  const effectivePrice = activeTier ? activeTier.price : $price;

  const CardContainerComponent = isClickable ? "a" : "div";
  const containerProps = isClickable
    ? {
        href: actionUrlStr,
        target: "_blank",
        rel: "noopener noreferrer",
        className: styles.cardItem,
      }
    : { className: styles.cardItem };

  // 3. Identify secondary fields (Suppress bare 'ID' if no explicit uiRole)
  const primaryRoles = [
    "title",
    "description",
    "price",
    "image",
    "status",
    "metric",
  ];
  const secondaryFields = fields
    .filter((f) => {
      if (f.hidden) return false;
      if (primaryRoles.includes(f.uiRole as string)) return false;
      // Suppress bare ID fields with no uiRole
      const keyLower = f.key.toLowerCase();
      const labelLower = (f.label || "").toLowerCase();
      if ((keyLower === "id" || keyLower === "_id" || labelLower === "id") && !f.uiRole) {
        return false;
      }
      return true;
    })
    .slice(0, 3); // Max 3 secondary rows

  const handleClick = (e: React.MouseEvent) => {
    if (actionUrlStr) return; // If it has a URL, let it open the link naturally
    if (onSelect) {
      e.preventDefault();
      onSelect(record as Record<string, any>);
    }
  };

  const [addedToast, setAddedToast] = useState(false);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 2200);
    await addToCartAndSync({
      item: {
        id: id || (record as any)._id || titleStr,
        title: titleStr,
        price: effectivePrice ?? 0,
        image: $image || null,
        tier: activeTier ? activeTier.label : undefined,
      },
      quantity: 1,
      actions,
      recordId: id || (record as any)._id,
    });
  };

  const statusStr = String(
    $status ||
      (record as any).availabilityStatus ||
      (record as any).status ||
      "",
  ).toLowerCase();

  const isOutOfStock =
    (record as any).stock === 0 ||
    statusStr.includes("out of stock") ||
    statusStr.includes("sold out") ||
    statusStr === "inactive";

  const canAddToCart =
    audience !== "admin" &&
    effectivePrice !== undefined &&
    effectivePrice !== null;

  return (
    <CardContainerComponent
      {...containerProps}
      onClick={handleClick}
      style={{ cursor: actionUrlStr || onSelect ? "pointer" : "default" }}
    >
      {/* Asset / Image Area — tapping the card (incl. image) opens the detail */}
      {Boolean($image) && (
        <div
          style={{
            position: "relative",
            height: "160px",
            width: "100%",
            background: "var(--BackgroundSecondary, #0f172a)",
            borderBottom: "1px solid var(--WidgetCardBorder, rgba(255,255,255,0.08))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          {renderImage($image, titleStr, "cover")}

          {/* Out of Stock Badge (Only shown if out of stock, never for in stock) */}
          {isOutOfStock && (
            <div
              style={{
                position: "absolute",
                top: "8px",
                left: "8px",
                zIndex: 2,
                background: "rgba(239, 68, 68, 0.85)",
                color: "#ffffff",
                fontSize: "11px",
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: "6px",
                backdropFilter: "blur(4px)",
              }}
            >
              Out of Stock
            </div>
          )}

          {/* Quick Action Icons on Image (Top Right) */}
          <div
            style={{
              position: "absolute",
              top: "8px",
              right: "8px",
              zIndex: 3,
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            {/* Quick View Button */}
            {(actionUrlStr || onSelect) && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClick(e);
                }}
                title="Quick View"
                aria-label="Quick View"
                style={{
                  background: "rgba(15, 23, 42, 0.75)",
                  backdropFilter: "blur(6px)",
                  border: "1px solid rgba(255, 255, 255, 0.18)",
                  borderRadius: "50%",
                  width: "32px",
                  height: "32px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff",
                  cursor: "pointer",
                  fontSize: "13px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.35)",
                  transition: "all 0.15s ease",
                }}
              >
                👁️
              </button>
            )}

            {/* Quick Add to Cart Button */}
            {canAddToCart && !isOutOfStock && (
              <button
                type="button"
                onClick={handleAddToCart}
                title="Add to Cart"
                aria-label="Add to Cart"
                style={{
                  background: addedToast
                    ? "#10b981"
                    : "rgba(15, 23, 42, 0.75)",
                  backdropFilter: "blur(6px)",
                  border: "1px solid rgba(255, 255, 255, 0.18)",
                  borderRadius: "50%",
                  width: "32px",
                  height: "32px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff",
                  cursor: "pointer",
                  fontSize: "13px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.35)",
                  transition: "all 0.15s ease",
                }}
              >
                {addedToast ? "✓" : "🛒"}
              </button>
            )}
          </div>
        </div>
      )}

        <div className={styles.contentBody}>
          {/* Header */}
          <div className={styles.cardHeader}>
            <div className={styles.titleGroup}>
              <h3 className={styles.title} title={titleStr}>
                {titleStr}
              </h3>
              {$description && !tieredResult.hasTiers && (
                <span className={styles.subtitle} title={String($description)}>
                  {String($description)}
                </span>
              )}
            </div>
          </div>

          {/* Tiered Options Dropdown (if paired CSV tiers exist) */}
          {tieredResult.hasTiers && (
            <div style={{ margin: "6px 0" }} onClick={(e) => e.stopPropagation()}>
              <label
                style={{
                  fontSize: "11px",
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
                  borderRadius: "6px",
                  color: "#f8fafc",
                  padding: "6px 8px",
                  fontSize: "12px",
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

          {/* Price Tag & Rating Metric */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "4px 0" }}>
            {effectivePrice !== undefined && effectivePrice !== null && (
              <div className={styles.priceTag} style={{ color: "var(--app-text-heading, #ffffff)", fontWeight: 800 }}>
                {renderCurrency(effectivePrice)}
              </div>
            )}

            {$metric !== undefined && $metric !== null && (
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "#f59e0b",
                  background: "rgba(245, 158, 11, 0.12)",
                  padding: "2px 6px",
                  borderRadius: "4px",
                }}
              >
                ⭐ {String($metric)}
              </span>
            )}
          </div>

          {/* Compact Swatch / Size Preview (#D) */}
          {(() => {
            for (const [key, val] of Object.entries(record as any)) {
              if (key.startsWith("$")) continue;
              if (
                Array.isArray(val) &&
                val.length > 1 &&
                val.length <= 16 &&
                val.every(
                  (item) =>
                    typeof item === "string" || typeof item === "number",
                ) &&
                !val.some(
                  (item) =>
                    typeof item === "string" && /^https?:\/\//i.test(item),
                )
              ) {
                const kLower = key.toLowerCase();
                if (
                  kLower.includes("size") ||
                  kLower.includes("color") ||
                  kLower.includes("shade") ||
                  kLower.includes("variant") ||
                  kLower.includes("flavor") ||
                  kLower.includes("tag")
                ) {
                  return (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        margin: "4px 0 6px 0",
                        flexWrap: "wrap",
                      }}
                    >
                      {val.slice(0, 3).map((item, idx) => (
                        <span
                          key={`swatch-${idx}`}
                          style={{
                            background: "rgba(255, 255, 255, 0.06)",
                            border: "1px solid rgba(255, 255, 255, 0.12)",
                            borderRadius: "4px",
                            padding: "1px 6px",
                            fontSize: "10px",
                            fontWeight: 600,
                            color: "var(--app-text-secondary, #cbd5e1)",
                          }}
                        >
                          {String(item)}
                        </span>
                      ))}
                      {val.length > 3 && (
                        <span
                          style={{
                            fontSize: "10px",
                            color: "var(--app-text-secondary, #94a3b8)",
                            fontWeight: 600,
                          }}
                        >
                          +{val.length - 3}
                        </span>
                      )}
                    </div>
                  );
                }
              }
            }
            return null;
          })()}

          {/* Secondary Metadata List */}
          {secondaryFields.length > 0 && (
            <div className={styles.metaList}>
              {secondaryFields.map((field) => {
                const val = getFieldValue(record, field);
                if (val === null || val === undefined || val === "") return null;
                return (
                  <div key={field.key} className={styles.metaRow}>
                    <span className={styles.metaLabel}>{field.label}</span>
                    <span className={styles.metaValue}>
                      {formatFieldValue(val, field)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContainerComponent>
  );
};


