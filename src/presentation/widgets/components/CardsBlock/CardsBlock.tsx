import React, { useMemo, useState, useEffect } from "react";
import { CardItem } from "./CardItem";
import { callMcpTool } from "../../../../utils/mcpBridge";
import styles from "../../../../styles/cardsblock.module.css";
import type { CardsBlockProps } from "../../../../interfaces/mcp/cardsblock.interface";
import {
  useMcpWidgetStore,
  extractToolResult,
} from "../../../../infrastructure/store/mcpWidgetStore";
import { findDetailTool } from "../../helper/AudienceHelper";
import { useRealtimeStream } from "../../hooks/useRealtimeStream";

/**
 * Reduce a get-by-id tool result to the single detail record, generically:
 *  • unwrap a nested { data: {…} } envelope,
 *  • if the payload is a list wrapper ({ products:[…] }) or array, take the
 *    first object,
 *  • otherwise use the object itself.
 * Returns null when nothing object-shaped is found. No entity/company names.
 */
const recordFromToolResult = (result: unknown): Record<string, any> | null => {
  const payload = extractToolResult(result);
  let data: any = payload?.structuredContent?.data;

  if (
    data &&
    typeof data === "object" &&
    !Array.isArray(data) &&
    "data" in data
  ) {
    data = (data as Record<string, unknown>).data;
  }

  if (Array.isArray(data)) {
    const first = data.find((d) => d && typeof d === "object");
    return (first as Record<string, any>) || null;
  }

  if (data && typeof data === "object") {
    const arr = Object.values(data).find((v) => Array.isArray(v)) as
      | any[]
      | undefined;
    const firstInArr = arr?.find((d) => d && typeof d === "object");
    if (firstInArr) return firstInArr as Record<string, any>;
    return data as Record<string, any>;
  }

  return null;
};

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
        // A widget-initiated callTool returns the result to us; the host does
        // NOT automatically re-render the widget with it. So apply it ourselves:
        // open the detail sub-view with the freshest record (enriched values
        // from the tool merged over the card record we already have). This is
        // what makes the tap actually navigate to the detail. Generic.
        const enriched = recordFromToolResult(result);
        pushSubView({
          title: String(record.$title || collection?.entity || "Details"),
          data: enriched ? { ...record, ...enriched } : record,
          blockType: "detail",
        });
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
