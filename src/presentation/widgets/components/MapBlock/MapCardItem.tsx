import React, { useMemo, useState } from "react";
import styles from "../../../../styles/mapblock.module.css";
import { extractFirstImageUrl } from "../../helper/RenderImage/getproxiedimageurl";
import { renderImage } from "../../helper/RenderImage";
import { extractRatingInfo } from "../../helper/geoHelper";
import { parseNumericPrice } from "../../../../infrastructure/store/cartStore";
import {
  deriveSpecChips,
  deriveLocationText,
  deriveStatusBadge,
  deriveCtaLabel,
  findFavouriteAction,
  findFavouriteField,
} from "../../helper/cardMeta";
import { callMcpTool } from "../../../../utils/mcpBridge";

interface MapCardItemProps {
  record: Record<string, any>;
  fields?: Array<Record<string, any>>;
  actions?: any[];
  isActive?: boolean;
  onSelect?: (record: Record<string, any>) => void;
  onHover?: (record: Record<string, any> | null) => void;
}

export const MapCardItem: React.FC<MapCardItemProps> = ({
  record,
  fields = [],
  actions = [],
  isActive = false,
  onSelect,
  onHover,
}) => {
  // Favourite is gated: only shown when the company exposes a favourite tool
  // or the record itself carries a favourite/wishlist flag.
  const favTool = useMemo(() => findFavouriteAction(actions), [actions]);
  const favField = useMemo(() => findFavouriteField(record), [record]);
  const showHeart = Boolean(favTool || favField);
  const [isWishlisted, setIsWishlisted] = useState(
    Boolean(favField && record?.[favField]),
  );

  if (!record || typeof record !== "object") return null;

  const title =
    record.make
      ? `${record.make} ${record.model || ""}`.trim()
      : (record.$title ||
         record.title ||
         record.name ||
         record.hotelName ||
         record.propertyName ||
         "Item");

  const rating = extractRatingInfo(record);
  const statusBadge = deriveStatusBadge(record, fields);
  const locationText = deriveLocationText(record);
  const specChips = deriveSpecChips(record, fields);
  const ctaLabel = deriveCtaLabel(actions);

  // Pricing & Discounts
  let basePrice: unknown =
    record.pricePerDay ?? record.price_per_day ?? record.$price ?? record.price;
  if (basePrice === undefined || basePrice === null) {
    for (const [k, v] of Object.entries(record)) {
      if (/(percent|discount|qty|quantity|count|stock)/i.test(k)) continue;
      if (
        /(price|rate|cost|amount|fare|charge)/i.test(k) &&
        (typeof v === "number" || (typeof v === "string" && /\d/.test(v)))
      ) {
        basePrice = v;
        break;
      }
    }
  }

  const baseNum = parseNumericPrice(basePrice);
  let finalPrice = baseNum;
  let originalPrice: number | null = null;

  const compareAtRaw =
    record.originalPrice ??
    record.regularPrice ??
    record.listPrice ??
    record.compareAtPrice;
  const compareAtNum = compareAtRaw != null ? parseNumericPrice(compareAtRaw) : NaN;

  const saleRaw =
    record.salePrice ??
    record.discountedPrice ??
    record.specialPrice;
  const saleNum = saleRaw != null ? parseNumericPrice(saleRaw) : NaN;

  const pctRaw =
    record.discountPercentage ??
    record.discountPercent ??
    record.discountRate;
  const pctNum = pctRaw != null ? Number(pctRaw) : NaN;

  if (isFinite(compareAtNum) && compareAtNum > baseNum) {
    finalPrice = baseNum;
    originalPrice = compareAtNum;
  } else if (isFinite(saleNum) && saleNum > 0 && saleNum < baseNum) {
    finalPrice = saleNum;
    originalPrice = baseNum;
  } else if (isFinite(pctNum) && pctNum > 0 && pctNum < 100) {
    finalPrice = Math.round(baseNum * (1 - pctNum / 100) * 100) / 100;
    originalPrice = baseNum;
  }

  // Currency symbol — from record currency fields only (no country/city guess).
  const currencySymbol =
    record.currencySymbol ||
    record.currency_symbol ||
    record.symbol ||
    (typeof record.currency === "string" && record.currency
      ? `${record.currency} `
      : "") ||
    (typeof record.currencyCode === "string" && record.currencyCode
      ? `${record.currencyCode} `
      : "") ||
    "$";

  const formattedSale =
    isFinite(finalPrice) && finalPrice > 0
      ? `${currencySymbol}${finalPrice.toLocaleString(undefined, {
          maximumFractionDigits: finalPrice % 1 !== 0 ? 2 : 0,
        })}`
      : typeof basePrice === "string"
        ? basePrice
        : "";

  const formattedOriginal =
    originalPrice !== null && isFinite(originalPrice)
      ? `${currencySymbol}${originalPrice.toLocaleString(undefined, {
          maximumFractionDigits: originalPrice % 1 !== 0 ? 2 : 0,
        })}`
      : null;

  const period =
    record.period ||
    record.duration ||
    (record.pricePerDay || record.price_per_day
      ? "/ day"
      : record.nights
        ? `/ ${record.nights} nights`
        : "");

  const imageUrl =
    extractFirstImageUrl(record.thumbnail) ||
    extractFirstImageUrl(record.image) ||
    extractFirstImageUrl(record.images) ||
    extractFirstImageUrl(record.photo) ||
    extractFirstImageUrl(record);

  const handleFavourite = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !isWishlisted;
    setIsWishlisted(next); // optimistic
    if (favTool?.tool) {
      callMcpTool(favTool.tool, {
        id: record.id ?? record._id,
        favourite: next,
      }).catch(() => setIsWishlisted(!next));
    }
  };

  const toneClass =
    statusBadge?.tone === "positive"
      ? styles.statusBadgePositive
      : statusBadge?.tone === "negative"
        ? styles.statusBadgeNegative
        : styles.statusBadgeNeutral;

  return (
    <div
      className={`${styles.carCard} ${isActive ? styles.carCardActive : ""}`}
      onClick={() => onSelect?.(record)}
      onMouseEnter={() => onHover?.(record)}
      onMouseLeave={() => onHover?.(null)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect?.(record);
        }
      }}
    >
      {/* Hero image with badges */}
      <div className={styles.carCardImageWrap}>
        {renderImage(imageUrl, title, "cover")}
        {statusBadge && (
          <span className={`${styles.statusBadge} ${toneClass}`}>
            {statusBadge.text}
          </span>
        )}
        {rating.scoreFormatted && (
          <span className={styles.scoreBadge}>{rating.scoreFormatted}</span>
        )}
        {showHeart && (
          <button
            type="button"
            className={`${styles.favBtn} ${isWishlisted ? styles.favBtnActive : ""}`}
            onClick={handleFavourite}
            title={isWishlisted ? "Remove from favourites" : "Add to favourites"}
            aria-label="Favourite"
          >
            {isWishlisted ? "♥" : "♡"}
          </button>
        )}
      </div>

      {/* Body */}
      <div className={styles.carCardBody}>
        <h4 className={styles.carCardTitle} title={title}>
          {title}
        </h4>

        {locationText && (
          <div className={styles.carCardLocation}>
            <span>📍</span>
            <span>{locationText}</span>
          </div>
        )}

        {rating.stars > 0 && (
          <div className={styles.starsReviewsRow}>
            <span>{"★".repeat(rating.stars)}</span>
            {rating.reviewsCount !== null && (
              <span className={styles.reviewsCountText}>
                {rating.reviewsCount.toLocaleString()} reviews
              </span>
            )}
          </div>
        )}

        {specChips.length > 0 && (
          <div className={styles.carCardSpecs}>
            {specChips.map((chip) => (
              <span className={styles.specChip} key={chip.key}>
                {chip.value}
              </span>
            ))}
          </div>
        )}

        <div className={styles.carCardFooter}>
          <div className={styles.cardPriceRow}>
            {formattedOriginal && (
              <span className={styles.originalPrice}>{formattedOriginal}</span>
            )}
            {formattedSale && (
              <span className={styles.salePrice}>{formattedSale}</span>
            )}
            {period && <span className={styles.periodSuffix}>{period}</span>}
          </div>
          <span className={styles.carCardCta}>{ctaLabel}</span>
        </div>
      </div>
    </div>
  );
};
