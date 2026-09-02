import React from "react";
import { WidgetLayoutProps } from "../../../interfaces/mcp/normalizedwidget.interface";
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
  capabilities,
  actions,
  audience,
  presentationPlan,
}) => {
  const { colors } = useThemeStore();
  const blocks = presentationPlan?.blocks ?? [];

  return (
    <section className={styles.container}>
      {/* Prompt Answer Summary Banner */}
      {Boolean(collection?.summary || (collection as any)?.text) && (
        <div className={styles.summaryBanner}>
          ✨ {String(collection?.summary || (collection as any)?.text)}
        </div>
      )}

      <div className={styles.blockContainer}>
        {blocks.map((block, index) => {
          let content: React.ReactNode = null;

          switch (block.type) {
            case "summary":
              content = (
                <SummaryBlock
                  block={block}
                  records={records}
                  fields={fields}
                  collection={collection}
                />
              );
              break;

            case "chart":
              content = (
                <ChartsBlock
                  block={block}
                  records={records}
                  fields={fields}
                  collection={collection}
                />
              );
              break;

            case "table":
              content = (
                <TableBlock
                  block={block}
                  records={records}
                  fields={fields}
                  pagination={pagination}
                  capabilities={capabilities}
                  actions={actions}
                  audience={audience}
                />
              );
              break;

            case "cards":
              content = (
                <CardsBlock
                  block={block}
                  records={records}
                  fields={fields}
                  collection={collection}
                  capabilities={capabilities}
                  actions={actions}
                  audience={audience}
                />
              );
              break;

            case "details":
              content = (
                <DetailBlock
                  block={block}
                  records={records}
                  fields={fields}
                  collection={collection}
                  actions={actions}
                  audience={audience}
                />
              );
              break;

            case "assets":
            case "asset":
              content = (
                <AssetBlock block={block} records={records} fields={fields} />
              );
              break;

            case "filters":
              content = (
                <FormBlock block={block} fields={fields} actions={actions} />
              );
              break;

            default:
              content = null;
          }

          if (!content) return null;

          return (
            <div key={`block-${index}`} className={styles.blockWrapper}>
              {content}
            </div>
          );
        })}
      </div>
    </section>
  );
};
