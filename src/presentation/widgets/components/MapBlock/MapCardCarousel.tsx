import React, { useRef, useEffect } from "react";
import styles from "../../../../styles/mapblock.module.css";
import { MapCardItem } from "./MapCardItem";

interface MapCardCarouselProps {
  records: Array<Record<string, any>>;
  selectedIndex: number;
  onSelect: (record: Record<string, any>, index: number) => void;
}

export const MapCardCarousel: React.FC<MapCardCarouselProps> = ({
  records,
  selectedIndex,
  onSelect,
}) => {
  const trackRef = useRef<HTMLDivElement>(null);

  // Auto-scroll selected card into view
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
      {records.length > 1 && (
        <button
          type="button"
          className={styles.carouselNavBtn}
          onClick={handlePrev}
          disabled={selectedIndex === 0}
          aria-label="Previous stay"
        >
          ‹
        </button>
      )}

      <div className={styles.carouselTrack} ref={trackRef}>
        {records.map((rec, idx) => (
          <div key={rec.id || rec._id || `carousel-card-${idx}`} className={styles.carouselCardItem}>
            <MapCardItem
              record={rec}
              isActive={idx === selectedIndex}
              onSelect={() => onSelect(rec, idx)}
            />
          </div>
        ))}
      </div>

      {records.length > 1 && (
        <button
          type="button"
          className={styles.carouselNavBtn}
          onClick={handleNext}
          disabled={selectedIndex === records.length - 1}
          aria-label="Next stay"
        >
          ›
        </button>
      )}
    </div>
  );
};
