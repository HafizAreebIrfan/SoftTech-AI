import React, { useMemo, useState } from "react";
import { CardItem } from "./CardItem";
import styles from "../../../../styles/cardsblock.module.css";
import type { CardsBlockProps } from "../../../../interfaces/mcp/cardsblock.interface";
import { getFieldValue } from "../../../../utils";
import { renderImage } from "../../helper/RenderImage";

export const CardsBlock: React.FC<CardsBlockProps> = ({
  block,
  records = [],
  fields = [],
  maxItems,
  variant,
}) => {
  const [selectedRecord, setSelectedRecord] = useState<Record<
    string,
    any
  > | null>(null);
  const displayRecords = useMemo(() => {
    const limit = maxItems || block?.maxItems;
    if (limit && limit > 0) {
      return records.slice(0, limit);
    }
    return records;
  }, [records, maxItems, block?.maxItems]);

  if (!displayRecords || displayRecords.length === 0) {
    return null;
  }

  const activeVariant = variant || block?.variant;

  return (
    <section className={styles.container}>
      <div className={styles.grid}>
        {displayRecords.map((record: any, index) => (
          <CardItem
            key={`card-${record.id || index}`}
            record={record}
            fields={fields}
            variant={variant || block?.variant}
            onSelect={(rec) => setSelectedRecord(rec)}
          />
        ))}
      </div>
      {/* Detail Modal on Card Click */}
      {selectedRecord && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "var(--ModalBackdrop)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "16px",
          }}
          onClick={() => setSelectedRecord(null)}
        >
          <div
            style={{
              background: "var(--Card)",
              border: "1px solid var(--CardBorder)",
              borderRadius: "14px",
              padding: "24px",
              maxWidth: "500px",
              width: "100%",
              maxHeight: "80vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "16px",
              }}
            >
              <div
                style={{ display: "flex", gap: "12px", alignItems: "center" }}
              >
                {selectedRecord.$image && (
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "6px",
                      overflow: "hidden",
                    }}
                  >
                    {renderImage(
                      selectedRecord.$image,
                      String(selectedRecord.$title || "Item"),
                    )}
                  </div>
                )}
                <h3 style={{ margin: 0, color: "var(--TextHeading)" }}>
                  {selectedRecord.$title || "Details"}
                </h3>
              </div>
              <button
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--TextSecondary)",
                  cursor: "pointer",
                  fontSize: "20px",
                }}
                onClick={() => setSelectedRecord(null)}
              >
                ✕
              </button>
            </div>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "10px" }}
            >
              {fields
                .filter((f) => !f.hidden)
                .map((field) => {
                  const val = getFieldValue(selectedRecord, field);
                  if (val === null || val === undefined || val === "")
                    return null;
                  return (
                    <div
                      key={field.key}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        borderBottom: "1px solid var(--TableDivider)",
                        paddingBottom: "6px",
                      }}
                    >
                      <span
                        style={{
                          fontWeight: 600,
                          fontSize: "13px",
                          color: "var(--TextSecondary)",
                        }}
                      >
                        {field.label}:
                      </span>
                      <span
                        style={{
                          fontSize: "13px",
                          color: "var(--TextPrimary)",
                          textAlign: "right",
                          maxWidth: "65%",
                        }}
                      >
                        {typeof val === "object"
                          ? JSON.stringify(val)
                          : String(val)}
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
