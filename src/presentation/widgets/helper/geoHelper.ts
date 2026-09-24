import { parseNumericPrice } from "../../../infrastructure/store/cartStore";

export interface GeoCoordinate {
  lat: number;
  lng: number;
}

export interface RatingInfo {
  score: number | null;
  scoreFormatted: string;
  reviewsCount: number | null;
  stars: number;
}

/**
 * Centroids for major metropolitan areas worldwide.
 * Used as an automatic fallback when an API only returns city/neighborhood
 * without exact latitude/longitude coordinates.
 */
const KNOWN_CITY_CENTROIDS: Record<string, GeoCoordinate> = {
  karachi: { lat: 24.8607, lng: 67.0011 },
  lahore: { lat: 31.5204, lng: 74.3587 },
  islamabad: { lat: 33.6844, lng: 73.0479 },
  rawalpindi: { lat: 33.5651, lng: 73.0169 },
  faisalabad: { lat: 31.4504, lng: 73.135 },
  multan: { lat: 30.1575, lng: 71.5249 },
  peshawar: { lat: 34.0151, lng: 71.5249 },
  dubai: { lat: 25.2048, lng: 55.2708 },
  "abu dhabi": { lat: 24.4539, lng: 54.3773 },
  doha: { lat: 25.2854, lng: 51.531 },
  riyadh: { lat: 24.7136, lng: 46.6753 },
  london: { lat: 51.5074, lng: -0.1278 },
  manchester: { lat: 53.4808, lng: -2.2426 },
  paris: { lat: 48.8566, lng: 2.3522 },
  berlin: { lat: 52.52, lng: 13.405 },
  amsterdam: { lat: 52.3676, lng: 4.9041 },
  "new york": { lat: 40.7128, lng: -74.006 },
  "san francisco": { lat: 37.7749, lng: -122.4194 },
  "los angeles": { lat: 34.0522, lng: -118.2437 },
  chicago: { lat: 41.8781, lng: -87.6298 },
  toronto: { lat: 43.6532, lng: -79.3832 },
  tokyo: { lat: 35.6762, lng: 139.6503 },
  singapore: { lat: 1.3521, lng: 103.8198 },
  sydney: { lat: -33.8688, lng: 151.2093 },
};

/**
 * Universally extracts geographic coordinates from any API/tool response record.
 * Supports:
 * - Direct: lat, lng, latitude, longitude
 * - Nested objects: location.lat, geo.lat, position.latitude, etc.
 * - GeoJSON coordinate arrays: [lng, lat]
 * - City centroid lookup with slight deterministic dispersion so items in the
 *   same city don't stack directly on top of each other.
 */
