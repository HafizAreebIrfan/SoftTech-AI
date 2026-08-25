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
}) => {
  if (!record || typeof record !== "object") return null;

  // 1. Instantly extract backend-mapped primary UI fields
  const { $title, $description, $price, $status, $image, id, url, link } =
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

  return (
    <CardContainerComponent
      {...containerProps}
      onClick={handleClick}
      style={{ cursor: actionUrlStr || onSelect ? "pointer" : "default" }}
    >
      {/* Asset / Image Area */}
      {Boolean($image) && (
        <div
          style={{
            height: "160px",
            width: "100%",
            background: "var(--BackgroundSecondary)",
            borderBottom: "1px solid var(--WidgetCardBorder)",
            /* Add these to ensure your renderImage fits perfectly inside the card */
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          {renderImage($image, titleStr)}
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

        {/* Price Tag */}
        {$price !== undefined && $price !== null && (
          <div className={styles.priceTag}>{renderCurrency($price)}</div>
        )}

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

      {(actionUrlStr || onSelect) && (
        <div className={styles.cardFooter}>
          <span className={styles.actionButton}>View Details &rarr;</span>
        </div>
      )}
    </CardContainerComponent>
  );
};
