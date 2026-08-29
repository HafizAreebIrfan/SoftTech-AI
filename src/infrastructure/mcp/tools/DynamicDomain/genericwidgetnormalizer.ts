import { ApiSchema } from "../../schema_analyzer/interfaces";
import { GenericWidgetResult, WidgetAction } from "../../../../domain/types/genericWidget.types";
import { JsonValue } from "../../../../domain/types/mcpjsonprimitive.types";
import { CapabilitiesResult } from "../../../../domain/types/mcpcapabilities.types";
import {
  CollectionResult,
  FieldSchema,
} from "../../../../domain/types/mcpcollection.types";
import { PaginationResult } from "../../../../domain/types/mcppagination.types";
import { WidgetAudience } from "../../../../domain/types/widgetaudience.types";
import { PlatformType } from "../../../../domain/types/widgetplatform.types";

/**
 * Registered MCP tool ids that back each CRUD action for an entity. Resolved
 * once per company at tool-registration time and passed in so the widget's
 * action buttons target real tools instead of display names. Any role may be
 * absent when the company did not register a tool for it.
 */
export interface ActionToolLinks {
  detail?: string;
  create?: string;
  update?: string;
  delete?: string;
}

export const normalizeApiResponseToWidget = (
  companyName: string,
  apiName: string,
  response: unknown,
  layout?: string,
  industry?: string,
  apiSchema?: ApiSchema,
  apiParams: any[] = [],
  audience?: WidgetAudience,
  platformType?: PlatformType,
  method = "GET",
  themeColor?: string,
  actionTools?: ActionToolLinks,
  userRawPrompt?: string,
  inferredIntent?: string,
): GenericWidgetResult => {
  const rawData = normalizeJsonValue(response);

  const collection = buildCollectionMetadata(
    apiName,
    rawData,
    layout,
    apiSchema,
    audience,
  );

  // 1. Sanitize the payload: strip internal fields, apply schema, and flatten arrays
  let data = sanitizeDataPayload(rawData, collection?.fields || [], apiSchema);
  if (data === undefined) {
    data = rawData ?? null;
  }

  const capabilities = buildCapabilities(apiParams, method);
  const pagination = extractPagination(data);

  const entityName = apiSchema?.entity || collection?.entity || "";
  const entityLower = String(entityName).toLowerCase();

  const isCommercialEntity =
    /package|product|service|hotel|car|item|accommodation/.test(entityLower);

  // 2. Fix interactivity: Treat catalog GET requests as interactive so buttons render
  const isInteractiveAction =
    method.toUpperCase() !== "GET" ||
    isCommercialEntity ||
    audience === "customer" ||
    layout === "catalog" ||
    layout === "table" ||
    Boolean(collection);

  const defaultActions = isInteractiveAction
    ? buildWidgetActions(actionTools, audience, isCommercialEntity)
    : undefined;

  return {
    title: apiName || "API Result",
    subtitle: "Live API response",
    data,
    ...(collection ? { collection } : {}),
    ...(hasCapabilities(capabilities) ? { capabilities } : {}),
    ...(pagination ? { pagination } : {}),
    ...(defaultActions ? { actions: defaultActions } : {}),
    ...(audience ? { audience } : {}),
    ...(platformType ? { platformtype: platformType } : {}),
    metadata: {
      companyName,
      apiName,
      httpMethod: method.toUpperCase(),
      isAction: isInteractiveAction,
      ...(industry ? { industry } : {}),
      ...(themeColor ? { themeColor } : {}),
      ...(entityName ? { entity: entityName } : {}),
      ...(userRawPrompt ? { user_raw_prompt: userRawPrompt } : {}),
      ...(inferredIntent ? { inferred_intent: inferredIntent } : {}),
      generatedAt: new Date().toISOString(),
    },
  };
};

/**
 * Builds the widget's action buttons. Every emitted action points at a REAL
 * registered MCP tool id (resolved per entity at registration time and passed
 * in via `actionTools`) — never a display name — and is only emitted when a
 * tool actually backs it, so the widget's `callTool(action.tool, { id })`
 * always resolves. When no sibling tool exists the action is omitted and the
 * widget's own client-side preview modal still covers plain "view". The verb
 * ids (create/update/delete) match what the table view looks for. Generic for
 * every company and industry.
 */
