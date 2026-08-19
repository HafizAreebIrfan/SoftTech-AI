import React, { useState } from "react";
import styles from "../../../../styles/fieldrenderer.module.css";
import { getProxiedImageUrl, getRawImageUrl } from "./getproxiedimageurl";
import { RenderImageProps } from "../../../../interfaces/mcp/renderimageprops.interface";

import { getWeatherConditionSvg } from "../../../../assets/icons/WeatherIcons";

export const renderImage = (value: unknown, alt = "Image"): React.ReactNode => {
  return <ImageField value={value} alt={alt} />;
};

const ImageField: React.FC<RenderImageProps> = ({ value, alt }) => {
  const rawSrc = getRawImageUrl(value);
  const proxiedSrc = getProxiedImageUrl(value);

  const [currentSrc, setCurrentSrc] = useState<string | null>(
    proxiedSrc || rawSrc,
  );
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    if (currentSrc === proxiedSrc && rawSrc && rawSrc !== proxiedSrc) {
      setCurrentSrc(rawSrc);
    } else {
      setHasError(true);
    }
  };

  if (hasError || !currentSrc) {
    return <ImageFallback alt={alt} />;
  }

  return (
    <div className={styles.imageWrapper}>
      <img
        src={currentSrc}
        alt={alt}
        className={styles.image}
        loading="lazy"
        onError={handleError}
      />
    </div>
  );
};

const ImageFallback: React.FC<{ alt?: string }> = ({ alt }) => {
  if (alt && /weather|rain|cloud|sun|clear|patchy|overcast|snow|drizzle|thunder/i.test(alt)) {
    return (
      <div className={styles.imageFallback} style={{ background: "transparent", border: "none" }}>
        {getWeatherConditionSvg(alt, 36)}
      </div>
    );
  }
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
