import React from "react";
import { WidgetLayoutProps } from "../../../interfaces/mcp/normalizedwidget.interface";
import { CardsBlock } from "../components/CardsBlock";
import { useThemeStore } from "../../../hooks";
import styles from "../../../styles/dashboardwidget.module.css";
import { FormBlock } from "../components";

export const CatalogLayout: React.FC<WidgetLayoutProps> = ({
  title,
  subtitle,
  records,
  fields,
  collection,
  capabilities,
  actions,
  audience,
  presentationPlan,
}) => {
  const { colors } = useThemeStore();
  const blocks = presentationPlan?.blocks ?? [];
  const filtersBlock = blocks.find((b) => b.type === "filters");
  const cardsBlock = blocks.find((b) => b.type === "cards");

  return (
    <section className={styles.container} style={{ color: colors.TextPrimary }}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title} style={{ color: colors.TextHeading }}>
            {title || collection?.entity || "Catalog"}
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

      {filtersBlock && (
        <div style={{ marginBottom: "16px" }}>
          {/* Assuming you use FormBlock or a custom FilterBlock for this */}
          <FormBlock block={filtersBlock} fields={fields} />
        </div>
      )}

      <CardsBlock
        block={cardsBlock}
        records={records}
        fields={fields}
        collection={collection}
        capabilities={capabilities}
        actions={actions}
        audience={audience}
      />
    </section>
  );
};
