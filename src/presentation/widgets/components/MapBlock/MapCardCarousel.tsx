import React, { useRef, useEffect } from "react";
import styles from "../../../../styles/mapblock.module.css";
import { MapCardItem } from "./MapCardItem";

interface MapCardCarouselProps {
  records: Array<Record<string, any>>;
  selectedIndex: number;
  fields?: Array<Record<string, any>>;
  actions?: any[];
  onSelect: (record: Record<string, any>, index: number) => void;
  onOpenDetail?: (record: Record<string, any>, index: number) => void;
}

export const MapCardCarousel: React.FC<MapCardCarouselProps> = ({
  records,
  selectedIndex,
  fields = [],
  actions = [],
  onSelect,
  onOpenDetail,
}) => {
  const trackRef = useRef<HTMLDivElement>(null);

  // Auto-scroll the selected card into view when the map selection changes.
  useEffect(() => {
    if (!trackRef.current) return;
    const cardEl = trackRef.current.children[selectedIndex] as HTMLElement;
    if (cardEl) {
      cardEl.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  }, [selectedIndex]);

  const handlePrev = () => {
    const nextIdx = Math.max(0, selectedIndex - 1);
    if (records[nextIdx]) {
      onSelect(records[nextIdx], nextIdx);
    }
  };

  const handleNext = () => {
    const nextIdx = Math.min(records.length - 1, selectedIndex + 1);
    if (records[nextIdx]) {
      onSelect(records[nextIdx], nextIdx);
    }
  };

  if (!records || records.length === 0) return null;

  return (
    <div className={styles.carouselOverlay}>
      {/* Floating arrows sit ON the cards (desktop only; mobile swipes). */}
      {records.length > 1 && (
        <button
          type="button"
          className={`${styles.carouselNavBtn} ${styles.carouselNavPrev}`}
          onClick={handlePrev}
          disabled={selectedIndex === 0}
          aria-label="Previous"
        >
          ‹
        </button>
      )}

      <div className={styles.carouselTrack} ref={trackRef}>
        {records.map((rec, idx) => (
          <div
            key={rec.id || rec._id || `carousel-card-${idx}`}
            className={styles.carouselCardItem}
          >
            <MapCardItem
              record={rec}
              fields={fields}
              actions={actions}
              isActive={idx === selectedIndex}
              onSelect={() => (onOpenDetail || onSelect)(rec, idx)}
            />
          </div>
        ))}
      </div>

      {records.length > 1 && (
        <button
          type="button"
          className={`${styles.carouselNavBtn} ${styles.carouselNavNext}`}
          onClick={handleNext}
          disabled={selectedIndex === records.length - 1}
          aria-label="Next"
        >
          ›
        </button>
      )}
    </div>
  );
};
