import React, { useEffect } from "react";
import { getProxiedImageUrl, getRawImageUrl } from "../../helper/RenderImage/getproxiedimageurl";
import styles from "../../../../styles/imagelightbox.module.css";

export interface ImageLightboxProps {
  src: string | null;
  alt?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ImageLightbox: React.FC<ImageLightboxProps> = ({
  src,
  alt = "Preview",
  isOpen,
  onClose,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !src) return null;

  const proxied = getProxiedImageUrl(src) || getRawImageUrl(src) || src;

  return (
    <div
      className={`${styles.backdrop} ${isOpen ? styles.backdropOpen : ""}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
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
        <img src={proxied} alt={alt} className={styles.image} />
        {alt && <p className={styles.caption}>{alt}</p>}
      </div>
    </div>
  );
};
