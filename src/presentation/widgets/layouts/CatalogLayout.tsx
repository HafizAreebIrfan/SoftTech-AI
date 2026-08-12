import React from "react";
import { WidgetLayoutProps } from "../../../interfaces/mcp/normalizedwidget.interface";
import { CardsBlock } from "../components/CardsBlock";
import { useThemeStore } from "../../../hooks";
import styles from "../../../styles/dashboardwidget.module.css";

export const CatalogLayout: React.FC<WidgetLayoutProps> = ({
  title,
  subtitle,
  records,
  fields,
  collection,
  presentationPlan,
}) => {
  const { colors } = useThemeStore();
  const blocks = presentationPlan?.blocks ?? [];
  const cardsBlock = blocks.find((b) => b.type === "cards");

  return (
    <section className={styles.container} style={{ color: colors.TextPrimary }}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title} style={{ color: colors.TextHeading }}>
            {title || collection?.entity || "Catalog"}
          </h1>
          {subtitle && (
            <p className={styles.subtitle} style={{ color: colors.TextSecondary }}>
              {subtitle}
            </p>
          )}
        </div>
      </header>

      <CardsBlock
        block={cardsBlock}
        records={records}
        fields={fields}
      />
    </section>
  );
};

