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

/** Compact, currency-aware price using the record's OWN currency — fallback default to '$'. */
const formatCardPrice = (value: unknown, rec: Record<string, any>): string => {
  if (value === null || value === undefined || value === "") return "";
  if (typeof value === "string" && /[^\d.,\s-]/.test(value)) return value.trim();
  const num = parseNumericPrice(value);
  if (isNaN(num)) return "";

  const code =
    rec.currency ||
    rec.currencyCode ||
    rec.currency_code ||
    rec.priceCurrency;

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

  const symbol =
    rec.currencySymbol ||
    rec.currency_symbol ||
    rec.symbol ||
    "$";

  const formatted = num.toLocaleString(undefined, {
    minimumFractionDigits: num % 1 !== 0 ? 2 : 0,
    maximumFractionDigits: 2,
  });

  return typeof symbol === "string" && symbol.trim()
    ? `${symbol.trim()}${formatted}`
    : `$${formatted}`;
};

interface CardPriceDisplay {
  mainPrice: string;
  originalPrice?: string;
}

/**
 * Computes main price and optional strikethrough original price.
 * Supports explicit sale price, compare-at price, percentage discount,
 * or flat discount from any tool response, with fallback default to '$'.
 */
const computeCardPrices = (rec: Record<string, any>): CardPriceDisplay => {
  // 1. Identify base / normal price
  let baseRaw: unknown = rec.$price ?? rec.price;
  if (baseRaw === undefined || baseRaw === null || baseRaw === "") {
    for (const [k, v] of Object.entries(rec)) {
      if (/(percent|discount|qty|quantity|count|stock)/i.test(k)) continue;
      if (
        PRICE_KEY_RE.test(k) &&
        (typeof v === "number" || (typeof v === "string" && /\d/.test(v)))
      ) {
        baseRaw = v;
        break;
      }
    }
  }

  const baseNum = parseNumericPrice(baseRaw);
  if (isNaN(baseNum) || baseNum <= 0) {
    return { mainPrice: formatCardPrice(baseRaw, rec) };
  }

  // 2. Explicit compare-at / original / list price higher than base price
  const compareAtRaw =
    rec.originalPrice ??
    rec.original_price ??
    rec.regularPrice ??
    rec.regular_price ??
    rec.listPrice ??
    rec.list_price ??
    rec.compareAtPrice ??
    rec.compare_at_price ??
    rec.msrp ??
    rec.oldPrice ??
    rec.old_price;

  const compareAtNum = compareAtRaw != null ? parseNumericPrice(compareAtRaw) : NaN;
  if (isFinite(compareAtNum) && compareAtNum > baseNum) {
    return {
      mainPrice: formatCardPrice(baseNum, rec),
      originalPrice: formatCardPrice(compareAtNum, rec),
    };
  }

  // 3. Explicit sale price lower than base price
  const saleRaw =
    rec.salePrice ??
    rec.sale_price ??
    rec.discountedPrice ??
    rec.discount_price ??
    rec.specialPrice ??
    rec.special_price ??
    rec.offerPrice ??
    rec.offer_price ??
    rec.promoPrice;

  const saleNum = saleRaw != null ? parseNumericPrice(saleRaw) : NaN;
  if (isFinite(saleNum) && saleNum > 0 && saleNum < baseNum) {
    return {
      mainPrice: formatCardPrice(saleNum, rec),
      originalPrice: formatCardPrice(baseNum, rec),
    };
  }

  // 4. Percentage discount (e.g. discountPercentage: 6.55 from DummyJSON or e-com APIs)
  const pctRaw =
    rec.discountPercentage ??
    rec.discount_percentage ??
    rec.discountPercent ??
    rec.discount_percent ??
    rec.discountRate ??
    rec.discount_rate;

  const pctNum = pctRaw != null ? Number(pctRaw) : NaN;
  if (isFinite(pctNum) && pctNum > 0 && pctNum < 100) {
    const calculatedSale = Math.round(baseNum * (1 - pctNum / 100) * 100) / 100;
    if (calculatedSale > 0 && calculatedSale < baseNum) {
      return {
        mainPrice: formatCardPrice(calculatedSale, rec),
        originalPrice: formatCardPrice(baseNum, rec),
      };
    }
  }

  // 5. Flat discount amount (e.g. discountAmount: 10 or discount: 10)
  const flatRaw =
    rec.discountAmount ??
    rec.discount_amount ??
    (typeof rec.discount === "number" ||
    (typeof rec.discount === "string" && !rec.discount.includes("%"))
      ? rec.discount
      : undefined);

  const flatNum = flatRaw != null ? parseNumericPrice(flatRaw) : NaN;
  if (isFinite(flatNum) && flatNum > 0 && flatNum < baseNum) {
    const calculatedSale = Math.round((baseNum - flatNum) * 100) / 100;
    return {
      mainPrice: formatCardPrice(calculatedSale, rec),
      originalPrice: formatCardPrice(baseNum, rec),
    };
  }

  // Fallback: only normal price clearly
  return { mainPrice: formatCardPrice(baseRaw, rec) };
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

  // Price — supports sale price & discounts with fallback default to '$'
  const priceDisplay = computeCardPrices(rec);

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
            {priceDisplay.mainPrice && (
              <div className={styles.priceRow}>
                <span className={styles.priceValue}>{priceDisplay.mainPrice}</span>
                {priceDisplay.originalPrice && (
                  <span className={styles.originalPrice}>
                    {priceDisplay.originalPrice}
                  </span>
                )}
              </div>
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
