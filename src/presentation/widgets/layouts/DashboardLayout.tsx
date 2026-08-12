import React, { useMemo } from "react";
import { WidgetLayoutProps } from "../../../interfaces/mcp/normalizedwidget.interface";
import { getFieldValue } from "../../../utils/schema/getValue";
import styles from "../../../styles/dashboardwidget.module.css";
import { useThemeStore } from "../../../hooks";
import { ChartsBlock, TableBlock } from "../components";
import { SummaryBlock } from "../components/SummaryBlock";
import { DetailBlock } from "../components/DetailBlock";
import { CardsBlock } from "../components/CardsBlock";
import { AssetBlock } from "../components/AssetBlock";
import { FormBlock } from "../components/FormBlock";

export const DashboardLayout: React.FC<WidgetLayoutProps> = ({
  title,
  subtitle,
  records,
  fields,
  collection,
  pagination,
  actions,
  presentationPlan,
}) => {
  const { colors } = useThemeStore();
  const blocks = presentationPlan?.blocks ?? [];

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
          <h1 className={styles.title} style={{ color: colors.TextHeading }}>
            {title || collection?.entity || "Dashboard"}
          </h1>

          {subtitle && (
            <p
              className={styles.subtitle}
              style={{ color: colors.TextSecondary }}
            >
              {subtitle}
            </p>
          )}
        </div>
      </header>
      <div className={styles.blockContainer}>
        {blocks.map((block, index) => {
          switch (block.type) {
            case "summary":
              return (
                <SummaryBlock
                  key={`summary-${index}`}
                  block={block}
                  records={records}
                  fields={fields}
                  collection={collection}
                />
              );

            case "chart":
              return (
                <ChartsBlock
                  key={`chart-${index}`}
                  block={block}
                  records={records}
                  fields={fields}
                />
              );

            case "table":
              return (
                <TableBlock
                  key={`table-${index}`}
                  block={block}
                  records={records}
                  fields={fields}
                />
              );

            case "cards":
              return (
                <CardsBlock
                  key={`cards-${index}`}
                  block={block}
                  records={records}
                  fields={fields}
                />
              );

            case "details":
              return (
                <DetailBlock
                  key={`detail-${index}`}
                  block={block}
                  records={records}
                  fields={fields}
                />
              );

            case "assets":
            case "asset":
              return (
                <AssetBlock
                  key={`asset-${index}`}
                  block={block}
                  records={records}
                  fields={fields}
                />
              );

            case "filters":
              return (
                <FormBlock
                  key={`form-${index}`}
                  block={block}
                  fields={fields}
                  actions={actions}
                />
              );

            default:
              return null;
          }
        })}
      </div>
    </section>
  );
};
