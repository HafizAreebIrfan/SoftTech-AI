import React, { useState } from "react";
import styles from "../../../../styles/cardsblock.module.css";
import type { CardItemProps } from "../../../../interfaces/mcp/cardsblock.interface";
import { extractFirstImageUrl } from "../../helper/RenderImage/getproxiedimageurl";

// Silhouette SVG for vehicle placeholder
const CarSilhouetteIcon: React.FC = () => (
  <svg
    viewBox="0 0 100 50"
    fill="currentColor"
    className={styles.bannerSilhouette}
    aria-hidden="true"
  >
    <path d="M15 32c-3.3 0-6-2.7-6-6 0-3.3 2.7-6 6-6s6 2.7 6 6c0 3.3-2.7 6-6 6zm70 0c-3.3 0-6-2.7-6-6 0-3.3 2.7-6 6-6s6 2.7 6 6c0 3.3-2.7 6-6 6zm10-12l-7-8c-2-2.3-5-3.6-8-3.6H42c-2.4 0-4.7.9-6.4 2.5L25 18H10c-3.3 0-6 2.7-6 6v8c0 1.1.9 2 2 2h3.5c1.2-4.6 5.4-8 10.5-8s9.3 3.4 10.5 8h39c1.2-4.6 5.4-8 10.5-8s9.3 3.4 10.5 8H96c1.1 0 2-.9 2-2v-9c0-1.7-.7-3.3-2-4.5zM38 18l7.5-6h23.5l5 6H38z" />
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

export const CardItem: React.FC<CardItemProps> = ({
  record,
  onSelect,
  actions,
  audience,
}) => {
  if (!record || typeof record !== "object") return null;

  const rec = record as Record<string, any>;

  // Detect whether this item is a vehicle / rental car or an e-commerce / general product
  const isVehicle =
    Boolean(
      rec.make &&
      (rec.fuelType ||
        rec.transmission ||
        rec.licensePlate ||
        rec.dailyRate ||
        rec.pricePerDay),
    ) ||
    /car|vehicle|rental|fleet|auto/i.test(
      String(rec.category || "").toLowerCase(),
    );

  // Extract Titles
  const mainTitle =
    (isVehicle ? rec.make : null) ||
    rec.$title ||
    rec.title ||
    rec.name ||
    rec.make ||
    "Product";

  const variantTitle =
    (isVehicle ? rec.model : null) ||
    rec.model ||
    rec.brand ||
    rec.variant ||
    rec.subtitle ||
    (isVehicle && rec.year ? String(rec.year) : "");

  // Location or Category breadcrumb
  const locationStr = isVehicle
    ? rec.location?.name ||
      rec.location?.city ||
      rec.locationName ||
      rec.city ||
      (rec.branch ? `${rec.branch}, ${rec.city || ""}` : "")
    : rec.category
      ? String(rec.category)
      : "";

  // Specs
  const specs: Array<{ icon: string; text: string }> = [];
  if (isVehicle) {
    if (rec.fuel || rec.fuelType) {
      specs.push({
        icon: "⛽",
        text: String(rec.fuel || rec.fuelType).toLowerCase(),
      });
    }
    if (rec.transmission) {
      specs.push({ icon: "⚙️", text: String(rec.transmission).toLowerCase() });
    }
    if (rec.seats) {
      specs.push({ icon: "👥", text: `${rec.seats} seats` });
    }
  } else {
    // General / e-commerce specs
    if (rec.rating) {
      specs.push({ icon: "★", text: `${rec.rating}` });
    }
    if (rec.stock !== undefined && rec.stock !== null) {
      specs.push({ icon: "📦", text: `${rec.stock} in stock` });
    }
    if (rec.brand && rec.brand !== variantTitle) {
      specs.push({ icon: "🏷️", text: String(rec.brand) });
    }
  }

  // Price & Period
  const rawPrice =
    rec.dailyRate ??
    rec.pricePerDay ??
    rec.price_per_day ??
    rec.$price ??
    rec.price;

  let formattedPrice = "Price on request";
  if (rawPrice !== undefined && rawPrice !== null) {
    if (typeof rawPrice === "number") {
      formattedPrice = isVehicle
        ? `Rs. ${rawPrice.toLocaleString()}`
        : `$${rawPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else {
      formattedPrice = String(rawPrice);
    }
  }

  // Robust Image candidate resolution (handling comma-separated lists, arrays, objects)
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

  // Determine deterministic banner color based on name/id
  const bannerHash = (rec.id || rec._id || mainTitle)
    .toString()
    .split("")
    .reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
  const bannerClass = BANNER_CLASSES[bannerHash % BANNER_CLASSES.length];

  // Availability status
  const statusStr = String(
    rec.status || rec.availabilityStatus || "",
  ).toUpperCase();
  const isAvailable =
    rec.isAvailable !== false &&
    statusStr !== "MAINTENANCE" &&
    statusStr !== "BOOKED" &&
    statusStr !== "OUT OF STOCK" &&
    rec.availability !== "Unavailable";

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

  const [imgError, setImgError] = useState(false);
  const actionLabel = isVehicle ? "Book now" : "View details";

  return (
    <CardContainer {...containerProps}>
      {/* Top Banner with Image or Colored Theme + Silhouette */}
      <div className={`${styles.bannerWrapper} ${bannerClass}`}>
        {hasValidImage && !imgError ? (
          <img
            src={imageUrl!}
            alt={`${mainTitle} ${variantTitle}`}
            className={styles.bannerImage}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={(e) => {
              const target = e.currentTarget;
              if (!target.dataset.triedProxy) {
                target.dataset.triedProxy = "true";
                target.src = `https://softtech-ai.onrender.com/api/images/image-proxy?url=${encodeURIComponent(imageUrl!)}`;
              } else {
                setImgError(true);
              }
            }}
          />
        ) : isVehicle ? (
          <CarSilhouetteIcon />
        ) : (
          <div className={styles.productPlaceholderIcon}>🛍️</div>
        )}

        {isAvailable ? (
          <span className={styles.availableBadge}>
            {rec.availabilityStatus || "Available"}
          </span>
        ) : (
          <span className={styles.outOfStockBadge}>
            {rec.availabilityStatus || (isVehicle ? "Booked" : "Out of Stock")}
          </span>
        )}
      </div>

      {/* Card Content Body */}
      <div className={styles.contentBody}>
        <div className={styles.titleRow}>
          <h3 className={styles.carTitle}>{mainTitle}</h3>
          {variantTitle && (
            <span className={styles.carVariant}>{variantTitle}</span>
          )}
        </div>

        {locationStr && (
          <p className={styles.locationRow}>
            <span>{isVehicle ? "📍" : "🏷️"}</span>
            <span>{locationStr}</span>
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
            <span className={styles.priceValue}>{formattedPrice}</span>
            {isVehicle && <span className={styles.pricePeriod}>per day</span>}
          </div>

          <button
            type="button"
            className={styles.bookNowBtn}
            onClick={(e) => {
              e.stopPropagation();
              onSelect?.(rec);
            }}
          >
            <span>{actionLabel}</span>
            <span>&rarr;</span>
          </button>
        </div>
      </div>
    </CardContainer>
  );
};
