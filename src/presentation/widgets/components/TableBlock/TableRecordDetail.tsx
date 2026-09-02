import React from "react";
import { renderImage } from "../../helper/RenderImage";
import { renderStatus } from "../../helper/RenderStatus";
import { renderCurrency } from "../../helper/RenderCurrency";
import { renderDate } from "../../helper/RenderDate";
import { getFieldValue } from "../../../../utils/schema/getValue";
import type { FieldSchema } from "../../../../domain/entities/GenericWidget";
import styles from "../../../../styles/tableblock.module.css";

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
    <div className={styles.recordDetailContainer}>
      {/* Navigation Top Bar */}
      <div className={styles.recordDetailTopNav}>
        <button
          type="button"
          onClick={onBack}
          className={styles.backBtn}
        >
          <span>←</span> Back to Table
        </button>

        <div className={styles.recordDetailActions}>
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(record)}
              className={`${styles.actionBtn} ${styles.editBtn}`}
              style={{ width: "auto", padding: "6px 14px", height: "auto" }}
            >
              ✏️ Edit
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(record)}
              className={`${styles.actionBtn} ${styles.deleteBtn}`}
              style={{ width: "auto", padding: "6px 14px", height: "auto" }}
            >
              🗑️ Delete
            </button>
          )}
        </div>
      </div>

      {/* Main Detail Card Header */}
      <div className={styles.recordDetailCard}>
        <div className={styles.recordDetailHero}>
          {image && (
            <div className={styles.recordDetailImage}>
              {renderImage(image, title, "cover")}
            </div>
          )}

          <div className={styles.recordDetailHeroInfo}>
            <div className={styles.recordDetailTitleRow}>
              <h2 className={styles.recordDetailTitle}>
                {title}
              </h2>
              {status && <div>{renderStatus(status)}</div>}
            </div>

            {description && (
              <p className={styles.recordDetailDescription}>
                {description}
              </p>
            )}

            {price !== undefined && price !== null && (
              <div className={styles.recordDetailPrice}>
                {renderCurrency(price)}
              </div>
            )}
          </div>
        </div>

        {/* Labeled Specifications / Field Rows */}
        <div className={styles.recordDetailSpecsSection}>
          <h4 className={styles.recordDetailSpecsTitle}>
            Record Details
          </h4>

          <div className={styles.recordDetailSpecsGrid}>
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
                <div key={field.key} className={styles.recordDetailSpecItem}>
                  <span className={styles.recordDetailSpecLabel}>
                    {field.label}
                  </span>
                  <span className={styles.recordDetailSpecValue}>
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
