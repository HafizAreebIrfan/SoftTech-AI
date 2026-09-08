import React, { useState, useEffect, useMemo } from "react";
import styles from "../../../../styles/detailblock.module.css";
import type { DetailBlockProps } from "../../../../interfaces/mcp/detailblock.interface";
import { useMcpWidgetStore } from "../../../../infrastructure/store/mcpWidgetStore";
import { requestDisplayMode } from "../../../../utils/mcpBridge";
import {
  extractAllImageUrls,
} from "../../helper/RenderImage/getproxiedimageurl";
import { appendChatUrlToCheckout } from "../../../../utils/checkoutHelper";
import { useCartStore } from "../../../../infrastructure/store/cartStore";

// Silhouette SVG for vehicle placeholder
const DetailSilhouetteIcon: React.FC = () => (
  <svg
    viewBox="0 0 100 50"
    fill="currentColor"
    className={styles.heroSilhouette}
    aria-hidden="true"
  >
    <path d="M15 32c-3.3 0-6-2.7-6-6 0-3.3 2.7-6 6-6s6 2.7 6 6c0 3.3-2.7 6-6 6zm70 0c-3.3 0-6-2.7-6-6 0-3.3 2.7-6 6-6s6 2.7 6 6c0 3.3-2.7 6-6 6zm10-12l-7-8c-2-2.3-5-3.6-8-3.6H42c-2.4 0-4.7.9-6.4 2.5L25 18H10c-3.3 0-6 2.7-6 6v8c0 1.1.9 2 2 2h3.5c1.2-4.6 5.4-8 10.5-8s9.3 3.4 10.5 8h39c1.2-4.6 5.4-8 10.5-8s9.3 3.4 10.5 8H96c1.1 0 2-.9 2-2v-9c0-1.7-.7-3.3-2-4.5zM38 18l7.5-6h23.5l5 6H38z" />
  </svg>
);

