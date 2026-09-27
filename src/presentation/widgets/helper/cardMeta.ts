import { findCartAction } from "../../../infrastructure/store/cartStore";

/**
 * Generic, company/industry-agnostic derivations for a browsable "card"
 * (map card, grid catalog card). Everything here keys off field TYPE / value
 * SHAPE / structural key patterns / action verbs — never off entity, company
 * or industry names. Shared by MapCardItem and the grid CardItem so both cards
 * stay visually consistent without merging the components.
 */

interface FieldLike {
  key?: string;
  label?: string;
  type?: string;
  uiRole?: string;
  primary?: boolean;
}

// Keys that are structural, media, pricing, geo, or already shown elsewhere —
// never surfaced as a generic "spec" chip.
const EXCLUDE_KEY_RE =
  /(^_)|(^\$)|(^id$)|(_id$)|image|images|photo|thumbnail|thumb|icon|logo|banner|gallery|url|link|href|slug|price|pricing|cost|rate|fare|amount|charge|\bfee\b|currency|symbol|discount|percent|lat|latitude|lng|lon|longitude|geo|coord|description|about|summary|detail|title|name|created|updated|deleted|status|review|rating/i;

const humanize = (key: string): string =>
  key
    .replace(/[_-]+/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();

const isScalar = (v: unknown): v is string | number | boolean =>
  typeof v === "string" || typeof v === "number" || typeof v === "boolean";

export interface SpecChip {
  key: string;
  label: string;
  value: string;
}

/**
 * Up to `max` short scalar attributes to show as spec chips. Prefers the
 * backend-declared `fields` (curated), falling back to a direct record scan.
 */
export const deriveSpecChips = (
  record: Record<string, any>,
  fields: FieldLike[] = [],
  max = 3,
): SpecChip[] => {
  const chips: SpecChip[] = [];

  const pushChip = (key: string, label: string, raw: unknown) => {
    if (chips.length >= max) return;
    if (raw === undefined || raw === null || raw === "") return;
    if (typeof raw === "boolean") {
      if (!raw) return; // skip disabled/false flags
      chips.push({ key, label, value: label });
      return;
    }
    const str = String(raw).trim();
    if (!str || str.length > 24) return;
    chips.push({ key, label, value: str });
  };

  const usableFields = (fields || []).filter(
    (f) =>
      f &&
      f.key &&
      !f.primary &&
      !["image", "currency", "date", "datetime"].includes(String(f.type)) &&
      !EXCLUDE_KEY_RE.test(f.key),
  );

  for (const f of usableFields) {
    if (chips.length >= max) break;
    pushChip(f.key!, f.label || humanize(f.key!), record[f.key!]);
  }

  if (chips.length < max) {
    for (const [k, v] of Object.entries(record || {})) {
      if (chips.length >= max) break;
      if (chips.some((c) => c.key === k)) continue;
      if (EXCLUDE_KEY_RE.test(k)) continue;
      if (!isScalar(v)) continue;
      pushChip(k, humanize(k), v);
    }
  }

  return chips;
};

/** A short human location label, if the record carries one. */
export const deriveLocationText = (
  record: Record<string, any>,
): string | null => {
  const loc = record?.location;
  if (loc && typeof loc === "object") {
    return loc.city || loc.name || loc.address || loc.label || loc.area || null;
  }
  if (typeof loc === "string" && loc.trim()) return loc.trim();
  return (
    record?.city ||
    record?.address ||
    record?.locationName ||
    record?.area ||
    record?.branch ||
    null
  );
};

const POSITIVE_STATUS_RE = /(avail|active|open|in.?stock|ready|confirmed|free)/i;
const NEGATIVE_STATUS_RE =
  /(unavail|sold|out.?of|booked|closed|inactive|reserved|pending|cancel)/i;

export interface StatusBadge {
  text: string;
  tone: "positive" | "negative" | "neutral";
}

/** A short status/availability badge, tone inferred from the value wording. */
export const deriveStatusBadge = (
  record: Record<string, any>,
  fields: FieldLike[] = [],
): StatusBadge | null => {
  let raw: unknown;
  const statusField = (fields || []).find(
    (f) =>
      f?.type === "status" ||
      (f?.key && /status|availab|condition/i.test(f.key)),
  );
  if (statusField?.key) raw = record?.[statusField.key];
  if (raw === undefined || raw === null || raw === "") {
    raw = record?.status ?? record?.availability ?? record?.condition;
  }
  if (raw === undefined || raw === null || raw === "") return null;
  const text = String(raw).trim();
  if (!text || text.length > 20) return null;
  const tone = POSITIVE_STATUS_RE.test(text)
    ? "positive"
    : NEGATIVE_STATUS_RE.test(text)
      ? "negative"
      : "neutral";
  return { text, tone };
};

/** Primary CTA label chosen from the company's registered action verbs. */
export const deriveCtaLabel = (actions: any[] = []): string => {
  const act = findCartAction(actions) as { id?: string; tool?: string } | undefined;
  if (!act) return "View details →";
  const text = `${act.id ?? ""} ${act.tool ?? ""}`.toLowerCase();
  if (/book|reserve|rent|appointment|schedule/.test(text)) return "Book now →";
  if (/cart|bag/.test(text)) return "Add to cart →";
  if (/order|buy|purchase|checkout/.test(text)) return "Order now →";
  return "Select →";
};

/* ------------------------------------------------------------------ *
 * Favourite / wishlist detection (verb-based, mirrors findCartAction).
 * ------------------------------------------------------------------ */

const FAVOURITE_ACTION_RE = /(favou?rite|wishlist|bookmark|\bsave\b|\bsaved\b)/i;
const FAVOURITE_ACTION_EXCLUDE_RE = /(get|list|view|show|search|fetch|read|all)/i;

export const findFavouriteAction = <T extends { id?: string; tool?: string }>(
  actions: T[] = [],
): T | undefined =>
  actions.find((a) => {
    if (!a || !a.tool) return false;
    const text = `${a.id ?? ""} ${a.tool ?? ""}`.toLowerCase();
    if (FAVOURITE_ACTION_EXCLUDE_RE.test(text)) return false;
    return FAVOURITE_ACTION_RE.test(text);
  });

const FAVOURITE_FIELD_RE = /(isfavou?rite|favou?rite|wishlist|bookmark|saved)/i;

/** The record's own favourite/wishlist flag key, if any. */
export const findFavouriteField = (
  record: Record<string, any>,
): string | null => {
  for (const k of Object.keys(record || {})) {
    if (FAVOURITE_FIELD_RE.test(k)) return k;
  }
  return null;
};
