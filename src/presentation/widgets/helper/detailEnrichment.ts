import { callMcpTool } from "../../../utils/mcpBridge";
import { extractToolResult } from "../../../infrastructure/store/mcpWidgetStore";
import { findDetailTool } from "./AudienceHelper";

/**
 * Reduce a get-by-id tool result to its single detail record, generically:
 *  • unwrap a nested { data: {…} } envelope,
 *  • unwrap a known / single-key wrapper ({ product:{…} } / { car:{…} } …),
 *  • if the payload is a list wrapper or array, take the first object,
 *  • otherwise use the object itself.
 * Returns null when nothing object-shaped is found. No entity/company names.
 */
export const recordFromToolResult = (
  result: unknown,
): Record<string, any> | null => {
  const payload = extractToolResult(result);
  let data: any =
    payload?.structuredContent?.data ?? (payload as any)?.data ?? payload;

  if (data && typeof data === "object" && !Array.isArray(data)) {
    // Check known common wrapper keys or single-key envelopes generically
    for (const key of [
      "product",
      "car",
      "package",
      "service",
      "item",
      "record",
      "result",
      "detail",
      "data",
    ]) {
      if (
        key in data &&
        data[key] &&
        typeof data[key] === "object" &&
        !Array.isArray(data[key])
      ) {
        data = data[key];
        break;
      }
    }
    // If the object has only 1 property and that property is an object, unwrap it
    const keys = Object.keys(data);
    if (
      keys.length === 1 &&
      typeof data[keys[0]] === "object" &&
      data[keys[0]] !== null &&
      !Array.isArray(data[keys[0]])
    ) {
      data = data[keys[0]];
    }
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

/**
 * Card / marker tap enrichment — shared by the grid (CardsBlock) and the map
 * (MapCatalogLayout) so a tapped item opens the SAME detail regardless of view.
 *
 * When a get-by-id detail tool exists, fetch the full record from the backend
 * and merge the enriched values over the summary record we already hold, so the
 * detail view carries booking / availability / date data the list payload
 * omitted. Falls back to the original record whenever there is no detail tool,
 * no id, or the call fails — the caller always gets a usable record to render.
 *
 * Fully generic: keys off the detail action + record id only (no entity names).
 */
export const enrichRecordViaDetailTool = async (
  record: Record<string, any>,
  actions: any[] | undefined,
  collection?: { entity?: string } | null,
): Promise<Record<string, any>> => {
  const detailTool = findDetailTool(actions || []);
  const rawId = record?.id ?? record?._id;
  if (!detailTool?.tool || rawId === undefined || rawId === null) return record;

  const idStr = String(rawId);
  const numId = Number(rawId);
  const isNumeric = !isNaN(numId) && typeof rawId !== "boolean";
  const entitySingular = (collection?.entity || "").replace(/s$/, "").toLowerCase();
  const entityIdKey = entitySingular ? `${entitySingular}Id` : "itemId";

  try {
    let result: unknown;
    try {
      // Attempt 1: clean single parameter with native type (standard: { id })
      result = await callMcpTool(detailTool.tool, { id: isNumeric ? numId : idStr });
    } catch {
      try {
        // Attempt 2: entity-specific id key (e.g. { carId }, { packageId })
        result = await callMcpTool(detailTool.tool, {
          [entityIdKey]: isNumeric ? numId : idStr,
        });
      } catch {
        // Attempt 3: combined multi-key payload for strict schemas
        result = await callMcpTool(detailTool.tool, {
          id: isNumeric ? numId : idStr,
          [entityIdKey]: isNumeric ? numId : idStr,
          productId: isNumeric ? numId : idStr,
          carId: isNumeric ? numId : idStr,
          packageId: isNumeric ? numId : idStr,
          itemId: isNumeric ? numId : idStr,
        });
      }
    }
    const enriched = recordFromToolResult(result);
    return enriched ? { ...record, ...enriched } : record;
  } catch {
    return record;
  }
};
