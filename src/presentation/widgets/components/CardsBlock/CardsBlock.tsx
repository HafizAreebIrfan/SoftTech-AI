import React, { useMemo } from "react";
import { CardItem } from "./CardItem";
import { callMcpTool } from "../../../../utils/mcpBridge";
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
    let list = records;

    // Defensive customer filtering: drop inactive / pending / draft records for customer audience
    if (audience === "customer") {
      list = list.filter((rec: any) => {
        if (!rec || typeof rec !== "object") return true;
        const statusVal = String(
          rec.$status ||
            rec.status ||
            rec.packagestatus ||
            rec.orderstatus ||
            rec.availabilityStatus ||
            "",
        )
          .toLowerCase()
          .trim();

        if (
          statusVal === "pending" ||
          statusVal === "inactive" ||
          statusVal === "draft" ||
          statusVal === "test" ||
          statusVal === "archived"
        ) {
          return false;
        }
        return true;
      });
    }

    const limit = maxItems || block?.maxItems;
    if (limit && limit > 0) {
      return list.slice(0, limit);
    }
    return list;
  }, [records, maxItems, block?.maxItems, audience]);


  if (!displayRecords || displayRecords.length === 0) {
    return null;
  }

  const detailTool = findDetailTool(actions);

  // Card tap → single-record detail (hybrid):
  //  • if a get-by-id tool exists, fetch the full record from the backend
  //    (the new tool result re-renders the widget as its detail layout);
  //  • otherwise push an instant in-widget detail view built from this record.
  const handleSelect = async (record: Record<string, any>) => {
    const rawId = record.id ?? record._id;

    if (detailTool?.tool && rawId !== undefined && rawId !== null) {
      const idStr = String(rawId);
      console.log(`[CardsBlock] Card selected → calling detail tool "${detailTool.tool}" for id=${idStr}`);
      try {
        const result = await callMcpTool(detailTool.tool, {
          id: idStr,
          _id: idStr,
          productId: idStr,
          packageId: idStr,
          itemId: idStr,
        });
        console.log(`[CardsBlock] ✓ Detail tool "${detailTool.tool}" succeeded:`, result);
      } catch (err) {
        console.error(`[CardsBlock] ✗ Detail tool "${detailTool.tool}" failed:`, err);
        console.log(`[CardsBlock] Falling back to in-widget detail view`);
        pushSubView({
          title: String(record.$title || collection?.entity || "Details"),
          data: record,
          blockType: "detail",
        });
      }
      return;
    }

    console.log(`[CardsBlock] Card selected → no detail tool, using in-widget view for "${record.$title || record.id}"`);
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
