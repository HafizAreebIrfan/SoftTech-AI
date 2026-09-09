import React from "react";
import styles from "../../../../styles/cardsblock.module.css";
import type { CardItemProps } from "../../../../interfaces/mcp/cardsblock.interface";
import { extractFirstImageUrl } from "../../helper/RenderImage/getproxiedimageurl";
import { renderImage } from "../../helper/RenderImage";
import { parseNumericPrice } from "../../../../infrastructure/store/cartStore";

/** Neutral, industry-agnostic placeholder shown when an item has no image. */
const GenericItemIcon: React.FC = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    className={styles.bannerSilhouette}
    aria-hidden="true"
  >
    <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.4" />
    <circle cx="8.5" cy="9" r="1.6" stroke="currentColor" strokeWidth="1.4" />
    <path
      d="M4 17l5-5 4 4 3-3 4 4"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const BANNER_CLASSES = [
  styles.bannerOlive,
  styles.bannerPurple,
  styles.bannerBurgundy,
  styles.bannerViolet,
  styles.bannerEmerald,
  styles.bannerWine,
  styles.bannerNavy,
];

const PRICE_KEY_RE = /(price|rate|cost|amount|fee|fare|premium|charge)/i;
const OUT_OF_STOCK_RE =
  /(out.?of.?stock|unavailable|sold.?out|booked|maintenance|inactive|discontinued|reserved)/i;

/** Compact, currency-aware price using the record's OWN currency — no hardcoded symbol. */
const formatCardPrice = (value: unknown, rec: Record<string, any>): string => {
  if (value === null || value === undefined || value === "") return "";
  if (typeof value === "string" && /[^\d.,\s-]/.test(value)) return value.trim();
  const num = parseNumericPrice(value);
  const code = rec.currency || rec.currencyCode || rec.priceCurrency;
  if (typeof code === "string" && /^[A-Za-z]{3}$/.test(code)) {
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: code.toUpperCase(),
      }).format(num);
    } catch {
      /* unknown code — fall through */
    }
  }
  const symbol = rec.currencySymbol || rec.symbol;
  const formatted = num.toLocaleString(undefined, { maximumFractionDigits: 2 });
  return typeof symbol === "string" && symbol.trim()
    ? `${symbol.trim()}${formatted}`
    : formatted;
};

