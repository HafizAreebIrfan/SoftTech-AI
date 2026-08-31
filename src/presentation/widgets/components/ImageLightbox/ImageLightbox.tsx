import React, { useEffect, useCallback, useState } from "react";
import { createPortal } from "react-dom";
import { getProxiedImageUrl, getRawImageUrl } from "../../helper/RenderImage/getproxiedimageurl";
import styles from "../../../../styles/imagelightbox.module.css";

export interface ImageLightboxProps {
  src: string | null;
  alt?: string;
  isOpen: boolean;
  onClose: () => void;
  images?: string[];
  currentIndex?: number;
  onNavigate?: (index: number) => void;
}

export const ImageLightbox: React.FC<ImageLightboxProps> = ({
  src,
  alt = "Preview",
  isOpen,
  onClose,
  images = [],
  currentIndex = 0,
  onNavigate,
}) => {
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const hasMultiple = images.length > 1;

  const goToPrev = useCallback(() => {
    if (!hasMultiple || !onNavigate) return;
    const prev = currentIndex > 0 ? currentIndex - 1 : images.length - 1;
    onNavigate(prev);
  }, [currentIndex, images.length, hasMultiple, onNavigate]);

  const goToNext = useCallback(() => {
    if (!hasMultiple || !onNavigate) return;
    const next = currentIndex < images.length - 1 ? currentIndex + 1 : 0;
    onNavigate(next);
  }, [currentIndex, images.length, hasMultiple, onNavigate]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goToPrev();
      if (e.key === "ArrowRight") goToNext();
    };
    window.addEventListener("keydown", handleKeyDown);

    // Scroll to top and lock body scroll so the fixed backdrop covers
    // the current viewport (avoids issues when iframe is scrolled).
    const prevOverflow = document.body.style.overflow;
    window.scrollTo(0, 0);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose, goToPrev, goToNext]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const diff = touchStart - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goToNext();
      else goToPrev();
    }
    setTouchStart(null);
  };

  if (!isOpen || !src) return null;

  const activeSrc = images[currentIndex] || src;
  const proxied = getProxiedImageUrl(activeSrc) || getRawImageUrl(activeSrc) || activeSrc;

  const content = (
    <div
      className={`${styles.backdrop} ${isOpen ? styles.backdropOpen : ""}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      role="dialog"
      aria-modal="true"
    >
      <div className={styles.container}>
        <button
          type="button"
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Close image preview"
        >
          ✕
        </button>

        {hasMultiple && (
          <button
            type="button"
            className={styles.navButton}
            style={{ left: "12px" }}
            onClick={goToPrev}
            aria-label="Previous image"
          >
            ‹
          </button>
        )}

        <img src={proxied} alt={alt} className={styles.image} />

        {hasMultiple && (
          <button
            type="button"
            className={styles.navButton}
            style={{ right: "12px" }}
            onClick={goToNext}
            aria-label="Next image"
          >
            ›
          </button>
        )}

        {hasMultiple && (
          <div className={styles.counter}>
            {currentIndex + 1} / {images.length}
          </div>
        )}

        {hasMultiple && images.length <= 10 && (
          <div className={styles.thumbnailStrip}>
            {images.map((img, idx) => {
              const thumbProxied = getProxiedImageUrl(img) || getRawImageUrl(img) || img;
              return (
                <button
                  key={`lb-thumb-${idx}`}
                  type="button"
                  className={`${styles.thumb} ${idx === currentIndex ? styles.thumbActive : ""}`}
                  onClick={() => onNavigate?.(idx)}
                  aria-label={`View image ${idx + 1}`}
                >
                  <img src={thumbProxied} alt={`Thumbnail ${idx + 1}`} />
                </button>
              );
            })}
          </div>
        )}

        {alt && <p className={styles.caption}>{alt}</p>}
      </div>
    </div>
  );

  return createPortal(content, document.body);
};
