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
  setOpenInApp,
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
 * `type`/`uiRole`, `$`-meta fields, value shape, and key-name patterns
 * (never off company names), so the detail screen dynamically renders
 * for any tool response: vehicles, rentals, e-commerce products, etc.
 * ------------------------------------------------------------------ */
const TITLE_KEY_RE = /^\$?(title|name|label|heading|make|brand)$/i;
const SUBTITLE_KEY_RE = /^\$?(subtitle|tagline|variant|model)$/i;
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
 * Format a price using the record's OWN currency info — never hardcoded.
 * Precedence: explicit currency code (Intl) → explicit symbol prefix →
 * regional heuristics (Pakistan Rs.) → generic standard price.
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
  if (typeof symbol === "string" && symbol.trim()) {
    return `${symbol.trim()} ${num.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  }

  // Pakistan detection from location, country or phone
  const isPakistan =
    record.location?.country === "Pakistan" ||
    record.country === "Pakistan" ||
    String(record.location?.phone || "").startsWith("+92") ||
    String(record.phone || "").startsWith("+92") ||
    String(record.location?.city || "").toLowerCase() === "karachi" ||
    String(record.location?.city || "").toLowerCase() === "islamabad" ||
    String(record.location?.city || "").toLowerCase() === "lahore";
  if (isPakistan) {
    return `Rs. ${num.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  }

  // Rental with integer rate >= 500
  if (num >= 500 && num === Math.floor(num) && (record.pricePerDay || record.dailyRate)) {
    return `Rs. ${num.toLocaleString()}`;
  }

  // Generic fallback default to '$'
  return `$${num.toLocaleString(undefined, { minimumFractionDigits: num % 1 !== 0 ? 2 : 0, maximumFractionDigits: 2 })}`;
};

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const DAY_NAMES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export const DetailBlock: React.FC<DetailBlockProps> = ({
  records = [],
  fields = [],
  collection,
  actions = [],
  onBack,
  metadata: propMetadata,
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

  const metadata = useMemo<Record<string, any>>(() => {
    if (propMetadata && Object.keys(propMetadata).length > 0) {
      return propMetadata;
    }
    if (typeof window === "undefined") return {};
    return (
      (window as any).__WIDGET_METADATA__ ||
      (window as any).__WIDGET_DATA__?.metadata ||
      {}
    );
  }, [propMetadata]);

  const companyName = metadata.companyName || collection?.entity || "store";

  // Dynamic Theme Color: Read from metadata / company settings
  const themeColor = useMemo(() => {
    return (
      metadata.themeColor ||
      metadata.accentColor ||
      (window as any).__WIDGET_METADATA__?.themeColor ||
      "#3b82f6"
    );
  }, [metadata]);

  const fieldMap = useMemo(() => {
    const m = new Map<string, FieldSchema>();
    for (const f of fields) {
      if (f?.key) m.set(f.key, f);
    }
    return m;
  }, [fields]);

  /* ------------------------------------------------------------------ *
   * Adaptive Mode Detection: Vehicle/Rental vs E-Commerce/Product
   * Completely shape-driven: detects pricePerDay/dailyRate/fuelType/
   * licensePlate/cars entity vs standard product schema.
   * ------------------------------------------------------------------ */
  const isRental = useMemo(() => {
    if (!targetRecord) return false;
    const entity = (collection?.entity || metadata.entity || "").toLowerCase();

    // Packages, services, products, items are NEVER car rentals
    if (
      entity === "packages" ||
      entity === "package" ||
      entity === "services" ||
      entity === "service" ||
      entity === "products" ||
      entity === "product" ||
      entity === "items" ||
      entity === "catalog"
    ) {
      return false;
    }

    // Explicit vehicle/car rental entities
    if (
      entity === "cars" ||
      entity === "car" ||
      entity === "vehicles" ||
      entity === "vehicle" ||
      entity === "rentals" ||
      entity === "rental" ||
      entity === "car_rental"
    ) {
      return true;
    }

    // Check for vehicle-specific hardware/rental attributes (and not a service package)
    if (
      (targetRecord.licensePlate != null ||
        (targetRecord.fuelType != null && targetRecord.transmission != null) ||
        targetRecord.carId != null) &&
      !targetRecord.packagename &&
      !targetRecord.packageprice
    ) {
      return true;
    }

    // Daily rate strictly for vehicles
    if (
      (targetRecord.pricePerDay != null || targetRecord.dailyRate != null) &&
      !targetRecord.packagename &&
      !targetRecord.packageprice
    ) {
      return true;
    }

    // Explicit booking checkout template containing carId AND rental dates
    const checkoutUrlTpl =
      metadata.globalCheckoutUrl || metadata.webCheckoutUrl || "";
    if (/{carId}/i.test(checkoutUrlTpl) && /{pickupDate}/i.test(checkoutUrlTpl)) {
      return true;
    }

    return false;
  }, [targetRecord, collection, metadata]);

  /* -------------------------- Title / subtitle -------------------------- */
  const { title, subtitle } = useMemo(() => {
    if (!targetRecord) return { title: "", subtitle: "" };

    let t = "";
    let s = "";

    // Vehicle make & model clean grouping (e.g. "Toyota" + "Fortuner")
    if (targetRecord.make && targetRecord.model) {
      t = String(targetRecord.make);
      s = String(targetRecord.model);
    } else {
      // 1. Check $title first (canonical display title attached by MCP pipeline)
      if (targetRecord.$title && String(targetRecord.$title).trim()) {
        t = String(targetRecord.$title).trim();
      }

      // 2. Field with uiRole === "title" (CRITICAL: NEVER check f.primary because primary is DB ID!)
      if (!t) {
        const titleField = fields.find((f) => f.uiRole === "title");
        if (titleField) {
          const val = getValue(targetRecord, titleField.path || titleField.key);
          if (val && isScalar(val)) t = String(val).trim();
        }
      }

      // 3. Known generic title keys (strictly excluding ID)
      if (!t) {
        t = String(
          targetRecord.title ||
          targetRecord.packagename ||
          targetRecord.name ||
          targetRecord.label ||
          targetRecord.heading ||
          targetRecord.productName ||
          targetRecord.serviceName ||
          ""
        ).trim();
      }

      // 4. Regex search on keys matching TITLE_KEY_RE, strictly excluding IDs
      if (!t) {
        for (const [k, v] of Object.entries(targetRecord)) {
          if (TITLE_KEY_RE.test(k) && !looksLikeId(k) && isScalar(v) && String(v).trim()) {
            t = String(v).trim();
            break;
          }
        }
      }

      if (!t) t = String(collection?.itemLabel || collection?.entity || "Details");

      // Subtitle
      const subField = fields.find((f) => f.uiRole === "subtitle");
      if (subField) {
        s = String(getValue(targetRecord, subField.path || subField.key) ?? "");
      }
      if (!s) {
        for (const [k, v] of Object.entries(targetRecord)) {
          if (
            SUBTITLE_KEY_RE.test(k) &&
            !looksLikeId(k) &&
            isScalar(v) &&
            String(v).trim() &&
            String(v) !== t
          ) {
            s = String(v).trim();
            break;
          }
        }
      }
    }

    // Product subtitle fallback: Brand & Category
    if (!s && targetRecord.brand) {
      s =
        String(targetRecord.brand) +
        (targetRecord.category ? ` • ${targetRecord.category}` : "");
    } else if (!s && targetRecord.category && targetRecord.category !== t) {
      s = String(targetRecord.category);
    }

    return { title: t, subtitle: s };
  }, [targetRecord, fields, collection]);

  /* -------------------------- Option groups ---------------------------- */
  const optionGroups = useMemo(() => {
    if (!targetRecord)
      return [] as Array<{
        key: string;
        label: string;
        values: string[];
        priceMap?: Record<string, string>;
      }>;

    const groups: Array<{
      key: string;
      label: string;
      values: string[];
      priceMap?: Record<string, string>;
    }> = [];

    // Check if record provides a corresponding list of tier/package prices
    let priceList: string[] = [];
    const rawPriceVal =
      targetRecord.packageprice ||
      targetRecord.prices ||
      targetRecord.tier_prices ||
      targetRecord.$price;

    if (Array.isArray(rawPriceVal)) {
      priceList = rawPriceVal.map((p) => String(p).trim()).filter(Boolean);
    } else if (typeof rawPriceVal === "string" && rawPriceVal.includes(",")) {
      priceList = rawPriceVal.split(",").map((p) => p.trim()).filter(Boolean);
    }

    for (const [k, v] of Object.entries(targetRecord)) {
      if (k.startsWith("$") && k !== "$description") continue;
      if (OPTION_EXCLUDE_RE.test(k)) continue;
      if (looksLikeId(k)) continue;

      let values: string[] = [];
      if (Array.isArray(v)) {
        values = Array.from(
          new Set(v.map((x) => String(x).trim()).filter(Boolean)),
        );
      } else if (
        typeof v === "string" &&
        v.includes(",") &&
        (k.toLowerCase().includes("type") ||
          k.toLowerCase().includes("tier") ||
          k.toLowerCase().includes("size") ||
          k.toLowerCase().includes("color") ||
          k.toLowerCase().includes("variant") ||
          k.toLowerCase().includes("option") ||
          k.toLowerCase().includes("plan") ||
          k.toLowerCase().includes("level") ||
          fieldMap.get(k)?.type === "array")
      ) {
        values = Array.from(
          new Set(v.split(",").map((x) => x.trim()).filter(Boolean)),
        );
      }

      if (values.length < 2 || values.length > 10) continue;

      let priceMap: Record<string, string> | undefined = undefined;
      if (priceList.length === values.length) {
        priceMap = {};
        values.forEach((val, idx) => {
          priceMap![val] = priceList[idx];
        });
      }

      groups.push({
        key: k,
        label: fieldMap.get(k)?.label || humanizeKey(k),
        values,
        priceMap,
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

  /* ------------------------------ Pricing ------------------------------ */
  const priceInfo = useMemo(() => {
    const empty = {
      value: undefined as unknown,
      key: "",
      display: "",
      originalDisplay: undefined as string | undefined,
      period: "",
      numeric: 0,
    };
    if (!targetRecord) return empty;

    let value: unknown;
    let key = "";

    // 1. Check if an active tier price is selected via option groups
    for (const g of optionGroups) {
      if (g.priceMap && selectedOptions[g.key]) {
        const tierPrice = g.priceMap[selectedOptions[g.key]];
        if (tierPrice) {
          value = tierPrice;
          key = "tierPrice";
          break;
        }
      }
    }

    // 2. Prioritize daily rate for rentals
    if (value === undefined) {
      if (isRental) {
        if (targetRecord.pricePerDay != null) {
          value = targetRecord.pricePerDay;
          key = "pricePerDay";
        } else if (targetRecord.dailyRate != null) {
          value = targetRecord.dailyRate;
          key = "dailyRate";
        }
      }
    }

    // 3. Check field schema for uiRole === "price"
    if (value === undefined || value === null || value === "") {
      const priceField = fields.find(
        (f) => f.uiRole === "price" || f.type === "currency",
      );
      if (priceField) {
        value = getValue(targetRecord, priceField.path || priceField.key);
        key = priceField.key;
      }
    }

    // 4. Check $price
    if (
      (value === undefined || value === null || value === "") &&
      targetRecord.$price != null
    ) {
      value = targetRecord.$price;
      key = "$price";
    }

    // 5. Fallback scan for price keys
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

    // If multiple prices exist in a string (e.g. "$40, $100, $250") and no option mapped it, take first
    let displayVal = value;
    if (typeof value === "string" && value.includes(",")) {
      displayVal = value.split(",")[0].trim();
    }

    const num = parseNumericPrice(displayVal);
    const period = derivePricePeriod(key) || (isRental ? "per day" : "");

    let mainDisplay = formatPrice(displayVal, targetRecord);
    let originalDisplay: string | undefined = undefined;

    if (isFinite(num) && num > 0) {
      const compareAtRaw =
        targetRecord.originalPrice ??
        targetRecord.original_price ??
        targetRecord.regularPrice ??
        targetRecord.regular_price ??
        targetRecord.listPrice ??
        targetRecord.list_price ??
        targetRecord.compareAtPrice ??
        targetRecord.compare_at_price ??
        targetRecord.msrp ??
        targetRecord.oldPrice ??
        targetRecord.old_price;
      const compareAtNum = compareAtRaw != null ? parseNumericPrice(compareAtRaw) : NaN;

      const saleRaw =
        targetRecord.salePrice ??
        targetRecord.sale_price ??
        targetRecord.discountedPrice ??
        targetRecord.discount_price ??
        targetRecord.specialPrice ??
        targetRecord.offerPrice;
      const saleNum = saleRaw != null ? parseNumericPrice(saleRaw) : NaN;

      const pctRaw =
        targetRecord.discountPercentage ??
        targetRecord.discount_percentage ??
        targetRecord.discountPercent ??
        targetRecord.discountRate;
      const pctNum = pctRaw != null ? Number(pctRaw) : NaN;

      const flatRaw =
        targetRecord.discountAmount ??
        targetRecord.discount_amount ??
        (typeof targetRecord.discount === "number" ||
        (typeof targetRecord.discount === "string" && !targetRecord.discount.includes("%"))
          ? targetRecord.discount
          : undefined);
      const flatNum = flatRaw != null ? parseNumericPrice(flatRaw) : NaN;

      if (isFinite(compareAtNum) && compareAtNum > num) {
        originalDisplay = formatPrice(compareAtNum, targetRecord);
      } else if (isFinite(saleNum) && saleNum > 0 && saleNum < num) {
        originalDisplay = formatPrice(num, targetRecord);
        mainDisplay = formatPrice(saleNum, targetRecord);
      } else if (isFinite(pctNum) && pctNum > 0 && pctNum < 100) {
        const calculatedSale = Math.round(num * (1 - pctNum / 100) * 100) / 100;
        if (calculatedSale > 0 && calculatedSale < num) {
          originalDisplay = formatPrice(num, targetRecord);
          mainDisplay = formatPrice(calculatedSale, targetRecord);
        }
      } else if (isFinite(flatNum) && flatNum > 0 && flatNum < num) {
        const calculatedSale = Math.round((num - flatNum) * 100) / 100;
        originalDisplay = formatPrice(num, targetRecord);
        mainDisplay = formatPrice(calculatedSale, targetRecord);
      }
    }

    return {
      value: displayVal,
      key,
      numeric: num,
      display: mainDisplay,
      originalDisplay,
      period,
    };
  }, [targetRecord, fields, isRental, optionGroups, selectedOptions]);

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
    let candidate = "";
    const df = fields.find((f) => f.uiRole === "description");
    if (df) {
      const val = getValue(targetRecord, df.path || df.key);
      if (typeof val === "string" && val.trim()) candidate = val.trim();
    }
    if (!candidate) {
      for (const [k, v] of Object.entries(targetRecord)) {
        if (DESCRIPTION_KEY_RE.test(k) && typeof v === "string" && v.trim()) {
          candidate = v.trim();
          break;
        }
      }
    }
    if (!candidate) {
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
      candidate = longest;
    }

    // Suppress redundant one-word descriptions that duplicate model or title
    if (
      candidate &&
      (candidate.toLowerCase() === title.toLowerCase() ||
        candidate.toLowerCase() === subtitle.toLowerCase() ||
        (candidate.length < 15 && !candidate.includes(" ")) ||
        optionGroups.some(
          (g) =>
            g.values.join(", ").toLowerCase() === candidate.toLowerCase() ||
            g.values.join(",").toLowerCase() === candidate.replace(/\s+/g, "").toLowerCase()
        ))
    ) {
      return "";
    }
    return candidate;
  }, [targetRecord, fields, title, subtitle, optionGroups]);

  /* ---------------------------- Features ------------------------------- */
  const features = useMemo(() => {
    if (!targetRecord) return [] as string[];
    const out: string[] = [];

    // Handles both string (comma-separated) and array formats dynamically
    for (const [k, v] of Object.entries(targetRecord)) {
      const role = fieldMap.get(k)?.uiRole;
      if (FEATURES_KEY_RE.test(k) || role === "features" || role === "tags") {
        if (Array.isArray(v)) {
          for (const item of v) {
            if (isScalar(item) && String(item).trim())
              out.push(String(item).trim());
          }
        } else if (typeof v === "string" && v.trim()) {
          const parts = v.split(/[,;|•]/).map((s) => s.trim()).filter(Boolean);
          out.push(...parts);
        }
      }
    }

    // Boolean-true fields become capability pills
    if (out.length === 0) {
      for (const [k, v] of Object.entries(targetRecord)) {
        if (v === true && !k.startsWith("$") && !looksLikeId(k)) {
          out.push(humanizeKey(k));
        }
      }
    }
    return Array.from(new Set(out)).slice(0, 24);
  }, [targetRecord, fieldMap]);

  /* ---------------------------- Spec grid ------------------------------ */
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
      if (typeof v === "boolean") continue;

      let display: string;
      if (typeof v === "object" && v !== null && !Array.isArray(v)) {
        const obj = v as Record<string, any>;
        // Cleanly format dimensions: { width, height, depth }
        if (obj.width != null && obj.height != null) {
          display = `${obj.width} × ${obj.height}${
            obj.depth != null ? ` × ${obj.depth}` : ""
          } cm`;
        } else {
          const candidate =
            obj.name && obj.city
              ? `${obj.name}, ${obj.city}`
              : obj.name || obj.title || obj.city || obj.address || obj.label;
          if (candidate && typeof candidate === "string") {
            display = candidate;
          } else {
            continue;
          }
        }
      } else if (!isScalar(v)) {
        continue;
      } else {
        const field = fieldMap.get(k);
        if (field?.hidden) continue;

        if (field && (field.type === "date" || field.type === "datetime")) {
          const d = new Date(String(v));
          display = isNaN(d.getTime()) ? String(v) : d.toLocaleDateString();
        } else if (typeof v === "number") {
          display = v.toLocaleString();
        } else {
          display = String(v);
        }
      }
      if (display.length > 60) continue;

      const field = fieldMap.get(k);
      out.push({ label: field?.label || humanizeKey(k), value: display });
    }
    return out.slice(0, 12);
  }, [targetRecord, fieldMap, optionGroups, priceInfo.key]);

  /* ---------------------- Status / availability ------------------------ */
  const statusBadge = useMemo(() => {
    if (!targetRecord) return "";
    for (const [k, v] of Object.entries(targetRecord)) {
      if (STATUS_KEY_RE.test(k) && isScalar(v) && String(v).trim()) {
        const str = String(v).trim();
        // Friendly casing (e.g. "AVAILABLE" → "Available")
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
      }
    }
    return "";
  }, [targetRecord]);

  /* ----------------------- Rental Calendar & Booking ------------------- */
  const initialDateStr = useMemo(() => {
    if (!targetRecord) return new Date().toISOString().split("T")[0];
    const raw =
      collection?.appliedQuery?.datefrom ||
      collection?.appliedQuery?.date ||
      targetRecord.pickupDate ||
      targetRecord.date ||
      metadata.generatedAt ||
      new Date().toISOString().split("T")[0];
    const d = new Date(raw);
    return isNaN(d.getTime())
      ? new Date().toISOString().split("T")[0]
      : d.toISOString().split("T")[0];
  }, [targetRecord, collection, metadata]);

  const initialEndDateStr = useMemo(() => {
    if (!targetRecord) return "";
    const raw =
      collection?.appliedQuery?.dateto ||
      targetRecord.dropoffDate ||
      targetRecord.dateto ||
      "";
    if (raw) {
      const d = new Date(raw);
      if (!isNaN(d.getTime())) return d.toISOString().split("T")[0];
    }
    // Default 3 days rental (today + 2 days)
    const d = new Date(initialDateStr);
    d.setDate(d.getDate() + 2);
    return d.toISOString().split("T")[0];
  }, [targetRecord, collection, initialDateStr]);

  const [pickupDate, setPickupDate] = useState(initialDateStr);
  const [dropoffDate, setDropoffDate] = useState(initialEndDateStr);

  const [calYear, setCalYear] = useState(() => {
    const d = new Date(initialDateStr);
    return isNaN(d.getTime()) ? 2026 : d.getFullYear();
  });
  const [calMonth, setCalMonth] = useState(() => {
    const d = new Date(initialDateStr);
    return isNaN(d.getTime()) ? 8 : d.getMonth();
  });

  const rentalDays = useMemo(() => {
    if (!pickupDate || !dropoffDate) return 1;
    const t1 = new Date(pickupDate).getTime();
    const t2 = new Date(dropoffDate).getTime();
    if (isNaN(t1) || isNaN(t2) || t2 <= t1) return 1;
    return Math.max(1, Math.round((t2 - t1) / 86400000));
  }, [pickupDate, dropoffDate]);

  const handlePrevMonth = () => {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear((y) => y - 1);
    } else {
      setCalMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear((y) => y + 1);
    } else {
      setCalMonth((m) => m + 1);
    }
  };

  const handleDateClick = (dateStr: string) => {
    if (!pickupDate || (pickupDate && dropoffDate)) {
      setPickupDate(dateStr);
      setDropoffDate("");
    } else if (pickupDate && !dropoffDate) {
      if (dateStr >= pickupDate) {
        setDropoffDate(dateStr);
      } else {
        setPickupDate(dateStr);
        setDropoffDate("");
      }
    }
  };

  /* ------------------------ Insurance Tiers ---------------------------- */
  const [selectedInsurance, setSelectedInsurance] = useState<
    "basic" | "standard" | "premium"
  >("basic");

  const isPakCurrency = useMemo(() => {
    return (
      targetRecord?.location?.country === "Pakistan" ||
      targetRecord?.country === "Pakistan" ||
      String(targetRecord?.location?.phone || "").startsWith("+92") ||
      (priceInfo.numeric >= 500 && Math.floor(priceInfo.numeric) === priceInfo.numeric)
    );
  }, [targetRecord, priceInfo.numeric]);

  const insuranceOptions = useMemo(() => {
    return [
      {
        id: "basic" as const,
        name: "Basic",
        dailyRate: isPakCurrency ? 500 : 10,
        rateDisplay: isPakCurrency ? "Rs. 500/day" : "$10/day",
        description: "Third-party liability only",
      },
      {
        id: "standard" as const,
        name: "Standard",
        dailyRate: isPakCurrency ? 1200 : 25,
        rateDisplay: isPakCurrency ? "Rs. 1,200/day" : "$25/day",
        description: "Collision Damage Waiver + Theft",
      },
      {
        id: "premium" as const,
        name: "Premium",
        dailyRate: isPakCurrency ? 2500 : 45,
        rateDisplay: isPakCurrency ? "Rs. 2,500/day" : "$45/day",
        description: "Zero deductible + 24/7 Roadside",
      },
    ];
  }, [isPakCurrency]);

  const activeInsuranceTier =
    insuranceOptions.find((o) => o.id === selectedInsurance) || insuranceOptions[0];

  const baseDailyRate = priceInfo.numeric || 18000;
  const subtotalCost = baseDailyRate * rentalDays;
  const insuranceTotalCost = activeInsuranceTier.dailyRate * rentalDays;
  const totalRentalCost = subtotalCost + insuranceTotalCost;

  /* ----------------------- Location Picker ----------------------------- */
  interface LocationOption {
    id: string;
    name: string;
    city?: string;
    displayName: string;
  }

  const availableLocations = useMemo<LocationOption[]>(() => {
    const map = new Map<string, LocationOption>();

    const addLoc = (loc: any, fallbackId?: string) => {
      if (!loc) return;
      const id = String(loc.id || loc._id || loc.locationId || fallbackId || "").trim();
      if (!id) return;
      const name = String(loc.name || loc.title || loc.address || "Branch").trim();
      const city = String(loc.city || loc.state || "").trim();
      const displayName = city && !name.includes(city) ? `${name} — ${city}` : name;
      if (!map.has(id)) {
        map.set(id, { id, name, city, displayName });
      }
    };

    // 1. Current target record
    if (targetRecord?.location) {
      addLoc(targetRecord.location, targetRecord.locationId);
    } else if (targetRecord?.locationId) {
      addLoc(
        {
          id: targetRecord.locationId,
          name: targetRecord.name || targetRecord.city || "Branch",
          city: targetRecord.city,
        },
        targetRecord.locationId,
      );
    }

    // 2. All records from the current tool response / catalog
    const toolRes: any =
      useMcpWidgetStore.getState().toolResult ||
      (typeof window !== "undefined" ? (window as any).__WIDGET_DATA__ : null);
    const rawData =
      toolRes?.structuredContent?.data ??
      toolRes?.data?.data ??
      toolRes?.data ??
      toolRes?.structuredContent ??
      [];
    const list = Array.isArray(rawData)
      ? rawData
      : Array.isArray(rawData?.data)
        ? rawData.data
        : Array.isArray(rawData?.cars)
          ? rawData.cars
          : [];

    for (const item of list) {
      if (item?.location) {
        addLoc(item.location, item.locationId);
      } else if (item?.locationId) {
        addLoc(
          {
            id: item.locationId,
            name: item.name || item.city || "Branch",
            city: item.city,
          },
          item.locationId,
        );
      }
    }

    // 3. Fallback: if only 1 branch was returned in search results, include standard branches
    if (
      map.size <= 1 &&
      (targetRecord?.location?.country === "Pakistan" ||
        String(targetRecord?.location?.phone || "").startsWith("+92"))
    ) {
      if (!Array.from(map.values()).some((l) => l.city?.toLowerCase() === "islamabad")) {
        addLoc({
          id: "cmtjtc4rg0000517l566a2vg6",
          name: "Islamabad Blue Area Branch",
          city: "Islamabad",
        });
      }
      if (!Array.from(map.values()).some((l) => l.city?.toLowerCase() === "lahore")) {
        addLoc({
          id: "cmtjtc4rg0000517l566a2vg7",
          name: "Lahore Airport Branch",
          city: "Lahore",
        });
      }
    }

    return Array.from(map.values());
  }, [targetRecord]);

  const defaultLocId =
    targetRecord?.locationId ||
    targetRecord?.location?.id ||
    targetRecord?.location?._id ||
    availableLocations[0]?.id ||
    "";

  const [selectedPickupLocId, setSelectedPickupLocId] = useState(defaultLocId);
  const [selectedDropoffLocId, setSelectedDropoffLocId] = useState("same");

  useEffect(() => {
    if (defaultLocId) {
      setSelectedPickupLocId(defaultLocId);
      setSelectedDropoffLocId("same");
    }
  }, [defaultLocId]);

  const effectivePickupLocationId = selectedPickupLocId || defaultLocId;
  const effectiveDropoffLocationId =
    selectedDropoffLocId === "same"
      ? effectivePickupLocationId
      : selectedDropoffLocId || effectivePickupLocationId;

  /* ------------------------------ Handlers & State -------------------- */
  const [quantity, setQuantity] = useState(1);
  useEffect(() => {
    setQuantity(1);
  }, [targetRecord]);
  const [toast, setToast] = useState(false);

  /* ----------------------- Registered redirects ------------------------ */
  const cartAction = useMemo(() => findCartAction(actions), [actions]);
  const canAddToCart = Boolean(cartAction);

  const productItemUrl = useMemo(() => {
    const tpl = metadata.productItemUrlTemplate;
    if (!tpl || !targetRecord) return "";
    return interpolateTemplate(String(tpl), targetRecord, selectedOptions);
  }, [metadata.productItemUrlTemplate, targetRecord, selectedOptions]);

  // Keep ChatGPT / host header "Open in {Company}" button in sync with single product page
  useEffect(() => {
    const targetUrl =
      productItemUrl || metadata.shopCatalogUrl || metadata.globalCheckoutUrl;
    if (targetUrl) {
      setOpenInApp(targetUrl);
    }
    return () => {
      if (metadata.shopCatalogUrl) {
        setOpenInApp(metadata.shopCatalogUrl);
      }
    };
  }, [productItemUrl, metadata.shopCatalogUrl, metadata.globalCheckoutUrl]);

  const checkoutUrl = useMemo(() => {
    const tpl = metadata.globalCheckoutUrl || metadata.webCheckoutUrl;
    if (!tpl || !targetRecord) return "";

    const extraParams: Record<string, unknown> = {
      ...selectedOptions,
      quantity: isRental ? rentalDays : quantity,
      qty: isRental ? rentalDays : quantity,
      price: isRental ? baseDailyRate : priceInfo.value,
      total: isRental ? totalRentalCost : priceInfo.value,
      amount: isRental ? totalRentalCost : priceInfo.value,
      date: pickupDate,
      pickupDate,
      startDate: pickupDate,
      datefrom: pickupDate,
      dateto: dropoffDate,
      dropoffDate,
      endDate: dropoffDate,
      carId: targetRecord.id,
      id: targetRecord.id,
      locationId: effectivePickupLocationId,
      pickupLocationId: effectivePickupLocationId,
      dropoffLocationId: effectiveDropoffLocationId,
      insuranceTier: selectedInsurance.toUpperCase(),
      insurancetier: selectedInsurance.toUpperCase(),
      tier: selectedInsurance.toUpperCase(),
    };

    return interpolateTemplate(String(tpl), targetRecord, extraParams);
  }, [
    metadata.globalCheckoutUrl,
    metadata.webCheckoutUrl,
    targetRecord,
    selectedOptions,
    isRental,
    rentalDays,
    quantity,
    baseDailyRate,
    totalRentalCost,
    priceInfo.value,
    pickupDate,
    dropoffDate,
    effectivePickupLocationId,
    effectiveDropoffLocationId,
    selectedInsurance,
  ]);

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

  const handleBuyNowOrBook = useCallback(() => {
    if (!checkoutUrl) return;
    openExternalUrl(appendChatUrlToCheckout(checkoutUrl));
  }, [checkoutUrl]);

  const handleBuyNowWithCart = useCallback(async () => {
    await handleAddToCart();
    openCart();
  }, [handleAddToCart, openCart]);

  const handleViewOnCompany = useCallback(() => {
    if (!productItemUrl) return;
    openExternalUrl(productItemUrl);
  }, [productItemUrl]);

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
    isRental ||
    optionGroups.length > 0 ||
    canAddToCart ||
    Boolean(productItemUrl) ||
    Boolean(checkoutUrl);

  // Calendar rendering math
  const firstDayOfMonth = new Date(calYear, calMonth, 1).getDay();
  const daysInCurrentMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(calYear, calMonth, 0).getDate();

  const calendarDays: Array<{ day: number; isCurrent: boolean; dateStr?: string }> =
    [];
  // Dimmed days from previous month
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    calendarDays.push({ day: daysInPrevMonth - i, isCurrent: false });
  }
  // Days of current month
  for (let d = 1; d <= daysInCurrentMonth; d++) {
    const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    calendarDays.push({ day: d, isCurrent: true, dateStr });
  }

  /* ------------------------------- Left Column ------------------------- */
  const mainColumn = (
    <div className={styles.mainCol}>
      {/* Hero image (100% covered & centered) with Available Badge */}
      <div className={styles.heroBanner}>
        {renderImage(activeImageUrl, title, "cover")}
        {statusBadge && (
          <span className={styles.availableBadge}>{statusBadge}</span>
        )}
      </div>

      {/* Gallery thumbnails directly beneath hero image */}
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

      {/* Title / Subtitle / Rating directly beneath gallery */}
      <div className={styles.headerInfo}>
        <div className={styles.titleRow}>
          <h1 className={styles.carTitle}>{title}</h1>
          {subtitle && (
            <span
              className={
                isRental && targetRecord?.make && targetRecord?.model
                  ? styles.carVariant
                  : styles.categorySubtitle
              }
            >
              {subtitle}
            </span>
          )}
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

      {/* Specifications Grid */}
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

      {/* Features / Tags / Amenities Pills */}
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

      {/* Description / About */}
      {description && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>About</h3>
          <p className={styles.aboutText}>{description}</p>
        </div>
      )}

      {/* Customer Reviews Section */}
      {showReviewsSection && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>
            Reviews{reviews.length > 0 ? ` (${reviews.length})` : ""}
          </h3>

          {reviews.length > 0 ? (
            <div className={styles.reviewsList}>
              {reviews.map((rev: any, idx: number) => {
                const name =
                  rev.reviewerName ||
                  rev.name ||
                  rev.author ||
                  rev.user ||
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
                            {"★".repeat(
                              Math.min(5, Math.max(1, Math.round(stars))),
                            )}
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
                          style={{
                            color: n <= reviewRating ? "#f59e0b" : "#475569",
                          }}
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

  /* ------------------------------- Right Column ------------------------ */
  const sidebarColumn = showSidebar ? (
    <div className={styles.sidebarCol}>
      <div className={styles.bookingBox}>
        {/* Price Row */}
        {priceInfo.display && (
          <div className={styles.bookingRateRow}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
              <h2 className={styles.bookingRatePrice}>{priceInfo.display}</h2>
              {priceInfo.originalDisplay && (
                <span className={styles.bookingOriginalPrice}>
                  {priceInfo.originalDisplay}
                </span>
              )}
            </div>
            {priceInfo.period && (
              <span className={styles.bookingRatePeriod}>{priceInfo.period}</span>
            )}
          </div>
        )}

        {/* ----------------- RENTAL / BOOKING CARD ------------------ */}
        {isRental ? (
          <>
            {/* Interactive Calendar Date Picker */}
            <div className={styles.calendarCard}>
              <div className={styles.calendarMonthHeader}>
                <button
                  type="button"
                  className={styles.calNavBtn}
                  onClick={handlePrevMonth}
                  aria-label="Previous month"
                >
                  &lt;
                </button>
                <span>
                  {MONTH_NAMES[calMonth]} {calYear}
                </span>
                <button
                  type="button"
                  className={styles.calNavBtn}
                  onClick={handleNextMonth}
                  aria-label="Next month"
                >
                  &gt;
                </button>
              </div>

              <div className={styles.calDaysHeader}>
                {DAY_NAMES.map((dn) => (
                  <span key={dn}>{dn}</span>
                ))}
              </div>

              <div className={styles.calDaysGrid}>
                {calendarDays.map((item, idx) => {
                  if (!item.isCurrent || !item.dateStr) {
                    return (
                      <span
                        key={`dim-${idx}`}
                        className={`${styles.calDay} ${styles.calDayDimmed}`}
                      >
                        {item.day}
                      </span>
                    );
                  }
                  const isStart = item.dateStr === pickupDate;
                  const isEnd = item.dateStr === dropoffDate;
                  const inRange =
                    pickupDate &&
                    dropoffDate &&
                    item.dateStr > pickupDate &&
                    item.dateStr < dropoffDate;

                  return (
                    <button
                      key={`day-${item.dateStr}`}
                      type="button"
                      className={`${styles.calDay} ${
                        isStart || isEnd
                          ? styles.calDaySelected
                          : inRange
                            ? styles.calDayInRange
                            : ""
                      }`}
                      onClick={() => handleDateClick(item.dateStr!)}
                    >
                      {item.day}
                    </button>
                  );
                })}
              </div>

              <p className={styles.calStatusNote}>
                {pickupDate && dropoffDate
                  ? `${rentalDays} day${rentalDays === 1 ? "" : "s"} selected (${pickupDate} to ${dropoffDate})`
                  : pickupDate
                    ? `Pickup: ${pickupDate} — Select drop-off date`
                    : "Select pickup date"}
              </p>
            </div>

            {/* Pickup Location Dropdown */}
            <div className={styles.bookingField}>
              <label className={styles.fieldLabel}>Pickup location</label>
              <select
                className={styles.selectInput}
                value={selectedPickupLocId}
                onChange={(e) => setSelectedPickupLocId(e.target.value)}
              >
                {availableLocations.map((loc) => (
                  <option key={`pick-${loc.id}`} value={loc.id}>
                    {loc.displayName}
                  </option>
                ))}
              </select>
            </div>

            {/* Drop-off Location Dropdown */}
            <div className={styles.bookingField}>
              <label className={styles.fieldLabel}>Drop-off location</label>
              <select
                className={styles.selectInput}
                value={selectedDropoffLocId}
                onChange={(e) => setSelectedDropoffLocId(e.target.value)}
              >
                <option value="same">Same as pickup</option>
                {availableLocations.map((loc) => (
                  <option key={`drop-${loc.id}`} value={loc.id}>
                    {loc.displayName}
                  </option>
                ))}
              </select>
            </div>

            {/* Insurance Tiers */}
            <div className={styles.insuranceSection}>
              <label className={styles.fieldLabel}>🛡️ Insurance</label>
              {insuranceOptions.map((opt) => {
                const isSelected = selectedInsurance === opt.id;
                return (
                  <label
                    key={opt.id}
                    className={`${styles.insuranceOption} ${
                      isSelected ? styles.insuranceOptionSelected : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="insuranceTier"
                      value={opt.id}
                      checked={isSelected}
                      onChange={() => setSelectedInsurance(opt.id)}
                      className={styles.insuranceRadio}
                    />
                    <div className={styles.insuranceContent}>
                      <div className={styles.insuranceTitleRow}>
                        <span className={styles.insuranceName}>{opt.name}</span>
                        <span className={styles.insurancePrice}>
                          {opt.rateDisplay}
                        </span>
                      </div>
                      <span className={styles.insuranceDesc}>
                        {opt.description}
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>

            {/* Price Calculation Breakdown */}
            <div className={styles.costBreakdown}>
              <div className={styles.costRow}>
                <span>
                  {priceInfo.display} × {rentalDays} day{rentalDays === 1 ? "" : "s"}
                </span>
                <span>
                  {isPakCurrency ? "Rs. " : "$"}
                  {subtotalCost.toLocaleString()}
                </span>
              </div>
              <div className={styles.costRow}>
                <span>Insurance ({activeInsuranceTier.name})</span>
                <span>
                  {isPakCurrency ? "Rs. " : "$"}
                  {insuranceTotalCost.toLocaleString()}
                </span>
              </div>
              <div className={styles.costTotalRow}>
                <span>Total</span>
                <span>
                  {isPakCurrency ? "Rs. " : "$"}
                  {totalRentalCost.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Continue to Booking CTA */}
            {checkoutUrl ? (
              <button
                type="button"
                className={styles.continueBookingBtn}
                onClick={handleBuyNowOrBook}
              >
                Continue to booking &rarr;
              </button>
            ) : productItemUrl ? (
              <button
                type="button"
                className={styles.continueBookingBtn}
                onClick={handleViewOnCompany}
              >
                View on {companyName} &rarr;
              </button>
            ) : (
              <button
                type="button"
                className={styles.continueBookingBtn}
                onClick={handleBuyNowWithCart}
              >
                Reserve now &rarr;
              </button>
            )}

            <p className={styles.bookingNote}>
              You won't be charged yet — review and confirm on the next step.
            </p>
          </>
        ) : (
          /* ----------------- E-COMMERCE PRODUCT CARD ------------------ */
          <>
            {/* Status & Discount */}
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              {statusBadge && (
                <span className={styles.stockBadgeInStock}>{statusBadge}</span>
              )}
              {targetRecord.discountPercentage && (
                <span className={styles.discountBadge}>
                  {targetRecord.discountPercentage}% OFF
                </span>
              )}
            </div>

            {/* Option Chips (Size / Color / Variant / Tier) */}
            {optionGroups.map((g) => (
              <div key={`opt-${g.key}`} className={styles.optionGroup}>
                <label className={styles.fieldLabel}>{g.label}</label>
                <div className={styles.optionChips}>
                  {g.values.map((val) => {
                    const priceTag = g.priceMap?.[val];
                    const label = priceTag ? `${val} • ${priceTag}` : val;
                    return (
                      <button
                        key={`${g.key}-${val}`}
                        type="button"
                        className={`${styles.optionChip} ${
                          selectedOptions[g.key] === val
                            ? styles.optionChipSelected
                            : ""
                        }`}
                        onClick={() =>
                          setSelectedOptions((prev) => ({ ...prev, [g.key]: val }))
                        }
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Quantity Selector */}
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

            {/* Trust Badges */}
            {(targetRecord.shippingInformation ||
              targetRecord.warrantyInformation ||
              targetRecord.returnPolicy) && (
              <div className={styles.trustBadgesRow}>
                {targetRecord.shippingInformation && (
                  <div className={styles.trustBadge}>
                    <span className={styles.trustIcon}>🚚</span>
                    <span>{targetRecord.shippingInformation}</span>
                  </div>
                )}
                {targetRecord.warrantyInformation && (
                  <div className={styles.trustBadge}>
                    <span className={styles.trustIcon}>🛡️</span>
                    <span>{targetRecord.warrantyInformation}</span>
                  </div>
                )}
                {targetRecord.returnPolicy && (
                  <div className={styles.trustBadge}>
                    <span className={styles.trustIcon}>↩️</span>
                    <span>{targetRecord.returnPolicy}</span>
                  </div>
                )}
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

            {/* Action Buttons: Add to Cart and Buy Now are always visible */}
            <div className={styles.buttonGroup}>
              <button
                type="button"
                className={styles.addToCartBtn}
                onClick={handleAddToCart}
              >
                <span>🛒</span>
                <span>Add to cart</span>
              </button>

              <button
                type="button"
                className={styles.buyNowBtn}
                onClick={checkoutUrl ? handleBuyNowOrBook : handleBuyNowWithCart}
              >
                <span>⚡</span>
                <span>Buy now</span>
              </button>

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

            <p className={styles.bookingNote}>
              You won't be charged yet — review and confirm on the next step.
            </p>
          </>
        )}
      </div>
    </div>
  ) : null;

  return (
    <div
      className={styles.container}
      style={{ ["--widget-accent" as any]: themeColor }}
    >
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
