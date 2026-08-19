import type {
  JsonValue,
  FieldSchema,
} from "../../domain/entities/GenericWidget";

const isObject = (
  value: JsonValue | unknown,
): value is Record<string, JsonValue> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const normalizePath = (path: string): string => {
  return path
    .replace(/\[(\d+)\]/g, ".$1")
    .replace(/^\./, "")
    .replace(/\.$/, "");
};

/**
 * Safely retrieves a value from an arbitrary JSON object using
 * dot notation and array indexes.
 *
 * Examples:
 *
 * getValue(data, "username")
 * getValue(data, "customer.name")
 * getValue(data, "orders.0.username")
 * getValue(data, "orders[0].username")
 */
export const getValue = (data: unknown, path?: string): unknown => {
  if (data === null || data === undefined) {
    return undefined;
  }

  if (!path || path.trim() === "") {
    return data;
  }

  const normalizedPath = normalizePath(path);

  const parts = normalizedPath.split(".").filter(Boolean);

  let current: unknown = data;

  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }

    if (Array.isArray(current)) {
      const index = Number(part);

      if (!Number.isInteger(index)) {
        return undefined;
      }

      current = current[index];
      continue;
    }

    if (isObject(current)) {
      current = current[part];
      continue;
    }

    return undefined;
  }

  return current;
};

/**
 * Resolves a field from one record.
 *
 * Prefer field.path when available.
 * Fall back to field.key for backwards compatibility.
 */
export const getFieldValue = (record: unknown, field: FieldSchema): unknown => {
  return getValue(record, field.path || field.key);
};
