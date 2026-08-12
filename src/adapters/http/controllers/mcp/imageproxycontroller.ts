import type { Request, Response } from "express";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB

/**
 * Hosts that are currently allowed to be proxied.
 *
 * Add more domains as your platform encounters legitimate
 * image providers.
 */
const ALLOWED_IMAGE_HOSTS = new Set(["cdn.weatherapi.com"]);

const isAllowedImageHost = (hostname: string): boolean => {
  return ALLOWED_IMAGE_HOSTS.has(hostname.toLowerCase());
};

const isPrivateOrLocalHostname = (hostname: string): boolean => {
  const host = hostname.toLowerCase();

  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "::1" ||
    host.startsWith("10.") ||
    host.startsWith("192.168.") ||
    host.startsWith("169.254.") ||
    host.endsWith(".local")
  );
};

export const imageProxyController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const targetUrl = req.query.url;

    if (typeof targetUrl !== "string" || !targetUrl.trim()) {
      res.status(400).json({
        message: "Image URL is required.",
      });
      return;
    }

    let parsedUrl: URL;

    try {
      parsedUrl = new URL(targetUrl);
    } catch {
      res.status(400).json({
        message: "Invalid image URL.",
      });
      return;
    }

    /**
     * Only HTTPS external resources should be proxied.
     */
    if (parsedUrl.protocol !== "https:") {
      res.status(400).json({
        message: "Only HTTPS image URLs are supported.",
      });
      return;
    }

    /**
     * Prevent obvious SSRF targets.
     */
    if (isPrivateOrLocalHostname(parsedUrl.hostname)) {
      res.status(403).json({
        message: "This image host is not allowed.",
      });
      return;
    }

    /**
     * Only proxy known/approved image hosts.
     */
    if (!isAllowedImageHost(parsedUrl.hostname)) {
      res.status(403).json({
        message: "This image host is not allowed.",
      });
      return;
    }

    const response = await fetch(parsedUrl.toString(), {
      method: "GET",
      redirect: "follow",
      headers: {
        Accept: "image/*",
      },
    });

    if (!response.ok) {
      res.status(response.status).json({
        message: "Unable to retrieve image.",
      });
      return;
    }

    const contentType = response.headers.get("content-type");

    if (!contentType || !contentType.startsWith("image/")) {
      res.status(415).json({
        message: "The requested resource is not an image.",
      });
      return;
    }

    const contentLength = response.headers.get("content-length");

    if (contentLength) {
      const size = Number(contentLength);

      if (Number.isFinite(size) && size > MAX_IMAGE_SIZE) {
        res.status(413).json({
          message: "Image is too large.",
        });
        return;
      }
    }

    const buffer = Buffer.from(await response.arrayBuffer());

    if (buffer.length > MAX_IMAGE_SIZE) {
      res.status(413).json({
        message: "Image is too large.",
      });
      return;
    }

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Length", buffer.length.toString());

    /**
     * Cache images because the same weather/product image
     * may be rendered multiple times.
     */
    res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=3600");

    res.send(buffer);
  } catch (error) {
    console.error("Image proxy error:", error);

    res.status(500).json({
      message: "Failed to load image.",
    });
  }
};
