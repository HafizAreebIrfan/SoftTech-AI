import React, { useMemo, useState, useEffect } from "react";
import { CardItem } from "./CardItem";
import styles from "../../../../styles/cardsblock.module.css";
import type { CardsBlockProps } from "../../../../interfaces/mcp/cardsblock.interface";
import { useMcpWidgetStore } from "../../../../infrastructure/store/mcpWidgetStore";
import { enrichRecordViaDetailTool } from "../../helper/detailEnrichment";
import { useRealtimeStream } from "../../hooks/useRealtimeStream";

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
  const [localRecords, setLocalRecords] = useState<any[]>(records);

  useEffect(() => {
    setLocalRecords(records);
  }, [records]);

  const streamUrl: string | undefined =
    (block as any)?.streamUrl ||
    (window as any).__WIDGET_METADATA__?.streamUrl ||
    (window as any).__WIDGET_DATA__?.streamUrl ||
    actions?.find((a: any) => a?.streamUrl || a?.isRealtimeApi)?.streamUrl;

  useRealtimeStream({
    streamUrl,
    onMessage: (payload) => {
      if (!payload) return;
      const incomingList = Array.isArray(payload)
        ? payload
        : Array.isArray(payload.data)
          ? payload.data
          : Array.isArray(payload.records)
            ? payload.records
            : [payload];

      setLocalRecords((prev) => {
        let updated = [...prev];
        for (const item of incomingList) {
          if (!item || typeof item !== "object") continue;
          const itemId = item.id || item._id || item.packageId || item.productId;
          if (itemId) {
            const idx = updated.findIndex(
              (r) => (r.id || r._id || r.packageId || r.productId) === itemId,
            );
            if (idx >= 0) {
              updated[idx] = { ...updated[idx], ...item };
            } else {
              updated = [item, ...updated];
            }
          } else {
            updated = [item, ...updated];
          }
        }
        return updated;
      });
    },
  });

  const displayRecords = useMemo(() => {
    let list = localRecords;

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
  }, [localRecords, maxItems, block?.maxItems, audience]);


  if (!displayRecords || displayRecords.length === 0) {
    return null;
  }

  // Card tap → single-record detail (hybrid, shared with the map view):
  // enrich the summary record via the get-by-id detail tool when one exists
  // (so the detail carries booking / availability / date data the list omits),
  // then open the in-widget detail sub-view. enrichRecordViaDetailTool always
  // resolves to a usable record — the original when there is no tool / it fails.
  const handleSelect = async (record: Record<string, any>) => {
    const data = await enrichRecordViaDetailTool(record, actions, collection);
    pushSubView({
      title: String(record.$title || collection?.entity || "Details"),
      data,
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