export const extractCoordinates = (
  rec: Record<string, any>,
  index = 0,
): GeoCoordinate | null => {
  if (!rec || typeof rec !== "object") return null;

  // 1. Direct or nested latitude / longitude candidates
  const latCandidate =
    rec.latitude ??
    rec.lat ??
    rec.geo?.latitude ??
    rec.geo?.lat ??
    rec.location?.latitude ??
    rec.location?.lat ??
    rec.position?.lat ??
    rec.position?.latitude ??
    rec.coords?.latitude ??
    rec.coords?.lat ??
    rec.coordinates?.latitude ??
    rec.coordinates?.lat ??
    rec.address?.latitude ??
    rec.address?.lat ??
    rec.point?.lat ??
    rec.point?.latitude ??
    rec.branch?.latitude ??
    rec.branch?.lat ??
    rec.store?.latitude ??
    rec.store?.lat;

  const lngCandidate =
    rec.longitude ??
    rec.lng ??
    rec.lon ??
    rec.long ??
    rec.geo?.longitude ??
    rec.geo?.lng ??
    rec.geo?.lon ??
    rec.geo?.long ??
    rec.location?.longitude ??
    rec.location?.lng ??
    rec.location?.lon ??
    rec.location?.long ??
    rec.position?.lng ??
    rec.position?.longitude ??
    rec.position?.lon ??
    rec.position?.long ??
    rec.coords?.longitude ??
    rec.coords?.lng ??
    rec.coords?.lon ??
    rec.coords?.long ??
    rec.coordinates?.longitude ??
    rec.coordinates?.lng ??
    rec.coordinates?.lon ??
    rec.coordinates?.long ??
    rec.address?.longitude ??
    rec.address?.lng ??
    rec.address?.lon ??
    rec.address?.long ??
    rec.point?.lng ??
    rec.point?.longitude ??
    rec.point?.lon ??
    rec.point?.long ??
    rec.branch?.longitude ??
    rec.branch?.lng ??
    rec.store?.longitude ??
    rec.store?.lng;

  const latNum = Number(latCandidate);
  const lngNum = Number(lngCandidate);

  if (
    isFinite(latNum) &&
    isFinite(lngNum) &&
    latNum >= -90 &&
    latNum <= 90 &&
    lngNum >= -180 &&
    lngNum <= 180 &&
    (latNum !== 0 || lngNum !== 0)
  ) {
    return { lat: latNum, lng: lngNum };
  }

  // 2. Comma-separated string coordinate (e.g. "24.8607, 67.0011" or "24.8607,67.0011")
  const strCandidate =
    (typeof rec.coordinates === "string" ? rec.coordinates : null) ||
    (typeof rec.coords === "string" ? rec.coords : null) ||
    (typeof rec.location === "string" ? rec.location : null) ||
    (typeof rec.geo === "string" ? rec.geo : null) ||
    (typeof rec.point === "string" ? rec.point : null);

  if (strCandidate && strCandidate.includes(",")) {
    const parts = strCandidate.split(",").map((s: string) => Number(s.trim()));
    if (parts.length >= 2 && isFinite(parts[0]) && isFinite(parts[1])) {
      const [pLat, pLng] = parts;
      if (Math.abs(pLat) <= 90 && Math.abs(pLng) <= 180 && (pLat !== 0 || pLng !== 0)) {
        return { lat: pLat, lng: pLng };
      }
    }
  }

  // 3. Coordinate array [lng, lat] or [lat, lng]
  const rawArray =
    (Array.isArray(rec.coordinates) ? rec.coordinates : null) ??
    (Array.isArray(rec.location?.coordinates) ? rec.location.coordinates : null) ??
    (Array.isArray(rec.geo?.coordinates) ? rec.geo.coordinates : null) ??
    (Array.isArray(rec.position?.coordinates) ? rec.position.coordinates : null);

  if (Array.isArray(rawArray) && rawArray.length >= 2) {
    const a = Number(rawArray[0]);
    const b = Number(rawArray[1]);
    if (isFinite(a) && isFinite(b)) {
      // GeoJSON standard is [longitude, latitude]
      if (Math.abs(b) <= 90 && Math.abs(a) <= 180) {
        return { lat: b, lng: a };
      }
      if (Math.abs(a) <= 90 && Math.abs(b) <= 180) {
        return { lat: a, lng: b };
      }
    }
  }

  // 4. Fallback: Lookup by city / area name with deterministic offset
  const cityName =
    rec.location?.city ||
    rec.city ||
    rec.location?.name ||
    rec.address?.city ||
    rec.destination;

  if (typeof cityName === "string" && cityName.trim()) {
    const key = cityName.toLowerCase().trim();
    const matchKey = Object.keys(KNOWN_CITY_CENTROIDS).find((k) =>
      key.includes(k),
    );
    if (matchKey) {
      const base = KNOWN_CITY_CENTROIDS[matchKey];
      // Deterministic pseudo-random offset (~1km - 3km) based on record ID / index
      const seed =
        (rec.id || rec._id || rec.title || String(index))
          .toString()
          .split("")
          .reduce((acc: number, c: string) => acc + c.charCodeAt(0), 0) +
        index * 13;
      const offsetLat = ((seed % 100) - 50) * 0.0006;
      const offsetLng = (((seed * 7) % 100) - 50) * 0.0006;
      return {
        lat: base.lat + offsetLat,
        lng: base.lng + offsetLng,
      };
    }
  }

  return null;
};

/**
 * Formats a clean, compact price string suitable for the map price pin badge
 * (e.g. "PKR 16,740" or "$120").
 */
