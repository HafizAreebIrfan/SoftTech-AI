import { ApiSchema, FieldMetadata, AnalyzerOptions } from "./interfaces";
import { detectFieldType } from "./typeDetector";

export const generateHeuristicSchema = (
  rawResponse: unknown,
  options?: AnalyzerOptions
): ApiSchema => {
  let sampleObj: Record<string, unknown> = {};

  if (Array.isArray(rawResponse) && rawResponse.length > 0) {
    sampleObj = typeof rawResponse[0] === "object" && rawResponse[0] !== null ? (rawResponse[0] as Record<string, unknown>) : { value: rawResponse[0] };
  } else if (typeof rawResponse === "object" && rawResponse !== null) {
    sampleObj = rawResponse as Record<string, unknown>;
  } else {
    sampleObj = { response: rawResponse };
  }

  const fields: FieldMetadata[] = Object.entries(sampleObj).map(([key, val]) => {
    const lowerKey = key.toLowerCase();
    const isHidden = ["_id", "__v", "password", "secret", "token", "hash"].some((h) => lowerKey.includes(h));
    const isPrimary = key === "id" || key === "_id" || lowerKey.includes("id");

    return {
      key,
      label: key
        .replace(/([A-Z])/g, " $1")
        .replace(/_/g, " ")
        .replace(/^./, (str) => str.toUpperCase())
        .trim(),
      type: detectFieldType(key, val),
      hidden: isHidden,
      primary: isPrimary,
      sortable: true,
      searchable: true,
      filterable: true,
    };
  });

  const keys = Object.keys(sampleObj);
  const primaryKey = keys.find((k) => k === "id" || k === "_id" || k.toLowerCase().endsWith("id"));
  const titleKey = keys.find((k) => ["title", "name", "label", "heading", "username"].includes(k.toLowerCase()));
  const subtitleKey = keys.find((k) => ["email", "subtitle", "description", "category"].includes(k.toLowerCase()));
  const imageKey = keys.find((k) => ["image", "avatar", "photo", "thumbnail", "pic"].includes(k.toLowerCase()));
  const statusKey = keys.find((k) => ["status", "state", "condition"].includes(k.toLowerCase()));
  const amountKey = keys.find((k) => ["amount", "price", "cost", "total", "fee"].includes(k.toLowerCase()));
  const dateKey = keys.find((k) => ["date", "createdat", "updatedat", "timestamp"].includes(k.toLowerCase().replace(/_/g, "")));

  const rawEntity = (options?.apiName || "Data")
    .toLowerCase()
    .replace(/^get\s*/i, "")
    .replace(/^fetch\s*/i, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return {
    entity: rawEntity || "entity",
    defaultLayout: Array.isArray(rawResponse) ? "table" : "cards",
    fields,
    entityMeta: {
      entity: rawEntity || "entity",
      primaryKey,
      titleKey,
      subtitleKey,
      imageKey,
      statusKey,
      dateKey,
      amountKey,
    },
    uiHints: {
      search: true,
      sorting: true,
      filters: true,
      pagination: true,
      bulkActions: false,
      editable: false,
      chart: false,
      map: false,
    },
    analyzedAt: new Date().toISOString(),
  };
};
