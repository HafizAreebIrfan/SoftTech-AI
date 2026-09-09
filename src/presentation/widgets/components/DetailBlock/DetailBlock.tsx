import React, { useState, useEffect, useMemo, useCallback } from "react";
import styles from "../../../../styles/detailblock.module.css";
import type { DetailBlockProps } from "../../../../interfaces/mcp/detailblock.interface";
import type { FieldSchema } from "../../../../domain/entities/GenericWidget";
import { useMcpWidgetStore } from "../../../../infrastructure/store/mcpWidgetStore";
import {
  requestDisplayMode,
  openExternalUrl,
  interpolateTemplate,
  callMcpTool,
} from "../../../../utils/mcpBridge";
import { extractAllImageUrls } from "../../helper/RenderImage/getproxiedimageurl";
import { renderImage } from "../../helper/RenderImage";
import { appendChatUrlToCheckout } from "../../../../utils/checkoutHelper";
import {
  useCartStore,
  findCartAction,
  parseNumericPrice,
} from "../../../../infrastructure/store/cartStore";
import { addToCartAndSync } from "../../../../utils/cartFlow";
import { getValue } from "../../../../utils";

/* ------------------------------------------------------------------ *
 * Generic field-role detection. Everything below keys off field
 * `type`/`uiRole`, `$`-meta fields, value shape, and key-name *patterns*
 * (never off entity/industry/company names), so the detail screen renders
 * for any company's records — products, packages, listings, vehicles, etc.
 * ------------------------------------------------------------------ */
const TITLE_KEY_RE = /^\$?(title|name|label|heading)$/i;
const SUBTITLE_KEY_RE = /^\$?(subtitle|tagline|variant)$/i;
const PRICE_KEY_RE = /(price|rate|cost|amount|fee|fare|premium|charge|subtotal|total)/i;
const IMAGE_KEY_RE =
  /(image|img|photo|thumbnail|thumb|picture|avatar|logo|icon|banner|gallery|media)/i;
const DESCRIPTION_KEY_RE =
  /^\$?(description|about|summary|overview|details|bio|content|body)$/i;
const RATING_KEY_RE = /^(rating|stars|score|avgrating|averagerating)$/i;
const REVIEWS_KEY_RE = /(reviews?|ratings?|feedback|testimonials?)/i;
const FEATURES_KEY_RE =
  /^(features?|amenities|tags|highlights|includes|perks|benefits)$/i;
const OPTION_EXCLUDE_RE =
  /(feature|amenit|tag|highlight|include|perk|benefit|image|img|photo|thumbnail|picture|gallery|media|review|rating|comment|spec)/i;
const STATUS_KEY_RE = /^(availabilitystatus|availability|status|state)$/i;

const isScalar = (v: unknown): v is string | number | boolean =>
  typeof v === "string" || typeof v === "number" || typeof v === "boolean";

const looksLikeId = (k: string): boolean =>
  /^(id|_id|__v|uuid|guid|slug)$/i.test(k) || /(^|_)ids?$|Ids?$/.test(k);

/** camelCase / snake_case / $prefixed → "Title Case". */
const humanizeKey = (key: string): string =>
  key
    .replace(/^\$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());

/** Period suffix inferred from a rate key's shape (generic param-shape read). */
const derivePricePeriod = (key: string): string => {
  const k = key.toLowerCase();
  if (/(daily|per_?day|\bday\b)/.test(k)) return "per day";
  if (/(nightly|per_?night|\bnight\b)/.test(k)) return "per night";
  if (/(hourly|per_?hour|\bhour\b)/.test(k)) return "per hour";
  if (/(weekly|per_?week|\bweek\b)/.test(k)) return "per week";
  if (/(monthly|per_?month|\bmonth\b)/.test(k)) return "per month";
  if (/(yearly|annual|per_?year|\byear\b)/.test(k)) return "per year";
  return "";
};

/**
 * Format a price using the record's OWN currency info — never a hardcoded
 * symbol. Precedence: an already-formatted string → currency code
 * (Intl) → currency symbol prefix → bare localized number.
 */
