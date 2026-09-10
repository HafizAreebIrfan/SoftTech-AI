import React, { useState } from "react";
import styles from "../../../../styles/mapblock.module.css";
import { extractFirstImageUrl } from "../../helper/RenderImage/getproxiedimageurl";
import { renderImage } from "../../helper/RenderImage";
import { extractRatingInfo } from "../../helper/geoHelper";
import { parseNumericPrice } from "../../../../infrastructure/store/cartStore";

interface MapCardItemProps {
  record: Record<string, any>;
  isActive?: boolean;
  onSelect?: (record: Record<string, any>) => void;
  onHover?: (record: Record<string, any> | null) => void;
}

export const MapCardItem: React.FC<MapCardItemProps> = ({
  record,
  isActive = false,
  onSelect,
  onHover,
}) => {
  const [isWishlisted, setIsWishlisted] = useState(false);

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

  // Compare-at / list price
  const compareAtRaw =
    record.originalPrice ??
    record.regularPrice ??
    record.listPrice ??
    record.compareAtPrice;
  const compareAtNum = compareAtRaw != null ? parseNumericPrice(compareAtRaw) : NaN;

  // Sale price
  const saleRaw =
    record.salePrice ??
    record.discountedPrice ??
    record.specialPrice;
  const saleNum = saleRaw != null ? parseNumericPrice(saleRaw) : NaN;

  // Percentage discount
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

  // Currency symbol
  const currencySymbol =
    record.currencySymbol ||
    record.currency_symbol ||
    record.symbol ||
    (record.location?.country === "Pakistan" || record.city === "Karachi"
      ? "PKR "
      : "$");

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

  // Period / duration
  const period =
    record.period ||
    record.duration ||
    (record.pricePerDay || record.price_per_day
      ? "/ day"
      : record.nights
        ? `/ ${record.nights} nights`
        : "");

  // Image
  const imageUrl =
    extractFirstImageUrl(record.thumbnail) ||
    extractFirstImageUrl(record.image) ||
    extractFirstImageUrl(record.images) ||
    extractFirstImageUrl(record.photo) ||
    extractFirstImageUrl(record);

  return (
    <div
      className={`${styles.listItemCard} ${isActive ? styles.listItemCardActive : ""}`}
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
      {/* Thumbnail with score badge */}
      <div className={styles.cardThumbWrapper}>
        {renderImage(imageUrl, title, "cover")}
        {rating.scoreFormatted && (
          <span className={styles.scoreBadge}>{rating.scoreFormatted}</span>
        )}
      </div>

      {/* Content */}
      <div className={styles.cardContent}>
        <div>
          <div className={styles.cardHeaderRow}>
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
            <button
              type="button"
              className={`${styles.wishlistBtn} ${isWishlisted ? styles.wishlistBtnActive : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                setIsWishlisted(!isWishlisted);
              }}
              title={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
              aria-label="Wishlist"
            >
              {isWishlisted ? "♥" : "♡"}
            </button>
          </div>

          <h4 className={styles.cardTitle} title={title}>
            {title}
          </h4>
        </div>

        <div>
          <div className={styles.cardPriceRow}>
            {formattedOriginal && (
              <span className={styles.originalPrice}>{formattedOriginal}</span>
            )}
            {formattedSale && (
              <span className={styles.salePrice}>{formattedSale}</span>
            )}
            {period && <span className={styles.periodSuffix}>{period}</span>}
          </div>
          <p className={styles.taxesSubtext}>Taxes and fees: included</p>
        </div>
      </div>
    </div>
  );
};
