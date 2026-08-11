import React, { useMemo } from "react";
import type {
  Capabilities,
  CollectionResult,
  FieldSchema,
  JsonValue,
  Pagination,
  WidgetAction,
} from "../../../domain/entities/GenericWidget";
import { WidgetLayoutProps } from "../../../interfaces/mcp/normalizedwidget.interface";
import { getFieldValue } from "../../../utils/schema/getValue";
import styles from "../../../styles/dashboardwidget.module.css";
import { useThemeStore } from "../../../hooks";
import { FieldRenderer } from "../components/FieldRenderer/fieldrenderer";

export const DashboardLayout: React.FC<WidgetLayoutProps> = ({
  title,
  subtitle,
  data,
  records,
  fields,
  collection,
  capabilities,
  pagination,
  actions,
}) => {
  const { colors } = useThemeStore();

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
            {title}
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

        {/* Temporary generic table */}
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                {fields.map((field) => (
                  <th
                    key={field.key}
                    style={{
                      color: colors.TextSecondary,
                      borderColor: colors.TableDivider,
                    }}
                  >
                    {field.label}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {records.map((record, rowIndex) => (
                <tr key={rowIndex}>
                  {fields.map((field) => (
                    <td
                      key={field.key}
                      style={{
                        color: colors.TextPrimary,
                        borderColor: colors.TableDivider,
                      }}
                    >
                      <FieldRenderer record={record} field={field} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
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
