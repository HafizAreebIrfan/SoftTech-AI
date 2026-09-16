import React from "react";
import { WidgetLayoutProps } from "../../../interfaces/mcp/normalizedwidget.interface";
import { DetailBlock } from "../components/DetailBlock";
import { useThemeStore } from "../../../hooks";
import styles from "../../../styles/dashboardwidget.module.css";

export const GeneralLayout: React.FC<WidgetLayoutProps> = ({
  title,
  subtitle,
  records,
  fields,
  collection,
  actions,
  audience,
  presentationPlan,
}) => {
  const { colors } = useThemeStore();
  const blocks = presentationPlan?.blocks ?? [];
  const detailBlock = blocks.find((b) => b.type === "details" || b.type === "detail");

  return (
    <section className={styles.container}>

      <DetailBlock
        block={detailBlock}
        records={records}
        fields={fields}
        collection={collection}
        actions={actions}
        audience={audience}
      />
    </section>
  );
};

