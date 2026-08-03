import { SYSTEM_FIELDS } from "./constants";
import { toLabel } from "./formatter";
import { FieldMetadata } from "./interfaces";
import { detectFieldType } from "./typeDetector";

export const analyzeFields = (record: Record<string, unknown>): FieldMetadata[] => {
  if (!record || typeof record !== "object") return [];

  const keys = Object.keys(record);

  return keys.map((key) => {
    const value = record[key];
    const isSystem = SYSTEM_FIELDS.has(key);
    const lowerKey = key.toLowerCase();
    const isPrimary =
      lowerKey === "id" ||
      lowerKey === "_id" ||
      lowerKey === "uuid" ||
      lowerKey === "code";

    const type = detectFieldType(key, value);

    return {
      key,
      label: toLabel(key),
      type,
      hidden: isSystem,
      primary: isPrimary,
      sortable: !isSystem && type !== "object" && type !== "array",
      searchable: !isSystem && (type === "text" || type === "email" || type === "status"),
      filterable: !isSystem && (type === "status" || type === "currency" || type === "date"),
    };
  });
};
