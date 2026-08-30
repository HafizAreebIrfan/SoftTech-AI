import { IApi } from "../../../../domain/types/company.types";

/**
 * Deterministic "Search Recovery" helpers.
 *
 * Many upstream APIs (e.g. dummyjson, most SQL "LIKE" searches, exact-match
 * engines) return an empty collection when the query does not match verbatim.
 * A user asking for "shirts for men" becomes q="men shirts", which matches
 * nothing even though a men's shirt exists.
 *
 * These helpers let the API handler relax such queries generically for ANY
 * company/entity (products, orders, packages, hotels, cars, ...) without
 * hard-coding a single domain. They are pure functions with no HTTP or
 * framework dependency so they stay easy to test.
 */

export interface SearchRecoveryInfo {
  recovered?: boolean;
  empty?: boolean;
  originalQuery?: string;
  effectiveQuery?: string;
}

// Common parameter names that represent a free-text search across companies.
// Intentionally excludes exact-lookup fields like "name"/"id" so we never
// relax a precise fetch-by-identifier call.
const SEARCH_PARAM_KEYS = new Set([
  "q",
  "query",
  "search",
  "searchterm",
  "searchquery",
  "keyword",
  "keywords",
  "term",
  "text",
  "s",
]);

// Filler words that carry no search signal on their own.
const STOPWORDS = new Set([
  "for",
  "the",
  "a",
  "an",
  "and",
  "or",
  "of",
  "in",
  "on",
  "to",
  "with",
  "me",
  "my",
  "our",
  "show",
  "list",
  "find",
  "get",
  "all",
  "any",
  "some",
  "please",
]);

/**
 * Finds the first array anywhere in the response (shallow first, then nested),
 * regardless of the wrapper key. Works for `[...]`, `{ products: [...] }`,
 * `{ data: { items: [...] } }`, etc.
 */
const findFirstArray = (value: any): any[] | null => {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== "object") return null;

  for (const child of Object.values(value)) {
    if (Array.isArray(child)) return child;
  }

  for (const child of Object.values(value)) {
    if (child && typeof child === "object") {
      const nested = findFirstArray(child);
      if (nested) return nested;
    }
  }

  return null;
};

/**
 * Generic "did this search come back empty?" check. Treats an empty collection
 * array, or an explicit zero total/count, as empty. A scalar or a single
 * object (no collection array) is NOT considered an empty search result, so we
 * never relax a legitimate single-record response.
 */
export const isEmptyResult = (response: any): boolean => {
  if (response === null || response === undefined) return true;
  if (Array.isArray(response)) return response.length === 0;
  if (typeof response !== "object") return false;

  const collection = findFirstArray(response);
  if (collection) return collection.length === 0;

  for (const key of [
    "total",
    "count",
    "totalResults",
    "totalCount",
    "totalItems",
  ]) {
    if (typeof response[key] === "number" && response[key] === 0) return true;
  }

  return false;
};

/**
 * Toggles a word between singular and plural using light, language-agnostic
 * heuristics. Returns "" when no sensible variant exists.
 */
export const toggleNumber = (word: string): string => {
  const value = word.trim();
  if (value.length < 3) return "";
  const lower = value.toLowerCase();

  // Plural -> singular
  if (lower.endsWith("ies")) return `${value.slice(0, -3)}y`;
  if (/(ses|xes|zes|ches|shes)$/.test(lower)) return value.slice(0, -2);
  if (lower.endsWith("s") && !lower.endsWith("ss")) return value.slice(0, -1);

  // Singular -> plural
  if (/(s|x|z|ch|sh)$/.test(lower)) return `${value}es`;
  if (lower.endsWith("y") && !/[aeiou]y$/.test(lower))
    return `${value.slice(0, -1)}ies`;
  return `${value}s`;
};

/**
 * Builds an ordered list of relaxed query candidates for an original search
 * string. Strategy (option 1 – tokenize, then drop):
 *   1. Each significant word, head-noun first (e.g. "men shirts" -> "shirts").
 *   2. Its singular/plural variant (e.g. "shirts" -> "shirt").
 *   3. An empty string as the final fallback => omit the query entirely and
 *      return the full catalog/list.
 * Capped so we never hammer the upstream API.
 */
export const buildRelaxedQueries = (original: string): string[] => {
  const value = String(original || "").trim();
  const nonEmpty: string[] = [];

  const add = (candidate: string) => {
    const trimmed = candidate.trim();
    if (!trimmed || trimmed === value || nonEmpty.includes(trimmed)) return;
    nonEmpty.push(trimmed);
  };

  const tokens = value
    .split(/[^a-zA-Z0-9]+/)
    .map((token) => token.trim())
    .filter(Boolean);

  const significant = tokens.filter(
    (token) => token.length >= 2 && !STOPWORDS.has(token.toLowerCase()),
  );

  // Head-noun heuristic: the last words in English are usually the subject,
  // so try them first ("men shirts" -> "shirts" -> "shirt").
  for (const token of [...significant].reverse()) {
    add(token);
    add(toggleNumber(token));
  }

  // Single-token searches: also try toggling the whole phrase.
  if (significant.length <= 1) {
    add(toggleNumber(value));
  }

  const relaxed = nonEmpty.slice(0, 4);
  relaxed.push(""); // final fallback: drop the query -> full list/catalog
  return relaxed;
};

/**
 * Detects whether this API exposes a free-text search parameter and, if the
 * caller supplied a value for it, returns the api-side key, the input-side
 * name, and the current value. Returns null when there is nothing to relax.
 */
export const detectSearchParam = (
  api: IApi,
  input: any,
): { key: string; inputName: string; value: string } | null => {
  const flat: Record<string, any> = {
    ...(input && typeof input === "object" && input.params &&
    typeof input.params === "object"
      ? input.params
      : {}),
    ...(input && typeof input === "object" ? input : {}),
  };

  const params = Array.isArray(api.params) ? api.params : [];

  for (const param of params) {
    if (!param || param.isDynamic === false) continue;

    const key = String(param.key || "")
      .replace(/^\{|\}$/g, "")
      .trim();
    if (!key) continue;

    const inputName = String(param.inputName || key).trim();

    const isSearchField =
      SEARCH_PARAM_KEYS.has(key.toLowerCase()) ||
      SEARCH_PARAM_KEYS.has(inputName.toLowerCase());
    if (!isSearchField) continue;

    const raw = flat[inputName] ?? flat[key];
    if (typeof raw === "string" && raw.trim()) {
      return { key, inputName, value: raw.trim() };
    }
  }

  return null;
};
