import React, { useState } from "react";
import styles from "../../../../styles/travel.module.css";

interface TravelScreenProps {
  title: string;
  subtitle?: string;
  blocks: any[];
  isPreview?: boolean;
  previewIndustry?: string;
  setPreviewIndustry?: (val: string) => void;
  renderPreviewControls?: (
    previewIndustry: string,
    setPreviewIndustry: (v: string) => void
  ) => React.ReactNode;
}

export const TravelScreen: React.FC<TravelScreenProps> = ({
  title,
  subtitle,
  blocks = [],
  isPreview,
  previewIndustry,
  setPreviewIndustry,
  renderPreviewControls,
}) => {
  const listBlock = blocks && Array.isArray(blocks) ? blocks.find((b) => b?.type === "list" || b?.type === "table") : null;
  const rawFlights = listBlock ? (listBlock.listItems || listBlock.tableRows || []) : [];
  
  const flights = rawFlights.length > 0 ? rawFlights : [
    { title: "JFK → LHR Express Flight (British Airways)", description: "Non-stop Boeing 787 Dreamliner • Business Class available", meta: "$840.00 • 6h 45m" },
    { title: "SFO → TYO Direct (All Nippon Airways)", description: "Direct Flight • Premium Economy with Lounge Access", meta: "$1,250.00 • 10h 15m" },
    { title: "Grand Hotel & Spa Bali (5-Star Resort)", description: "Oceanfront Deluxe Villa with Private Pool & Breakfast Included", meta: "$310.00 / night • 4.9 ★ Rating" }
  ];

  const [bookedId, setBookedId] = useState<string | null>(null);

  const handleBook = (id: string) => {
    setBookedId(id);
    setTimeout(() => setBookedId(null), 3000);
  };

  return (
    <div className={styles.container}>
      {isPreview && renderPreviewControls && setPreviewIndustry && previewIndustry && (
        <div style={{ marginBottom: "1rem" }}>
          {renderPreviewControls(previewIndustry, setPreviewIndustry)}
        </div>
      )}

      <header className={styles.header}>
        <h2 className={styles.title}>
          {title}
        </h2>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </header>

      {/* List of Travel/Flight Offers */}
      <div className={styles.list}>
        {flights.map((flight: any, idx: number) => {
          const isBooked = bookedId === flight.title;

          return (
            <div key={idx} className={styles.card}>
              <div>
                <h4 className={styles.cardTitle}>
                  {flight.title}
                </h4>
                <p className={styles.cardDesc}>
                  {flight.description}
                </p>
                {flight.meta && (
                  <span className={styles.cardMeta}>
                    {flight.meta}
                  </span>
                )}
              </div>

              <button
                disabled={isBooked}
                onClick={() => handleBook(flight.title)}
                className={isBooked ? styles.actionBtnBooked : styles.actionBtn}
              >
                {isBooked ? "Booked!" : "Book Now"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
