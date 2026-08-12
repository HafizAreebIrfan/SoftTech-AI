import React, { useMemo } from "react";
import { WidgetLayoutProps } from "../../../interfaces/mcp/normalizedwidget.interface";
import { getFieldValue } from "../../../utils/schema/getValue";
import styles from "../../../styles/dashboardwidget.module.css";
import { useThemeStore } from "../../../hooks";
import { FieldRenderer } from "../components/FieldRenderer/fieldrenderer";

export const DashboardLayout: React.FC<WidgetLayoutProps> = ({
  title,
  subtitle,
  data,
  records: propRecords,
  fields: propFields,
  collection: propCollection,
  capabilities,
  pagination,
  actions,
  sections,
}) => {
  const { colors } = useThemeStore();
  const [activeSectionIndex, setActiveSectionIndex] = React.useState(0);

  const currentSection =
    sections && sections.length > 1 && sections[activeSectionIndex]
      ? sections[activeSectionIndex]
      : null;

  const records = currentSection ? currentSection.records : propRecords;
  const fields = currentSection ? currentSection.fields : propFields;
  const collection = currentSection ? currentSection.collection : propCollection;
  const displayTitle = currentSection ? currentSection.title : title;

  const numericFields = useMemo(() => {
    return fields.filter(
      (field) => field.type === "number" || field.type === "currency",
    );
  }, [fields]);

  const summaryFields = numericFields.slice(0, 3);

  /**
   * Calculate summary values from the records.
   */
  const summaries = useMemo(() => {
    return summaryFields.map((field) => {
      const values = records
        .map((record) => getFieldValue(record, field))
        .filter(
          (value): value is number =>
            typeof value === "number" && Number.isFinite(value),
        );

      const total = values.reduce((sum, value) => sum + value, 0);

      return {
        field,
        total,
        count: values.length,
      };
    });
  }, [records, summaryFields]);

  return (
    <section
      className={styles.container}
      style={{
        color: colors.TextPrimary,
      }}
    >
      {/* Header */}
      <header className={styles.header}>
        <div>
          <h1
            className={styles.title}
            style={{
              color: colors.TextHeading,
            }}
          >
            {displayTitle}
          </h1>

          {subtitle && (
            <p
              className={styles.subtitle}
              style={{
                color: colors.TextSecondary,
              }}
            >
              {subtitle}
            </p>
          )}
        </div>
      </header>

      {/* Combined Multi-Tool Section Tabs */}
      {sections && sections.length > 1 && (
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
          {sections.map((section, idx) => (
            <button
              key={idx}
              onClick={() => setActiveSectionIndex(idx)}
              style={{
                padding: "0.4rem 0.85rem",
                borderRadius: "0.5rem",
                fontSize: "0.8rem",
                fontWeight: activeSectionIndex === idx ? 600 : 400,
                cursor: "pointer",
                background:
                  activeSectionIndex === idx
                    ? colors.CardActiveBorder
                    : colors.Card,
                color: activeSectionIndex === idx ? "#ffffff" : colors.TextSecondary,
                border: `1px solid ${
                  activeSectionIndex === idx
                    ? colors.CardActiveBorder
                    : colors.CardBorder
                }`,
                transition: "all 0.15s ease",
              }}
            >
              {section.title}
            </button>
          ))}
        </div>
      )}

      {/* Summary */}
      {summaries.length > 0 && (
        <section className={styles.summaryGrid}>
          {summaries.map(({ field, total }) => (
            <div
              key={field.key}
              className={styles.summaryCard}
              style={{
                background: colors.Card,
                borderColor: colors.CardBorder,
              }}
            >
              <span
                className={styles.summaryLabel}
                style={{
                  color: colors.TextSecondary,
                }}
              >
                {field.label}
              </span>

              <strong
                className={styles.summaryValue}
                style={{
                  color: colors.TextPrimary,
                }}
              >
                {field.type === "currency"
                  ? `$${total.toLocaleString()}`
                  : total.toLocaleString()}
              </strong>
            </div>
          ))}
        </section>
      )}

      {/* Collection information */}
      <section
        className={styles.contentCard}
        style={{
          background: colors.Card,
          borderColor: colors.CardBorder,
        }}
      >
        <div className={styles.contentHeader}>
          <div>
            <h2
              style={{
                color: colors.TextHeading,
              }}
            >
              {collection?.entity || "Results"}
            </h2>

            <p
              style={{
                color: colors.TextSecondary,
              }}
            >
              {pagination?.total ?? collection?.total ?? records.length} records
            </p>
          </div>
        </div>

        {/* Pagination information */}
        {pagination && (
          <div
            className={styles.pagination}
            style={{
              color: colors.TextSecondary,
            }}
          >
            Page {pagination.page ?? 1}
            {pagination.totalPages ? ` of ${pagination.totalPages}` : ""}
          </div>
        )}
      </section>
    </section>
  );
};
