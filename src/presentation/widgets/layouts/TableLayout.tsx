import React from "react";
import { WidgetLayoutProps } from "../../../interfaces/mcp/normalizedwidget.interface";
import { TableBlock } from "../components/TableBlock";
import { useThemeStore } from "../../../hooks";
import styles from "../../../styles/dashboardwidget.module.css";

export const TableLayout: React.FC<WidgetLayoutProps> = ({
  title,
  subtitle,
  records,
  fields,
  collection,
  pagination,
  capabilities,
  actions,
  audience,
  presentationPlan,
}) => {
  const { colors } = useThemeStore();
  const blocks = presentationPlan?.blocks ?? [];
  const tableBlock = blocks.find((b) => b.type === "table");

  return (
    <section className={styles.container} style={{ color: colors.TextPrimary }}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title} style={{ color: colors.TextHeading }}>
            {title || collection?.entity || "Data Table"}
          </h1>
          {subtitle && (
            <p className={styles.subtitle} style={{ color: colors.TextSecondary }}>
              {subtitle}
            </p>
          )}
        </div>
      </header>

      <TableBlock
        block={tableBlock}
        records={records}
        fields={fields}
        pagination={pagination}
        capabilities={capabilities}
        actions={actions}
        audience={audience}
      />
    </section>
  );
};