export const DetailBlock: React.FC<DetailBlockProps> = ({
  records = [],
  collection,
}) => {
  const popSubView = useMcpWidgetStore((state) => state.popSubView);

  const targetRecord = useMemo(() => {
    if (records.length > 0 && records[0] && typeof records[0] === "object") {
      return records[0] as Record<string, any>;
    }
    return null;
  }, [records]);

  useEffect(() => {
    requestDisplayMode("fullscreen");
    return () => {
      requestDisplayMode("inline");
    };
  }, []);

  const metadata = useMemo(() => {
    if (typeof window === "undefined") return {};
    return (
      (window as any).__WIDGET_METADATA__ ||
      (window as any).__WIDGET_DATA__?.metadata ||
      {}
    );
  }, []);

  const companyName = metadata.companyName || collection?.entity || "Store";

  // Entity Detection: Distinguish Vehicles from E-Commerce / General Products
  const isVehicle = useMemo(() => {
    if (!targetRecord) return false;
    const entity = String(collection?.entity || "").toLowerCase();
    const industry = String(metadata?.industry || "").toLowerCase();
    if (
      entity.includes("car") ||
      entity.includes("vehicle") ||
      entity.includes("fleet") ||
      entity.includes("auto") ||
      industry.includes("travel") ||
      industry.includes("rental") ||
      industry.includes("automotive")
    ) {
      return true;
    }
    if (
      (targetRecord.fuelType || targetRecord.fuel || targetRecord.licensePlate) &&
      !targetRecord.sku &&
      !targetRecord.dimensions
    ) {
      return true;
    }
    return false;
  }, [collection?.entity, metadata?.industry, targetRecord]);

  // Gallery Images & Active Image Index
  const allImages = useMemo(() => {
    if (!targetRecord) return [];
    return extractAllImageUrls(targetRecord);
  }, [targetRecord]);

  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);

  useEffect(() => {
    setActiveImageIndex(0);
  }, [targetRecord]);

  const activeImageUrl = allImages[activeImageIndex] || allImages[0] || "";
  const [imageFailed, setImageFailed] = useState<boolean>(false);

  useEffect(() => {
    setImageFailed(false);
  }, [activeImageUrl]);

  const hasValidImage = Boolean(
    !imageFailed &&
      activeImageUrl &&
      (activeImageUrl.startsWith("data:") ||
        activeImageUrl.startsWith("blob:") ||
        activeImageUrl.startsWith("/") ||
        /^https?:\/\//i.test(activeImageUrl)),
  );

  // E-Commerce Quantity & Cart Store
  const [quantity, setQuantity] = useState<number>(
    targetRecord?.minimumOrderQuantity || 1,
  );
  const [addedToCartToast, setAddedToCartToast] = useState<boolean>(false);
  const addItem = useCartStore((state) => state.addItem);
  const openCart = useCartStore((state) => state.openCart);

  const maxStock =
    typeof targetRecord?.stock === "number" ? targetRecord.stock : 99;

  // Car Rental Interactive Calendar Date Selection
  const [selectedStartDay, setSelectedStartDay] = useState<number>(7);
  const [selectedEndDay, setSelectedEndDay] = useState<number | null>(9);
  const [selectedInsurance, setSelectedInsurance] = useState<
    "basic" | "standard" | "premium"
  >("basic");
  const [pickupLocation, setPickupLocation] = useState<string>(
    targetRecord?.location?.name ||
      targetRecord?.city ||
      "Karachi Airport Branch",
  );
  const [dropoffLocation, setDropoffLocation] = useState<string>("same");

  const handleDayClick = (day: number) => {
    if (selectedStartDay === null || (selectedStartDay !== null && selectedEndDay !== null)) {
      setSelectedStartDay(day);
      setSelectedEndDay(null);
    } else {
      if (day > selectedStartDay) {
        setSelectedEndDay(day);
      } else {
        setSelectedStartDay(day);
        setSelectedEndDay(null);
      }
    }
  };

  const effectiveEndDay = selectedEndDay ?? selectedStartDay;
  const rentalDays = Math.max(1, effectiveEndDay - selectedStartDay);

  if (!targetRecord) {
    return (
      <div className={styles.container}>
        <button
          type="button"
          className={styles.backBtn}
          onClick={() => popSubView()}
        >
          &larr; Back
        </button>
        <div className={styles.emptyDetailState}>
          <h3>No item details found</h3>
          <p>The requested record could not be loaded.</p>
        </div>
      </div>
    );
  }

  // Titles
  const mainTitle = isVehicle
    ? targetRecord.make ||
      targetRecord.$title ||
      targetRecord.title ||
      targetRecord.name ||
      "Vehicle Details"
    : targetRecord.title ||
      targetRecord.$title ||
      targetRecord.name ||
      "Product Details";

  const variantTitle = isVehicle
    ? targetRecord.model ||
      targetRecord.variant ||
      targetRecord.subtitle ||
      (targetRecord.year ? String(targetRecord.year) : "")
    : targetRecord.brand ||
      targetRecord.subtitle ||
      "";

  const locationStr = isVehicle
    ? targetRecord.location?.name ||
      targetRecord.location?.city ||
      targetRecord.locationName ||
      targetRecord.city ||
      targetRecord.address ||
      ""
    : targetRecord.category ? String(targetRecord.category) : "";

  // Pricing
  const rawPrice =
    targetRecord.dailyRate ??
    targetRecord.pricePerDay ??
    targetRecord.price_per_day ??
    targetRecord.$price ??
    targetRecord.price ??
    0;

  const dailyRate = Number(rawPrice) || 0;
  const weeklyRate = Number(targetRecord.weeklyRate ?? dailyRate * 6);
  const monthlyRate = Number(targetRecord.monthlyRate ?? dailyRate * 23);
  const depositAmount = Number(targetRecord.securityDeposit ?? 0);

  const insuranceRate =
    selectedInsurance === "premium"
      ? 2500
      : selectedInsurance === "standard"
        ? 1200
        : 500;
  const insuranceTotal = insuranceRate * rentalDays;
  const rentalTotal = dailyRate * rentalDays;
  const grandTotal = rentalTotal + insuranceTotal + depositAmount;

  // Features / Amenities list
  const rawFeatures =
    targetRecord.features ||
    targetRecord.amenities ||
    targetRecord.tags ||
    [];
  const featuresList = Array.isArray(rawFeatures)
    ? rawFeatures.map(String)
    : typeof rawFeatures === "string"
      ? rawFeatures.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

  // Description
  const aboutText =
    targetRecord.description ||
    targetRecord.$description ||
    targetRecord.about ||
    "";

  // Reviews
  const reviewsList = Array.isArray(targetRecord.reviews)
    ? targetRecord.reviews
    : [];

  // External product / single item URL
  const singleProductUrl =
    targetRecord.url ||
    targetRecord.link ||
    targetRecord.productUrl ||
    targetRecord.webUrl ||
    targetRecord.itemUrl ||
    "";

  // Derived company website URL
  const extractCompanyWebsite = (): string => {
    if (targetRecord?.checkoutUrl && /^https?:\/\//i.test(targetRecord.checkoutUrl)) return targetRecord.checkoutUrl;
    if (targetRecord?.url && /^https?:\/\//i.test(targetRecord.url)) return targetRecord.url;
    if (targetRecord?.link && /^https?:\/\//i.test(targetRecord.link)) return targetRecord.link;
    if (metadata.webCheckoutUrl && /^https?:\/\//i.test(metadata.webCheckoutUrl)) return metadata.webCheckoutUrl;
    if (metadata.globalCheckoutUrl && /^https?:\/\//i.test(metadata.globalCheckoutUrl)) return metadata.globalCheckoutUrl;
    if (metadata.websiteURL) {
      const u = metadata.websiteURL.trim();
      return u.startsWith("http") ? u : `https://${u}`;
    }
    if (metadata.website) {
      const u = metadata.website.trim();
      return u.startsWith("http") ? u : `https://${u}`;
    }
    if (metadata.domain) {
      const u = metadata.domain.trim();
      return u.startsWith("http") ? u : `https://${u}`;
    }
    // Derive from company email if available (e.g. karachi@carrental.pro -> https://carrental.pro)
    const email = targetRecord?.location?.email || targetRecord?.useremail || targetRecord?.email;
    if (email && typeof email === "string" && email.includes("@")) {
      const domain = email.split("@")[1]?.trim();
      if (domain && !domain.includes("dummyjson") && !domain.includes("example") && !domain.includes("softtech")) {
        return `https://${domain}`;
      }
    }
    return "";
  };

  const handleViewOnCompany = () => {
    let url =
      singleProductUrl ||
      extractCompanyWebsite() ||
      metadata.websiteURL ||
      metadata.website ||
      metadata.domain;

    if (!url && companyName) {
      url = `https://www.google.com/search?q=${encodeURIComponent(companyName)}`;
    }

    if (url && typeof window !== "undefined") {
      const safeUrl = url.startsWith("http") ? url : `https://${url}`;
      const finalUrl = appendChatUrlToCheckout(safeUrl);
      window.open(finalUrl, "_blank", "noopener,noreferrer");
    }
  };

  const handleContinueBooking = () => {
    // 1. Check record-specific or metadata checkout URL
    let checkoutBase =
      targetRecord.checkoutUrl ||
      targetRecord.checkout_url ||
      targetRecord.bookingUrl ||
      targetRecord.booking_url ||
      metadata.webCheckoutUrl ||
      metadata.globalCheckoutUrl ||
      metadata.checkoutUrl ||
      "";

    // 2. Fallback to company website checkout endpoint
    if (!checkoutBase) {
      const companyBase = extractCompanyWebsite();
      if (companyBase) {
        checkoutBase = `${companyBase.replace(/\/$/, "")}/checkout`;
      }
    }

    if (checkoutBase) {
      const safeUrl = checkoutBase.startsWith("http") ? checkoutBase : `https://${checkoutBase}`;
      try {
        const parsed = new URL(safeUrl);
        parsed.searchParams.set("carId", String(targetRecord.id || ""));
        parsed.searchParams.set("days", String(rentalDays));
        parsed.searchParams.set("startDate", `2026-09-${selectedStartDay}`);
        parsed.searchParams.set("endDate", `2026-09-${effectiveEndDay}`);
        parsed.searchParams.set("insurance", selectedInsurance);
        parsed.searchParams.set("total", grandTotal.toFixed(2));
        window.open(
          appendChatUrlToCheckout(parsed.toString()),
          "_blank",
          "noopener,noreferrer",
        );
        return;
      } catch {
        window.open(
          appendChatUrlToCheckout(safeUrl),
          "_blank",
          "noopener,noreferrer",
        );
        return;
      }
    }

    // 3. If no checkout URL is configured by the company, open the product link or inform user
    if (singleProductUrl) {
      window.open(
        appendChatUrlToCheckout(singleProductUrl),
        "_blank",
        "noopener,noreferrer",
      );
      return;
    }

    alert(`Checkout URL is not configured for ${companyName}. Please configure webCheckoutUrl in company registration.`);
  };

  const handleAddToCart = () => {
    addItem(
      {
        id: targetRecord.id,
        title: mainTitle,
        price: rawPrice,
        image: activeImageUrl || undefined,
        tier: targetRecord.category,
        checkoutUrl:
          targetRecord.checkoutUrl ||
          targetRecord.checkout_url ||
          targetRecord.bookingUrl ||
          targetRecord.booking_url,
        productUrl: singleProductUrl,
      },
      quantity,
    );
    setAddedToCartToast(true);
    setTimeout(() => setAddedToCartToast(false), 4000);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    openCart();
  };

  // Back Button Label (dynamic and never forced to cars for products)
  const rawItemLabel = collection?.itemLabel || collection?.entity || "item";
  const itemLabelPlural = rawItemLabel.endsWith("s")
    ? rawItemLabel
    : `${rawItemLabel}s`;
  const backBtnText = isVehicle ? "Back to cars" : `Back to ${itemLabelPlural.toLowerCase()}`;

  // Vehicle Specifications
  const vehicleSpecs = [
    ...(targetRecord.fuel || targetRecord.fuelType
      ? [
          {
            label: "Fuel",
            value: String(targetRecord.fuel || targetRecord.fuelType),
            icon: "⛽",
          },
        ]
      : []),
    ...(targetRecord.transmission
      ? [
          {
            label: "Transmission",
            value: String(targetRecord.transmission),
            icon: "⚙️",
          },
        ]
      : []),
    ...(targetRecord.seats
      ? [
          {
            label: "Seats",
            value: `${targetRecord.seats} Seats`,
            icon: "👥",
          },
        ]
      : []),
    ...(targetRecord.year
      ? [
          {
            label: "Year",
            value: String(targetRecord.year),
            icon: "📅",
          },
        ]
      : []),
    ...(targetRecord.color
      ? [
          {
            label: "Color",
            value: String(targetRecord.color),
            icon: "🎨",
          },
        ]
      : []),
    ...(targetRecord.doors
      ? [
          {
            label: "Doors",
            value: `${targetRecord.doors} Doors`,
            icon: "🚪",
          },
        ]
      : []),
    ...(targetRecord.mileage
      ? [
          {
            label: "Mileage",
            value: `${Number(targetRecord.mileage).toLocaleString()} km`,
            icon: "🛣️",
          },
        ]
      : []),
    ...(targetRecord.licensePlate
      ? [
          {
            label: "License Plate",
            value: String(targetRecord.licensePlate),
            icon: "🚘",
          },
        ]
      : []),
  ];

  // E-Commerce Product Specifications
  const ecomSpecs = [
    ...(targetRecord.category
      ? [
          {
            label: "Category",
            value: String(targetRecord.category),
            icon: "🏷️",
          },
        ]
      : []),
    ...(targetRecord.brand
      ? [
          {
            label: "Brand",
            value: String(targetRecord.brand),
            icon: "🏢",
          },
        ]
      : []),
    ...(targetRecord.sku
      ? [
          {
            label: "SKU",
            value: String(targetRecord.sku),
            icon: "🔢",
          },
        ]
      : []),
    ...(targetRecord.stock !== undefined && targetRecord.stock !== null
      ? [
          {
            label: "Stock",
            value: `${targetRecord.stock} units`,
            icon: "📦",
          },
        ]
      : []),
    ...(targetRecord.dimensions && typeof targetRecord.dimensions === "object"
      ? [
          {
            label: "Dimensions",
            value: `${targetRecord.dimensions.width ?? "-"} × ${targetRecord.dimensions.height ?? "-"} × ${targetRecord.dimensions.depth ?? "-"} cm`,
            icon: "📐",
          },
        ]
      : []),
    ...(targetRecord.weight
      ? [
          {
            label: "Weight",
            value: `${targetRecord.weight} kg`,
            icon: "⚖️",
          },
        ]
      : []),
    ...(targetRecord.warrantyInformation
      ? [
          {
            label: "Warranty",
            value: String(targetRecord.warrantyInformation),
            icon: "🛡️",
          },
        ]
      : []),
    ...(targetRecord.shippingInformation
      ? [
          {
            label: "Shipping",
            value: String(targetRecord.shippingInformation),
            icon: "🚚",
          },
        ]
      : []),
    ...(targetRecord.returnPolicy
      ? [
          {
            label: "Return Policy",
            value: String(targetRecord.returnPolicy),
            icon: "🔄",
          },
        ]
      : []),
    ...(targetRecord.minimumOrderQuantity && targetRecord.minimumOrderQuantity > 1
      ? [
          {
            label: "Min Order",
            value: `${targetRecord.minimumOrderQuantity} items`,
            icon: "📋",
          },
        ]
      : []),
  ];

  const specsToRender = isVehicle ? vehicleSpecs : ecomSpecs;

  return (
    <div className={styles.container}>
      {/* Dynamic Back Navigation */}
      <button
        type="button"
        className={styles.backBtn}
        onClick={() => popSubView()}
        aria-label={backBtnText}
      >
        &larr; {backBtnText}
      </button>

      {/* Two Column Detail Layout */}
      <div className={styles.layoutTwoCol}>
        {/* Left Column: Hero, Gallery, Header Info, Specs, Features, About, Reviews */}
        <div className={styles.mainCol}>
          {/* Hero Banner with Dynamic Image or Fallback */}
          <div className={styles.heroBanner}>
            {hasValidImage ? (
              <img
                src={activeImageUrl}
                alt={`${mainTitle} ${variantTitle}`}
                className={styles.heroImage}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (!target.dataset.triedProxy) {
                    target.dataset.triedProxy = "true";
                    target.src = `https://softtech-ai.onrender.com/api/images/image-proxy?url=${encodeURIComponent(activeImageUrl)}`;
                  } else {
                    setImageFailed(true);
                  }
                }}
              />
            ) : isVehicle ? (
              <DetailSilhouetteIcon />
            ) : (
              <div className={styles.productPlaceholderBox}>
                <span className={styles.productPlaceholderIcon}>🛍️</span>
              </div>
            )}

            {/* Status / Availability Badge */}
            {targetRecord.availabilityStatus ? (
              <span className={styles.availableBadge}>
                {targetRecord.availabilityStatus}
              </span>
            ) : targetRecord.status ? (
              <span className={styles.availableBadge}>
                {String(targetRecord.status)}
              </span>
            ) : (
              <span className={styles.availableBadge}>Available</span>
            )}
          </div>

          {/* Multi-Image Gallery Thumbnails */}
          {allImages.length > 1 && (
            <div className={styles.galleryThumbnails}>
              {allImages.map((imgUrl, idx) => (
                <button
                  key={`thumb-${idx}`}
                  type="button"
                  className={`${styles.galleryThumbBtn} ${idx === activeImageIndex ? styles.galleryThumbBtnActive : ""}`}
                  onClick={() => setActiveImageIndex(idx)}
                  aria-label={`View image ${idx + 1}`}
                >
                  <img
                    src={imgUrl}
                    alt={`Thumbnail ${idx + 1}`}
                    className={styles.galleryThumbImg}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (!target.dataset.triedProxy) {
                        target.dataset.triedProxy = "true";
                        target.src = `https://softtech-ai.onrender.com/api/images/image-proxy?url=${encodeURIComponent(imgUrl)}`;
                      } else {
                        target.style.display = "none";
                      }
                    }}
                  />
                </button>
              ))}
            </div>
          )}

          {/* Title & Metadata Header */}
          <div className={styles.headerInfo}>
            <div className={styles.titleRow}>
              <h1 className={styles.carTitle}>{mainTitle}</h1>
              {variantTitle && (
                <span className={styles.carVariant}>{variantTitle}</span>
              )}
              {targetRecord.discountPercentage && (
                <span className={styles.discountBadge}>
                  {targetRecord.discountPercentage}% OFF
                </span>
              )}
            </div>

            {/* Sub-header: Location (for vehicle) or Category / Rating (for product) */}
            {isVehicle && (locationStr || targetRecord.year) && (
              <p className={styles.locationRow}>
                <span>📍</span>
                <span>
                  {locationStr}
                  {targetRecord.year ? ` • ${targetRecord.year}` : ""}
                </span>
              </p>
            )}

            {!isVehicle && targetRecord.rating && (
              <div className={styles.ratingRow}>
                <span className={styles.ratingStar}>★</span>
                <span className={styles.ratingNumber}>
                  {targetRecord.rating}
                </span>
                <span className={styles.reviewsCountText}>
                  ({reviewsList.length || targetRecord.totalReviews || 0} reviews)
                </span>
                {targetRecord.category && (
                  <span>• {targetRecord.category}</span>
                )}
              </div>
            )}
          </div>

          {/* Specifications Grid */}
          {specsToRender.length > 0 && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Specifications</h3>
              <div className={styles.specsGrid}>
                {specsToRender.map((s, idx) => (
                  <div key={`spec-${idx}`} className={styles.specBox}>
                    <span className={styles.specIcon}>{s.icon}</span>
                    <div className={styles.specContent}>
                      <span className={styles.specLabel}>{s.label}</span>
                      <span className={styles.specValue}>{s.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Features / Amenities / Tags Pills */}
          {featuresList.length > 0 && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>
                {isVehicle ? "Features" : "Tags & Highlights"}
              </h3>
              <div className={styles.featuresGrid}>
                {featuresList.map((f, idx) => (
                  <span key={`feat-${idx}`} className={styles.featurePill}>
                    <span className={styles.checkIcon}>✓</span>
                    <span>{f}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Description Section */}
          {aboutText && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>
                {isVehicle ? "About this vehicle" : "Product Description"}
              </h3>
              <p className={styles.aboutText}>{aboutText}</p>
            </div>
          )}

          {/* Vehicle Rates Tier Section (Only for vehicles with dailyRate) */}
          {isVehicle && dailyRate > 0 && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Pricing Rates</h3>
              <div className={styles.pricingGrid}>
                <div className={styles.pricingCard}>
                  <span className={styles.pricingLabel}>Daily rate</span>
                  <span className={styles.pricingValue}>
                    Rs. {dailyRate.toLocaleString()}
                  </span>
                </div>
                <div className={styles.pricingCard}>
                  <span className={styles.pricingLabel}>Weekly rate</span>
                  <span className={styles.pricingValue}>
                    Rs. {weeklyRate.toLocaleString()}
                  </span>
                </div>
                <div className={styles.pricingCard}>
                  <span className={styles.pricingLabel}>Monthly rate</span>
                  <span className={styles.pricingValue}>
                    Rs. {monthlyRate.toLocaleString()}
                  </span>
                </div>
              </div>
              {depositAmount > 0 && (
                <p className={styles.depositNote}>
                  Refundable security deposit: Rs. {depositAmount.toLocaleString()}
                </p>
              )}
            </div>
          )}

          {/* Customer Reviews Section */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>
              Customer Reviews ({reviewsList.length})
            </h3>
            {reviewsList.length > 0 ? (
              <div className={styles.reviewsList}>
                {reviewsList.map((rev: any, idx: number) => (
                  <div key={`rev-${idx}`} className={styles.reviewCard}>
                    <div className={styles.reviewHeader}>
                      <span className={styles.reviewerName}>
                        {rev.reviewerName || rev.name || rev.author || "Verified Customer"}
                      </span>
                      {rev.rating && (
                        <span className={styles.reviewStars}>
                          {"★".repeat(Math.min(5, Math.max(1, Math.round(Number(rev.rating)))))}
                        </span>
                      )}
                      {rev.date && (
                        <span className={styles.reviewDate}>
                          {new Date(rev.date).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      )}
                    </div>
                    {rev.comment && (
                      <p className={styles.reviewComment}>{rev.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.reviewsBox}>
                <p className={styles.emptyReviewText}>
                  No reviews yet — be the first to share your experience.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Dynamic Action Sidebar */}
        <div className={styles.sidebarCol}>
          {isVehicle ? (
            /* Vehicle Rental Booking Card */
            <div className={styles.bookingBox}>
              <div className={styles.bookingRateRow}>
                <h2 className={styles.bookingRatePrice}>
                  Rs. {dailyRate.toLocaleString()}
                </h2>
                <span className={styles.bookingRatePeriod}>per day</span>
              </div>

              {/* Interactive Calendar Date Picker */}
              <div className={styles.calendarCard}>
                <div className={styles.calendarMonthHeader}>
                  <button type="button" className={styles.calNavBtn} aria-label="Previous month">
                    &lt;
                  </button>
                  <span>September 2026</span>
                  <button type="button" className={styles.calNavBtn} aria-label="Next month">
                    &gt;
                  </button>
                </div>

                <div className={styles.calDaysHeader}>
                  <span>Su</span>
                  <span>Mo</span>
                  <span>Tu</span>
                  <span>We</span>
                  <span>Th</span>
                  <span>Fr</span>
                  <span>Sa</span>
                </div>

                <div className={styles.calDaysGrid}>
                  {/* Previous month padding days */}
                  <button type="button" className={`${styles.calDay} ${styles.calDayDimmed}`} disabled>
                    30
                  </button>
                  <button type="button" className={`${styles.calDay} ${styles.calDayDimmed}`} disabled>
                    31
                  </button>

                  {/* Interactive Month Days 1 to 28 */}
                  {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => {
                    const isSelected =
                      day === selectedStartDay ||
                      (selectedEndDay !== null && day === selectedEndDay);
                    const isInRange =
                      selectedEndDay !== null &&
                      day > selectedStartDay &&
                      day < selectedEndDay;

                    return (
                      <button
                        key={`cal-${day}`}
                        type="button"
                        className={`${styles.calDay} ${isSelected ? styles.calDaySelected : ""} ${isInRange ? styles.calDayInRange : ""}`}
                        onClick={() => handleDayClick(day)}
                        aria-label={`Select September ${day}`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>

                <p className={styles.calStatusNote}>
                  {rentalDays} {rentalDays === 1 ? "day" : "days"} selected (Sept{" "}
                  {selectedStartDay}
                  {selectedEndDay ? ` – ${selectedEndDay}` : ""})
                </p>
              </div>

              {/* Pickup Location */}
              <div className={styles.bookingField}>
                <label className={styles.fieldLabel}>Pickup location</label>
                <select
                  className={styles.selectInput}
                  value={pickupLocation}
                  onChange={(e) => setPickupLocation(e.target.value)}
                >
                  <option value="Karachi Airport Branch — Karachi">
                    Karachi Airport Branch — Karachi
                  </option>
                  <option value="Islamabad Blue Area Branch — Islamabad">
                    Islamabad Blue Area Branch — Islamabad
                  </option>
                  <option value="Lahore Gulberg Branch — Lahore">
                    Lahore Gulberg Branch — Lahore
                  </option>
                </select>
              </div>

              {/* Drop-off Location */}
              <div className={styles.bookingField}>
                <label className={styles.fieldLabel}>Drop-off location</label>
                <select
                  className={styles.selectInput}
                  value={dropoffLocation}
                  onChange={(e) => setDropoffLocation(e.target.value)}
                >
                  <option value="same">Same as pickup</option>
                  <option value="Karachi Airport Branch — Karachi">
                    Karachi Airport Branch — Karachi
                  </option>
                  <option value="Islamabad Blue Area Branch — Islamabad">
                    Islamabad Blue Area Branch — Islamabad
                  </option>
                  <option value="Lahore Gulberg Branch — Lahore">
                    Lahore Gulberg Branch — Lahore
                  </option>
                </select>
              </div>

              {/* Insurance Options */}
              <div className={styles.insuranceSection}>
                <label className={styles.fieldLabel}>🛡️ Insurance</label>

                {/* Basic */}
                <label
                  className={`${styles.insuranceOption} ${
                    selectedInsurance === "basic"
                      ? styles.insuranceOptionSelected
                      : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="insurance"
                    checked={selectedInsurance === "basic"}
                    onChange={() => setSelectedInsurance("basic")}
                    className={styles.insuranceRadio}
                  />
                  <div className={styles.insuranceContent}>
                    <div className={styles.insuranceTitleRow}>
                      <span className={styles.insuranceName}>Basic</span>
                      <span className={styles.insurancePrice}>Rs. 500/day</span>
                    </div>
                    <p className={styles.insuranceDesc}>
                      Third-party liability only
                    </p>
                  </div>
                </label>

                {/* Standard */}
                <label
                  className={`${styles.insuranceOption} ${
                    selectedInsurance === "standard"
                      ? styles.insuranceOptionSelected
                      : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="insurance"
                    checked={selectedInsurance === "standard"}
                    onChange={() => setSelectedInsurance("standard")}
                    className={styles.insuranceRadio}
                  />
                  <div className={styles.insuranceContent}>
                    <div className={styles.insuranceTitleRow}>
                      <span className={styles.insuranceName}>Standard</span>
                      <span className={styles.insurancePrice}>
                        Rs. 1,200/day
                      </span>
                    </div>
                    <p className={styles.insuranceDesc}>
                      Collision damage waiver + theft protection
                    </p>
                  </div>
                </label>

                {/* Premium */}
                <label
                  className={`${styles.insuranceOption} ${
                    selectedInsurance === "premium"
                      ? styles.insuranceOptionSelected
                      : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="insurance"
                    checked={selectedInsurance === "premium"}
                    onChange={() => setSelectedInsurance("premium")}
                    className={styles.insuranceRadio}
                  />
                  <div className={styles.insuranceContent}>
                    <div className={styles.insuranceTitleRow}>
                      <span className={styles.insuranceName}>Premium</span>
                      <span className={styles.insurancePrice}>
                        Rs. 2,500/day
                      </span>
                    </div>
                    <p className={styles.insuranceDesc}>
                      Full coverage with zero deductible
                    </p>
                  </div>
                </label>
              </div>

              {/* Price Calculation Breakdown */}
              <div className={styles.costBreakdown}>
                <div className={styles.costRow}>
                  <span>
                    Rs. {dailyRate.toLocaleString()} × {rentalDays}{" "}
                    {rentalDays === 1 ? "day" : "days"}
                  </span>
                  <span>Rs. {rentalTotal.toLocaleString()}</span>
                </div>
                <div className={styles.costRow}>
                  <span>
                    Insurance (
                    {selectedInsurance.charAt(0).toUpperCase() +
                      selectedInsurance.slice(1)}
                    )
                  </span>
                  <span>Rs. {insuranceTotal.toLocaleString()}</span>
                </div>
                {depositAmount > 0 && (
                  <div className={styles.costRow}>
                    <span>Security deposit</span>
                    <span>Rs. {depositAmount.toLocaleString()}</span>
                  </div>
                )}
                <div className={styles.costTotalRow}>
                  <span>Total</span>
                  <span>Rs. {grandTotal.toLocaleString()}</span>
                </div>
              </div>

              {/* Primary Action Button */}
              <div className={styles.buttonGroup}>
                <button
                  type="button"
                  className={styles.continueBookingBtn}
                  onClick={handleContinueBooking}
                >
                  Continue to booking
                </button>

                {/* Secondary Action Button: View on {companyName} */}
                <button
                  type="button"
                  className={styles.viewOnCompanyBtn}
                  onClick={handleViewOnCompany}
                >
                  <span>↗</span>
                  <span>View on {companyName}</span>
                </button>
              </div>

              <p className={styles.bookingNote}>
                You won't be charged yet — review and pay on the next step.
              </p>
            </div>
          ) : (
            /* E-Commerce Product Purchase Card */
            <div className={styles.bookingBox}>
              <div className={styles.bookingRateRow}>
                <h2 className={styles.bookingRatePrice}>
                  ${Number(rawPrice).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </h2>
              </div>

              {/* Availability Status */}
              <div>
                {targetRecord.stock !== undefined && targetRecord.stock > 0 ? (
                  <span className={styles.stockBadgeInStock}>
                    In Stock ({targetRecord.stock} available)
                  </span>
                ) : targetRecord.stock === 0 ? (
                  <span className={styles.stockBadgeOutOfStock}>
                    Out of Stock
                  </span>
                ) : (
                  <span className={styles.stockBadgeInStock}>
                    {targetRecord.availabilityStatus || "Available"}
                  </span>
                )}
              </div>

              {/* Quantity Stepper */}
              <div className={styles.qtySection}>
                <label className={styles.fieldLabel}>Quantity</label>
                <div className={styles.qtyRow}>
                  <button
                    type="button"
                    className={styles.qtyBtn}
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>
                  <span className={styles.qtyDisplay}>{quantity}</span>
                  <button
                    type="button"
                    className={styles.qtyBtn}
                    onClick={() => setQuantity((q) => Math.min(maxStock, q + 1))}
                    disabled={quantity >= maxStock}
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Added to Cart Feedback Toast */}
              {addedToCartToast && (
                <div className={styles.toastNotice}>
                  <span>✓ Added to cart ({quantity}x)</span>
                  <button
                    type="button"
                    className={styles.toastViewCartBtn}
                    onClick={openCart}
                  >
                    View Cart &rarr;
                  </button>
                </div>
              )}

              {/* Buttons Group */}
              <div className={styles.buttonGroup}>
                <button
                  type="button"
                  className={styles.addToCartBtn}
                  onClick={handleAddToCart}
                >
                  <span>🛒</span>
                  <span>Add to Cart</span>
                </button>

                <button
                  type="button"
                  className={styles.buyNowBtn}
                  onClick={handleBuyNow}
                >
                  <span>⚡</span>
                  <span>Buy Now</span>
                </button>

                {/* View on {companyName} button */}
                <button
                  type="button"
                  className={styles.viewOnCompanyBtn}
                  onClick={handleViewOnCompany}
                >
                  <span>↗</span>
                  <span>View on {companyName}</span>
                </button>
              </div>

              {/* Trust Badges */}
              <div className={styles.trustBadgesRow}>
                {targetRecord.shippingInformation && (
                  <div className={styles.trustBadge}>
                    <span className={styles.trustIcon}>🚚</span>
                    <span>{targetRecord.shippingInformation}</span>
                  </div>
                )}
                {targetRecord.returnPolicy && (
                  <div className={styles.trustBadge}>
                    <span className={styles.trustIcon}>🔄</span>
                    <span>{targetRecord.returnPolicy}</span>
                  </div>
                )}
                {targetRecord.warrantyInformation && (
                  <div className={styles.trustBadge}>
                    <span className={styles.trustIcon}>🛡️</span>
                    <span>{targetRecord.warrantyInformation}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
