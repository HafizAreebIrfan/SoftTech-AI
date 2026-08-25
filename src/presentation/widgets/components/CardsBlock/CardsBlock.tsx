import React, { useMemo } from "react";
import { CardItem } from "./CardItem";
import styles from "../../../../styles/cardsblock.module.css";
import type { CardsBlockProps } from "../../../../interfaces/mcp/cardsblock.interface";
import { useMcpWidgetStore } from "../../../../infrastructure/store/mcpWidgetStore";
import { findDetailTool } from "../../helper/AudienceHelper";

export const CardsBlock: React.FC<CardsBlockProps> = ({
  block,
  records = [],
  fields = [],
  maxItems,
  variant,
  actions = [],
  collection,
  audience,
}) => {
  const pushSubView = useMcpWidgetStore((state) => state.pushSubView);

  const displayRecords = useMemo(() => {
    const limit = maxItems || block?.maxItems;
    if (limit && limit > 0) {
      return records.slice(0, limit);
    }
    return records;
  }, [records, maxItems, block?.maxItems]);

  if (!displayRecords || displayRecords.length === 0) {
    return null;
  }

  const detailTool = findDetailTool(actions);

  // Card tap → single-record detail (hybrid):
  //  • if a get-by-id tool exists, fetch the full record from the backend
  //    (the new tool result re-renders the widget as its detail layout);
  //  • otherwise push an instant in-widget detail view built from this record.
  const handleSelect = (record: Record<string, any>) => {
    const openai = (window as any).openai;
    const id = record.id ?? record._id;

    if (detailTool?.tool && openai?.callTool && id !== undefined) {
      openai.callTool(detailTool.tool, { id });
      return;
    }

    pushSubView({
      title: String(record.$title || collection?.entity || "Details"),
      data: record,
      blockType: "detail",
    });
  };

  return (
    <section className={styles.container}>
      <div className={styles.grid}>
        {displayRecords.map((record: any, index) => (
          <CardItem
            key={`card-${record.id || index}`}
            record={record}
            fields={fields}
            variant={variant || block?.variant}
            actions={actions}
            audience={audience}
            onSelect={handleSelect}
          />
        ))}
      </div>
    </section>
  );
};
