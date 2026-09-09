import { env } from "../../../../infrastructure/config/env";

const API_BASE_URL = env.apiBaseUrl || "https://softtech-ai.onrender.com";

const OWN_HOSTS = new Set([
  "softtech-ai.onrender.com",
  "softtech-ai-app.onrender.com",
  "localhost",
  "127.0.0.1",
]);

const IMAGE_KEYS = [
  "url",
  "src",
  "href",
  "image",
  "img",
  "icon",
  "thumbnail",
  "avatar",
  "photo",
  "logo",
  "picture",
];

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

export const extractFirstImageUrl = (value: unknown): string | null => {
  if (!value) return null;

  if (Array.isArray(value)) {
    for (const item of value) {
      const candidate = extractFirstImageUrl(item);
      if (candidate) return candidate;
    }
    return null;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;

    // Handle comma-separated list of image URLs (common in backend APIs)
    const parts = trimmed.split(/,\s*(?=https?:\/\/|\/|data:|blob:)/i);
    for (const part of parts) {
      const clean = part.trim().replace(/^["']|["']$/g, "");
      if (clean.startsWith("/")) {
        try {
          return new URL(clean, API_BASE_URL).href;
        } catch {
          return clean;
        }
      }
      if (
        clean.startsWith("data:") ||
        clean.startsWith("blob:") ||
        clean.startsWith("//") ||
        /^https?:\/\//i.test(clean)
      ) {
        return clean;
      }
    }

    if (trimmed.startsWith("/")) {
      try {
        return new URL(trimmed, API_BASE_URL).href;
      } catch {
        return trimmed;
      }
    }

    if (
      trimmed.startsWith("data:") ||
      trimmed.startsWith("blob:") ||
      trimmed.startsWith("//") ||
      /^https?:\/\//i.test(trimmed)
    ) {
      return trimmed;
    }
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    for (const key of ["thumbnail", "image", "$image", "url", "src", "photo", "avatar", "images"]) {
      if (record[key]) {
        const candidate = extractFirstImageUrl(record[key]);
        if (candidate) return candidate;
      }
    }
  }

  return null;
};

export const extractAllImageUrls = (value: unknown): string[] => {
  if (!value) return [];

  if (Array.isArray(value)) {
    const urls: string[] = [];
    for (const item of value) {
      urls.push(...extractAllImageUrls(item));
    }
    return Array.from(new Set(urls));
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];

    // Split on comma followed by URL prefix (common in backend APIs)
    const parts = trimmed.split(/,\s*(?=https?:\/\/|\/|data:|blob:)/i);
    const urls: string[] = [];
    for (const part of parts) {
      const clean = part.trim().replace(/^["']|["']$/g, "");
      if (clean.startsWith("/")) {
        try {
          urls.push(new URL(clean, API_BASE_URL).href);
        } catch {
          urls.push(clean);
        }
      } else if (
        clean.startsWith("data:") ||
        clean.startsWith("blob:") ||
        clean.startsWith("//") ||
        /^https?:\/\//i.test(clean)
      ) {
        urls.push(clean);
      }
    }
    if (urls.length > 0) return urls;

    if (trimmed.startsWith("/")) {
      try {
        return [new URL(trimmed, API_BASE_URL).href];
      } catch {
        return [trimmed];
      }
    }

    if (
      trimmed.startsWith("data:") ||
      trimmed.startsWith("blob:") ||
      trimmed.startsWith("//") ||
      /^https?:\/\//i.test(trimmed)
    ) {
      return [trimmed];
    }
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const urls: string[] = [];
    for (const key of ["images", "thumbnail", "image", "$image", "url", "src", "photo", "avatar"]) {
      if (record[key]) {
        urls.push(...extractAllImageUrls(record[key]));
      }
    }
    return Array.from(new Set(urls));
  }

  return [];
};

const normalizeImageUrl = (value: string): string | null => {
  const single = extractFirstImageUrl(value) || value.trim();
  let src = single.trim();

  if (src.startsWith("data:") || src.startsWith("blob:")) {
    return src;
  }

  if (src.startsWith("//")) {
    src = `https:${src}`;
  } else if (src.startsWith("/")) {
    try {
      src = new URL(src, API_BASE_URL).href;
    } catch {
      return null;
    }
  }

  try {
    const url = new URL(src);

    // If it's an own host or a standard public image URL, return directly.
    // HTML <img> tags load cross-origin images natively without CORS.
    // Routing through a remote image-proxy causes CORS blocks when Render sleeps.
    if (url.protocol === "http:" || url.protocol === "https:") {
      return src;
    }

    return src;
  } catch {
    return null;
  }
};

const extractImageCandidate = (value: unknown, depth = 0): string | null => {
  if (isNonEmptyString(value)) {
    return normalizeImageUrl(value);
  }

  if (!value || typeof value !== "object" || depth > 2) {
    return null;
  }

  const record = value as Record<string, unknown>;

  for (const key of IMAGE_KEYS) {
    const candidate = extractImageCandidate(record[key], depth + 1);
    if (candidate) {
      return candidate;
    }
  }

  for (const nestedValue of Object.values(record)) {
    const candidate = extractImageCandidate(nestedValue, depth + 1);
    if (candidate) {
      return candidate;
    }
  }

  return null;
};

export const getRawImageUrl = (value: unknown): string | null => {
  const extracted = extractFirstImageUrl(value);
  if (extracted) {
    let src = extracted.trim();
    if (src.startsWith("//")) src = `https:${src}`;
    return src;
  }

  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;

  for (const key of IMAGE_KEYS) {
    if (record[key]) {
      const candidate = extractFirstImageUrl(record[key]);
      if (candidate) {
        let src = candidate.trim();
        if (src.startsWith("//")) src = `https:${src}`;
        return src;
      }
    }
  }

  return null;
};

export const getProxiedImageUrl = (value: unknown): string | null => {
  return extractImageCandidate(value);
};
