import { env } from "../../../../infrastructure/config/env";

const API_BASE_URL = env.apiBaseUrl || "https://softtech-ai.onrender.com";

const OWN_HOSTS = new Set([
  "softtech-ai.onrender.com",
  "softtech-ai-app.onrender.com",
]);

export const getProxiedImageUrl = (value: unknown): string | null => {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  let src = value.trim();

  if (src.startsWith("//")) {
    src = `https:${src}`;
  }

  try {
    const url = new URL(src);

    /**
     * Already served by our backend.
     */
    if (OWN_HOSTS.has(url.hostname)) {
      return src;
    }

    /**
     * External image.
     *
     * Route through our backend so ChatGPT's CSP only
     * needs to allow our own domain.
     */
    return `${API_BASE_URL}/api/image-proxy?url=${encodeURIComponent(src)}`;
  } catch {
    return null;
  }
};