export const formatMarkerPrice = (rec: Record<string, any>): string => {
  if (!rec || typeof rec !== "object") return "";

  // 1. Calculate price considering discounts or explicit sale price
  let rawPrice: unknown =
    rec.pricePerDay ?? rec.price_per_day ?? rec.$price ?? rec.price;
  if (rawPrice === undefined || rawPrice === null || rawPrice === "") {
    for (const [k, v] of Object.entries(rec)) {
      if (/(percent|discount|qty|quantity|count|stock)/i.test(k)) continue;
      if (
        /(price|rate|cost|amount|fee|fare|premium|charge)/i.test(k) &&
        (typeof v === "number" || (typeof v === "string" && /\d/.test(v)))
      ) {
        rawPrice = v;
        break;
      }
    }
  }

  const baseNum = parseNumericPrice(rawPrice);
  let finalNum = baseNum;

  // Sale price check
  const saleRaw =
    rec.salePrice ??
    rec.sale_price ??
    rec.discountedPrice ??
    rec.discount_price ??
    rec.specialPrice;
  const saleNum = saleRaw != null ? parseNumericPrice(saleRaw) : NaN;

  if (isFinite(saleNum) && saleNum > 0 && saleNum < baseNum) {
    finalNum = saleNum;
  } else {
    // Discount percentage
    const pctRaw =
      rec.discountPercentage ??
      rec.discount_percentage ??
      rec.discountPercent ??
      rec.discountRate;
    const pctNum = pctRaw != null ? Number(pctRaw) : NaN;
    if (isFinite(pctNum) && pctNum > 0 && pctNum < 100) {
      finalNum = Math.round(baseNum * (1 - pctNum / 100) * 100) / 100;
    }
  }

  if (isNaN(finalNum) || finalNum <= 0) {
    return typeof rawPrice === "string" && rawPrice.trim()
      ? rawPrice.trim()
      : "";
  }

  // Currency code / symbol
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
        maximumFractionDigits: 0,
      }).format(finalNum);
    } catch {}
  }

  const symbol =
    rec.currencySymbol ||
    rec.currency_symbol ||
    rec.symbol ||
    (typeof code === "string" && code.trim() ? `${code.trim()} ` : "$");

  const formattedNum = finalNum.toLocaleString(undefined, {
    maximumFractionDigits: finalNum % 1 !== 0 ? 2 : 0,
  });

  return `${symbol}${formattedNum}`.trim();
};

/**
 * Extracts rating score (e.g. 8.5), review count (e.g. 1277), and stars.
 */
export const extractRatingInfo = (rec: Record<string, any>): RatingInfo => {
  if (!rec || typeof rec !== "object") {
    return { score: null, scoreFormatted: "", reviewsCount: null, stars: 0 };
  }

  // Score
  let scoreRaw = rec.rating ?? rec.score ?? rec.reviewScore ?? rec.userRating;
  if (scoreRaw === undefined && rec.reviews && Array.isArray(rec.reviews)) {
    const scores = rec.reviews
      .map((r: any) => Number(r.rating || r.score))
      .filter((s: number) => isFinite(s) && s > 0);
    if (scores.length > 0) {
      scoreRaw = scores.reduce((a: number, b: number) => a + b, 0) / scores.length;
    }
  }

  const scoreNum = Number(scoreRaw);
  const score = isFinite(scoreNum) && scoreNum > 0 ? scoreNum : null;
  const scoreFormatted = score !== null ? score.toFixed(1) : "";

  // Stars: normalize score to 1–5 stars
  let stars = 0;
  if (rec.stars != null) {
    stars = Math.min(5, Math.max(1, Math.round(Number(rec.stars))));
  } else if (score !== null) {
    stars =
      score > 5
        ? Math.min(5, Math.max(1, Math.round((score / 10) * 5)))
        : Math.min(5, Math.max(1, Math.round(score)));
  }

  // Reviews count
  let reviewsCount: number | null = null;
  if (rec.reviewsCount != null) {
    reviewsCount = Number(rec.reviewsCount);
  } else if (rec.reviewCount != null) {
    reviewsCount = Number(rec.reviewCount);
  } else if (rec.totalReviews != null) {
    reviewsCount = Number(rec.totalReviews);
  } else if (Array.isArray(rec.reviews)) {
    reviewsCount = rec.reviews.length;
  }

  return {
    score,
    scoreFormatted,
    reviewsCount: isFinite(Number(reviewsCount)) ? reviewsCount : null,
    stars,
  };
};
