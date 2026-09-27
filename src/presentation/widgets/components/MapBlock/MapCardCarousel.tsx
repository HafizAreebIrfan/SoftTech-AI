import React, { useRef, useEffect } from "react";
import styles from "../../../../styles/mapblock.module.css";
import { MapCardItem } from "./MapCardItem";

interface MapCardCarouselProps {
  records: Array<Record<string, any>>;
  selectedIndex: number;
  fields?: Array<Record<string, any>>;
  actions?: any[];
  isDockOpen?: boolean;
  onSelect: (record: Record<string, any>, index: number) => void;
  onOpenDetail?: (record: Record<string, any>, index: number) => void;
}

export const MapCardCarousel: React.FC<MapCardCarouselProps> = ({
  records,
  selectedIndex,
  fields = [],
  actions = [],
  isDockOpen = false,
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

  // Infinite loop navigation
  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (records.length <= 1) return;
    const nextIdx = (selectedIndex - 1 + records.length) % records.length;
    if (records[nextIdx]) {
      onSelect(records[nextIdx], nextIdx);
    }
  };

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (records.length <= 1) return;
    const nextIdx = (selectedIndex + 1) % records.length;
    if (records[nextIdx]) {
      onSelect(records[nextIdx], nextIdx);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (trackRef.current && e.deltaY !== 0) {
      trackRef.current.scrollLeft += e.deltaY;
    }
  };

  if (!records || records.length === 0) return null;

  return (
    <div
      className={`${styles.carouselOverlay} ${isDockOpen ? styles.carouselOverlayDockOpen : ""}`}
    >
      {/* Floating arrows loop indefinitely (desktop only; mobile swipes). */}
      {records.length > 1 && (
        <button
          type="button"
          className={`${styles.carouselNavBtn} ${styles.carouselNavPrev}`}
          onClick={handlePrev}
          aria-label="Previous card"
        >
          ‹
        </button>
      )}

      <div
        className={styles.carouselTrack}
        ref={trackRef}
        onWheel={handleWheel}
      >
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
          aria-label="Next card"
        >
          ›
        </button>
      )}
    </div>
  );
};