const buildWidgetActions = (
  actionTools: ActionToolLinks | undefined,
  audience: WidgetAudience | undefined,
  commercial: boolean,
): WidgetAction[] | undefined => {
  if (!actionTools) return undefined;

  const actions: WidgetAction[] = [];

  // Open / view one record -> the entity's get-by-id tool. Customers on a
  // commercial catalog get a "Select" affordance; everyone else gets "View".
  if (actionTools.detail) {
    const isSelect = commercial && audience !== "admin";
    actions.push({
      id: isSelect ? "select_item" : "view_details",
      label: isSelect ? "Select Option" : "View Details",
      tool: actionTools.detail,
      requiresItem: true,
      enabled: true,
    });
  }

  // Write actions only for admins, and only when a tool implements them.
  if (audience === "admin") {
    if (actionTools.create) {
      actions.push({
        id: "create",
        label: "Create New",
        tool: actionTools.create,
        enabled: true,
      });
    }
    if (actionTools.update) {
      actions.push({
        id: "update",
        label: "Edit",
        tool: actionTools.update,
        requiresItem: true,
        enabled: true,
      });
    }
    if (actionTools.delete) {
      actions.push({
        id: "delete",
        label: "Delete",
        tool: actionTools.delete,
        requiresItem: true,
        requiresConfirmation: true,
        enabled: true,
      });
    }
  }

  return actions.length > 0 ? actions : undefined;
};

/**
 * Strips internal database artifacts, enforces the schema, and flattens primitive arrays.
 */
const sanitizeDataPayload = (
  data: JsonValue,
  fields: FieldSchema[],
  apiSchema?: ApiSchema,
): JsonValue => {
  const located = locateEntityRecords(data, apiSchema);
  const recordsToProcess = located
    ? located.records
    : Array.isArray(data)
      ? data.filter(isObject)
      : [];

  if (recordsToProcess.length === 0) {
    return data;
  }

  const allowedKeys = new Set(fields.map((f) => f.key));
  const hasSchema = allowedKeys.size > 0;

  const cleanRecords = recordsToProcess.map((record) => {
    const cleanRecord: Record<string, JsonValue> = {};

    // Ensure we always preserve an ID for frontend actions
    const recordId = record.id || record._id;
    if (recordId) {
      cleanRecord.id = recordId;
    }

    for (const [key, value] of Object.entries(record)) {
      if (isInternalField(key)) continue;

      // Drop fields not in the Gemini schema — but never strip reserved widget
      // keys (checkout CTA `url`/`link` and pre-computed $-markers injected
      // upstream), otherwise the checkout call-to-action vanishes here.
      if (
        hasSchema &&
        !allowedKeys.has(key) &&
        key !== "_id" &&
        key !== "id" &&
        !isReservedWidgetKey(key)
      ) {
        continue;
      }

      let finalValue = value;
      // Flatten arrays of strings/numbers
      if (
        Array.isArray(value) &&
        value.every((v) => typeof v === "string" || typeof v === "number")
      ) {
        finalValue = value.join(", ");
      }

      cleanRecord[key] = finalValue;

      // Pre-computed $-marker keys are already final; skip the re-mapping pass.
      if (key.startsWith("$")) continue;

      // Map to standard UI keys using AI schema first, heuristics second
      const schemaField = fields.find((f) => f.key === key);

      if (schemaField?.uiRole) {
        applySchemaUiRole(cleanRecord, schemaField.uiRole, finalValue);
      } else {
        const k = key.toLowerCase();
        if (!cleanRecord.$title && (k.includes("name") || k.includes("title")))
          cleanRecord.$title = finalValue;
        else if (
          !cleanRecord.$description &&
          (k.includes("desc") ||
            k.includes("type") ||
            k.includes("summary") ||
            k.includes("facility"))
        )
          cleanRecord.$description = finalValue;
        else if (
          !cleanRecord.$price &&
          (k.includes("price") || k.includes("amount") || k.includes("cost"))
        )
          cleanRecord.$price = finalValue;
        else if (
          !cleanRecord.$status &&
          (k.includes("status") || k.includes("state"))
        )
          cleanRecord.$status = finalValue;
        else if (
          !cleanRecord.$image &&
          (k.includes("image") ||
            k.includes("url") ||
            k.includes("photo") ||
            k.includes("thumbnail"))
        )
          cleanRecord.$image = finalValue;
      }
    }

    // Surface schema fields declared via nested dot-paths (e.g.
    // "dimensions.width", "meta.qrCode") as flat keys so nested business data
    // is not silently dropped. Sub-objects and arrays-of-objects are skipped;
    // arrays of primitives are joined like the top-level pass above.
    for (const field of fields) {
      const rawPath = String(field.path || "");
      if (!rawPath.includes(".")) continue; // top-level keys handled above

      const nestedValue = resolveDotPath(record, rawPath);
      if (nestedValue === undefined || nestedValue === null) continue;
      if (isObject(nestedValue)) continue;

      let flatValue: JsonValue = nestedValue;
      if (Array.isArray(flatValue)) {
        if (
          flatValue.every((v) => typeof v === "string" || typeof v === "number")
        ) {
          flatValue = flatValue.join(", ");
        } else {
          continue;
        }
      }

      if (!(field.key in cleanRecord)) {
        cleanRecord[field.key] = flatValue;
      }
      if (field.uiRole) applySchemaUiRole(cleanRecord, field.uiRole, flatValue);
    }

    return cleanRecord;
  });

  // A single-record response (e.g. GET /products/{id}) is rendered through the
  // same one-item path so its $title/$price/$image markers apply correctly and
  // its total reads as 1 instead of the size of some nested array.
  if (located?.single) {
    return cleanRecords;
  }

  if (located?.key && isObject(data)) {
    return {
      ...data,
      [located.key]: cleanRecords,
    };
  }

  return cleanRecords;
};

