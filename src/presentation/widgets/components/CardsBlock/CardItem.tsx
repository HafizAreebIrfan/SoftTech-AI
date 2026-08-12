import React from "react";
import { getFieldValue, getValue } from "../../../../utils/schema/getValue";
import { renderImage } from "../../helper/RenderImage";
import { renderStatus } from "../../helper/RenderStatus";
import { renderCurrency } from "../../helper/RenderCurrency";
import { renderDate } from "../../helper/RenderDate";
import styles from "../../../../styles/cardsblock.module.css";
import type { CardItemProps } from "../../../../interfaces/mcp/cardsblock.interface";
import type { FieldSchema } from "../../../../domain/entities/GenericWidget";

/**
 * Format a secondary field value based on its schema type.
 */
const formatFieldValue = (val: unknown, field: FieldSchema): React.ReactNode => {
  if (val === null || val === undefined || val === "") return "-";

  if (field.type === "currency") {
    return String(renderCurrency(val));
  }

  if (field.type === "date" || field.type === "datetime") {
    return String(renderDate(val, field.type === "datetime"));
  }

  if (typeof val === "number") {
    return val.toLocaleString();
  }

  if (typeof val === "boolean") {
    return val ? "Yes" : "No";
  }

  return String(val);
};

export const CardItem: React.FC<CardItemProps> = ({
  record,
  fieldMapping,
}) => {
  if (!record || typeof record !== "object") {
    return null;
  }

  // Extract primary fields
  const rawImage = fieldMapping.imageField
    ? getFieldValue(record, fieldMapping.imageField)
    : getValue(record, "image") ||
      getValue(record, "thumbnail") ||
      getValue(record, "photo") ||
      getValue(record, "avatar") ||
      getValue(record, "icon");

  const rawTitle = fieldMapping.titleField
    ? getFieldValue(record, fieldMapping.titleField)
    : getValue(record, "name") ||
      getValue(record, "title") ||
      getValue(record, "label") ||
      "Item";

  const rawSubtitle = fieldMapping.subtitleField
    ? getFieldValue(record, fieldMapping.subtitleField)
    : getValue(record, "subtitle") ||
      getValue(record, "category") ||
      getValue(record, "type") ||
      getValue(record, "description");

  const rawPrice = fieldMapping.priceField
    ? getFieldValue(record, fieldMapping.priceField)
    : getValue(record, "price") ||
      getValue(record, "amount") ||
      getValue(record, "cost");

  const rawStatus = fieldMapping.statusField
    ? getFieldValue(record, fieldMapping.statusField)
    : getValue(record, "status") || getValue(record, "state");

  const rawActionUrl =
    getValue(record, "url") ||
    getValue(record, "link") ||
    getValue(record, "actionUrl") ||
    getValue(record, "detailsUrl");

  const titleStr = rawTitle !== undefined && rawTitle !== null ? String(rawTitle) : "Item";
  const subtitleStr = rawSubtitle !== undefined && rawSubtitle !== null ? String(rawSubtitle) : undefined;
  const actionUrlStr = typeof rawActionUrl === "string" && rawActionUrl.trim() ? rawActionUrl : undefined;

  const isClickable = Boolean(actionUrlStr);

  const CardContainerComponent = isClickable ? "a" : "div";
  const containerProps = isClickable
    ? {
        href: actionUrlStr,
        target: "_blank",
        rel: "noopener noreferrer",
        className: styles.cardItem,
      }
    : {
        className: styles.cardItem,
      };

  return (
    <CardContainerComponent {...containerProps}>
      {/* Asset / Image Area */}
      {Boolean(rawImage) && (
        <div className={styles.mediaWrapper}>
          {renderImage(rawImage, titleStr)}
        </div>
      )}

      <div className={styles.contentBody}>
        {/* Header & Status */}
        <div className={styles.cardHeader}>
          <div className={styles.titleGroup}>
            <h3 className={styles.title} title={titleStr}>
              {titleStr}
            </h3>
            {subtitleStr && (
              <span className={styles.subtitle} title={subtitleStr}>
                {subtitleStr}
              </span>
            )}
          </div>

          {Boolean(rawStatus) && (
            <div className={styles.statusBadge}>
              {renderStatus(rawStatus)}
            </div>
          )}
        </div>

        {/* Price / Currency Tag */}
        {rawPrice !== undefined && rawPrice !== null && (
          <div className={styles.priceTag}>
            {renderCurrency(rawPrice)}
          </div>
        )}

        {/* Secondary Metadata List */}
        {fieldMapping.secondaryFields.length > 0 && (
          <div className={styles.metaList}>
            {fieldMapping.secondaryFields.map((field) => {
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

      {/* Action Footer if explicitly provided */}
      {actionUrlStr && (
        <div className={styles.cardFooter}>
          <span className={styles.actionButton}>
            View Details &rarr;
          </span>
        </div>
      )}
    </CardContainerComponent>
  );
};
