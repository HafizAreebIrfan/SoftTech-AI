import React from "react";
import { getFieldValue } from "../../../../utils/schema/getValue";
import { renderImage } from "../../helper/RenderImage";
import { renderStatus } from "../../helper/RenderStatus";
import { renderCurrency } from "../../helper/RenderCurrency";
import { renderDate } from "../../helper/RenderDate";
import styles from "../../../../styles/cardsblock.module.css";
import type { CardItemProps } from "../../../../interfaces/mcp/cardsblock.interface";
import type { FieldSchema } from "../../../../domain/entities/GenericWidget";

const formatFieldValue = (
  val: unknown,
  field: FieldSchema,
): React.ReactNode => {
  if (val === null || val === undefined || val === "") return "-";
  if (field.type === "currency") return String(renderCurrency(val));
  if (field.type === "date" || field.type === "datetime")
    return String(renderDate(val, field.type === "datetime"));
  if (typeof val === "number") return val.toLocaleString();
  if (typeof val === "boolean") return val ? "Yes" : "No";
  return String(val);
};

export const CardItem: React.FC<CardItemProps> = ({
  record,
  fields,
  onSelect,
  actions,
  audience,
}) => {
  if (!record || typeof record !== "object") return null;

  // 1. Extract backend-mapped primary UI fields
  const { $title, $description, $price, $status, $metric, $image, id, url, link } =
    record as any;

  const titleStr = $title || "Item";
  const actionUrlStr = url || link;
  const isClickable = Boolean(actionUrlStr);

  const CardContainerComponent = isClickable ? "a" : "div";
  const containerProps = isClickable
    ? {
        href: actionUrlStr,
        target: "_blank",
        rel: "noopener noreferrer",
        className: styles.cardItem,
      }
    : { className: styles.cardItem };

  // 2. Identify secondary fields (Fields that were NOT used for primary UI mapping)
  const primaryRoles = [
    "title",
    "description",
    "price",
    "image",
    "status",
    "metric",
  ];
  const secondaryFields = fields
    .filter((f) => !f.hidden && !primaryRoles.includes(f.uiRole as string))
    .slice(0, 3); // Max 3 secondary rows

  const handleClick = (e: React.MouseEvent) => {
    if (actionUrlStr) return; // If it has a URL, let it open the link naturally
    if (onSelect) {
      e.preventDefault();
      onSelect(record as Record<string, any>);
    }
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const openai = (window as any).openai;
    const prompt = `Add 1 × ${titleStr} to my cart`;
    if (openai?.sendFollowUpMessage) {
      openai.sendFollowUpMessage({ prompt });
    } else {
      console.log(`[MCP Widget] sendFollowUpMessage: "${prompt}"`);
    }
  };

  const canAddToCart = audience !== "admin" && $price !== undefined && $price !== null;

  return (
    <CardContainerComponent
      {...containerProps}
      onClick={handleClick}
      style={{ cursor: actionUrlStr || onSelect ? "pointer" : "default" }}
    >
      {/* Asset / Image Area (Fills box with cover fit) */}
      {Boolean($image) && (
        <div
          style={{
            height: "160px",
            width: "100%",
            background: "var(--BackgroundSecondary, #0f172a)",
            borderBottom: "1px solid var(--WidgetCardBorder, rgba(255,255,255,0.08))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          {renderImage($image, titleStr, "cover")}
        </div>
      )}

      <div className={styles.contentBody}>
        {/* Header & Status */}
        <div className={styles.cardHeader}>
          <div className={styles.titleGroup}>
            <h3 className={styles.title} title={titleStr}>
              {titleStr}
            </h3>
            {$description && (
              <span className={styles.subtitle} title={String($description)}>
                {String($description)}
              </span>
            )}
          </div>
          {$status && (
            <div className={styles.statusBadge}>{renderStatus($status)}</div>
          )}
        </div>

        {/* Price Tag & Rating Metric */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "4px 0" }}>
          {$price !== undefined && $price !== null && (
            <div className={styles.priceTag} style={{ color: "var(--widget-accent, #6366f1)", fontWeight: 800 }}>
              {renderCurrency($price)}
            </div>
          )}

          {$metric !== undefined && $metric !== null && (
            <span
              style={{
                fontSize: "12px",
                fontWeight: 700,
                color: "#f59e0b",
                background: "rgba(245, 158, 11, 0.12)",
                padding: "2px 6px",
                borderRadius: "4px",
              }}
            >
              ⭐ {String($metric)}
            </span>
          )}
        </div>

        {/* Secondary Metadata List (e.g. Dimensions, Capacity, SKU) */}
        {secondaryFields.length > 0 && (
          <div className={styles.metaList}>
            {secondaryFields.map((field) => {
              const val = getFieldValue(record, field);
              if (val === null || val === undefined || val === "") return null;
              return (
                <div key={field.key} className={styles.metaRow}>
                  <span className={styles.metaLabel}>{field.label}</span>
                  <span className={styles.metaValue}>
                    {formatFieldValue(val, field)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Card Footer with Detail and Cart CTAs */}
      <div
        className={styles.cardFooter}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "8px",
          borderTop: "1px solid var(--WidgetCardBorder, rgba(255,255,255,0.06))",
          padding: "10px 14px",
        }}
      >
        {(actionUrlStr || onSelect) && (
          <span className={styles.actionButton} style={{ fontSize: "12px" }}>
            View Details &rarr;
          </span>
        )}

        {canAddToCart && (
          <button
            type="button"
            onClick={handleAddToCart}
            style={{
              background: "var(--widget-accent, #6366f1)",
              color: "var(--widget-accent-contrast, #ffffff)",
              border: "none",
              borderRadius: "6px",
              padding: "4px 10px",
              fontSize: "11px",
              fontWeight: 700,
              cursor: "pointer",
              marginLeft: "auto",
              transition: "all 0.15s ease",
            }}
          >
            + Cart
          </button>
        )}
      </div>
    </CardContainerComponent>
  );
};

