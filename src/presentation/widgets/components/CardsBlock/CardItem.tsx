import React, { useState } from "react";
import { getFieldValue } from "../../../../utils/schema/getValue";
import { renderImage } from "../../helper/RenderImage";
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

const getEntityIcon = (rec: any): string => {
  const str = `${rec.make || ""} ${rec.model || ""} ${rec.category || ""} ${rec.$title || ""} ${rec.title || ""} ${rec.name || ""}`.toLowerCase();
  if (/car|auto|vehicle|rental|sedan|suv|truck|corolla|fortuner/i.test(str)) return "🚗";
  if (/hotel|room|suite|stay|resort|villa/i.test(str)) return "🏨";
  if (/flight|plane|air|airline/i.test(str)) return "✈️";
  if (/course|class|lesson|learn/i.test(str)) return "🎓";
  if (/tour|trip|travel|holiday/i.test(str)) return "🏖️";
  if (/food|meal|dish|restaurant|burger|pizza/i.test(str)) return "🍔";
  return "📦";
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

  const rec = (record || {}) as any;

  // 1. Extract primary UI fields
  const { $title, $description, $price, $status, $metric, $image, id, url, link } =
    rec;

  const titleStr =
    (rec.make ? `${rec.make} ${rec.model || ""}`.trim() : null) ||
    $title ||
    rec.title ||
    rec.name ||
    "Item";

  const subtitleStr =
    (rec.make && rec.year ? `${rec.year} • ${rec.model || rec.category || ""}`.trim() : null) ||
    $description ||
    rec.description ||
    rec.subtitle ||
    "";

  const actionUrlStr = url || link;
  const isClickable = Boolean(actionUrlStr || onSelect);

  // 2. Extract pricing
  const rawDailyPrice = rec.pricePerDay ?? rec.price_per_day ?? rec.dailyRate ?? rec.rent;
  const tieredResult = extractTieredPrices(record, fields);
  const activeTier = tieredResult.hasTiers
    ? tieredResult.options[selectedTierIdx]
    : null;
  const effectivePrice = activeTier ? activeTier.price : (rawDailyPrice ?? $price ?? rec.price);
  const isDailyRental = rawDailyPrice !== undefined && rawDailyPrice !== null;

  const CardContainerComponent = actionUrlStr ? "a" : "div";
  const containerProps = actionUrlStr
    ? {
        href: actionUrlStr,
        target: "_blank",
        rel: "noopener noreferrer",
        className: styles.cardItem,
      }
    : { className: styles.cardItem };

  const handleClick = (e: React.MouseEvent) => {
    if (actionUrlStr) return;
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
        id: id || rec._id || titleStr,
        title: titleStr,
        price: effectivePrice ?? 0,
        image: $image || null,
        tier: activeTier ? activeTier.label : undefined,
      },
      quantity: 1,
      actions,
      recordId: id || rec._id,
    });
  };

  const statusStr = String(
    $status ||
      rec.availabilityStatus ||
      rec.status ||
      "",
  ).toLowerCase().trim();

  const isOutOfStock =
    rec.stock === 0 ||
    statusStr.includes("out of stock") ||
    statusStr.includes("sold out") ||
    statusStr === "inactive" ||
    statusStr === "unavailable";

  const hasCartAction = actions?.some((a: any) =>
    /cart|order/i.test(a?.id || a?.label || a?.tool || ""),
  );
  const canAddToCart =
    audience !== "admin" &&
    hasCartAction &&
    effectivePrice !== undefined &&
    effectivePrice !== null;

  // Extract key quick-spec pills if available (only show what API actually returns)
  const specPills: Array<{ icon: string; text: string }> = [];
  if (rec.transmission) {
    specPills.push({ icon: "⚙️", text: String(rec.transmission) });
  }
  if (rec.fuelType || rec.fuel) {
    specPills.push({ icon: "⛽", text: String(rec.fuelType || rec.fuel) });
  }
  if (rec.seats) {
    specPills.push({ icon: "👥", text: `${rec.seats} Seats` });
  }
  if (rec.mileage) {
    const formattedMileage = typeof rec.mileage === "number"
      ? rec.mileage.toLocaleString()
      : rec.mileage;
    specPills.push({ icon: "🛣️", text: `${formattedMileage} km` });
  }
  if (rec.brand && !rec.make) {
    specPills.push({ icon: "🏷️", text: String(rec.brand) });
  }
  if (rec.location?.city || rec.city) {
    specPills.push({ icon: "📍", text: String(rec.location?.city || rec.city) });
  }

  // Identify remaining secondary metadata rows
  const handledKeys = new Set([
    "id",
    "_id",
    "make",
    "model",
    "title",
    "name",
    "description",
    "subtitle",
    "transmission",
    "fueltype",
    "fuel",
    "seats",
    "mileage",
    "price",
    "priceperday",
    "dailyrate",
    "images",
    "image",
    "status",
    "isrestricted",
    "restrictexpiresat",
    "createdat",
    "updatedat",
    "latitude",
    "longitude",
    "locationid",
  ]);

  const secondaryFields = fields
    .filter((f) => {
      if (f.hidden) return false;
      const kLower = f.key.toLowerCase();
      if (handledKeys.has(kLower)) return false;
      const val = getFieldValue(record, f);
      return val !== null && val !== undefined && val !== "";
    })
    .slice(0, 2);

  const hasImage = Boolean($image && typeof $image === "string" && $image.trim() !== "");

  return (
    <CardContainerComponent
      {...containerProps}
      onClick={handleClick}
      style={{ cursor: isClickable ? "pointer" : "default" }}
    >
      {/* Media Header / Graphic Banner */}
      <div
        style={{
          position: "relative",
          height: "135px",
          width: "100%",
          background: hasImage
            ? "var(--BackgroundSecondary, #0f172a)"
            : "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(15,23,42,0.6) 100%)",
          borderBottom: "1px solid var(--WidgetCardBorder, rgba(255,255,255,0.08))",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        {hasImage ? (
          renderImage($image, titleStr, "cover")
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              opacity: 0.85,
            }}
          >
            <span style={{ fontSize: "38px", filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.5))" }}>
              {getEntityIcon(record)}
            </span>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "var(--app-text-secondary, #94a3b8)",
              }}
            >
              {rec.category || rec.make || "Details"}
            </span>
          </div>
        )}

        {/* Status Badge on top-left */}
        {statusStr && (
          <div
            style={{
              position: "absolute",
              top: "8px",
              left: "8px",
              zIndex: 2,
              background: isOutOfStock
                ? "rgba(239, 68, 68, 0.85)"
                : "rgba(16, 185, 129, 0.85)",
              color: "#ffffff",
              fontSize: "10px",
              fontWeight: 700,
              padding: "2px 7px",
              borderRadius: "5px",
              backdropFilter: "blur(4px)",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            {isOutOfStock ? "Unavailable" : (rec.status || "Available")}
          </div>
        )}

        {/* Quick Add to Cart Button (if applicable) */}
        {canAddToCart && !isOutOfStock && (
          <div
            style={{
              position: "absolute",
              top: "8px",
              right: "8px",
              zIndex: 3,
            }}
          >
            <button
              type="button"
              onClick={handleAddToCart}
              title="Add to Cart"
              aria-label="Add to Cart"
              style={{
                background: addedToast
                  ? "var(--widget-accent, #3b82f6)"
                  : "rgba(15, 23, 42, 0.85)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255, 255, 255, 0.25)",
                borderRadius: "50%",
                width: "34px",
                height: "34px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                cursor: "pointer",
                fontSize: "15px",
                boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
                transition: "all 0.15s ease",
              }}
            >
              {addedToast ? "✓" : "🛒"}
            </button>
          </div>
        )}
      </div>

      <div className={styles.contentBody}>
        {/* Header */}
        <div className={styles.cardHeader}>
          <div className={styles.titleGroup}>
            <h3 className={styles.title} title={titleStr}>
              {titleStr}
            </h3>
            {subtitleStr && (
              <span className={styles.subtitle} title={subtitleStr}>
                {subtitleStr}
              </span>
            )}
          </div>
        </div>

        {/* Tiered Options Dropdown (if paired CSV tiers exist) */}
        {tieredResult.hasTiers && (
          <div style={{ margin: "4px 0" }} onClick={(e) => e.stopPropagation()}>
            <select
              value={selectedTierIdx}
              onChange={(e) => setSelectedTierIdx(Number(e.target.value))}
              style={{
                width: "100%",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: "6px",
                color: "#f8fafc",
                padding: "5px 8px",
                fontSize: "11px",
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
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", margin: "2px 0 4px 0" }}>
          {effectivePrice !== undefined && effectivePrice !== null && (
            <div className={styles.priceTag} style={{ color: "var(--app-text-heading, #ffffff)", fontWeight: 800 }}>
              {renderCurrency(effectivePrice)}
              {isDailyRental && (
                <span style={{ fontSize: "11px", fontWeight: 500, color: "var(--app-text-secondary, #94a3b8)", marginLeft: "3px" }}>
                  / day
                </span>
              )}
            </div>
          )}

          {($metric !== undefined && $metric !== null) || rec.averageRating ? (
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "#f59e0b",
                background: "rgba(245, 158, 11, 0.12)",
                padding: "1px 6px",
                borderRadius: "4px",
              }}
            >
              ⭐ {String($metric || rec.averageRating)}
            </span>
          ) : null}
        </div>

        {/* Spec Badge Pills Grid */}
        {specPills.length > 0 && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "5px",
              margin: "4px 0",
            }}
          >
            {specPills.map((pill, idx) => (
              <span
                key={`pill-${idx}`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "5px",
                  padding: "2px 6px",
                  fontSize: "10px",
                  fontWeight: 600,
                  color: "var(--app-text-secondary, #cbd5e1)",
                }}
              >
                <span>{pill.icon}</span>
                <span>{pill.text}</span>
              </span>
            ))}
          </div>
        )}

        {/* Secondary Metadata Rows */}
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

        {/* Interactive Card Action Button */}
        {onSelect && !canAddToCart && (
          <div style={{ marginTop: "6px", paddingTop: "6px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <button
              type="button"
              onClick={handleClick}
              style={{
                width: "100%",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid var(--widget-card-border, rgba(255,255,255,0.12))",
                borderRadius: "6px",
                color: "var(--widget-accent, #3b82f6)",
                padding: "6px 10px",
                fontSize: "11px",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "4px",
                transition: "all 0.15s ease",
              }}
            >
              <span>View Details</span>
              <span>&rarr;</span>
            </button>
          </div>
        )}
      </div>
    </CardContainerComponent>
  );
};


