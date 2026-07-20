import React, { useState } from "react";
import styles from "../../../../styles/travel.module.css";
import { MetricBlock } from "../../components/MetricBlock";
import { ListBlock } from "../../components/ListBlock";
import { KeyValueBlock } from "../../components/KeyValueBlock";
import { TableBlock } from "../../components/TableBlock";
import { FormBlock } from "../../components/FormBlock";

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
  const additionalBlocks = blocks && Array.isArray(blocks) ? blocks.filter(b => b !== listBlock) : [];
  
  const flights = rawFlights.length > 0 ? rawFlights.map((itm: any) => {
    if (Array.isArray(itm)) {
      return {
        title: itm[0] || "Travel Option",
        description: itm[1] || "Available offer details",
        meta: itm[2] || ""
      };
    }
    return {
      title: itm.title || itm.name || "Travel Option",
      description: itm.description || itm.text || "Available offer details",
      meta: itm.meta || itm.price || ""
    };
  }) : [
    { title: "JFK → LHR Express Flight (British Airways)", description: "Non-stop Boeing 787 Dreamliner • Business Class available", meta: "$840.00 • 6h 45m" },
    { title: "SFO → TYO Direct (All Nippon Airways)", description: "Direct Flight • Premium Economy with Lounge Access", meta: "$1,250.00 • 10h 15m" },
    { title: "Grand Hotel & Spa Bali (5-Star Resort)", description: "Oceanfront Deluxe Villa with Private Pool & Breakfast Included", meta: "$310.00 / night • 4.9 ★ Rating" }
  ];

  const [bookedId, setBookedId] = useState<string | null>(null);
  const [selectedItemName, setSelectedItemName] = useState<string | null>(null);

  const formBlock = additionalBlocks.find((b: any) => b?.type === "form");

  const handleBook = (id: string) => {
    if (formBlock) {
      setSelectedItemName(id);
      setTimeout(() => {
        const formEl = document.querySelector("form");
        if (formEl) {
          formEl.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 50);
    } else {
      setBookedId(id);
      setTimeout(() => setBookedId(null), 3000);
    }
  };

  const getFormDefaultValues = (itemName: string | null) => {
    if (!itemName) return {};
    return {
      package: itemName,
      packageName: itemName,
      package_name: itemName,
      item: itemName,
      itemName: itemName,
      item_name: itemName,
      product: itemName,
      productName: itemName,
      product_name: itemName,
      service: itemName,
      serviceName: itemName,
      service_name: itemName,
      title: itemName
    };
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

              {formBlock && (
                <button
                  disabled={isBooked}
                  onClick={() => handleBook(flight.title)}
                  className={isBooked ? styles.actionBtnBooked : styles.actionBtn}
                >
                  {isBooked ? "Booked!" : "Select"}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Additional Generic Blocks (like FormBlock, MetricBlock) */}
      {additionalBlocks.length > 0 && (
        <div style={{ marginTop: "2rem", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "1.5rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {additionalBlocks.map((block: any, index: number) => {
            switch (block.type) {
              case "metrics":
                return (
                  <MetricBlock
                    key={index}
                    metrics={block.metrics}
                    title={block.title}
                  />
                );
              case "list":
                return (
                  <ListBlock
                    key={index}
                    listItems={block.listItems}
                    title={block.title}
                  />
                );
              case "keyValue":
                return (
                  <KeyValueBlock
                    key={index}
                    keyValueItems={block.keyValueItems}
                    title={block.title}
                  />
                );
              case "table":
                return (
                  <TableBlock
                    key={index}
                    tableHeaders={block.tableHeaders}
                    tableRows={block.tableRows}
                    title={block.title}
                    totalItems={(block as any).totalItems}
                    totalPages={(block as any).totalPages}
                    currentPage={(block as any).currentPage}
                  />
                );
              case "form":
                return (
                  <FormBlock
                    key={index}
                    title={block.title}
                    formFields={block.formFields}
                    submitLabel={block.submitLabel}
                    actionUrl={block.actionUrl}
                    defaultValues={getFormDefaultValues(selectedItemName)}
                  />
                );
              default:
                return null;
            }
          })}
        </div>
      )}
    </div>
  );
};
