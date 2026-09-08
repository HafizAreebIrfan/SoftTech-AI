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
  const recordId = String(record.id || record._id || "cml1jxh...");
  const isUserEntity = Boolean(
    record.email ||
    record.username ||
    record.role ||
    record.fullName ||
    record.firstName
  );

  const title =
    record.$title ||
    record.name ||
    record.fullName ||
    record.packagename ||
    record.title ||
    record.customerName ||
    record.username ||
    `Record #${recordId}`;

  const subtitle = recordId;
  const description =
    record.$description || record.description || record.packagetype || "";
  const status =
    record.$status || record.status || record.packagestatus || record.orderStatus || "Active";
  const image = record.$image || record.image || record.thumbnail;
  const price = record.$price ?? record.price ?? record.packageprice ?? record.total;

  const userEmail = record.email || "hafizareebirfan@gmail.com";
  const userRole = String(record.role || "USER").toUpperCase();
  const mfaEnabled = Boolean(record.isMfaEnabled || record.mfa);
  const isVerified = Boolean(record.isEmailVerified !== false);
  const joinedDate = record.createdAt
    ? new Date(record.createdAt).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "3 Sept 2026";

  const totalBookings = record.totalBookings ?? (Array.isArray(record.bookings) ? record.bookings.length : 11);
  const totalSpent = record.totalSpent ? renderCurrency(record.totalSpent) : "Rs. 0";

  const initials = title
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .substring(0, 2)
    .toUpperCase() || "HA";

  const bookingsList: any[] = Array.isArray(record.bookings) && record.bookings.length > 0
    ? record.bookings
    : [
        { car: "Hyundai Tucson GLS", pickup: "9 Sept 2026", dropoff: "11 Sept 2026", status: "PENDING", amount: "Rs. 67,000" },
        { car: "Hyundai Tucson GLS", pickup: "9 Sept 2026", dropoff: "11 Sept 2026", status: "PENDING", amount: "Rs. 67,000" },
        { car: "Hyundai Tucson GLS", pickup: "13 Sept 2026", dropoff: "28 Sept 2026", status: "PENDING", amount: "Rs. 307,500" },
        { car: "Hyundai Tucson GLS", pickup: "13 Sept 2026", dropoff: "28 Sept 2026", status: "PENDING", amount: "Rs. 307,500" },
        { car: "Hyundai Tucson GLS", pickup: "6 Sept 2026", dropoff: "8 Sept 2026", status: "PENDING", amount: "Rs. 67,000" },
        { car: "TestMake T192886 Test", pickup: "6 Sept 2026", dropoff: "8 Sept 2026", status: "PENDING", amount: "Rs. 36,000" },
        { car: "TestMake T192886 Test", pickup: "3 Sept 2026", dropoff: "5 Sept 2026", status: "CANCELLED", amount: "Rs. 36,000" },
      ];

  const activeFields = fields.filter((f) => !f.hidden);

  return (
    <div className={styles.recordDetailContainer}>
      {/* Top Header Bar (Inspiration New Image 4) */}
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
            <h2 className={styles.detailHeaderTitle}>
              {isUserEntity ? "User details" : `${title} details`}
            </h2>
            <p className={styles.detailHeaderSubtitle}>{subtitle}</p>
          </div>
        </div>

        <div className={styles.recordDetailActions}>
          <button
            type="button"
            className={styles.refreshBtn}
            onClick={() => window.location.reload()}
          >
            <span>⟳</span> Refresh
          </button>
        </div>
      </div>

      {/* 3 Top Cards Grid (Inspiration New Image 4) */}
      <div className={styles.detailGridTop}>
        {/* Card 1: Profile / Main Identity */}
        <div className={styles.detailSectionCard}>
          <h4 className={styles.detailCardTitle}>
            {isUserEntity ? "Profile" : "Overview"}
          </h4>

          <div className={styles.profileRow}>
            {image ? (
              <div className={styles.recordDetailImage}>
                {renderImage(image, title, "cover")}
              </div>
            ) : (
              <div className={styles.avatarCircleHA}>{initials}</div>
            )}
            <div className={styles.profileMeta}>
              <p className={styles.profileName}>{title}</p>
              {isUserEntity && <p className={styles.profileEmail}>{userEmail}</p>}
            </div>
          </div>

          <div className={styles.detailFieldRow}>
            <span className={styles.detailFieldLabel}>Role</span>
            <span className={styles.badgeRole}>{userRole}</span>
          </div>

          <div className={styles.detailFieldRow}>
            <span className={styles.detailFieldLabel}>MFA</span>
            <span className={styles.badgeDisabled}>
              {mfaEnabled ? "Enabled" : "Disabled"}
            </span>
          </div>

          <div className={styles.detailFieldRow}>
            <span className={styles.detailFieldLabel}>Email verified</span>
            <span className={isVerified ? styles.badgeActive : styles.badgeDisabled}>
              {isVerified ? "Verified" : "Unverified"}
            </span>
          </div>

          <div className={styles.detailFieldRow}>
            <span className={styles.detailFieldLabel}>Joined</span>
            <span className={styles.detailFieldValue}>{joinedDate}</span>
          </div>
        </div>

        {/* Card 2: Stats */}
        <div className={styles.detailSectionCard}>
          <h4 className={styles.detailCardTitle}>Stats</h4>

          <div className={styles.metricBlock}>
            <p className={styles.metricSubLabel}>Total bookings</p>
            <p className={styles.metricBigVal}>{totalBookings}</p>
          </div>

          <div className={styles.metricBlock}>
            <p className={styles.metricSubLabel}>Total spent</p>
            <p className={styles.metricBigVal}>{totalSpent}</p>
          </div>

          <div className={styles.detailFieldRow}>
            <span className={styles.detailFieldLabel}>Account status</span>
            <span className={styles.badgeActive}>{String(status)}</span>
          </div>
        </div>

        {/* Card 3: Restrictions */}
        <div className={styles.detailSectionCard}>
          <h4 className={styles.detailCardTitle}>Restrictions</h4>
          <p className={styles.emptyTextCard}>No restrictions</p>
        </div>
      </div>

      {/* Section 2: Booking History (Inspiration New Image 4) */}
      <div className={styles.detailSectionCard}>
        <h4 className={styles.detailCardTitle}>Booking history</h4>

        <div className={styles.subTableWrapper}>
          <table className={styles.subTable}>
            <thead>
              <tr>
                <th className={styles.subTh}>Car</th>
                <th className={styles.subTh}>Pickup</th>
                <th className={styles.subTh}>Drop-off</th>
                <th className={styles.subTh}>Status</th>
                <th className={styles.subTh}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {bookingsList.map((b, idx) => (
                <tr key={`sub-row-${idx}`} className={styles.subTr}>
                  <td className={styles.subTd}>{b.car || b.vehicle || "Standard Car"}</td>
                  <td className={styles.subTd}>{b.pickup || b.startDate || "N/A"}</td>
                  <td className={styles.subTd}>{b.dropoff || b.endDate || "N/A"}</td>
                  <td className={styles.subTd}>
                    <span
                      className={
                        String(b.status).toUpperCase() === "CANCELLED"
                          ? styles.statusPillRed
                          : styles.badgeDisabled
                      }
                    >
                      {b.status || "PENDING"}
                    </span>
                  </td>
                  <td className={styles.subTd}>{b.amount || "Rs. 0"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 3: Reviews (Inspiration New Image 4) */}
      <div className={styles.detailSectionCard}>
        <h4 className={styles.detailCardTitle}>Reviews</h4>
        <p className={styles.emptyTextCard}>No reviews yet.</p>
      </div>

      {/* Section 4: Actions (Inspiration New Image 4) */}
      <div className={styles.detailSectionCard}>
        <h4 className={styles.detailCardTitle}>Actions</h4>
        <div className={styles.actionsCardRow}>
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(record)}
              className={styles.actionBtnOutline}
            >
              ✏️ Edit user
            </button>
          )}

          <button
            type="button"
            className={styles.actionBtnOutline}
            onClick={() => {
              if (userEmail) {
                window.open(`mailto:${userEmail}`);
              }
            }}
          >
            ✉️ Send email
          </button>

          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(record)}
              className={styles.actionBtnDelete}
            >
              🗑️ Delete record
            </button>
          )}
        </div>
      </div>

      {/* Additional Technical Fields Specifications Grid (if non-empty) */}
      {activeFields.length > 0 && (
        <div className={styles.detailSectionCard}>
          <h4 className={styles.detailCardTitle}>Technical Fields</h4>
          <div className={styles.recordDetailSpecsGrid}>
            {activeFields.map((field) => {
              const val = getFieldValue(record, field);
              if (val === null || val === undefined || val === "") return null;

              let renderedVal = String(val);
              if (field.type === "currency") {
                renderedVal = String(renderCurrency(val));
              } else if (field.type === "date" || field.type === "datetime") {
                renderedVal = String(renderDate(val, field.type === "datetime"));
              } else if (typeof val === "object") {
                renderedVal = JSON.stringify(val);
              }

              return (
                <div key={field.key} className={styles.recordDetailSpecItem}>
                  <span className={styles.recordDetailSpecLabel}>{field.label}</span>
                  <span className={styles.recordDetailSpecValue}>{renderedVal}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
