import { env } from "../../../../infrastructure/config/env";

const API_BASE_URL = env.apiBaseUrl || "https://softtech-ai.onrender.com";

const OWN_HOSTS = new Set([
  "softtech-ai.onrender.com",
  "softtech-ai-app.onrender.com",
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

const normalizeImageUrl = (value: string): string | null => {
  let src = value.trim();

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

    if (OWN_HOSTS.has(url.hostname)) {
      return src;
    }

    return `${API_BASE_URL}/api/image-proxy?url=${encodeURIComponent(src)}`;
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

export const getProxiedImageUrl = (value: unknown): string | null => {
  return extractImageCandidate(value);
};
