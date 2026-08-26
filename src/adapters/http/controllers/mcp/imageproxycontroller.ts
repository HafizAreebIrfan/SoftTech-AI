import type { Request, Response } from "express";
import dns from "node:dns/promises";
import net from "node:net";

const isPrivateIPv4 = (ip: string): boolean => {
  const parts = ip.split(".").map(Number);

  if (parts.length !== 4 || parts.some(Number.isNaN)) {
    return true;
  }

  const [a, b] = parts;

  return (
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    a === 0
  );
};

const isPrivateIPv6 = (ip: string): boolean => {
  const normalized = ip.toLowerCase();

  return (
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe80:")
  );
};

const isPrivateAddress = (ip: string): boolean => {
  if (net.isIPv4(ip)) {
    return isPrivateIPv4(ip);
  }

  if (net.isIPv6(ip)) {
    return isPrivateIPv6(ip);
  }

  return true;
};

const validateImageUrl = async (rawUrl: string): Promise<URL> => {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(rawUrl);
  } catch {
    throw new Error("Invalid image URL");
  }

  if (parsedUrl.protocol !== "https:") {
    throw new Error("Only HTTPS image URLs are allowed");
  }

  const hostname = parsedUrl.hostname.toLowerCase();

  const addresses = await dns.lookup(hostname, {
    all: true,
  });

  if (!addresses.length) {
    throw new Error("Unable to resolve image host");
  }

  for (const address of addresses) {
    if (isPrivateAddress(address.address)) {
      throw new Error("Image host resolves to a private address");
    }
  }

  return parsedUrl;
};

export const imageProxyController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  /*
   * The ChatGPT sandbox is a different origin and enforces COEP: require-corp.
   * Cross-Origin-Resource-Policy: cross-origin is required so the iframe can display images.
   */
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader(
    "Access-Control-Expose-Headers",
    "Content-Type, Content-Length",
  );
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }


  const rawUrl = String(req.query.url ?? "").trim();

  if (!rawUrl) {
    res.status(400).json({
      success: false,
      message: "Missing image URL",
    });
    return;
  }

  try {
    const imageUrl = await validateImageUrl(rawUrl);

    const upstreamResponse = await fetch(imageUrl, {
      method: "GET",
      headers: {
        Accept:
          "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        "User-Agent": "SoftTech-AI-Image-Proxy/1.0",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!upstreamResponse.ok) {
      res.status(upstreamResponse.status).json({
        success: false,
        message: `Image provider returned HTTP ${upstreamResponse.status}`,
      });
      return;
    }

    const contentType =
      upstreamResponse.headers.get("content-type") ||
      "application/octet-stream";

    if (!contentType.toLowerCase().startsWith("image/")) {
      res.status(415).json({
        success: false,
        message: "Upstream resource is not an image",
      });
      return;
    }

    const contentLength = upstreamResponse.headers.get("content-length");

    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=86400");

    if (contentLength) {
      res.setHeader("Content-Length", contentLength);
    }

    const imageBuffer = Buffer.from(await upstreamResponse.arrayBuffer());

    res.status(200).send(imageBuffer);
  } catch (error) {
    console.error("[Image Proxy Error]", {
      url: rawUrl,
      error: error instanceof Error ? error.message : error,
    });

    if (error instanceof Error && error.name === "TimeoutError") {
      res.status(504).json({
        success: false,
        message: "Image provider timed out",
      });
      return;
    }

    res.status(502).json({
      success: false,
      message: "Unable to fetch image",
    });
  }
};
