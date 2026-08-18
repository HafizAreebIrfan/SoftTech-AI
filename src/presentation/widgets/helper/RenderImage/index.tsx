import React, { useState, useEffect } from "react";
import styles from "../../../../styles/fieldrenderer.module.css";
import { getProxiedImageUrl, getRawImageUrl } from "./getproxiedimageurl";
import { RenderImageProps } from "../../../../interfaces/mcp/renderimageprops.interface";

export const renderImage = (value: unknown, alt = "Image"): React.ReactNode => {
  return <ImageField value={value} alt={alt} />;
};

const ImageField: React.FC<RenderImageProps> = ({ value, alt }) => {
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const proxiedSrc = getProxiedImageUrl(value);
  const rawSrc = getRawImageUrl(value);

  useEffect(() => {
    let isMounted = true;
    let createdBlobUrl: string | null = null;

    const loadImage = async () => {
      const targetUrl = rawSrc || proxiedSrc;

      if (!targetUrl) {
        if (isMounted) {
          setHasError(true);
          setIsLoading(false);
        }
        return;
      }

      if (targetUrl.startsWith("data:") || targetUrl.startsWith("blob:")) {
        if (isMounted) {
          setImgSrc(targetUrl);
          setIsLoading(false);
        }
        return;
      }

      try {
        const response = await fetch(targetUrl, { mode: "cors" });
        if (response.ok) {
          const blob = await response.blob();
          if (isMounted) {
            createdBlobUrl = URL.createObjectURL(blob);
            setImgSrc(createdBlobUrl);
            setIsLoading(false);
            return;
          }
        }
      } catch {
        // Fall back to direct target URL if fetch fails
      }

      if (isMounted) {
        setImgSrc(targetUrl);
        setIsLoading(false);
      }
    };

    setIsLoading(true);
    setHasError(false);
    loadImage();

    return () => {
      isMounted = false;
      if (createdBlobUrl) {
        URL.revokeObjectURL(createdBlobUrl);
      }
    };
  }, [proxiedSrc, rawSrc]);

  if (hasError || (!isLoading && !imgSrc)) {
    return <ImageFallback />;
  }

  return (
    <div className={styles.imageWrapper}>
      <img
        src={imgSrc || undefined}
        alt={alt}
        className={styles.image}
        loading="lazy"
        onError={() => {
          setHasError(true);
        }}
      />
    </div>
  );
};

const ImageFallback: React.FC = () => {
  return (
    <div className={styles.imageFallback} aria-label="Image unavailable">
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <rect
          x="3"
          y="4"
          width="18"
          height="16"
          rx="2"
          stroke="currentColor"
          strokeWidth="1.5"
        />

        <circle cx="8" cy="9" r="1.5" stroke="currentColor" strokeWidth="1.5" />

        <path
          d="M4 17L9 12L13 16L16 13L20 17"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};