export const CardItem: React.FC<CardItemProps> = ({ record, onSelect }) => {
  if (!record || typeof record !== "object") return null;

  const rec = record as Record<string, any>;

  // Title / subtitle — supports products, vehicles, bookings, listings universally
  const mainTitle =
    rec.$title ||
    rec.title ||
    rec.name ||
    rec.make ||
    rec.brand ||
    rec.label ||
    rec.heading ||
    "Item";
  const variantTitle =
    rec.$subtitle ||
    rec.subtitle ||
    rec.model ||
    rec.variant ||
    rec.tagline ||
    (rec.year ? String(rec.year) : "");

  // Category / type breadcrumb (generic).
  const categoryStr = (() => {
    const c = rec.category || rec.type || rec.group || rec.collection;
    return c && (typeof c === "string" || typeof c === "number") ? String(c) : "";
  })();

  // Universal spec pills: rating, stock, vehicle specs, location
  const specs: Array<{ icon: string; text: string }> = [];
  const ratingNum =
    typeof rec.rating === "number"
      ? rec.rating
      : rec.rating != null && /^\d/.test(String(rec.rating))
        ? Number(rec.rating)
        : NaN;
  if (isFinite(ratingNum) && ratingNum > 0) {
    specs.push({ icon: "★", text: ratingNum.toFixed(1) });
  }
  if (typeof rec.stock === "number" && rec.stock >= 0) {
    specs.push({ icon: "📦", text: `${rec.stock} in stock` });
  }
  if (rec.transmission) {
    specs.push({ icon: "⚙️", text: String(rec.transmission).toLowerCase() });
  }
  if (rec.fuelType || rec.fuel) {
    specs.push({ icon: "⛽", text: String(rec.fuelType || rec.fuel).toLowerCase() });
  }
  if (rec.seats || rec.capacity) {
    specs.push({ icon: "👥", text: `${rec.seats || rec.capacity} seats` });
  }
  if (rec.mileage) {
    specs.push({ icon: "🛣️", text: `${Number(rec.mileage).toLocaleString()} km` });
  }
  const locStr = rec.location?.city || rec.location?.name || rec.city;
  if (locStr) {
    specs.push({ icon: "📍", text: String(locStr) });
  }

  // Price — prefer $price/price, else the first price-ish scalar (skip
  // discount/qty/stock keys). Formatted with the record's own currency.
  let rawPrice: unknown = rec.$price ?? rec.price;
  if (rawPrice === undefined || rawPrice === null) {
    for (const [k, v] of Object.entries(rec)) {
      if (/(percent|discount|qty|quantity|count|stock)/i.test(k)) continue;
      if (
        PRICE_KEY_RE.test(k) &&
        (typeof v === "number" || (typeof v === "string" && /\d/.test(v)))
      ) {
        rawPrice = v;
        break;
      }
    }
  }
  const formattedPrice = formatCardPrice(rawPrice, rec);

  // Image candidate (handles comma-lists, arrays, objects). renderImage then
  // does raw → proxied → neutral-fallback internally (no sticky dataset flag).
  const imageUrl =
    extractFirstImageUrl(rec.thumbnail) ||
    extractFirstImageUrl(rec.$image) ||
    extractFirstImageUrl(rec.image) ||
    extractFirstImageUrl(rec.images) ||
    extractFirstImageUrl(rec);

  const hasValidImage = Boolean(
    imageUrl &&
      (imageUrl.startsWith("data:") ||
        imageUrl.startsWith("blob:") ||
        imageUrl.startsWith("/") ||
        /^https?:\/\//i.test(imageUrl)),
  );

  // Deterministic gradient — used ONLY behind the no-image fallback icon.
  const bannerHash = (rec.id || rec._id || mainTitle)
    .toString()
    .split("")
    .reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
  const bannerClass = BANNER_CLASSES[bannerHash % BANNER_CLASSES.length];

  // Availability badge — only when the record actually declares a status
  // (never fabricate "Available").
  const statusRaw = rec.availabilityStatus ?? rec.status ?? rec.availability;
  const statusStr =
    statusRaw != null && (typeof statusRaw === "string" || typeof statusRaw === "number")
      ? String(statusRaw)
      : "";
  const explicitlyUnavailable = rec.isAvailable === false;
  const isOut = statusStr ? OUT_OF_STOCK_RE.test(statusStr) : explicitlyUnavailable;
  const showBadge = Boolean(statusStr) || explicitlyUnavailable;

  const actionUrlStr = rec.url || rec.link;
  const CardContainer = actionUrlStr ? "a" : "div";
  const containerProps = actionUrlStr
    ? {
        href: actionUrlStr,
        target: "_blank",
        rel: "noopener noreferrer",
        className: styles.cardItem,
      }
    : {
        className: styles.cardItem,
        onClick: () => onSelect?.(rec),
      };

  return (
    <CardContainer {...containerProps}>
      {/* Real image → plain (bg-less) wrapper, contained so nothing is cropped.
          No image → gradient banner behind a neutral placeholder icon. */}
      {hasValidImage ? (
        <div className={styles.bannerWrapperPlain}>
          {renderImage(imageUrl, `${mainTitle} ${variantTitle}`.trim(), "contain")}
          {showBadge && (
            <span className={isOut ? styles.outOfStockBadge : styles.availableBadge}>
              {statusStr || "Unavailable"}
            </span>
          )}
        </div>
      ) : (
        <div className={`${styles.bannerWrapper} ${bannerClass}`}>
          <GenericItemIcon />
          {showBadge && (
            <span className={isOut ? styles.outOfStockBadge : styles.availableBadge}>
              {statusStr || "Unavailable"}
            </span>
          )}
        </div>
      )}

      {/* Card Content Body */}
      <div className={styles.contentBody}>
        <div className={styles.titleRow}>
          <h3 className={styles.carTitle}>{mainTitle}</h3>
          {variantTitle && (
            <span className={styles.carVariant}>{variantTitle}</span>
          )}
        </div>

        {categoryStr && (
          <p className={styles.locationRow}>
            <span>🏷️</span>
            <span>{categoryStr}</span>
          </p>
        )}

        {specs.length > 0 && (
          <div className={styles.specsPillsRow}>
            {specs.map((spec, i) => (
              <span key={`spec-${i}`} className={styles.specPill}>
                <span>{spec.icon}</span>
                <span>{spec.text}</span>
              </span>
            ))}
          </div>
        )}

        {/* Footer with Price and CTA */}
        <div className={styles.cardFooterRow}>
          <div className={styles.priceGroup}>
            {formattedPrice && (
              <span className={styles.priceValue}>{formattedPrice}</span>
            )}
          </div>

          <button
            type="button"
            className={styles.bookNowBtn}
            onClick={(e) => {
              e.stopPropagation();
              onSelect?.(rec);
            }}
          >
            <span>View details</span>
            <span>&rarr;</span>
          </button>
        </div>
      </div>
    </CardContainer>
  );
};
