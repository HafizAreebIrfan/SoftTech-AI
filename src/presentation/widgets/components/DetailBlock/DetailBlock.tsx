import React, { useState, useEffect, useMemo } from "react";
import styles from "../../../../styles/detailblock.module.css";
import type { DetailBlockProps } from "../../../../interfaces/mcp/detailblock.interface";
import { useMcpWidgetStore } from "../../../../infrastructure/store/mcpWidgetStore";
import { requestDisplayMode } from "../../../../utils/mcpBridge";

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
  actions = [],
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

  // Booking Card State
  const [selectedInsurance, setSelectedInsurance] = useState<"basic" | "standard" | "premium">("basic");
  const [selectedStartDay, setSelectedStartDay] = useState<number>(7);
  const [selectedEndDay, setSelectedEndDay] = useState<number>(9);
  const [pickupLocation, setPickupLocation] = useState<string>("Islamabad Blue Area Branch — Islamabad");
  const [dropoffLocation, setDropoffLocation] = useState<string>("same");

  if (!targetRecord) {
    return (
      <div className={styles.container}>
        <button type="button" className={styles.backBtn} onClick={() => popSubView()}>
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
  const mainTitle =
    targetRecord.make ||
    targetRecord.$title ||
    targetRecord.title ||
    targetRecord.name ||
    "Vehicle Details";

  const variantTitle =
    targetRecord.model ||
    targetRecord.variant ||
    targetRecord.subtitle ||
    "GLS";

  const yearStr = targetRecord.year ? String(targetRecord.year) : "2024";

  const locationStr =
    targetRecord.location?.name ||
    targetRecord.location?.city ||
    targetRecord.locationName ||
    targetRecord.city ||
    "Islamabad Blue Area Branch, Islamabad";

  // Daily Rate
  const dailyRate = Number(
    targetRecord.dailyRate ??
      targetRecord.pricePerDay ??
      targetRecord.price_per_day ??
      targetRecord.$price ??
      targetRecord.price ??
      18000,
  );

  const weeklyRate = Number(targetRecord.weeklyRate ?? dailyRate * 6);
  const monthlyRate = Number(targetRecord.monthlyRate ?? dailyRate * 23);
  const depositAmount = Number(targetRecord.securityDeposit ?? 30000);

  // Specifications
  const specs = [
    {
      label: "Fuel",
      value: String(targetRecord.fuel || targetRecord.fuelType || "Petrol"),
      icon: "⛽",
    },
    {
      label: "Transmission",
      value: String(targetRecord.transmission || "Automatic"),
      icon: "⚙️",
    },
    {
      label: "Seats",
      value: `${targetRecord.seats || 5} Seats`,
      icon: "👥",
    },
    {
      label: "Year",
      value: yearStr,
      icon: "📅",
    },
    {
      label: "Color",
      value: String(targetRecord.color || "Blue"),
      icon: "🎨",
    },
    {
      label: "Doors",
      value: `${targetRecord.doors || 5} Doors`,
      icon: "🚪",
    },
  ];

  // Features / Amenities
  const rawFeatures = targetRecord.features || targetRecord.amenities || [
    "Air Conditioning",
    "Navigation",
    "Blind Spot Monitor",
    "Heated Seats",
  ];
  const featuresList = Array.isArray(rawFeatures) ? rawFeatures : [String(rawFeatures)];

  // Description
  const aboutText =
    targetRecord.description ||
    targetRecord.about ||
    "Comfortable SUV with advanced safety features.";

  // Image
  const imageUrl =
    targetRecord.images?.[0] ||
    targetRecord.image ||
    targetRecord.thumbnail ||
    targetRecord.$image ||
    "";
  const hasValidImage =
    typeof imageUrl === "string" && /^https?:\/\//i.test(imageUrl.trim());

  // Date calculation
  const rentalDays = Math.max(1, selectedEndDay - selectedStartDay);
  const insuranceRate =
    selectedInsurance === "premium"
      ? 2500
      : selectedInsurance === "standard"
        ? 1200
        : 500;
  const insuranceTotal = insuranceRate * rentalDays;
  const rentalTotal = dailyRate * rentalDays;
  const grandTotal = rentalTotal + insuranceTotal + depositAmount;

  const handleContinueBooking = () => {
    const bookingUrl = targetRecord.url || targetRecord.link || targetRecord.checkoutUrl;
    if (bookingUrl && typeof window !== "undefined") {
      window.open(bookingUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className={styles.container}>
      {/* Back to catalog navigation */}
      <button type="button" className={styles.backBtn} onClick={() => popSubView()}>
        &larr; Back to cars
      </button>

      {/* Two Column Layout (Image 2) */}
      <div className={styles.layoutTwoCol}>
        {/* Left Column: Hero, Specs, Features, About, Pricing, Reviews */}
        <div className={styles.mainCol}>
          {/* Hero Banner */}
          <div className={styles.heroBanner}>
            {hasValidImage ? (
              <img
                src={imageUrl}
                alt={`${mainTitle} ${variantTitle}`}
                className={styles.heroImage}
              />
            ) : (
              <DetailSilhouetteIcon />
            )}
            <span className={styles.availableBadge}>Available</span>
          </div>

          {/* Title & Location */}
          <div className={styles.headerInfo}>
            <div className={styles.titleRow}>
              <h1 className={styles.carTitle}>{mainTitle}</h1>
              {variantTitle && <span className={styles.carVariant}>{variantTitle}</span>}
            </div>
            <p className={styles.locationRow}>
              <span>📍</span>
              <span>
                {locationStr} • {yearStr}
              </span>
            </p>
          </div>

          {/* Specifications (2x3 Grid) */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Specifications</h3>
            <div className={styles.specsGrid}>
              {specs.map((s, idx) => (
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

          {/* Features Checkmarks */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Features</h3>
            <div className={styles.featuresGrid}>
              {featuresList.map((f, idx) => (
                <span key={`feat-${idx}`} className={styles.featurePill}>
                  <span className={styles.checkIcon}>✓</span>
                  <span>{f}</span>
                </span>
              ))}
            </div>
          </div>

          {/* About this car */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>About this car</h3>
            <p className={styles.aboutText}>{aboutText}</p>
          </div>

          {/* Tiered Pricing Rates */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Pricing</h3>
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
            <p className={styles.depositNote}>
              Refundable security deposit: Rs. {depositAmount.toLocaleString()}
            </p>
          </div>

          {/* Reviews Section */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Reviews</h3>
            <div className={styles.reviewsBox}>
              <p className={styles.emptyReviewText}>
                No reviews yet — be the first to rent this car.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Sticky Booking Card */}
        <div className={styles.sidebarCol}>
          <div className={styles.bookingBox}>
            {/* Top Daily Rate */}
            <div className={styles.bookingRateRow}>
              <h2 className={styles.bookingRatePrice}>
                Rs. {dailyRate.toLocaleString()}
              </h2>
              <span className={styles.bookingRatePeriod}>per day</span>
            </div>

            {/* Calendar Mini-Widget */}
            <div className={styles.calendarCard}>
              <div className={styles.calendarMonthHeader}>
                <button type="button" className={styles.calNavBtn}>
                  &lt;
                </button>
                <span>September 2026</span>
                <button type="button" className={styles.calNavBtn}>
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
                <button type="button" className={`${styles.calDay} ${styles.calDayDimmed}`}>30</button>
                <button type="button" className={`${styles.calDay} ${styles.calDayDimmed}`}>31</button>
                <button type="button" className={styles.calDay}>1</button>
                <button type="button" className={styles.calDay}>2</button>
                <button type="button" className={styles.calDay}>3</button>
                <button type="button" className={styles.calDay}>4</button>
                <button type="button" className={styles.calDay}>5</button>
                <button type="button" className={styles.calDay}>6</button>

                {/* Selected Range: 7 to 9 */}
                <button
                  type="button"
                  className={`${styles.calDay} ${selectedStartDay === 7 ? styles.calDaySelected : ""}`}
                  onClick={() => setSelectedStartDay(7)}
                >
                  7
                </button>
                <button
                  type="button"
                  className={`${styles.calDay} ${styles.calDaySelected}`}
                >
                  8
                </button>
                <button
                  type="button"
                  className={`${styles.calDay} ${selectedEndDay === 9 ? styles.calDaySelected : ""}`}
                  onClick={() => setSelectedEndDay(9)}
                >
                  9
                </button>

                <button type="button" className={styles.calDay}>10</button>
                <button type="button" className={styles.calDay}>11</button>
                <button type="button" className={styles.calDay}>12</button>
                <button type="button" className={styles.calDay}>13</button>
                <button type="button" className={styles.calDay}>14</button>
                <button type="button" className={styles.calDay}>15</button>
                <button type="button" className={styles.calDay}>16</button>
                <button type="button" className={styles.calDay}>17</button>
                <button type="button" className={styles.calDay}>18</button>
                <button type="button" className={styles.calDay}>19</button>
              </div>

              <p className={styles.calStatusNote}>
                {rentalDays} {rentalDays === 1 ? "day" : "days"} selected (Sept {selectedStartDay} – {selectedEndDay})
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
                <option value="Islamabad Blue Area Branch — Islamabad">
                  Islamabad Blue Area Branch — Islamabad
                </option>
                <option value="Karachi Airport Branch — Karachi">
                  Karachi Airport Branch — Karachi
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
                  selectedInsurance === "basic" ? styles.insuranceOptionSelected : ""
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
                  <p className={styles.insuranceDesc}>Third-party liability only</p>
                </div>
              </label>

              {/* Standard */}
              <label
                className={`${styles.insuranceOption} ${
                  selectedInsurance === "standard" ? styles.insuranceOptionSelected : ""
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
                    <span className={styles.insurancePrice}>Rs. 1,200/day</span>
                  </div>
                  <p className={styles.insuranceDesc}>Collision damage waiver + theft protection</p>
                </div>
              </label>

              {/* Premium */}
              <label
                className={`${styles.insuranceOption} ${
                  selectedInsurance === "premium" ? styles.insuranceOptionSelected : ""
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
                    <span className={styles.insurancePrice}>Rs. 2,500/day</span>
                  </div>
                  <p className={styles.insuranceDesc}>Full coverage with zero deductible</p>
                </div>
              </label>
            </div>

            {/* Cost Breakdown */}
            <div className={styles.costBreakdown}>
              <div className={styles.costRow}>
                <span>
                  Rs. {dailyRate.toLocaleString()} × {rentalDays} {rentalDays === 1 ? "day" : "days"}
                </span>
                <span>Rs. {rentalTotal.toLocaleString()}</span>
              </div>
              <div className={styles.costRow}>
                <span>Insurance ({selectedInsurance.charAt(0).toUpperCase() + selectedInsurance.slice(1)})</span>
                <span>Rs. {insuranceTotal.toLocaleString()}</span>
              </div>
              <div className={styles.costRow}>
                <span>Security deposit</span>
                <span>Rs. {depositAmount.toLocaleString()}</span>
              </div>
              <div className={styles.costTotalRow}>
                <span>Total</span>
                <span>Rs. {grandTotal.toLocaleString()}</span>
              </div>
            </div>

            {/* CTA Button */}
            <button
              type="button"
              className={styles.continueBookingBtn}
              onClick={handleContinueBooking}
            >
              Continue to booking
            </button>

            <p className={styles.bookingNote}>
              You won't be charged yet — review and pay on the next step.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
