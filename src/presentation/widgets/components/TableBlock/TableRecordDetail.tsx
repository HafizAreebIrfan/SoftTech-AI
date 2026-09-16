import React from "react";
import { renderImage } from "../../helper/RenderImage";
import { renderStatus } from "../../helper/RenderStatus";
import { renderCurrency } from "../../helper/RenderCurrency";
import { renderDate } from "../../helper/RenderDate";
import { getFieldValue } from "../../../../utils/schema/getValue";
import type { FieldSchema, WidgetAction } from "../../../../domain/entities/GenericWidget";
import styles from "../../../../styles/tableblock.module.css";

interface TableRecordDetailProps {
  record: Record<string, any>;
  fields: FieldSchema[];
  actions?: WidgetAction[];
  onBack: () => void;
  onEdit?: (record: Record<string, any>) => void;
  onDelete?: (record: Record<string, any>) => void;
  onRefresh?: () => void;
}

export const TableRecordDetail: React.FC<TableRecordDetailProps> = ({
  record,
  fields,
  actions = [],
  onBack,
  onEdit,
  onDelete,
  onRefresh,
}) => {
  const recordId = String(record.id || record._id || "");

  // Dynamic Title
  const title =
    record.$title ||
    record.username ||
    record.fullName ||
    record.name ||
    record.title ||
    record.packagename ||
    record.customerName ||
    (recordId ? `Record #${recordId}` : "Item Details");

  // Dynamic Status
  const statusVal =
    record.$status ||
    record.orderstatus ||
    record.status ||
    record.packagestatus ||
    record.availabilityStatus;

  // Dynamic Image
  const imageVal = record.$image || record.image || record.thumbnail;

  // Dynamic Financial Amount
  const rawPrice =
    record.orderamount ??
    record.$price ??
    record.price ??
    record.packageprice ??
    record.total ??
    record.totalAmount;

  // Check which actions are legitimately enabled and available
  const canEdit =
    Boolean(onEdit) &&
    actions.some((a) =>
      /update|edit/i.test(String(a.id || a.tool || "")),
    );

  const canDelete =
    Boolean(onDelete) &&
    actions.some((a) =>
      /delete|remove/i.test(String(a.id || a.tool || "")),
    );

  const canEmail = actions.some((a) =>
    /email|mail|send_email/i.test(String(a.id || a.tool || "")),
  );

  const customActions = actions.filter(
    (a) =>
      a.enabled !== false &&
      !/update|edit|delete|remove|email|mail|view|detail|select/i.test(
        String(a.id || a.tool || ""),
      ),
  );

  const hasAnyActions = canEdit || canDelete || canEmail || customActions.length > 0;

  const isTechnicalId =
    recordId.length > 15 || /^[a-z0-9]{18,}$/i.test(recordId);

  // Filter and prioritize fields dynamically from active schema
  const activeFields = fields.filter((f) => {
    if (f.hidden) return false;
    const k = f.key.toLowerCase();
    if (k === "__v" || k === "_id" || k === "password" || k === "hash") return false;
    if (k === "id" && isTechnicalId) return false;
    return true;
  });

  const initials = title
    .split(" ")
    .map((w: string) => w[0])
    .filter(Boolean)
    .join("")
    .substring(0, 2)
    .toUpperCase() || "RC";

  const derivedSubtitle =
    record.address || record.city
      ? `${record.address ? record.address + ", " : ""}${record.city || ""}`.trim()
      : record.category ||
        record.type ||
        record.role ||
        (!isTechnicalId && recordId ? `ID: ${recordId}` : "");

  const hasPrice = rawPrice !== undefined && rawPrice !== null;
  const hasVehicle = Boolean(record.usercar || record.make || record.car);
  const hasPackage = Boolean(record.userpackage || record.package || record.category);
  const hasLocationDetails = Boolean(record.address || record.city || record.state);
  const hasHours = Boolean(record.hours);
  const hasSpecialFeatures = Boolean(record.hasDetailingStudio);

  const hasKeyDetails =
    hasPrice || hasVehicle || hasPackage || hasLocationDetails || hasHours || hasSpecialFeatures;

  const hasTimestamps = Boolean(
    record.userdate || record.date || record.createdAt || record.updatedAt,
  );

  return (
    <div className={styles.recordDetailContainer}>
      {/* Top Header Navigation */}
      <div className={styles.recordDetailTopNav}>
        <div className={styles.detailNavLeft}>
          <button
            type="button"
            onClick={onBack}
            className={styles.backIconBtn}
            aria-label="Back to table"
          >
            ←
          </button>
          <div>
            <h2 className={styles.detailHeaderTitle}>{title}</h2>
            {derivedSubtitle && (
              <p className={styles.detailHeaderSubtitle}>{derivedSubtitle}</p>
            )}
          </div>
        </div>

        <div className={styles.recordDetailActions}>
          <button
            type="button"
            className={styles.refreshBtn}
            onClick={() => onRefresh?.()}
            aria-label="Refresh record"
          >
            <span>⟳</span> Refresh
          </button>
        </div>
      </div>

      {/* Overview Cards Grid */}
      <div className={styles.detailGridTop}>
        {/* Card 1: Primary Identity & Image */}
        <div className={styles.detailSectionCard}>
          <h4 className={styles.detailCardTitle}>Identity</h4>
          <div className={styles.profileRow}>
            {imageVal ? (
              <div className={styles.recordDetailImage}>
                {renderImage(imageVal, title, "cover")}
              </div>
            ) : (
              <div className={styles.avatarCircleHA}>{initials}</div>
            )}
            <div className={styles.profileMeta}>
              <p className={styles.profileName}>{title}</p>
              {(record.useremail || record.email) && (
                <p className={styles.profileEmail}>
                  {String(record.useremail || record.email)}
                </p>
              )}
            </div>
          </div>

          {statusVal && (
            <div className={styles.detailFieldRow}>
              <span className={styles.detailFieldLabel}>Status</span>
              <div>{renderStatus(statusVal)}</div>
            </div>
          )}

          {(record.userphoneno || record.phone) && (
            <div className={styles.detailFieldRow}>
              <span className={styles.detailFieldLabel}>Phone</span>
              <span className={styles.detailFieldValue}>
                {String(record.userphoneno || record.phone)}
              </span>
            </div>
          )}
        </div>

        {/* Card 2: Key Financial & Entity Attributes (Only rendered when attributes exist) */}
        {hasKeyDetails && (
          <div className={styles.detailSectionCard}>
            <h4 className={styles.detailCardTitle}>Key Details</h4>

            {hasPrice && (
              <div className={styles.metricBlock}>
                <p className={styles.metricSubLabel}>Amount</p>
                <p className={styles.metricBigVal}>{renderCurrency(rawPrice)}</p>
              </div>
            )}

            {hasVehicle && (
              <div className={styles.detailFieldRow}>
                <span className={styles.detailFieldLabel}>Vehicle / Item</span>
                <span className={styles.detailFieldValue}>
                  {String(record.usercar || record.make || record.car)}{" "}
                  {record.usercarmodel || record.model ? String(record.usercarmodel || record.model) : ""}
                </span>
              </div>
            )}

            {hasPackage && (
              <div className={styles.detailFieldRow}>
                <span className={styles.detailFieldLabel}>Package / Category</span>
                <span className={styles.badgeRole}>
                  {String(record.userpackage || record.package || record.category)}
                  {record.userpackagetype ? ` (${record.userpackagetype})` : ""}
                </span>
              </div>
            )}

            {hasLocationDetails && (
              <div className={styles.detailFieldRow}>
                <span className={styles.detailFieldLabel}>Address</span>
                <span className={styles.detailFieldValue}>
                  {[record.address, record.city, record.state].filter(Boolean).join(", ")}
                </span>
              </div>
            )}

            {hasHours && (
              <div className={styles.detailFieldRow}>
                <span className={styles.detailFieldLabel}>Hours</span>
                <span className={styles.detailFieldValue}>
                  {typeof record.hours === "object"
                    ? `${record.hours.weekday ? `Weekdays: ${record.hours.weekday}` : ""} ${record.hours.weekend ? `| Weekends: ${record.hours.weekend}` : ""}`.trim()
                    : String(record.hours)}
                </span>
              </div>
            )}

            {record.hasDetailingStudio && (
              <div className={styles.detailFieldRow}>
                <span className={styles.detailFieldLabel}>Studio</span>
                <span className={styles.badgeRole}>✨ Detailing Studio Available</span>
              </div>
            )}
          </div>
        )}

        {/* Card 3: Date & Timestamp Information (Only rendered when dates exist) */}
        {hasTimestamps && (
          <div className={styles.detailSectionCard}>
            <h4 className={styles.detailCardTitle}>Timestamps</h4>

            {(record.userdate || record.date) && (
              <div className={styles.detailFieldRow}>
                <span className={styles.detailFieldLabel}>Scheduled Date</span>
                <span className={styles.detailFieldValue}>
                  {renderDate(record.userdate || record.date, true)}
                </span>
              </div>
            )}

            {record.createdAt && (
              <div className={styles.detailFieldRow}>
                <span className={styles.detailFieldLabel}>Created</span>
                <span className={styles.detailFieldValue}>
                  {renderDate(record.createdAt, true)}
                </span>
              </div>
            )}

            {record.updatedAt && (
              <div className={styles.detailFieldRow}>
                <span className={styles.detailFieldLabel}>Updated</span>
                <span className={styles.detailFieldValue}>
                  {renderDate(record.updatedAt, true)}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Full Attributes Specification Grid */}
      {activeFields.length > 0 && (
        <div className={styles.detailSectionCard}>
          <h4 className={styles.detailCardTitle}>All Record Fields</h4>
          <div className={styles.recordDetailSpecsGrid}>
            {activeFields.map((field) => {
              const val = getFieldValue(record, field);
              if (val === null || val === undefined || val === "") return null;

              let renderedVal: React.ReactNode = String(val);
              if (field.type === "currency") {
                renderedVal = renderCurrency(val);
              } else if (field.type === "status") {
                renderedVal = renderStatus(val);
              } else if (field.type === "date" || field.type === "datetime") {
                renderedVal = renderDate(val, field.type === "datetime");
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
      )}

      {/* Available Actions (Only actions enabled in the tool response) */}
      {hasAnyActions && (
        <div className={styles.detailSectionCard}>
          <h4 className={styles.detailCardTitle}>Actions</h4>
          <div className={styles.actionsCardRow}>
            {canEdit && (
              <button
                type="button"
                onClick={() => onEdit?.(record)}
                className={styles.actionBtnOutline}
              >
                ✏️ Edit record
              </button>
            )}

            {canEmail && (record.useremail || record.email) && (
              <button
                type="button"
                className={styles.actionBtnOutline}
                onClick={() => {
                  window.open(`mailto:${record.useremail || record.email}`);
                }}
              >
                ✉️ Send email
              </button>
            )}

            {canDelete && (
              <button
                type="button"
                onClick={() => onDelete?.(record)}
                className={styles.actionBtnDelete}
              >
                🗑️ Delete record
              </button>
            )}

            {customActions.map((action) => (
              <button
                key={action.id || action.tool}
                type="button"
                className={styles.actionBtnOutline}
              >
                ⚡ {action.label || action.id}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
