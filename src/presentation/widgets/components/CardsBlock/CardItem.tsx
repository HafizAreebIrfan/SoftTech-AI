import React, { useState } from "react";
import { getFieldValue } from "../../../../utils/schema/getValue";
import { renderImage } from "../../helper/RenderImage";
import { renderStatus } from "../../helper/RenderStatus";
import { renderCurrency } from "../../helper/RenderCurrency";
import { renderDate } from "../../helper/RenderDate";
import { extractTieredPrices } from "../../helper/TieredPriceHelper/tieredPriceHelper";
import { useCartStore } from "../../../../infrastructure/store/cartStore";
import { ImageLightbox } from "../ImageLightbox";
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

  const [lightboxOpen, setLightboxOpen] = useState(false);
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

  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setLightboxOpen(true);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    const addItem = useCartStore.getState().addItem;
    const openCart = useCartStore.getState().openCart;

    addItem(
      {
        id: id || (record as any)._id || titleStr,
        title: titleStr,
        price: effectivePrice ?? 0,
        image: $image || null,
        tier: activeTier ? activeTier.label : undefined,
      },
      1,
    );
    openCart();

    const openai = (window as any).openai;
    const tierSuffix = activeTier ? ` (${activeTier.label})` : "";
    const prompt = `Add 1 × ${titleStr}${tierSuffix} to my cart`;
    if (openai?.sendFollowUpMessage) {
      openai.sendFollowUpMessage({ prompt });
    }
  };

  const canAddToCart = audience !== "admin" && effectivePrice !== undefined && effectivePrice !== null;

  return (
    <>
      <CardContainerComponent
        {...containerProps}
        onClick={handleClick}
        style={{ cursor: actionUrlStr || onSelect ? "pointer" : "default" }}
      >
        {/* Asset / Image Area (Clickable to Zoom) */}
        {Boolean($image) && (
          <div
            onClick={handleImageClick}
            title="Click to view full image"
            style={{
              height: "160px",
              width: "100%",
              background: "var(--BackgroundSecondary, #0f172a)",
              borderBottom: "1px solid var(--WidgetCardBorder, rgba(255,255,255,0.08))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              cursor: "zoom-in",
              position: "relative",
            }}
          >
            {renderImage($image, titleStr, "cover")}
            <span
              style={{
                position: "absolute",
                top: "8px",
                right: "8px",
                background: "rgba(0,0,0,0.5)",
                padding: "3px 6px",
                borderRadius: "4px",
                fontSize: "11px",
                color: "#fff",
              }}
            >
              🔍
            </span>
          </div>
        )}

        <div className={styles.contentBody}>
          {/* Header & Status */}
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
            {$status && (
              <div className={styles.statusBadge}>{renderStatus($status)}</div>
            )}
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
              <div className={styles.priceTag} style={{ color: "var(--widget-accent, #6366f1)", fontWeight: 800 }}>
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

        {/* Card Footer with Detail and Cart CTAs */}
        <div
          className={styles.cardFooter}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "8px",
            borderTop: "1px solid var(--WidgetCardBorder, rgba(255,255,255,0.06))",
            padding: "10px 14px",
          }}
        >
          {(actionUrlStr || onSelect) && (
            <span className={styles.actionButton} style={{ fontSize: "12px" }}>
              View Details &rarr;
            </span>
          )}

          {canAddToCart && (
            <button
              type="button"
              onClick={handleAddToCart}
              style={{
                background: "var(--widget-accent, #6366f1)",
                color: "var(--widget-accent-contrast, #ffffff)",
                border: "none",
                borderRadius: "6px",
                padding: "6px 12px",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
                marginLeft: "auto",
                transition: "all 0.15s ease",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <span>🛒</span> + Cart
            </button>
          )}
        </div>
      </CardContainerComponent>

      {/* Full-Screen Image Lightbox */}
      <ImageLightbox
        src={$image}
        alt={titleStr}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </>
  );
};