const formatPrice = (value: unknown, record: Record<string, any>): string => {
  if (value === null || value === undefined || value === "") return "";
  if (typeof value === "string" && /[^\d.,\s-]/.test(value)) return value.trim();

  const num = parseNumericPrice(value);
  const code = record.currency || record.currencyCode || record.priceCurrency;
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
  const symbol = record.currencySymbol || record.symbol;
  const formatted = num.toLocaleString(undefined, { maximumFractionDigits: 2 });
  return typeof symbol === "string" && symbol.trim()
    ? `${symbol.trim()}${formatted}`
    : formatted;
};

export const DetailBlock: React.FC<DetailBlockProps> = ({
  records = [],
  fields = [],
  collection,
  actions = [],
  onBack,
}) => {
  const popSubView = useMcpWidgetStore((state) => state.popSubView);
  const openCart = useCartStore((state) => state.openCart);

  const targetRecord = useMemo<Record<string, any> | null>(() => {
    if (records.length > 0 && records[0] && typeof records[0] === "object") {
      return records[0] as Record<string, any>;
    }
    return null;
  }, [records]);

  // Fullscreen while a detail is open; restore inline when it closes.
  useEffect(() => {
    requestDisplayMode("fullscreen");
    return () => {
      requestDisplayMode("inline");
    };
  }, []);

  // Registration-driven checkout/catalog URLs (emitted by the backend only
  // when the company registered them). Read case-tolerantly from metadata.
  const metadata = useMemo<Record<string, any>>(() => {
    if (typeof window === "undefined") return {};
    return (
      (window as any).__WIDGET_METADATA__ ||
      (window as any).__WIDGET_DATA__?.metadata ||
      {}
    );
  }, []);
  const companyName = metadata.companyName || collection?.entity || "store";

  const fieldMap = useMemo(() => {
    const m = new Map<string, FieldSchema>();
    for (const f of fields) {
      if (f?.key) m.set(f.key, f);
    }
    return m;
  }, [fields]);

  /* -------------------------- Title / subtitle -------------------------- */
  const { title, subtitle } = useMemo(() => {
    if (!targetRecord) return { title: "", subtitle: "" };

    let t = "";
    const titleField = fields.find((f) => f.uiRole === "title" || f.primary);
    if (titleField) {
      t = String(getValue(targetRecord, titleField.path || titleField.key) ?? "");
    }
    if (!t) {
      for (const [k, v] of Object.entries(targetRecord)) {
        if (TITLE_KEY_RE.test(k) && isScalar(v) && String(v).trim()) {
          t = String(v);
          break;
        }
      }
    }
    if (!t) t = String(collection?.itemLabel || collection?.entity || "Details");

    let s = "";
    const subField = fields.find((f) => f.uiRole === "subtitle");
    if (subField) {
      s = String(getValue(targetRecord, subField.path || subField.key) ?? "");
    }
    if (!s) {
      for (const [k, v] of Object.entries(targetRecord)) {
        if (
          SUBTITLE_KEY_RE.test(k) &&
          isScalar(v) &&
          String(v).trim() &&
          String(v) !== t
        ) {
          s = String(v);
          break;
        }
      }
    }
    return { title: t, subtitle: s };
  }, [targetRecord, fields, collection]);

  /* ------------------------------ Pricing ------------------------------ */
  const priceInfo = useMemo(() => {
    const empty = { value: undefined as unknown, key: "", display: "", period: "" };
    if (!targetRecord) return empty;

    let value: unknown;
    let key = "";

    const priceField = fields.find(
      (f) => f.uiRole === "price" || f.type === "currency",
    );
    if (priceField) {
      value = getValue(targetRecord, priceField.path || priceField.key);
      key = priceField.key;
    }
    if ((value === undefined || value === null || value === "") &&
        targetRecord.$price != null) {
      value = targetRecord.$price;
      key = "$price";
    }
    if (value === undefined || value === null || value === "") {
      for (const [k, v] of Object.entries(targetRecord)) {
        if (/(percent|discount|qty|quantity|count|stock)/i.test(k)) continue;
        if (
          PRICE_KEY_RE.test(k) &&
          (typeof v === "number" || (typeof v === "string" && /\d/.test(v)))
        ) {
          value = v;
          key = k;
          break;
        }
      }
    }

    return {
      value,
      key,
      display: formatPrice(value, targetRecord),
      period: derivePricePeriod(key),
    };
  }, [targetRecord, fields]);

  /* --------------------------- Image gallery --------------------------- */
  const allImages = useMemo(
    () => (targetRecord ? extractAllImageUrls(targetRecord).slice(0, 12) : []),
    [targetRecord],
  );
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  useEffect(() => {
    setActiveImageIndex(0);
  }, [targetRecord]);
  const activeImageUrl = allImages[activeImageIndex] || allImages[0] || "";

  /* ------------------------------ Rating ------------------------------- */
  const ratingValue = useMemo(() => {
    if (!targetRecord) return null;
    const rf = fields.find((f) => f.uiRole === "rating");
    let raw: unknown = rf
      ? getValue(targetRecord, rf.path || rf.key)
      : undefined;
    if (raw === undefined) {
      const hit = Object.entries(targetRecord).find(
        ([k, v]) => RATING_KEY_RE.test(k) && typeof v === "number",
      );
      raw = hit?.[1];
    }
    const num = typeof raw === "number" ? raw : Number(raw);
    return isFinite(num) && num > 0 ? num : null;
  }, [targetRecord, fields]);

  /* ----------------------------- Reviews ------------------------------- */
  const reviews = useMemo(() => {
    if (!targetRecord) return [] as any[];
    for (const [k, v] of Object.entries(targetRecord)) {
      if (!Array.isArray(v) || v.length === 0) continue;
      const looksReviews =
        REVIEWS_KEY_RE.test(k) || fieldMap.get(k)?.uiRole === "reviews";
      if (looksReviews && typeof v[0] === "object") return v as any[];
    }
    return [];
  }, [targetRecord, fieldMap]);

  /* --------------------------- Description ----------------------------- */
  const description = useMemo(() => {
    if (!targetRecord) return "";
    const df = fields.find((f) => f.uiRole === "description");
    if (df) {
      const val = getValue(targetRecord, df.path || df.key);
      if (typeof val === "string" && val.trim()) return val.trim();
    }
    for (const [k, v] of Object.entries(targetRecord)) {
      if (DESCRIPTION_KEY_RE.test(k) && typeof v === "string" && v.trim()) {
        return v.trim();
      }
    }
    // Fallback: the longest free-text value that isn't an image/url.
    let longest = "";
    for (const [k, v] of Object.entries(targetRecord)) {
      if (
        typeof v === "string" &&
        v.length > 80 &&
        v.length > longest.length &&
        !IMAGE_KEY_RE.test(k) &&
        !/^https?:\/\//i.test(v)
      ) {
        longest = v;
      }
    }
    return longest;
  }, [targetRecord, fields]);

  /* ---------------------------- Features ------------------------------- */
  const features = useMemo(() => {
    if (!targetRecord) return [] as string[];
    const out: string[] = [];
    // 1. A features/tags scalar array.
    for (const [k, v] of Object.entries(targetRecord)) {
      if (!Array.isArray(v)) continue;
      const role = fieldMap.get(k)?.uiRole;
      if (FEATURES_KEY_RE.test(k) || role === "features" || role === "tags") {
        for (const item of v) {
          if (isScalar(item) && String(item).trim()) out.push(String(item).trim());
        }
      }
    }
    // 2. Else boolean-true fields become capability pills.
    if (out.length === 0) {
      for (const [k, v] of Object.entries(targetRecord)) {
        if (v === true && !k.startsWith("$") && !looksLikeId(k)) {
          out.push(humanizeKey(k));
        }
      }
    }
    return Array.from(new Set(out)).slice(0, 24);
  }, [targetRecord, fieldMap]);

  /* -------------------------- Option groups ---------------------------- *
   * Small scalar arrays (e.g. sizes / colors / tiers) become selectable
   * chip groups that feed selectedOptions → cart + checkout interpolation.
   * Purely shape-driven (cardinality 2–8, scalar, not a features/media key).
   * ------------------------------------------------------------------ */
  const optionGroups = useMemo(() => {
    if (!targetRecord) return [] as Array<{ key: string; label: string; values: string[] }>;
    const groups: Array<{ key: string; label: string; values: string[] }> = [];
    for (const [k, v] of Object.entries(targetRecord)) {
      if (!Array.isArray(v) || v.length < 2) continue;
      if (OPTION_EXCLUDE_RE.test(k)) continue;
      if (!v.every((x) => typeof x === "string" || typeof x === "number")) continue;
      const uniq = Array.from(
        new Set(v.map((x) => String(x).trim()).filter(Boolean)),
      );
      if (uniq.length < 2 || uniq.length > 8) continue;
      groups.push({
        key: k,
        label: fieldMap.get(k)?.label || humanizeKey(k),
        values: uniq,
      });
    }
    return groups;
  }, [targetRecord, fieldMap]);

  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  useEffect(() => {
    const init: Record<string, string> = {};
    for (const g of optionGroups) init[g.key] = g.values[0];
    setSelectedOptions(init);
  }, [optionGroups]);

  /* ---------------------------- Spec grid ------------------------------ *
   * Short scalar fields that aren't already surfaced elsewhere (title,
   * subtitle, price, description, rating, reviews, features, options,
   * images) and aren't identifiers/meta. Labels come from FieldSchema.
   * ------------------------------------------------------------------ */
  const specs = useMemo(() => {
    if (!targetRecord) return [] as Array<{ label: string; value: string }>;
    const optionKeys = new Set(optionGroups.map((g) => g.key));
    const out: Array<{ label: string; value: string }> = [];

    for (const [k, v] of Object.entries(targetRecord)) {
      if (k.startsWith("$")) continue;
      if (looksLikeId(k)) continue;
      if (optionKeys.has(k)) continue;
      if (priceInfo.key && k === priceInfo.key) continue;
      if (
        TITLE_KEY_RE.test(k) ||
        SUBTITLE_KEY_RE.test(k) ||
        PRICE_KEY_RE.test(k) ||
        IMAGE_KEY_RE.test(k) ||
        DESCRIPTION_KEY_RE.test(k) ||
        REVIEWS_KEY_RE.test(k) ||
        RATING_KEY_RE.test(k) ||
        FEATURES_KEY_RE.test(k) ||
        STATUS_KEY_RE.test(k)
      ) {
        continue;
      }
      if (v === null || v === undefined || v === "") continue;
      if (typeof v === "boolean") continue; // → features
      if (!isScalar(v)) continue; // objects / arrays skipped

      const field = fieldMap.get(k);
      if (field?.hidden) continue;

      let display: string;
      if (field && (field.type === "date" || field.type === "datetime")) {
        const d = new Date(String(v));
        display = isNaN(d.getTime()) ? String(v) : d.toLocaleDateString();
      } else if (typeof v === "number") {
        display = v.toLocaleString();
      } else {
        display = String(v);
      }
      if (display.length > 60) continue;

      out.push({ label: field?.label || humanizeKey(k), value: display });
    }
    return out.slice(0, 12);
  }, [targetRecord, fieldMap, optionGroups, priceInfo.key]);

  /* ---------------------- Status / availability ------------------------ */
  const statusBadge = useMemo(() => {
    if (!targetRecord) return "";
    for (const [k, v] of Object.entries(targetRecord)) {
      if (STATUS_KEY_RE.test(k) && isScalar(v) && String(v).trim()) {
        return String(v);
      }
    }
    return "";
  }, [targetRecord]);

  /* ----------------------- Registered redirects ------------------------ */
  const cartAction = useMemo(() => findCartAction(actions), [actions]);
  const canAddToCart = Boolean(cartAction);

  const productItemUrl = useMemo(() => {
    const tpl = metadata.productItemUrlTemplate;
    if (!tpl || !targetRecord) return "";
    return interpolateTemplate(String(tpl), targetRecord);
  }, [metadata.productItemUrlTemplate, targetRecord]);

  const checkoutUrl = useMemo(() => {
    const tpl = metadata.globalCheckoutUrl || metadata.webCheckoutUrl;
    if (!tpl || !targetRecord) return "";
    return interpolateTemplate(String(tpl), targetRecord, selectedOptions);
  }, [metadata.globalCheckoutUrl, metadata.webCheckoutUrl, targetRecord, selectedOptions]);

  // A review-write tool: a review/rating/feedback tool with a write verb and
  // no read/destructive verb. Generic — matched on action id/tool text only.
  const reviewWriteAction = useMemo(() => {
    return actions.find((a: any) => {
      if (!a?.tool) return false;
      const text = `${a.id ?? ""} ${a.tool ?? ""}`;
      return (
        /review|rating|feedback|testimonial/i.test(text) &&
        /(add|create|post|submit|write|leave|new|save)/i.test(text) &&
        !/(get|list|fetch|read|delete|remove|all)/i.test(text)
      );
    });
  }, [actions]);

  /* ------------------------------ Handlers ----------------------------- */
  const [quantity, setQuantity] = useState(1);
  useEffect(() => {
    setQuantity(1);
  }, [targetRecord]);
  const [toast, setToast] = useState(false);

  const recordId = targetRecord?.id ?? targetRecord?._id;

  const handleAddToCart = useCallback(async () => {
    if (!targetRecord) return;
    await addToCartAndSync({
      item: {
        id: recordId ?? title,
        title,
        price: (priceInfo.value as number | string) ?? 0,
        image: activeImageUrl || undefined,
        ...(Object.keys(selectedOptions).length ? { options: selectedOptions } : {}),
        ...(productItemUrl ? { productUrl: productItemUrl } : {}),
        ...(checkoutUrl ? { checkoutUrl } : {}),
      },
      quantity,
      actions,
      recordId,
    });
    setToast(true);
    setTimeout(() => setToast(false), 4000);
  }, [
    targetRecord,
    recordId,
    title,
    priceInfo.value,
    activeImageUrl,
    selectedOptions,
    productItemUrl,
    checkoutUrl,
    quantity,
    actions,
  ]);

  const handleBuyNow = useCallback(() => {
    if (!checkoutUrl) return;
    openExternalUrl(appendChatUrlToCheckout(checkoutUrl));
  }, [checkoutUrl]);

  const handleViewOnCompany = useCallback(() => {
    if (!productItemUrl) return;
    openExternalUrl(productItemUrl);
  }, [productItemUrl]);

  // Add-a-review inline form (only rendered when a review-write tool exists).
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewDone, setReviewDone] = useState(false);

  const handleSubmitReview = useCallback(async () => {
    if (!reviewWriteAction?.tool || !reviewComment.trim()) return;
    setReviewSubmitting(true);
    try {
      await callMcpTool(reviewWriteAction.tool, {
        rating: reviewRating,
        comment: reviewComment.trim(),
        id: recordId,
        productId: recordId,
      });
      setReviewDone(true);
      setReviewComment("");
    } catch (err) {
      console.warn("[DetailBlock] review submit failed:", err);
    } finally {
      setReviewSubmitting(false);
    }
  }, [reviewWriteAction, reviewRating, reviewComment, recordId]);

  const handleBack = useCallback(() => {
    if (onBack) onBack();
    else popSubView();
  }, [onBack, popSubView]);

  /* ------------------------------ Guards ------------------------------- */
  if (!targetRecord) {
    return (
      <div className={styles.container}>
        <button type="button" className={styles.backBtn} onClick={handleBack}>
          &larr; Back
        </button>
        <div className={styles.emptyDetailState}>
          <h3>No details available</h3>
          <p>The requested record could not be loaded.</p>
        </div>
      </div>
    );
  }

  const itemLabel = collection?.itemLabel || collection?.entity || "";
  const backText = itemLabel
    ? `Back to ${itemLabel.endsWith("s") ? itemLabel : `${itemLabel}s`}`
    : "Back";

  const showReviewsSection = reviews.length > 0 || Boolean(reviewWriteAction);
  const showSidebar =
    Boolean(priceInfo.display) ||
    optionGroups.length > 0 ||
    canAddToCart ||
    Boolean(productItemUrl) ||
    Boolean(checkoutUrl);

  /* ------------------------------- Left -------------------------------- */
  const mainColumn = (
    <div className={styles.mainCol}>
      {/* Hero image (contain, no crop) with graceful fallback */}
      <div className={styles.heroBanner}>
        {renderImage(activeImageUrl, title, "contain")}
        {statusBadge && (
          <span className={styles.availableBadge}>{statusBadge}</span>
        )}
      </div>

      {/* Gallery thumbnails */}
      {allImages.length > 1 && (
        <div className={styles.galleryThumbnails}>
          {allImages.map((imgUrl, idx) => (
            <button
              key={`thumb-${idx}`}
              type="button"
              className={`${styles.galleryThumbBtn} ${
                idx === activeImageIndex ? styles.galleryThumbBtnActive : ""
              }`}
              onClick={() => setActiveImageIndex(idx)}
              aria-label={`View image ${idx + 1}`}
            >
              {renderImage(imgUrl, `Thumbnail ${idx + 1}`, "cover")}
            </button>
          ))}
        </div>
      )}

      {/* Title / subtitle / rating */}
      <div className={styles.headerInfo}>
        <div className={styles.titleRow}>
          <h1 className={styles.carTitle}>{title}</h1>
          {subtitle && <span className={styles.carVariant}>{subtitle}</span>}
        </div>
        {ratingValue !== null && (
          <div className={styles.ratingRow}>
            <span className={styles.ratingStar}>★</span>
            <span className={styles.ratingNumber}>{ratingValue.toFixed(1)}</span>
            {reviews.length > 0 && (
              <span className={styles.reviewsCountText}>
                ({reviews.length} {reviews.length === 1 ? "review" : "reviews"})
              </span>
            )}
          </div>
        )}
      </div>

      {/* Specifications */}
      {specs.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Details</h3>
          <div className={styles.specsGrid}>
            {specs.map((s, idx) => (
              <div key={`spec-${idx}`} className={styles.specBox}>
                <div className={styles.specContent}>
                  <span className={styles.specLabel}>{s.label}</span>
                  <span className={styles.specValue}>{s.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Features / tags / highlights */}
      {features.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Features</h3>
          <div className={styles.featuresGrid}>
            {features.map((f, idx) => (
              <span key={`feat-${idx}`} className={styles.featurePill}>
                <span className={styles.checkIcon}>✓</span>
                <span>{f}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Description */}
      {description && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>About</h3>
          <p className={styles.aboutText}>{description}</p>
        </div>
      )}

      {/* Reviews */}
      {showReviewsSection && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>
            Reviews{reviews.length > 0 ? ` (${reviews.length})` : ""}
          </h3>

          {reviews.length > 0 ? (
            <div className={styles.reviewsList}>
              {reviews.map((rev: any, idx: number) => {
                const name =
                  rev.reviewerName || rev.name || rev.author || rev.user ||
                  "Verified customer";
                const stars = Number(rev.rating);
                const date = rev.date || rev.createdAt || rev.reviewDate;
                return (
                  <div key={`rev-${idx}`} className={styles.reviewCard}>
                    <div className={styles.reviewHeader}>
                      <div className={styles.reviewHeaderLeft}>
                        <span className={styles.reviewerName}>{name}</span>
                        {isFinite(stars) && stars > 0 && (
                          <span className={styles.reviewStars}>
                            {"★".repeat(Math.min(5, Math.max(1, Math.round(stars))))}
                          </span>
                        )}
                      </div>
                      {date && (
                        <span className={styles.reviewDate}>
                          {(() => {
                            const d = new Date(date);
                            return isNaN(d.getTime())
                              ? String(date)
                              : d.toLocaleDateString(undefined, {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                });
                          })()}
                        </span>
                      )}
                    </div>
                    {(rev.comment || rev.text || rev.body) && (
                      <p className={styles.reviewComment}>
                        {rev.comment || rev.text || rev.body}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={styles.reviewsBox}>
              <p className={styles.emptyReviewText}>
                No reviews yet — be the first to share your experience.
              </p>
            </div>
          )}

          {/* Add a review — only when the company registered a review-write tool */}
          {reviewWriteAction && (
            <div className={styles.addReviewBox}>
              {reviewDone ? (
                <p className={styles.emptyReviewText}>
                  Thanks! Your review has been submitted.
                </p>
              ) : (
                <>
                  <div className={styles.starPicker}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={`star-${n}`}
                        type="button"
                        className={styles.starPickBtn}
                        onClick={() => setReviewRating(n)}
                        aria-label={`${n} star${n === 1 ? "" : "s"}`}
                      >
                        <span
                          style={{ color: n <= reviewRating ? "#f59e0b" : "#475569" }}
                        >
                          ★
                        </span>
                      </button>
                    ))}
                  </div>
                  <textarea
                    className={styles.reviewTextarea}
                    placeholder="Share your experience…"
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    rows={3}
                  />
                  <button
                    type="button"
                    className={styles.submitReviewBtn}
                    onClick={handleSubmitReview}
                    disabled={reviewSubmitting || !reviewComment.trim()}
                  >
                    {reviewSubmitting ? "Submitting…" : "Submit review"}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );

  /* ------------------------------ Right -------------------------------- */
  const sidebarColumn = showSidebar ? (
    <div className={styles.sidebarCol}>
      <div className={styles.bookingBox}>
        {priceInfo.display && (
          <div className={styles.bookingRateRow}>
            <h2 className={styles.bookingRatePrice}>{priceInfo.display}</h2>
            {priceInfo.period && (
              <span className={styles.bookingRatePeriod}>{priceInfo.period}</span>
            )}
          </div>
        )}

        {statusBadge && (
          <div>
            <span className={styles.stockBadgeInStock}>{statusBadge}</span>
          </div>
        )}

        {/* Selectable option groups (sizes / colors / tiers / …) */}
        {optionGroups.map((g) => (
          <div key={`opt-${g.key}`} className={styles.optionGroup}>
            <label className={styles.fieldLabel}>{g.label}</label>
            <div className={styles.optionChips}>
              {g.values.map((val) => (
                <button
                  key={`${g.key}-${val}`}
                  type="button"
                  className={`${styles.optionChip} ${
                    selectedOptions[g.key] === val ? styles.optionChipSelected : ""
                  }`}
                  onClick={() =>
                    setSelectedOptions((prev) => ({ ...prev, [g.key]: val }))
                  }
                >
                  {val}
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Quantity — only when there's a cart/order tool to receive it */}
        {canAddToCart && (
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
                onClick={() => setQuantity((q) => q + 1)}
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          </div>
        )}

        {toast && (
          <div className={styles.toastNotice}>
            <span>✓ Added to cart ({quantity}×)</span>
            <button
              type="button"
              className={styles.toastViewCartBtn}
              onClick={openCart}
            >
              View cart &rarr;
            </button>
          </div>
        )}

        {/* Gated CTAs — each only when the company registered it */}
        <div className={styles.buttonGroup}>
          {canAddToCart && (
            <button
              type="button"
              className={styles.addToCartBtn}
              onClick={handleAddToCart}
            >
              <span>🛒</span>
              <span>Add to cart</span>
            </button>
          )}
          {checkoutUrl && (
            <button
              type="button"
              className={styles.buyNowBtn}
              onClick={handleBuyNow}
            >
              <span>⚡</span>
              <span>Buy now</span>
            </button>
          )}
          {productItemUrl && (
            <button
              type="button"
              className={styles.viewOnCompanyBtn}
              onClick={handleViewOnCompany}
            >
              <span>↗</span>
              <span>View on {companyName}</span>
            </button>
          )}
        </div>

        {(checkoutUrl || canAddToCart) && (
          <p className={styles.bookingNote}>
            You won't be charged yet — review and confirm on the next step.
          </p>
        )}
      </div>
    </div>
  ) : null;

  return (
    <div className={styles.container}>
      <button
        type="button"
        className={styles.backBtn}
        onClick={handleBack}
        aria-label={backText}
      >
        &larr; {backText}
      </button>

      {showSidebar ? (
        <div className={styles.layoutTwoCol}>
          {mainColumn}
          {sidebarColumn}
        </div>
      ) : (
        mainColumn
      )}
    </div>
  );
};
