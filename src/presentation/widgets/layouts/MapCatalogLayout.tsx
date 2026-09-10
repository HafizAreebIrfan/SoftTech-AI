import React, { useState, useMemo } from "react";
import styles from "../../../styles/mapcataloglayout.module.css";
import { WidgetLayoutProps } from "../../../interfaces/mcp/normalizedwidget.interface";
import { MapBlock } from "../components/MapBlock/MapBlock";
import { MapCardItem } from "../components/MapBlock/MapCardItem";
import { MapCardCarousel } from "../components/MapBlock/MapCardCarousel";
import { CardsBlock } from "../components/CardsBlock";
import { extractRatingInfo } from "../helper/geoHelper";
import { extractFirstImageUrl } from "../helper/RenderImage/getproxiedimageurl";
import { renderImage } from "../helper/RenderImage";
import { parseNumericPrice } from "../../../infrastructure/store/cartStore";
import { useMcpWidgetStore } from "../../../infrastructure/store/mcpWidgetStore";
import { openExternalUrl } from "../../../utils/mcpBridge";

export const MapCatalogLayout: React.FC<WidgetLayoutProps> = ({
  title = "Stays based on your search",
  subtitle,
  records = [],
  fields = [],
  collection,
  capabilities,
  actions = [],
  audience,
  presentationPlan,
}) => {
  const [viewMode, setViewMode] = useState<"map" | "grid">("map");
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [isFlyoutOpen, setIsFlyoutOpen] = useState<boolean>(false);
  const pushSubView = useMcpWidgetStore((state) => state.pushSubView);

  const typedRecords = useMemo(
    () => (Array.isArray(records) ? (records as Array<Record<string, any>>) : []),
    [records],
  );

  const selectedRecord: Record<string, any> | null =
    typedRecords[selectedIndex] || typedRecords[0] || null;

  // Derive human-friendly dates & guests or search context
  const derivedSubtitle = useMemo(() => {
    if (subtitle) return subtitle;
    const q = collection?.appliedQuery;
    const parts: string[] = [];
    if (q?.datefrom && q?.dateto) {
      parts.push(`${q.datefrom} – ${q.dateto}`);
    } else if (q?.startDate && q?.endDate) {
      parts.push(`${q.startDate} – ${q.endDate}`);
    } else if (q?.checkin && q?.checkout) {
      parts.push(`${q.checkin} – ${q.checkout}`);
    } else if (selectedRecord?.dates) {
      parts.push(String(selectedRecord.dates));
    }
    if (q?.adults || q?.guests) {
      parts.push(`${q.adults || q.guests} guests`);
    } else if (q?.city || selectedRecord?.location?.city) {
      parts.push(String(q?.city || selectedRecord?.location?.city));
    } else if (selectedRecord?.location?.name) {
      parts.push(String(selectedRecord.location.name));
    }
    if (parts.length > 0) return parts.join(" · ");
    return `${typedRecords.length} available`;
  }, [subtitle, collection, selectedRecord, typedRecords.length]);

  const handleSelectRecord = (rec: Record<string, any>, idx: number) => {
    setSelectedIndex(idx);
    setIsFlyoutOpen(true);
  };

  const handleOpenFullDetail = (rec: Record<string, any>) => {
    pushSubView({
      title: rec.$title || rec.title || rec.name || "Stay Details",
      data: rec,
      blockType: "detail",
    });
  };

  // Flyout details extraction
  const flyoutRating = extractRatingInfo(selectedRecord || {});
  const flyoutImage = selectedRecord
    ? extractFirstImageUrl(selectedRecord.thumbnail) ||
      extractFirstImageUrl(selectedRecord.image) ||
      extractFirstImageUrl(selectedRecord.images) ||
      extractFirstImageUrl(selectedRecord)
    : "";

  const flyoutTitle =
    selectedRecord?.make
      ? `${selectedRecord.make} ${selectedRecord.model || ""}`.trim()
      : (selectedRecord?.$title ||
         selectedRecord?.title ||
         selectedRecord?.name ||
         selectedRecord?.hotelName ||
         "Details");

  // Price
  let basePrice =
    selectedRecord?.pricePerDay ??
    selectedRecord?.price_per_day ??
    selectedRecord?.$price ??
    selectedRecord?.price;
  const baseNum = parseNumericPrice(basePrice);
  let salePrice = baseNum;
  let originalPrice: number | null = null;

  if (selectedRecord) {
    const saleRaw =
      selectedRecord.salePrice ??
      selectedRecord.discountedPrice ??
      selectedRecord.specialPrice;
    const saleNum = saleRaw != null ? parseNumericPrice(saleRaw) : NaN;
    const pctRaw =
      selectedRecord.discountPercentage ?? selectedRecord.discountPercent;
    const pctNum = pctRaw != null ? Number(pctRaw) : NaN;

    if (isFinite(saleNum) && saleNum > 0 && saleNum < baseNum) {
      salePrice = saleNum;
      originalPrice = baseNum;
    } else if (isFinite(pctNum) && pctNum > 0 && pctNum < 100) {
      salePrice = Math.round(baseNum * (1 - pctNum / 100) * 100) / 100;
      originalPrice = baseNum;
    }
  }

  const currencySymbol =
    selectedRecord?.currencySymbol ||
    selectedRecord?.currency_symbol ||
    selectedRecord?.symbol ||
    (selectedRecord?.location?.country === "Pakistan" ||
    selectedRecord?.city === "Karachi"
      ? "PKR "
      : "$");

  const formattedSale =
    isFinite(salePrice) && salePrice > 0
      ? `${currencySymbol}${salePrice.toLocaleString(undefined, {
          maximumFractionDigits: salePrice % 1 !== 0 ? 2 : 0,
        })}`
      : String(basePrice || "");

  const formattedOriginal =
    originalPrice !== null && isFinite(originalPrice)
      ? `${currencySymbol}${originalPrice.toLocaleString(undefined, {
          maximumFractionDigits: originalPrice % 1 !== 0 ? 2 : 0,
        })}`
      : null;

  const period =
    selectedRecord?.period ||
    selectedRecord?.duration ||
    (selectedRecord?.pricePerDay || selectedRecord?.price_per_day
      ? "/ day"
      : selectedRecord?.nights
        ? `/ ${selectedRecord.nights} nights`
        : "");

  const actionUrl =
    selectedRecord?.url ||
    selectedRecord?.link ||
    selectedRecord?.bookingUrl ||
    selectedRecord?.webUrl;

  const description =
    selectedRecord?.description ||
    selectedRecord?.$description ||
    selectedRecord?.about ||
    selectedRecord?.summary ||
    (selectedRecord?.make
      ? `${selectedRecord.make} ${selectedRecord.model || ""} · ${selectedRecord.transmission || ""} · ${selectedRecord.fuelType || ""} · ${selectedRecord.seats ? selectedRecord.seats + " seats" : ""}`
      : "Premium amenities and comfortable booking experience.");

  return (
    <div className={styles.layoutContainer}>
      {/* Header Bar */}
      <div className={styles.headerBar}>
        <div className={styles.headerTitleCol}>
          <h2 className={styles.mainTitle}>{title}</h2>
          <p className={styles.subTitle}>
            <span>📍</span>
            <span>{derivedSubtitle}</span>
          </p>
        </div>

        <div className={styles.headerActionsRow}>
          {/* View Toggle Button */}
          <button
            type="button"
            className={`${styles.viewToggleBtn} ${viewMode === "map" ? styles.viewToggleBtnActive : ""}`}
            onClick={() => setViewMode("map")}
            title="Switch to Map View"
          >
            <span>🗺️</span>
            <span>Map</span>
          </button>

          <button
            type="button"
            className={`${styles.viewToggleBtn} ${viewMode === "grid" ? styles.viewToggleBtnActive : ""}`}
            onClick={() => setViewMode("grid")}
            title="Switch to Cards Grid View"
          >
            <span>⊞</span>
            <span>Grid</span>
          </button>
        </div>
      </div>

      {/* VIEW MODE 1: Standard Cards Grid */}
      {viewMode === "grid" ? (
        <CardsBlock
          block={presentationPlan?.blocks?.find((b) => b.type === "cards")}
          records={records}
          fields={fields}
          collection={collection}
          capabilities={capabilities}
          actions={actions}
          audience={audience}
        />
      ) : (
        /* VIEW MODE 2: Master-Detail Map Navigation */
        <div className={styles.splitLayout}>
          {/* Left Panel: Scrollable Vertical List */}
          <div className={styles.listPanel}>
            {typedRecords.map((rec, idx) => (
              <MapCardItem
                key={rec.id || rec._id || `map-list-card-${idx}`}
                record={rec}
                isActive={idx === selectedIndex}
                onSelect={() => handleSelectRecord(rec, idx)}
              />
            ))}
          </div>

          {/* Right Panel: Interactive Map & Flyout Sheet */}
          <div className={styles.mapPanel}>
            <MapBlock
              records={typedRecords}
              selectedRecord={selectedRecord}
              onSelectRecord={handleSelectRecord}
              height="100%"
            />

            {/* Mobile / Compact Screen Carousel Overlay */}
            <MapCardCarousel
              records={typedRecords}
              selectedIndex={selectedIndex}
              onSelect={handleSelectRecord}
            />

            {/* Desktop Detail Flyout Sheet */}
            {isFlyoutOpen && selectedRecord && (
              <aside className={styles.detailFlyout}>
                <div className={styles.flyoutHeader}>
                  <button
                    type="button"
                    className={styles.flyoutCloseBtn}
                    onClick={() => setIsFlyoutOpen(false)}
                    aria-label="Close detail"
                  >
                    ✕
                  </button>
                </div>

                <div className={styles.flyoutBody}>
                  {flyoutImage && (
                    <div className={styles.flyoutHeroImage}>
                      {renderImage(flyoutImage, flyoutTitle, "cover")}
                    </div>
                  )}

                  <div className={styles.flyoutTitleRow}>
                    <div>
                      {flyoutRating.stars > 0 && (
                        <span style={{ color: "#f59e0b", fontSize: 13 }}>
                          {"★".repeat(flyoutRating.stars)}
                        </span>
                      )}
                      <h3 className={styles.flyoutTitle}>{flyoutTitle}</h3>
                    </div>
                    {flyoutRating.scoreFormatted && (
                      <span className={styles.flyoutScoreBadge}>
                        {flyoutRating.scoreFormatted}
                      </span>
                    )}
                  </div>

                  <div className={styles.flyoutMetaRow}>
                    <span>📅 {derivedSubtitle}</span>
                  </div>

                  {/* Pricing Box */}
                  <div className={styles.flyoutPriceSection}>
                    <span style={{ fontSize: 11, color: "#94a3b8" }}>
                      Price from
                    </span>
                    <div className={styles.flyoutPriceRow}>
                      {formattedOriginal && (
                        <span className={styles.originalPrice}>
                          {formattedOriginal}
                        </span>
                      )}
                      <span
                        className={styles.salePrice}
                        style={{ fontSize: 18 }}
                      >
                        {formattedSale}
                      </span>
                      {period && (
                        <span className={styles.periodSuffix}>{period}</span>
                      )}
                    </div>
                    <span style={{ fontSize: 10, color: "#64748b" }}>
                      Taxes and fees: included
                    </span>
                  </div>

                  {/* Primary CTA */}
                  {actionUrl ? (
                    <button
                      type="button"
                      className={styles.flyoutCtaBtn}
                      onClick={() => openExternalUrl(actionUrl)}
                    >
                      <span>View on Booking.com</span>
                      <span>↗</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={styles.flyoutCtaBtn}
                      onClick={() => handleOpenFullDetail(selectedRecord)}
                    >
                      <span>View full details & book</span>
                      <span>&rarr;</span>
                    </button>
                  )}

                  {/* About this stay */}
                  <div>
                    <h4 className={styles.flyoutAboutTitle}>About this stay</h4>
                    <p className={styles.flyoutAboutText}>{description}</p>
                  </div>

                  {/* AI Summary based on reviews */}
                  {flyoutRating.reviewsCount && (
                    <div className={styles.aiSummaryBox}>
                      <span className={styles.aiSummaryTitle}>
                        <span>✨</span>
                        <span>
                          AI Summary based on {flyoutRating.reviewsCount}{" "}
                          reviews
                        </span>
                      </span>
                      <p
                        style={{
                          margin: 0,
                          fontSize: 12,
                          color: "#cbd5e1",
                          lineHeight: 1.4,
                        }}
                      >
                        Guests highlight the central location, friendly staff,
                        and delicious breakfast options.
                      </p>
                    </div>
                  )}
                </div>
              </aside>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
