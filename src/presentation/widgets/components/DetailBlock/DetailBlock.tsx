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
import {
  extractAllImageUrls,
  extractFirstImageUrl,
} from "../../helper/RenderImage/getproxiedimageurl";
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
const PRICE_KEY_RE =
  /(price|rate|cost|amount|fee|fare|premium|charge|subtotal|total)/i;
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
  if (typeof value === "string" && /[^\d.,\s-]/.test(value))
    return value.trim();

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

  if (typeof code === "string" && code.trim()) {
    return `${code.trim().toUpperCase()} ${num.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
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

/* ------------------------------------------------------------------ *
 * Generic availability-date parsing. APIs express availability many
 * ways: arrays of date strings, arrays of {from,to} / {start,end}
 * ranges, or objects carrying a single date. These helpers expand any
 * such shape into a Set of "YYYY-MM-DD" days, keying only off value
 * shape + key-name patterns (never company/entity names).
 * ------------------------------------------------------------------ */
const UNAVAILABLE_KEY_RE =
  /(unavailable|blocked|disabled|reserved|soldout|sold_out|booked|conflict)/i;
const AVAILABLE_KEY_RE =
  /(available|opendate|open_date|openday|open_day|slots?|freedates?|free_date)/i;
const RANGE_START_RE =
  /^(from|start|startdate|start_date|pickup|pickupdate|pickup_date|checkin|check_in|begin|datefrom|date_from)$/i;
const RANGE_END_RE =
  /^(to|end|enddate|end_date|dropoff|dropoffdate|dropoff_date|checkout|check_out|finish|dateto|date_to)$/i;
const SINGLE_DATE_KEY_RE = /^(date|day)$/i;

/** Normalize any date-ish value to a "YYYY-MM-DD" string, or null. */
const toDayStr = (v: unknown): string | null => {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  if (!s) return null;
  const d = new Date(s.length > 10 ? s.split("T")[0] : s);
  return isNaN(d.getTime()) ? null : d.toISOString().split("T")[0];
};

/** Add every day in [startStr, endStr] (inclusive) to the set. */
const expandDateRange = (
  startStr: string,
  endStr: string,
  out: Set<string>,
): void => {
  const s = new Date(startStr);
  const e = new Date(endStr);
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return;
  const cur = new Date(s);
  let guard = 0;
  while (cur <= e && guard < 3660) {
    out.add(cur.toISOString().split("T")[0]);
    cur.setDate(cur.getDate() + 1);
    guard++;
  }
};

/** Expand a date signal (string | range object | array of either) into days. */
const collectDates = (value: unknown, out: Set<string>): void => {
  if (value === null || value === undefined) return;
  if (typeof value === "string") {
    const d = toDayStr(value);
    if (d) out.add(d);
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectDates(item, out);
    return;
  }
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    let startVal: unknown;
    let endVal: unknown;
    let singleVal: unknown;
    for (const [k, v] of Object.entries(obj)) {
      if (startVal === undefined && RANGE_START_RE.test(k)) startVal = v;
      else if (endVal === undefined && RANGE_END_RE.test(k)) endVal = v;
      else if (singleVal === undefined && SINGLE_DATE_KEY_RE.test(k))
        singleVal = v;
    }
    const sStr = toDayStr(startVal);
    const eStr = toDayStr(endVal);
    if (sStr && eStr) expandDateRange(sStr, eStr, out);
    else if (sStr) out.add(sStr);
    else {
      const single = toDayStr(singleVal);
      if (single) out.add(single);
    }
  }
};

export const DetailBlock: React.FC<DetailBlockProps> = ({
  records = [],
  fields = [],
  collection,
  actions = [],
  audience,
  onBack,
  metadata: propMetadata,
  variant = "default",
}) => {
  const popSubView = useMcpWidgetStore((state) => state.popSubView);
  const subViewHistory = useMcpWidgetStore((state) => state.subViewHistory);
  const openCart = useCartStore((state) => state.openCart);
  const isDocked = variant === "mapDock";

  const targetRecord = useMemo<Record<string, any> | null>(() => {
    if (records.length > 0 && records[0] && typeof records[0] === "object") {
      return records[0] as Record<string, any>;
    }
    return null;
  }, [records]);

  // Detect physical location, branch, or shop records
  const isLocationRecord = useMemo(() => {
    if (collection?.purpose === "location") return true;
    const entityStr =
      `${collection?.entity || ""} ${targetRecord?.entity || ""} ${targetRecord?.type || ""}`.toLowerCase();
    if (
      /\b(locations?|branch(es)?|shops?|stores?|warehouses?|offices?)\b/i.test(
        entityStr,
      )
    )
      return true;
    const hasBranchName = /\b(branch|location|store|shop)\b/i.test(
      String(
        targetRecord?.name || targetRecord?.title || targetRecord?.$title || "",
      ),
    );
    const hasLocationFields = Boolean(
      (targetRecord?.latitude !== undefined &&
        targetRecord?.longitude !== undefined) ||
      (targetRecord?.city && targetRecord?.address) ||
      targetRecord?.phone,
    );
    const hasNestedItems = Boolean(
      targetRecord &&
        Object.entries(targetRecord).some(
          ([key, val]) =>
            Array.isArray(val) &&
            val.length > 0 &&
            typeof val[0] === "object" &&
            val[0] !== null &&
            !["bookings", "reviews", "features", "amenities", "images", "photos", "fields", "specifications"].includes(key),
        ),
    );
    return Boolean(
      (hasBranchName && hasLocationFields) ||
      (hasLocationFields && hasNestedItems),
    );
  }, [collection?.purpose, collection?.entity, targetRecord]);

  // Child items (e.g. inventory, products, catalog items) available at this location
  const nestedItems = useMemo(() => {
    if (!targetRecord) return [];
    for (const [key, val] of Object.entries(targetRecord)) {
      if (
        Array.isArray(val) &&
        val.length > 0 &&
        typeof val[0] === "object" &&
        val[0] !== null &&
        !["bookings", "reviews", "features", "amenities", "images", "photos", "fields", "specifications"].includes(key)
      ) {
        return val.filter((it): it is Record<string, any> =>
          Boolean(it && typeof it === "object"),
        );
      }
    }
    return [];
  }, [targetRecord]);

  // Active child item when user drills into a car or product from this location
  const [selectedChildItem, setSelectedChildItem] = useState<Record<
    string,
    any
  > | null>(null);

  // Fullscreen while a detail is open; restore inline when it closes.
  // The docked (map) variant is rendered INSIDE a parent-owned fullscreen map,
  // so it must not fight the parent for the host display mode.
  useEffect(() => {
    if (isDocked) return;
    requestDisplayMode("fullscreen");
    return () => {
      requestDisplayMode("inline");
    };
  }, [isDocked]);

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
   * Time-based booking ("rental") mode — fully data-driven.
   * A rental/booking prices by DURATION (rate × days/nights) and needs a
   * date-range picker; a product prices per unit and needs a quantity
   * stepper. Detected purely from field SHAPE / value patterns / template
   * placeholders — never from entity, company or industry name lists.
   * ------------------------------------------------------------------ */
  const isRental = useMemo(() => {
    if (!targetRecord) return false;
    if (isLocationRecord) return false;
    const keys = Object.keys(targetRecord);

    // (1) Priced per unit of TIME (pricePerDay, dailyRate, pricePerNight,
    //     nightlyRate, pricePerHour, weeklyRate, monthlyRate …) → the quantity
    //     is a duration, so this is a time-based booking.
    const PRICE_KEY_RE = /(price|rate|cost|fee|charge|fare|amount)/i;
    const TIME_UNIT_RE =
      /(per[_-]?)?(day|night|hour|week|month)s?\b|daily|nightly|hourly|weekly|monthly/i;
    if (keys.some((k) => PRICE_KEY_RE.test(k) && TIME_UNIT_RE.test(k))) {
      return true;
    }

    // (2) An explicit rental-duration quantity field on the record.
    const DURATION_QTY_RE =
      /^(nights?|numberofnights|rentaldays|numberofdays|durationdays)$/i;
    if (keys.some((k) => DURATION_QTY_RE.test(k))) return true;

    // (3) The record carries date-RANGE availability data (conflicting or
    //     blocked ranges), which only exists for time-range bookings.
    const RANGE_AVAIL_RE =
      /(conflictingbookings|bookeddates|blockeddates|unavailabledates|availabledates|reserveddates)/i;
    if (keys.some((k) => RANGE_AVAIL_RE.test(k))) return true;

    // (4) A checkout/booking URL template that consumes a DATE RANGE (two
    //     strong date-range placeholders: pickup/dropoff, check-in/out …).
    const tpl = String(
      metadata.globalCheckoutUrl || metadata.webCheckoutUrl || "",
    );
    const RANGE_PLACEHOLDER_RE =
      /{[^}]*(pickup|drop[_-]?off|check[_-]?in|check[_-]?out|arrival|departure|start[_-]?date|end[_-]?date|from[_-]?date|to[_-]?date)[^}]*}/gi;
    if ((tpl.match(RANGE_PLACEHOLDER_RE) || []).length >= 2) return true;

    return false;
  }, [targetRecord, metadata]);

  /* ---------------------- Booking Category & Labels ------------------- */
  const bookingCategory = useMemo(() => {
    const text = `${collection?.entity || ""} ${collection?.itemLabel || ""} ${targetRecord?.category || ""} ${targetRecord?.type || ""} ${metadata?.shopCatalogUrl || ""}`.toLowerCase();
    const isLodging = /hotel|room|apartment|stay|villa|hostel|resort|property|lodging|accommodation/i.test(text);
    const isVehicle = /car|vehicle|fleet|bike|scooter|auto|suv|sedan|truck/i.test(text);

    return {
      isLodging,
      isVehicle,
      startLabel: isLodging ? "Check-in date" : isVehicle ? "Pick-up date" : "Start date",
      endLabel: isLodging ? "Check-out date" : isVehicle ? "Drop-off date" : "End date",
      unitLabel: isLodging ? "night" : "day",
      unitPlural: isLodging ? "nights" : "days",
      locationLabel: isLodging ? "Property location" : isVehicle ? "Pick-up location" : "Location",
      dropoffLabel: isVehicle ? "Drop-off location" : "Return location",
    };
  }, [collection?.entity, collection?.itemLabel, targetRecord?.category, targetRecord?.type, metadata?.shopCatalogUrl]);

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
            "",
        ).trim();
      }

      // 4. Regex search on keys matching TITLE_KEY_RE, strictly excluding IDs
      if (!t) {
        for (const [k, v] of Object.entries(targetRecord)) {
          if (
            TITLE_KEY_RE.test(k) &&
            !looksLikeId(k) &&
            isScalar(v) &&
            String(v).trim()
          ) {
            t = String(v).trim();
            break;
          }
        }
      }

      if (!t)
        t = String(collection?.itemLabel || collection?.entity || "Details");

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
      priceList = rawPriceVal
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean);
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
          new Set(
            v
              .split(",")
              .map((x) => x.trim())
              .filter(Boolean),
          ),
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

  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, string>
  >({});
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
      symbol: "$",
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
      const compareAtNum =
        compareAtRaw != null ? parseNumericPrice(compareAtRaw) : NaN;

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
        (typeof targetRecord.discount === "string" &&
          !targetRecord.discount.includes("%"))
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

    const symbol =
      targetRecord.currencySymbol ||
      targetRecord.symbol ||
      (typeof targetRecord.currency === "string" && targetRecord.currency
        ? `${targetRecord.currency} `
        : "") ||
      (typeof targetRecord.currencyCode === "string" && targetRecord.currencyCode
        ? `${targetRecord.currencyCode} `
        : "") ||
      (mainDisplay.includes("Rs") ? "Rs. " : "$");

    return {
      value: displayVal,
      key,
      numeric: num,
      display: mainDisplay,
      originalDisplay,
      period,
      symbol,
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
            g.values.join(",").toLowerCase() ===
              candidate.replace(/\s+/g, "").toLowerCase(),
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
          const parts = v
            .split(/[,;|•]/)
            .map((s) => s.trim())
            .filter(Boolean);
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
  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);

  const [dynamicConflictingBookings, setDynamicConflictingBookings] = useState<
    any[]
  >([]);
  const [dynamicAvailableDates, setDynamicAvailableDates] = useState<any[]>([]);

  useEffect(() => {
    const recId = targetRecord?.id ?? targetRecord?._id;
    if (recId === undefined || recId === null || !isRental) return;

    if (
      targetRecord?.conflictingBookings ||
      targetRecord?.data?.conflictingBookings
    ) {
      return;
    }

    // Find an availability tool generically (verb/name shape only — no entity
    // names). Matches ids like "check_car_availability", "getAvailability",
    // "room_calendar", "slots", "schedule", "vacancies", …
    const availAction = actions.find((a: any) =>
      /availab|calendar|slots?|schedule|vacan/i.test(
        a?.tool || a?.mcpToolName || a?.name || a?.toolName || "",
      ),
    );
    const toolName =
      availAction?.tool || availAction?.mcpToolName || availAction?.name;
    if (!toolName) return;

    const endObj = new Date();
    endObj.setDate(endObj.getDate() + 90);
    const end = endObj.toISOString().split("T")[0];

    callMcpTool(toolName, { id: recId, startDate: todayStr, endDate: end })
      .then((res: any) => {
        const data = res?.data?.data || res?.data || res;
        const bookings =
          data?.conflictingBookings ||
          data?.bookings ||
          (Array.isArray(data) ? data : []);
        if (Array.isArray(bookings) && bookings.length > 0) {
          setDynamicConflictingBookings(bookings);
        }
        const avail =
          data?.availableDates || data?.available || data?.openDates;
        if (Array.isArray(avail) && avail.length > 0) {
          setDynamicAvailableDates(avail);
        }
        // Flat boolean/count responses (e.g. {available:false,
        // remainingQuantity:0} with no date arrays) carry no per-date data.
        // Do NOT block the entire range — let the calendar show all dates as
        // available so the user can still see and select open dates. The
        // record's own bookings array (if any) marks specific blocked dates.
      })
      .catch(() => {});
  }, [targetRecord?.id, isRental, actions, todayStr]);

  const bookedDatesSet = useMemo(() => {
    const set = new Set<string>();
    const allBookings = [
      ...(Array.isArray(targetRecord?.conflictingBookings)
        ? targetRecord.conflictingBookings
        : []),
      ...(Array.isArray(targetRecord?.data?.conflictingBookings)
        ? targetRecord.data.conflictingBookings
        : []),
      ...(Array.isArray(targetRecord?.bookings) ? targetRecord.bookings : []),
      ...dynamicConflictingBookings,
    ];

    for (const b of allBookings) {
      if (!b || typeof b !== "object") continue;
      const st = String(b.status || "").toUpperCase();
      if (st === "CANCELLED" || st === "REJECTED" || st === "REFUNDED")
        continue;

      const sStr = String(
        b.pickupDate || b.startDate || b.actualPickupDate || "",
      );
      const eStr = String(
        b.dropoffDate || b.endDate || b.actualDropoffDate || "",
      );
      if (!sStr || !eStr) continue;

      const s = new Date(sStr.split("T")[0]);
      const e = new Date(eStr.split("T")[0]);
      if (isNaN(s.getTime()) || isNaN(e.getTime())) continue;

      const cur = new Date(s);
      while (cur <= e) {
        set.add(cur.toISOString().split("T")[0]);
        cur.setDate(cur.getDate() + 1);
      }
    }

    // Generic unavailable-date fields (deny-list): arrays of date strings or
    // {from,to}/{start,end} ranges under keys like unavailableDates /
    // blockedDates. Booking arrays above are already handled (status-aware).
    for (const [k, v] of Object.entries(targetRecord || {})) {
      if (k.startsWith("$")) continue;
      if (/^(conflictingBookings|bookings)$/i.test(k)) continue;
      if (!UNAVAILABLE_KEY_RE.test(k)) continue;
      collectDates(v, set);
    }
    return set;
  }, [targetRecord, dynamicConflictingBookings]);

  // Allow-list: dates the record explicitly marks available (arrays of date
  // strings/ranges under keys like availableDates / openSlots), plus any the
  // availability tool returned. Deny-named keys (unavailable…) never count.
  const availableDatesSet = useMemo(() => {
    const set = new Set<string>();
    for (const [k, v] of Object.entries(targetRecord || {})) {
      if (k.startsWith("$")) continue;
      if (UNAVAILABLE_KEY_RE.test(k)) continue; // deny wins over allow
      if (!AVAILABLE_KEY_RE.test(k)) continue;
      collectDates(v, set);
    }
    for (const d of dynamicAvailableDates) collectDates(d, set);
    return set;
  }, [targetRecord, dynamicAvailableDates]);

  // An availability mechanism exists when the tool response advertises an
  // availability/slots/calendar action (verb/name shape, never entity name).
  const hasAvailabilityAction = useMemo(
    () =>
      (actions || []).some((a: any) =>
        /availab|calendar|slots?|schedule|vacan/i.test(
          `${a?.name || ""} ${a?.tool || ""} ${a?.mcpToolName || ""} ${a?.toolName || ""}`,
        ),
      ),
    [actions],
  );

  // Whether we have ANY availability signal. For rental items, always show
  // the calendar — the record's own bookings data marks blocked dates, and
  // the calendar shows which dates ARE available. Only hide the calendar
  // entirely when there is truly no availability mechanism (non-rental items).
  const hasAvailabilityData =
    isRental ||
    bookedDatesSet.size > 0 ||
    availableDatesSet.size > 0 ||
    hasAvailabilityAction;

  // A day is selectable when it is not past, not denied, and — if an explicit
  // allow-list exists — is inside it.
  const isSelectableDate = (dateStr: string): boolean => {
    if (!dateStr || dateStr < todayStr) return false;
    if (bookedDatesSet.has(dateStr)) return false;
    if (availableDatesSet.size > 0 && !availableDatesSet.has(dateStr))
      return false;
    return true;
  };

  const initialDateStr = useMemo(() => {
    if (!targetRecord) return todayStr;
    const raw =
      collection?.appliedQuery?.datefrom ||
      collection?.appliedQuery?.date ||
      targetRecord.pickupDate ||
      targetRecord.date ||
      metadata.generatedAt ||
      todayStr;
    const d = new Date(raw);
    let candidate = isNaN(d.getTime())
      ? todayStr
      : d.toISOString().split("T")[0];
    // Never allow past dates
    if (candidate < todayStr) candidate = todayStr;
    return candidate;
  }, [targetRecord, collection, metadata, todayStr]);

  const initialEndDateStr = useMemo(() => {
    if (!targetRecord) return "";
    const raw =
      collection?.appliedQuery?.dateto ||
      targetRecord.dropoffDate ||
      targetRecord.dateto ||
      "";
    if (raw) {
      const d = new Date(raw);
      if (!isNaN(d.getTime())) {
        const candidate = d.toISOString().split("T")[0];
        if (candidate > initialDateStr) return candidate;
      }
    }
    // Default 3 days rental (initialDate + 2 days)
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
    // Cannot select past, booked, or (when an allow-list exists) unavailable dates
    if (!isSelectableDate(dateStr)) return;

    if (!pickupDate || (pickupDate && dropoffDate)) {
      setPickupDate(dateStr);
      setDropoffDate("");
    } else if (pickupDate && !dropoffDate) {
      if (dateStr >= pickupDate) {
        // Verify that no booked date is contained inside the selected range
        let hasOverlap = false;
        const cur = new Date(pickupDate);
        const target = new Date(dateStr);
        while (cur <= target) {
          if (!isSelectableDate(cur.toISOString().split("T")[0])) {
            hasOverlap = true;
            break;
          }
          cur.setDate(cur.getDate() + 1);
        }
        if (hasOverlap) {
          // Range contains booked dates, reset to clicked date
          setPickupDate(dateStr);
          setDropoffDate("");
        } else {
          setDropoffDate(dateStr);
        }
      } else {
        setPickupDate(dateStr);
        setDropoffDate("");
      }
    }
  };

  /* ------------------------ Insurance / Protection / Addons ---------------------------- */
  interface ProtectionOption {
    id: string;
    name: string;
    dailyRate: number;
    rateDisplay: string;
    description: string;
  }

  const currencyPrefix = priceInfo.symbol || (priceInfo.display.includes("Rs") ? "Rs. " : "$");
  const baseDailyRate = priceInfo.numeric || 0;

  const insuranceOptions = useMemo<ProtectionOption[]>(() => {
    if (!targetRecord) return [];
    // Only construct options if the API record or response explicitly returned insurance or protection plans
    const rawOptions =
      targetRecord.insuranceOptions ||
      targetRecord.protectionPlans ||
      targetRecord.insuranceTiers ||
      targetRecord.addons ||
      targetRecord.insurance;

    if (!Array.isArray(rawOptions) || rawOptions.length === 0) {
      return [];
    }

    const options: ProtectionOption[] = [];
    for (let idx = 0; idx < rawOptions.length; idx++) {
      const opt = rawOptions[idx];
      if (!opt) continue;
      if (typeof opt === "string") {
        options.push({
          id: opt.toLowerCase().replace(/\s+/g, "_"),
          name: opt,
          dailyRate: 0,
          rateDisplay: "Included",
          description: "",
        });
        continue;
      }
      const id = String(opt.id || opt.tier || opt.name || `opt_${idx}`);
      const name = String(opt.name || opt.title || opt.tier || `Plan ${idx + 1}`);
      const rate = Number(opt.dailyRate ?? opt.pricePerDay ?? opt.price ?? opt.rate ?? 0);
      const rateDisplay = rate > 0 ? `${currencyPrefix}${rate.toLocaleString()}/day` : "Included";
      const description = String(opt.description || opt.coverage || opt.details || "");
      options.push({
        id,
        name,
        dailyRate: rate,
        rateDisplay,
        description,
      });
    }
    return options;
  }, [targetRecord, currencyPrefix]);

  const [selectedInsurance, setSelectedInsurance] = useState<string>("");

  useEffect(() => {
    if (insuranceOptions.length > 0) {
      setSelectedInsurance(insuranceOptions[0].id);
    } else {
      setSelectedInsurance("");
    }
  }, [insuranceOptions]);

  const activeInsuranceTier = useMemo(() => {
    return insuranceOptions.find((o) => o.id === selectedInsurance) || null;
  }, [insuranceOptions, selectedInsurance]);

  const subtotalCost = baseDailyRate * rentalDays;
  const insuranceTotalCost = activeInsuranceTier ? activeInsuranceTier.dailyRate * rentalDays : 0;
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
      const id = String(
        loc.id || loc._id || loc.locationId || fallbackId || "",
      ).trim();
      if (!id) return;
      const name = String(
        loc.name || loc.title || loc.address || "Branch",
      ).trim();
      const city = String(loc.city || loc.state || "").trim();
      const displayName =
        city && !name.includes(city) ? `${name} — ${city}` : name;
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
        : Array.isArray(rawData?.items)
          ? rawData.items
          : Array.isArray(rawData?.products)
            ? rawData.products
            : Array.isArray(rawData?.records)
              ? rawData.records
              : Array.isArray(rawData?.inventory)
                ? rawData.inventory
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

  const hasMultipleLocations = availableLocations.length > 1;
  const hasDropoffLocationSupport = useMemo(() => {
    if (bookingCategory.isVehicle) return true;
    const tpl = String(metadata.globalCheckoutUrl || metadata.webCheckoutUrl || "");
    return /{.*(drop[_-]?off|return)[_-]?loc.*}/i.test(tpl);
  }, [bookingCategory.isVehicle, metadata.globalCheckoutUrl, metadata.webCheckoutUrl]);
  const staticLocationName =
    availableLocations[0]?.displayName ||
    targetRecord?.address ||
    targetRecord?.location?.name ||
    targetRecord?.city ||
    "";

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

  // Keep ChatGPT / host header "Open in {Company}" button in sync with single product page (never for locations)
  useEffect(() => {
    if (isLocationRecord) return;
    const targetUrl =
      productItemUrl || metadata.shopCatalogUrl || metadata.globalCheckoutUrl;
    if (targetUrl) {
      setOpenInApp(targetUrl);
    }
    return () => {
      if (metadata.shopCatalogUrl && !isLocationRecord) {
        setOpenInApp(metadata.shopCatalogUrl);
      }
    };
  }, [
    isLocationRecord,
    productItemUrl,
    metadata.shopCatalogUrl,
    metadata.globalCheckoutUrl,
  ]);

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
      checkin: pickupDate,
      checkinDate: pickupDate,
      checkout: dropoffDate,
      checkoutDate: dropoffDate,
      id: targetRecord.id,
      itemId: targetRecord.id,
      productId: targetRecord.id,
      carId: targetRecord.id,
      roomId: targetRecord.id,
      locationId: effectivePickupLocationId,
      pickupLocationId: effectivePickupLocationId,
      dropoffLocationId: effectiveDropoffLocationId,
      ...(activeInsuranceTier
        ? {
            insuranceTier: activeInsuranceTier.id.toUpperCase(),
            insurancetier: activeInsuranceTier.id.toUpperCase(),
            tier: activeInsuranceTier.id.toUpperCase(),
            insuranceCost: insuranceTotalCost,
          }
        : {}),
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
    activeInsuranceTier,
    insuranceTotalCost,
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
        ...(Object.keys(selectedOptions).length
          ? { options: selectedOptions }
          : {}),
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

  // Only show "Back" when there is somewhere to return to: an explicit
  // onBack handler, or a pushed sub-view (card → detail). A primary
  // single-record render (e.g. GeneralLayout) has neither, so the button
  // is hidden instead of dead. (#6)
  const canGoBack = Boolean(onBack) || subViewHistory.length > 0;

  /* ------------------- Child item in-place drilldown ------------------ */
  if (selectedChildItem) {
    const parentLocationName = String(
      targetRecord?.name ||
        targetRecord?.title ||
        targetRecord?.$title ||
        "Location",
    );

    return (
      <div className={styles.container}>
        <div className={styles.childHeaderBar}>
          <button
            type="button"
            className={styles.backBtn}
            onClick={() => setSelectedChildItem(null)}
          >
            &larr; Back to {parentLocationName}
          </button>
        </div>
        <DetailBlock
          records={[selectedChildItem]}
          fields={fields}
          collection={
            collection
              ? {
                  ...collection,
                  purpose: "product",
                  itemLabel:
                    collection.itemLabel === "location"
                      ? "item"
                      : collection.itemLabel,
                }
              : undefined
          }
          actions={actions}
          audience={audience}
          metadata={metadata}
          onBack={() => setSelectedChildItem(null)}
          variant={variant}
        />
      </div>
    );
  }

  /* ------------------------------ Guards ------------------------------- */
  if (!targetRecord) {
    return (
      <div className={styles.container}>
        {canGoBack && (
          <button type="button" className={styles.backBtn} onClick={handleBack}>
            &larr; Back
          </button>
        )}
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
    !isLocationRecord &&
    (Boolean(priceInfo.display) ||
      isRental ||
      optionGroups.length > 0 ||
      canAddToCart ||
      Boolean(productItemUrl) ||
      Boolean(checkoutUrl));

  // Calendar rendering math
  const firstDayOfMonth = new Date(calYear, calMonth, 1).getDay();
  const daysInCurrentMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(calYear, calMonth, 0).getDate();

  const calendarDays: Array<{
    day: number;
    isCurrent: boolean;
    dateStr?: string;
  }> = [];
  // Dimmed days from previous month
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    calendarDays.push({ day: daysInPrevMonth - i, isCurrent: false });
  }
  // Days of current month
  for (let d = 1; d <= daysInCurrentMonth; d++) {
    const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    calendarDays.push({ day: d, isCurrent: true, dateStr });
  }

  // Detect when every selectable day in the visible month is blocked. In that
  // case fall back to plain date inputs so the user can still enter dates
  // manually (the calendar offers no clickable days and would be frustrating).
  // Also applies when there is no availability data at all — the calendar
  // would show every date as available, which is misleading; date inputs
  // with a "check availability" prompt are clearer.
  const noBookingData =
    isRental &&
    bookedDatesSet.size === 0 &&
    availableDatesSet.size === 0 &&
    dynamicConflictingBookings.length === 0;
  const allVisibleDatesBlocked = calendarDays.every((item) => {
    if (!item.isCurrent || !item.dateStr) return true; // non-current days don't count
    return !isSelectableDate(item.dateStr);
  });

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
            <span className={styles.ratingNumber}>
              {ratingValue.toFixed(1)}
            </span>
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

      {/* Location Inventory / Available Products Section */}
      {isLocationRecord && nestedItems.length > 0 && (
        <div className={styles.locationInventorySection}>
          <div className={styles.locationInventoryHeader}>
            <h3 className={styles.locationInventoryTitle}>
              <span>{bookingCategory.isVehicle ? "🚗" : bookingCategory.isLodging ? "🏨" : "📍"}</span>
              <span>Available at this Location ({nestedItems.length})</span>
            </h3>
            <p className={styles.locationInventorySubtitle}>
              Select an option below to view its full details, availability, and
              booking options.
            </p>
          </div>

          <div className={styles.locationInventoryGrid}>
            {nestedItems.map((item: Record<string, any>, idx: number) => {
              const itemTitle = (
                item.make && item.model
                  ? `${item.make} ${item.model}`
                  : item.name ||
                    item.title ||
                    item.$title ||
                    `Option ${idx + 1}`
              ).trim();
              const itemImg =
                extractFirstImageUrl(item.image) ||
                extractFirstImageUrl(item.thumbnail) ||
                extractFirstImageUrl(item.$image) ||
                extractFirstImageUrl(item.images);
              const priceVal =
                item.dailyRate || item.price || item.rate || item.cost;
              const curr =
                item.currencySymbol ||
                item.symbol ||
                (typeof item.currency === "string" && item.currency ? `${item.currency} ` : "") ||
                priceInfo.symbol ||
                "$";
              const priceStr = priceVal
                ? `${curr}${typeof priceVal === "number" ? priceVal.toLocaleString() : priceVal}`
                : null;
              const periodStr = item.dailyRate
                ? (bookingCategory.isLodging ? "/ night" : "/ day")
                : item.pricePeriod || "";

              const specs: string[] = [];
              if (item.category) specs.push(String(item.category));
              if (item.type) specs.push(String(item.type));
              if (item.transmission) specs.push(String(item.transmission));
              if (item.seats) specs.push(`${item.seats} seats`);
              if (item.rooms || item.bedrooms) specs.push(`${item.rooms || item.bedrooms} beds`);
              if (item.fuelType) specs.push(String(item.fuelType));
              if (item.year) specs.push(String(item.year));

              return (
                <div
                  key={String(item.id || item._id || idx)}
                  className={styles.locationItemCard}
                  onClick={() => setSelectedChildItem(item)}
                >
                  {itemImg && (
                    <div className={styles.locationItemImageWrap}>
                      {renderImage(itemImg, itemTitle, "cover")}
                    </div>
                  )}
                  <div className={styles.locationItemBody}>
                    <h4 className={styles.locationItemTitle}>{itemTitle}</h4>
                    {specs.length > 0 && (
                      <div className={styles.locationItemSpecs}>
                        {specs.map((sp, sIdx) => (
                          <span
                            key={sIdx}
                            className={styles.locationItemSpecChip}
                          >
                            {sp}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className={styles.locationItemFooter}>
                      {priceStr ? (
                        <div className={styles.locationItemPrice}>
                          {priceStr}{" "}
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 400,
                              color: "#94a3b8",
                            }}
                          >
                            {periodStr}
                          </span>
                        </div>
                      ) : (
                        <span
                          style={{
                            fontSize: 11,
                            color: "#22c55e",
                            fontWeight: 600,
                          }}
                        >
                          Available
                        </span>
                      )}
                      <button
                        type="button"
                        className={styles.locationItemCtaBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedChildItem(item);
                        }}
                      >
                        View Option &rarr;
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
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
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <h2 className={styles.bookingRatePrice}>{priceInfo.display}</h2>
              {priceInfo.originalDisplay && (
                <span className={styles.bookingOriginalPrice}>
                  {priceInfo.originalDisplay}
                </span>
              )}
            </div>
            {priceInfo.period && (
              <span className={styles.bookingRatePeriod}>
                {priceInfo.period}
              </span>
            )}
          </div>
        )}

        {/* ----------------- RENTAL / BOOKING CARD ------------------ */}
        {isRental ? (
          <>
            {/* Calendar: always show for rental items. Shows booked dates as
                disabled, available dates as selectable. When there is no
                booking data at all, shows a note prompting the user to select
                dates for an availability check. */}
            {!allVisibleDatesBlocked ? (
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

                    const isPast = item.dateStr
                      ? item.dateStr < todayStr
                      : false;
                    const isBooked = item.dateStr
                      ? bookedDatesSet.has(item.dateStr)
                      : false;
                    const isUnavailable = item.dateStr
                      ? availableDatesSet.size > 0 &&
                        !availableDatesSet.has(item.dateStr)
                      : false;
                    const isDisabled = isPast || isBooked || isUnavailable;

                    return (
                      <button
                        key={`day-${item.dateStr}`}
                        type="button"
                        disabled={isDisabled}
                        title={
                          isBooked
                            ? "Booked / Unavailable"
                            : isUnavailable
                              ? "Unavailable"
                              : isPast
                                ? "Past date"
                                : undefined
                        }
                        className={`${styles.calDay} ${
                          isStart || isEnd
                            ? styles.calDaySelected
                            : inRange
                              ? styles.calDayInRange
                              : isBooked
                                ? styles.calDayBooked
                                : isPast || isUnavailable
                                  ? styles.calDayDisabled
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
                  {noBookingData && !pickupDate
                    ? "Select dates to check availability"
                    : pickupDate && dropoffDate
                      ? `${rentalDays} ${rentalDays === 1 ? bookingCategory.unitLabel : bookingCategory.unitPlural} selected (${pickupDate} to ${dropoffDate})`
                      : pickupDate
                        ? `${bookingCategory.startLabel}: ${pickupDate} — Select ${bookingCategory.endLabel.toLowerCase()}`
                        : `Select ${bookingCategory.startLabel.toLowerCase()}`}
                </p>
              </div>
            ) : (
              <>
                {allVisibleDatesBlocked && (
                  <p
                    className={styles.calStatusNote}
                    style={{ marginBottom: 8 }}
                  >
                    All dates in this period are booked. Select dates manually
                    below — we'll check for the next available slot.
                  </p>
                )}
                <div className={styles.bookingField}>
                  <label className={styles.fieldLabel}>{bookingCategory.startLabel}</label>
                  <input
                    type="date"
                    className={styles.selectInput}
                    min={todayStr}
                    value={pickupDate}
                    onChange={(e) => {
                      const v = e.target.value;
                      setPickupDate(v);
                      if (dropoffDate && dropoffDate <= v) setDropoffDate("");
                    }}
                  />
                </div>
                <div className={styles.bookingField}>
                  <label className={styles.fieldLabel}>{bookingCategory.endLabel}</label>
                  <input
                    type="date"
                    className={styles.selectInput}
                    min={pickupDate || todayStr}
                    value={dropoffDate}
                    onChange={(e) => setDropoffDate(e.target.value)}
                  />
                </div>
              </>
            )}

            {/* Location Selector (Dynamic based on data) */}
            {hasMultipleLocations ? (
              <>
                <div className={styles.bookingField}>
                  <label className={styles.fieldLabel}>{bookingCategory.locationLabel}</label>
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

                {hasDropoffLocationSupport && (
                  <div className={styles.bookingField}>
                    <label className={styles.fieldLabel}>{bookingCategory.dropoffLabel}</label>
                    <select
                      className={styles.selectInput}
                      value={selectedDropoffLocId}
                      onChange={(e) => setSelectedDropoffLocId(e.target.value)}
                    >
                      <option value="same">Same as {bookingCategory.locationLabel.toLowerCase()}</option>
                      {availableLocations.map((loc) => (
                        <option key={`drop-${loc.id}`} value={loc.id}>
                          {loc.displayName}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </>
            ) : staticLocationName ? (
              <div className={styles.bookingField}>
                <label className={styles.fieldLabel}>{bookingCategory.locationLabel}</label>
                <div className={styles.staticLocationInfo}>
                  <span className={styles.staticLocationIcon}>📍</span>
                  <span className={styles.staticLocationText}>{staticLocationName}</span>
                </div>
              </div>
            ) : null}

            {/* Optional Protection / Insurance Plans - only rendered if returned by API */}
            {insuranceOptions.length > 0 && (
              <div className={styles.insuranceSection}>
                <label className={styles.fieldLabel}>🛡️ Protection & Coverage</label>
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
                        {opt.description ? (
                          <span className={styles.insuranceDesc}>
                            {opt.description}
                          </span>
                        ) : null}
                      </div>
                    </label>
                  );
                })}
              </div>
            )}

            {/* Price Calculation Breakdown */}
            <div className={styles.costBreakdown}>
              <div className={styles.costRow}>
                <span>
                  {priceInfo.display} × {rentalDays}{" "}
                  {rentalDays === 1 ? bookingCategory.unitLabel : bookingCategory.unitPlural}
                </span>
                <span>
                  {currencyPrefix}
                  {subtotalCost.toLocaleString()}
                </span>
              </div>
              {insuranceTotalCost > 0 && activeInsuranceTier && (
                <div className={styles.costRow}>
                  <span>Protection ({activeInsuranceTier.name})</span>
                  <span>
                    {currencyPrefix}
                    {insuranceTotalCost.toLocaleString()}
                  </span>
                </div>
              )}
              <div className={styles.costTotalRow}>
                <span>Total</span>
                <span>
                  {currencyPrefix}
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
                          setSelectedOptions((prev) => ({
                            ...prev,
                            [g.key]: val,
                          }))
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
            {!isLocationRecord && (
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

            {/* Action Buttons: Add to Cart and Buy Now — only for product purpose (never for physical locations/branches/shops) */}
            {collection?.purpose !== "profile" &&
              collection?.purpose !== "utility" &&
              collection?.purpose !== "analytics" &&
              !isLocationRecord && (
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
                    onClick={
                      checkoutUrl ? handleBuyNowOrBook : handleBuyNowWithCart
                    }
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
              )}

            {!isLocationRecord && (
              <p className={styles.bookingNote}>
                You won't be charged yet — review and confirm on the next step.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  ) : null;

  return (
    <div
      className={`${styles.container} ${isDocked ? styles.containerDocked : ""}`}
      style={{ ["--widget-accent" as any]: themeColor }}
    >
      {canGoBack && (
        <button
          type="button"
          className={styles.backBtn}
          onClick={handleBack}
          aria-label={backText}
        >
          &larr; {backText}
        </button>
      )}

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
