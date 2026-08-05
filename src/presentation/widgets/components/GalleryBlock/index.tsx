import React from "react";
import { WidgetGalleryImage } from "../../../../domain/entities/GenericWidget";
import styles from "../../../../styles/galleryblock.module.css";

interface GalleryBlockProps {
  title?: string;
  images: WidgetGalleryImage[];
}

export const GalleryBlock: React.FC<GalleryBlockProps> = ({ title, images = [] }) => {
  if (!images || images.length === 0) return null;

  return (
    <div className={styles.container}>
      {title && <h4 className={styles.title}>{title}</h4>}

      <div className={styles.grid}>
        {images.map((img, idx) => (
          <div key={idx} className={styles.item}>
            <img
              src={img.url}
              alt={img.title || `Gallery ${idx + 1}`}
              className={styles.image}
            />
            {img.title && <p className={styles.caption}>{img.title}</p>}
          </div>
        ))}
      </div>
    </div>
  );
};