/**
 * Maps a schema field's uiRole onto the standard $-prefixed UI keys the widget
 * reads. Shared by the top-level and nested-path passes.
 */
const applySchemaUiRole = (
  cleanRecord: Record<string, JsonValue>,
  uiRole: string,
  value: JsonValue,
): void => {
  if (uiRole === "title") cleanRecord.$title = value;
  else if (uiRole === "description") cleanRecord.$description = value;
  else if (uiRole === "price") cleanRecord.$price = value;
  else if (uiRole === "image") cleanRecord.$image = value;
  else if (uiRole === "status") cleanRecord.$status = value;
  else if (uiRole === "metric") cleanRecord.$metric = value;
};

const normalizeJsonValue = (value: unknown): JsonValue => {
  if (value === undefined || value === null) return null;
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  )
    return value;
  if (Array.isArray(value)) return value.map(normalizeJsonValue);
  if (typeof value === "object") {
    const result: Record<string, JsonValue> = {};
    Object.entries(value as Record<string, unknown>).forEach(([key, item]) => {
      result[key] = normalizeJsonValue(item);
    });
    return result;
  }
  return String(value);
};

const buildCollectionMetadata = (
  apiName: string,
  data: JsonValue,
  layout?: string,
  apiSchema?: ApiSchema,
  audience?: WidgetAudience,
): CollectionResult | undefined => {
  const entity = apiSchema?.entity || inferEntityName(apiName, data);
  if (!entity) return undefined;

  const result: CollectionResult = {
    entity,
    ...(apiSchema?.dataPath ? { dataPath: apiSchema.dataPath } : {}),
  };

  let selectedLayout = apiSchema?.defaultLayout || layout;
  const entityLower = String(entity || "").toLowerCase();
  const isCommercial =
    /package|product|service|hotel|car|item|accommodation/.test(entityLower);

  if (!selectedLayout || (isCommercial && audience === "customer")) {
    selectedLayout = audience === "admin" ? "table" : "catalog";
  }

  if (selectedLayout) {
    result.layout = selectedLayout;
  }

  const collectionData = locateEntityRecords(data, apiSchema);

  if (collectionData) {
    const { key, records } = collectionData;
    result.entity = apiSchema?.entity || key || entity;
    result.itemLabel = inferItemLabel(result.entity);

    const schemaFields = buildFieldsFromApiSchema(apiSchema);
    result.fields =
      schemaFields.length > 0 ? schemaFields : buildFieldsFromRecords(records);
    result.total = records.length;
  } else if (Array.isArray(data)) {
    result.itemLabel = inferItemLabel(result.entity);
    const schemaFields = buildFieldsFromApiSchema(apiSchema);
    result.fields =
      schemaFields.length > 0
        ? schemaFields
        : buildFieldsFromRecords(data.filter(isObject));
    result.total = data.length;
  }

  const pagination = extractPagination(data);
  if (pagination?.page !== undefined) result.page = pagination.page;
  if (pagination?.limit !== undefined) result.limit = pagination.limit;
  if (pagination?.totalPages !== undefined)
    result.totalPages = pagination.totalPages;
  if (pagination?.total !== undefined) result.total = pagination.total;

  const rawRecords = collectionData
    ? collectionData.records
    : Array.isArray(data)
      ? data.filter(isObject)
      : [];

  if (rawRecords.length > 0) {
    const fields = result.fields || [];
    const numericFields = fields.filter(
      (f) => f.type === "currency" || f.type === "number",
    );
    const dateFields = fields.filter(
      (f) => f.type === "datetime" || f.type === "date",
    );
    const computedMetrics: Array<{
      label: string;
      value: string;
      change?: string;
    }> = [];

    computedMetrics.push({
      label: `Total ${toLabel(result.itemLabel || "records")}`,
      value: String(result.total || rawRecords.length),
    });

    if (numericFields.length > 0 && rawRecords.length > 1) {
      const primaryNumField = numericFields[0];
      let sum = 0;
      let validCount = 0;

      rawRecords.forEach((rec) => {
        const val = Number(rec[primaryNumField.key]);
        if (!isNaN(val)) {
          sum += val;
          validCount++;
        }
      });

      if (validCount > 0) {
        const isCurrency = primaryNumField.type === "currency";
        const formattedSum = isCurrency
          ? `$${sum.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          : sum.toLocaleString();
        const avg = sum / validCount;
        const formattedAvg = isCurrency
          ? `$${avg.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          : avg.toLocaleString();

        computedMetrics.push({
          label: `Total ${primaryNumField.label || toLabel(primaryNumField.key)}`,
          value: formattedSum,
        });
        computedMetrics.push({
          label: `Avg ${primaryNumField.label || toLabel(primaryNumField.key)}`,
          value: formattedAvg,
        });
      }
    }

    if (computedMetrics.length > 0) result.metrics = computedMetrics;

    if (numericFields.length > 0 && dateFields.length > 0) {
      const primaryNumField = numericFields[0];
      const primaryDateField = dateFields[0];
      const monthlyGroups: Record<string, number> = {};

      rawRecords.forEach((rec) => {
        const dateVal = String(rec[primaryDateField.key] || "");
        const numVal = Number(rec[primaryNumField.key] || 0);

        if (dateVal && !isNaN(numVal)) {
          let monthKey = "";
          try {
            const d = new Date(dateVal);
            if (!isNaN(d.getTime())) {
              monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
            }
          } catch (e) {
            monthKey = "";
          }

          if (monthKey) {
            monthlyGroups[monthKey] = (monthlyGroups[monthKey] || 0) + numVal;
          }
        }
      });

      const sortedMonths = Object.keys(monthlyGroups).sort();
      if (sortedMonths.length >= 2) {
        const chartData = sortedMonths.map((m) => ({
          label: m,
          value: Math.round(monthlyGroups[m] * 100) / 100,
        }));
        result.charts = [
          {
            type: "line",
            title: `${primaryNumField.label || "Sales"} Trend`,
            data: chartData,
          },
        ];
      }
    }

    if (!selectedLayout || selectedLayout === "auto") {
      result.layout =
        result.metrics && result.metrics.length > 1 ? "dashboard" : "table";
    }
  }

  return result;
};

const findRecordCollection = (
  value: JsonValue,
  currentKey?: string,
): { key?: string; records: Record<string, JsonValue>[] } | undefined => {
  if (Array.isArray(value)) {
    const records = value.filter(isObject);
    if (records.length > 0) return { key: currentKey, records };
    return undefined;
  }

  if (!isObject(value)) return undefined;

  for (const [key, child] of Object.entries(value)) {
    if (Array.isArray(child)) {
      const records = child.filter(isObject);
      if (records.length > 0) return { key, records };
    }
  }

  for (const [key, child] of Object.entries(value)) {
    if (isObject(child) || Array.isArray(child)) {
      const result = findRecordCollection(child, key);
      if (result) return result;
    }
  }

  return undefined;
};

/**
 * Walks a dot-notation path (relative to one record) and returns the value at
 * that path, or undefined if any segment is missing. Used to honor the AI
 * analyzer's `dataPath` and nested field `path`s.
 */
const resolveDotPath = (
  source: JsonValue,
  path: string,
): JsonValue | undefined => {
  const segments = String(path || "")
    .split(".")
    .map((segment) => segment.trim())
    .filter(Boolean);

  if (segments.length === 0) return source;

  let current: JsonValue = source;
  for (const segment of segments) {
    if (isObject(current) && Object.prototype.hasOwnProperty.call(current, segment)) {
      current = current[segment];
    } else {
      return undefined;
    }
  }
  return current;
};

/**
 * Decides whether a lone object is a single business record (e.g. GET
 * /products/{id}) rather than a wrapper around a collection array. Uses the AI
 * schema when available (its fields are direct keys of the record) and falls
 * back to a light heuristic (a top-level id plus its own scalar fields).
 */
const looksLikeSingleRecord = (
  obj: { [key: string]: JsonValue },
  apiSchema?: ApiSchema,
): boolean => {
  const directFields = (apiSchema?.fields || []).filter(
    (field) => !String(field.path || "").includes("."),
  );
  if (directFields.length > 0) {
    const directHits = directFields.filter((field) =>
      Object.prototype.hasOwnProperty.call(obj, field.key),
    ).length;
    if (directHits >= Math.min(2, directFields.length)) return true;
  }

  const hasId = "id" in obj || "_id" in obj;
  const scalarCount = Object.values(obj).filter(
    (value) => value === null || typeof value !== "object",
  ).length;
  return hasId && scalarCount >= 2;
};

/**
 * Locates the business records in any response shape and reports whether it is
 * a single record or a collection. Priority:
 *   1. The AI analyzer's `dataPath` when it resolves.
 *   2. A root array (collection).
 *   3. A single record object (so nested arrays like `reviews` don't hijack it).
 *   4. Legacy fallback: the first nested object-array.
 * Generic for every company/entity — nothing here is product-specific.
 */
const locateEntityRecords = (
  value: JsonValue,
  apiSchema?: ApiSchema,
):
  | { key?: string; records: Record<string, JsonValue>[]; single: boolean }
  | undefined => {
  const dataPath = String(apiSchema?.dataPath || "").trim();

  // (1) Trust the analyzer's dataPath when it points somewhere resolvable.
  if (dataPath) {
    const resolved = resolveDotPath(value, dataPath);
    const key = dataPath.split(".").filter(Boolean).pop();

    if (Array.isArray(resolved)) {
      const records = resolved.filter(isObject);
      return records.length > 0 ? { key, records, single: false } : undefined;
    }
    if (isObject(resolved)) {
      return { key, records: [resolved], single: true };
    }
    // dataPath didn't resolve -> fall through to structural detection.
  }

  // (2) Root is already the collection array.
  if (Array.isArray(value)) {
    const records = value.filter(isObject);
    return records.length > 0 ? { records, single: false } : undefined;
  }

  // (3)/(4) Root object: single record vs. wrapper around a collection.
  if (isObject(value)) {
    if (looksLikeSingleRecord(value, apiSchema)) {
      return { records: [value], single: true };
    }
    const found = findRecordCollection(value);
    if (found) {
      return { key: found.key, records: found.records, single: false };
    }
  }

  return undefined;
};

const buildFieldsFromApiSchema = (apiSchema?: ApiSchema): FieldSchema[] => {
  if (!apiSchema?.fields || apiSchema.fields.length === 0) return [];
  const seenKeys = new Set<string>();
  return apiSchema.fields
    .filter((field) => !field.hidden)
    .filter((field) => {
      // Guard against the analyzer emitting two fields with the same key (e.g.
      // a top-level and a nested path both keyed "price"), which renders
      // duplicate columns and collides on React keys. First occurrence wins.
      if (!field.key || seenKeys.has(field.key)) return false;
      seenKeys.add(field.key);
      return true;
    })
    .map((field) => ({
      key: field.key,
      label: field.label,
      type: normalizeFieldSchemaType(field.type),
      ...(field.path ? { path: field.path } : {}),
      hidden: field.hidden,
      primary: field.primary,
      sortable: field.sortable,
      searchable: field.searchable,
      filterable: field.filterable,
      uiRole: (field as any).uiRole,
    }));
};

const buildFieldsFromRecords = (
  records: Record<string, JsonValue>[],
): FieldSchema[] => {
  if (records.length === 0) return [];
  const firstRecord = records[0];
  return Object.entries(firstRecord)
    .filter(([key]) => !isInternalField(key))
    .map(([key, value]) => ({
      key,
      label: toLabel(key),
      type: detectFieldSchemaType(key, value),
    }));
};

const normalizeFieldSchemaType = (
  type: string | undefined,
): FieldSchema["type"] => {
  if (!type) return "text";
  const normalized = type.toLowerCase();
  switch (normalized) {
    case "text":
    case "string":
      return "text";
    case "number":
    case "integer":
    case "float":
    case "decimal":
      return "number";
    case "currency":
    case "money":
    case "price":
    case "amount":
      return "currency";
    case "date":
      return "date";
    case "datetime":
    case "timestamp":
      return "datetime";
    case "image":
      return "image";
    case "email":
      return "email";
    case "phone":
    case "tel":
    case "telephone":
      return "phone";
    case "status":
      return "status";
    case "boolean":
    case "bool":
      return "boolean";
    case "latitude":
      return "latitude";
    case "longitude":
      return "longitude";
    case "url":
    case "uri":
      return "url";
    case "object":
      return "object";
    case "array":
      return "array";
    default:
      return "text";
  }
};

const detectFieldSchemaType = (
  key: string,
  value: JsonValue,
): FieldSchema["type"] => {
  const normalizedKey = key.toLowerCase();
  if (isInternalField(key)) return "text";
  if (normalizedKey.includes("email") || normalizedKey === "mail")
    return "email";
  if (
    normalizedKey.includes("phone") ||
    normalizedKey.includes("mobile") ||
    normalizedKey.includes("telephone")
  )
    return "phone";
  if (
    normalizedKey === "status" ||
    normalizedKey.endsWith("status") ||
    normalizedKey.includes("state")
  )
    return "status";
  if (normalizedKey === "latitude" || normalizedKey === "lat")
    return "latitude";
  if (
    normalizedKey === "longitude" ||
    normalizedKey === "lng" ||
    normalizedKey === "lon"
  )
    return "longitude";
  if (
    normalizedKey.includes("image") ||
    normalizedKey.includes("thumbnail") ||
    normalizedKey.includes("photo")
  )
    return "image";
  if (
    normalizedKey === "url" ||
    normalizedKey.endsWith("url") ||
    normalizedKey.includes("website")
  )
    return "url";

  if (
    normalizedKey.includes("amount") ||
    normalizedKey.includes("price") ||
    normalizedKey.includes("cost") ||
    normalizedKey.includes("revenue") ||
    normalizedKey.includes("salary") ||
    normalizedKey.includes("total")
  ) {
    if (typeof value === "number" || typeof value === "string")
      return "currency";
  }

  if (
    normalizedKey.includes("date") ||
    normalizedKey.includes("time") ||
    normalizedKey.endsWith("at")
  ) {
    if (typeof value === "string") return "datetime";
  }

  if (typeof value === "boolean") return "boolean";
  if (typeof value === "number") return "number";
  if (Array.isArray(value)) return "array";
  if (isObject(value)) return "object";
  return "text";
};

const toLabel = (value: string): string => {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const isInternalField = (key: string): boolean => {
  const normalized = key.toLowerCase();
  return (
    normalized === "__v" ||
    normalized === "_v" ||
    normalized === "__typename" ||
    normalized === "createdat" ||
    normalized === "updatedat"
  );
};

/**
 * Keys the widget layer owns and must never be schema-filtered away: the
 * checkout call-to-action (`url`/`link`) and the pre-computed $-prefixed UI
 * markers injected before normalization. Generic for every company.
 */
const isReservedWidgetKey = (key: string): boolean =>
  key.startsWith("$") || key === "url" || key === "link";

const inferItemLabel = (entity: string): string => {
  const normalized = entity
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, " ");
  if (normalized.endsWith("ies")) return `${normalized.slice(0, -3)}y`;
  if (
    normalized.endsWith("ses") ||
    normalized.endsWith("xes") ||
    normalized.endsWith("ches") ||
    normalized.endsWith("shes")
  ) {
    return normalized.slice(0, -2);
  }
  if (normalized.endsWith("s")) return normalized.slice(0, -1);
  return normalized || "item";
};

const buildCapabilities = (
  params: any[] = [],
  method = "GET",
): CapabilitiesResult => {
  const capabilities: CapabilitiesResult = {};
  const upperMethod = String(method || "GET").toUpperCase();

  if (upperMethod === "POST" || upperMethod === "PUT")
    capabilities.create = true;
  if (upperMethod === "PUT" || upperMethod === "PATCH")
    capabilities.update = true;
  if (upperMethod === "DELETE") capabilities.delete = true;

  const dynamicKeys = params
    .filter((param) => param?.isDynamic)
    .map((param) =>
      String(param.inputName || param.key || "")
        .replace(/^\{|\}$/g, "")
        .trim()
        .toLowerCase(),
    )
    .filter(Boolean);

  const hasAny = (...names: string[]) =>
    names.some((name) => dynamicKeys.includes(name.toLowerCase()));

  if (hasAny("query", "q", "search", "keyword", "searchterm"))
    capabilities.search = true;
  if (hasAny("sort", "sortby", "orderby", "order", "direction"))
    capabilities.sort = true;
  if (
    hasAny(
      "filter",
      "filters",
      "status",
      "category",
      "type",
      "minprice",
      "maxprice",
      "fromdate",
      "todate",
      "startdate",
      "enddate",
    )
  ) {
    capabilities.filter = true;
  }
  if (hasAny("page", "offset", "limit", "pagesize", "perpage", "skip"))
    capabilities.pagination = true;

  return capabilities;
};

const hasCapabilities = (capabilities: CapabilitiesResult): boolean => {
  return Object.keys(capabilities).length > 0;
};

const extractPagination = (data: JsonValue): PaginationResult | undefined => {
  if (Array.isArray(data) || !isObject(data)) return undefined;

  let page: number | undefined;
  let totalPages: number | undefined;
  let totalItems: number | undefined;
  let pageSize: number | undefined;

  for (const [key, value] of Object.entries(data)) {
    if (typeof value !== "number") continue;
    const normalizedKey = key.toLowerCase().replace(/[-_\s]/g, "");

    if (["page", "currentpage", "current"].includes(normalizedKey))
      page = value;
    if (["totalpages", "pages"].includes(normalizedKey)) totalPages = value;
    if (
      [
        "total",
        "totalcount",
        "totalitems",
        "totalrecords",
        "recordcount",
      ].includes(normalizedKey)
    )
      totalItems = value;
    if (["limit", "pagesize", "perpage", "per_page"].includes(normalizedKey))
      pageSize = value;
  }

  if (
    page === undefined &&
    totalPages === undefined &&
    totalItems === undefined &&
    pageSize === undefined
  ) {
    for (const value of Object.values(data)) {
      if (!isObject(value)) continue;
      const nested = extractPagination(value);
      if (nested) return nested;
    }
  }

  if (
    page === undefined &&
    totalPages === undefined &&
    totalItems === undefined &&
    pageSize === undefined
  )
    return undefined;

  const result: PaginationResult = {};
  if (page !== undefined) result.page = page;
  if (totalPages !== undefined) result.totalPages = totalPages;
  if (totalItems !== undefined) result.total = totalItems;
  if (pageSize !== undefined) result.limit = pageSize;

  return result;
};

const inferEntityName = (
  apiName: string,
  data: JsonValue,
): string | undefined => {
  if (Array.isArray(data)) {
    const cleaned = apiName
      .replace(/^(get|fetch|list|find|search|retrieve|load)\s+/i, "")
      .trim();
    return cleaned ? pluralize(cleaned) : "items";
  }

  if (isObject(data)) {
    const collection = findRecordCollection(data);
    if (collection?.key) return collection.key;
  }

  const cleaned = apiName
    .replace(/^(get|fetch|list|find|search|retrieve|load)\s+/i, "")
    .trim();
  return cleaned || undefined;
};

const pluralize = (value: string): string => {
  const normalized = value.trim().toLowerCase().replace(/\s+/g, "_");
  if (
    normalized.endsWith("s") ||
    normalized.endsWith("x") ||
    normalized.endsWith("ch") ||
    normalized.endsWith("sh")
  ) {
    return normalized;
  }
  return `${normalized}s`;
};

const isObject = (value: JsonValue): value is { [key: string]: JsonValue } => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};
