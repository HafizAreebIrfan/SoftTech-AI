import React from "react";
import { renderImage } from "../../helper/RenderImage";
import { renderStatus } from "../../helper/RenderStatus";
import { renderCurrency } from "../../helper/RenderCurrency";
import { renderDate } from "../../helper/RenderDate";
import { getFieldValue } from "../../../../utils/schema/getValue";
import type { FieldSchema } from "../../../../domain/entities/GenericWidget";

interface TableRecordDetailProps {
  record: Record<string, any>;
  fields: FieldSchema[];
  onBack: () => void;
  onEdit?: (record: Record<string, any>) => void;
  onDelete?: (record: Record<string, any>) => void;
}

export const TableRecordDetail: React.FC<TableRecordDetailProps> = ({
  record,
  fields,
  onBack,
  onEdit,
  onDelete,
}) => {
  const title =
    record.$title ||
    record.name ||
    record.packagename ||
    record.title ||
    record.customerName ||
    record.username ||
    `Record #${record.id || record._id || ""}`;

  const description =
    record.$description || record.description || record.packagetype || "";
  const status =
    record.$status || record.status || record.packagestatus || record.orderStatus;
  const image = record.$image || record.image || record.thumbnail;
  const price = record.$price ?? record.price ?? record.packageprice ?? record.total;

  const activeFields = fields.filter((f) => !f.hidden);

  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        color: "var(--app-text-primary, #f8fafc)",
        paddingBottom: "40px",
      }}
    >
      {/* Navigation Top Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        <button
          type="button"
          onClick={onBack}
          style={{
            background: "rgba(255, 255, 255, 0.06)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            borderRadius: "8px",
            color: "var(--app-text-primary, #f8fafc)",
            padding: "8px 14px",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            transition: "all 0.15s ease",
          }}
        >
          <span>←</span> Back to Table
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(record)}
              style={{
                background: "rgba(255, 255, 255, 0.08)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                borderRadius: "8px",
                color: "#f8fafc",
                padding: "8px 14px",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              ✏️ Edit
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(record)}
              style={{
                background: "rgba(239, 68, 68, 0.15)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                borderRadius: "8px",
                color: "#ef4444",
                padding: "8px 14px",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              🗑️ Delete
            </button>
          )}
        </div>
      </div>

      {/* Main Detail Card Header */}
      <div
        style={{
          background: "var(--WidgetCardBg, rgba(15, 23, 42, 0.7))",
          border: "1px solid var(--WidgetCardBorder, rgba(255, 255, 255, 0.08))",
          borderRadius: "16px",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.25)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "16px",
            flexWrap: "wrap",
          }}
        >
          {image && (
            <div
              style={{
                width: "80px",
                height: "80px",
                borderRadius: "10px",
                overflow: "hidden",
                flexShrink: 0,
                background: "rgba(0,0,0,0.2)",
              }}
            >
              {renderImage(image, title, "cover")}
            </div>
          )}

          <div style={{ flex: 1, minWidth: "200px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                flexWrap: "wrap",
                marginBottom: "6px",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: "20px",
                  fontWeight: 800,
                  color: "var(--app-text-heading, #ffffff)",
                }}
              >
                {title}
              </h2>
              {status && <div>{renderStatus(status)}</div>}
            </div>

            {description && (
              <p
                style={{
                  margin: 0,
                  fontSize: "13px",
                  color: "var(--app-text-secondary, #94a3b8)",
                  lineHeight: 1.4,
                }}
              >
                {description}
              </p>
            )}

            {price !== undefined && price !== null && (
              <div
                style={{
                  marginTop: "8px",
                  fontSize: "22px",
                  fontWeight: 800,
                  color: "var(--widget-accent, #6366f1)",
                }}
              >
                {renderCurrency(price)}
              </div>
            )}
          </div>
        </div>

        {/* Labeled Specifications / Field Rows */}
        <div
          style={{
            borderTop: "1px solid var(--WidgetCardBorder, rgba(255, 255, 255, 0.08))",
            paddingTop: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          <h4
            style={{
              margin: "0 0 4px 0",
              fontSize: "12px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "var(--app-text-secondary, #94a3b8)",
            }}
          >
            Record Details
          </h4>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "12px",
            }}
          >
            {activeFields.map((field) => {
              const val = getFieldValue(record, field);
              if (val === null || val === undefined || val === "") return null;

              let renderedVal = String(val);
              if (field.type === "currency") {
                renderedVal = String(renderCurrency(val));
              } else if (field.type === "date" || field.type === "datetime") {
                renderedVal = String(renderDate(val, field.type === "datetime"));
              } else if (field.type === "status" || field.uiRole === "status") {
                renderedVal = String(val);
              } else if (typeof val === "object") {
                renderedVal = JSON.stringify(val);
              }

              return (
                <div
                  key={field.key}
                  style={{
                    background: "rgba(255, 255, 255, 0.025)",
                    border: "1px solid rgba(255, 255, 255, 0.06)",
                    borderRadius: "8px",
                    padding: "10px 14px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "var(--app-text-secondary, #94a3b8)",
                    }}
                  >
                    {field.label}
                  </span>
                  <span
                    style={{
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "var(--app-text-primary, #ffffff)",
                      wordBreak: "break-word",
                    }}
                  >
                    {renderedVal}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
