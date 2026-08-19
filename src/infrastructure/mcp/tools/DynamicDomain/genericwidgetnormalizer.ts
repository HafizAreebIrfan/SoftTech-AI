import { ApiSchema } from "../../schema_analyzer/interfaces";
import { GenericWidgetResult } from "../../../../domain/types/genericWidget.types";
import { JsonValue } from "../../../../domain/types/mcpjsonprimitive.types";
import { CapabilitiesResult } from "../../../../domain/types/mcpcapabilities.types";
import {
  CollectionResult,
  FieldSchema,
} from "../../../../domain/types/mcpcollection.types";
import { PaginationResult } from "../../../../domain/types/mcppagination.types";
import { WidgetAudience } from "../../../../domain/types/widgetaudience.types";
import { PlatformType } from "../../../../domain/types/widgetplatform.types";

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
): GenericWidgetResult => {
  const data = normalizeJsonValue(response);

  const collection = buildCollectionMetadata(apiName, data, layout, apiSchema, audience);

  const capabilities = buildCapabilities(apiParams, method);

  const pagination = extractPagination(data);

  return {
    title: apiName || "API Result",

    subtitle: "Live API response",

    data,

    ...(collection ? { collection } : {}),

    ...(hasCapabilities(capabilities) ? { capabilities } : {}),

    ...(pagination ? { pagination } : {}),

    ...(audience ? { audience } : {}),

    ...(platformType ? { platformtype: platformType } : {}),

    metadata: {
      companyName,
      apiName,
      httpMethod: method.toUpperCase(),
      isAction: method.toUpperCase() !== "GET",
      ...(industry ? { industry } : {}),
      ...(themeColor ? { themeColor } : {}),
      ...(apiSchema?.entity ? { entity: apiSchema.entity } : {}),
      generatedAt: new Date().toISOString(),
    },
  };
};

const normalizeJsonValue = (value: unknown): JsonValue => {
  if (value === null) {
    return null;
  }

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(normalizeJsonValue);
  }

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

  if (!entity) {
    return undefined;
  }

  const result: CollectionResult = {
    entity,
    ...(apiSchema?.dataPath ? { dataPath: apiSchema.dataPath } : {}),
  };

  let selectedLayout = apiSchema?.defaultLayout || layout;

  const entityLower = String(entity || "").toLowerCase();
  const isCommercial = /package|product|service|hotel|car|item|accommodation/.test(
    entityLower,
  );

  if (
    !selectedLayout ||
    (isCommercial && (audience === "user" || audience === "both"))
  ) {
    selectedLayout = audience === "admin" ? "table" : "catalog";
  }

  if (selectedLayout) {
    result.layout = selectedLayout;
  }
  const collectionData = findRecordCollection(data);

  if (collectionData) {
    const { key, records } = collectionData;

    result.entity = apiSchema?.entity || key || entity;

    result.itemLabel = inferItemLabel(result.entity);

    const schemaFields = buildFieldsFromApiSchema(apiSchema);

    if (schemaFields.length > 0) {
      result.fields = schemaFields;
    } else {
      result.fields = buildFieldsFromRecords(records);
    }

    result.total = records.length;
  } else if (Array.isArray(data)) {
    result.itemLabel = inferItemLabel(result.entity);

    const schemaFields = buildFieldsFromApiSchema(apiSchema);

    if (schemaFields.length > 0) {
      result.fields = schemaFields;
    } else {
      result.fields = buildFieldsFromRecords(data.filter(isObject));
    }

    result.total = data.length;
  }

  const pagination = extractPagination(data);

  if (pagination?.page !== undefined) {
    result.page = pagination.page;
  }

  if (pagination?.limit !== undefined) {
    result.limit = pagination.limit;
  }

  if (pagination?.totalPages !== undefined) {
    result.totalPages = pagination.totalPages;
  }

  if (pagination?.total !== undefined) {
    result.total = pagination.total;
  }

  // Calculate dynamic metrics & charts for AI prediction and auto layout resolution
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

    const computedMetrics: Array<{ label: string; value: string; change?: string }> = [];

    computedMetrics.push({
      label: `Total ${toLabel(result.itemLabel || "records")}`,
      value: String(result.total || rawRecords.length),
    });

    if (numericFields.length > 0) {
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

    if (computedMetrics.length > 0) {
      result.metrics = computedMetrics;
    }

    // Dynamic Chart Trend Computation
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

    // Auto Layout Resolution
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

    if (records.length > 0) {
      return {
        key: currentKey,
        records,
      };
    }

    return undefined;
  }

  if (!isObject(value)) {
    return undefined;
  }

  for (const [key, child] of Object.entries(value)) {
    if (Array.isArray(child)) {
      const records = child.filter(isObject);

      if (records.length > 0) {
        return {
          key,
          records,
        };
      }
    }
  }

  for (const [key, child] of Object.entries(value)) {
    if (isObject(child) || Array.isArray(child)) {
      const result = findRecordCollection(child, key);

      if (result) {
        return result;
      }
    }
  }

  return undefined;
};

const buildFieldsFromApiSchema = (apiSchema?: ApiSchema): FieldSchema[] => {
  if (!apiSchema?.fields || apiSchema.fields.length === 0) {
    return [];
  }

  return apiSchema.fields
    .filter((field) => !field.hidden)
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
    }));
};

const buildFieldsFromRecords = (
  records: Record<string, JsonValue>[],
): FieldSchema[] => {
  if (records.length === 0) {
    return [];
  }

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
  if (!type) {
    return "text";
  }

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

  if (isInternalField(key)) {
    return "text";
  }

  if (normalizedKey.includes("email") || normalizedKey === "mail") {
    return "email";
  }

  if (
    normalizedKey.includes("phone") ||
    normalizedKey.includes("mobile") ||
    normalizedKey.includes("telephone")
  ) {
    return "phone";
  }

  if (
    normalizedKey === "status" ||
    normalizedKey.endsWith("status") ||
    normalizedKey.includes("state")
  ) {
    return "status";
  }

  if (normalizedKey === "latitude" || normalizedKey === "lat") {
    return "latitude";
  }

  if (
    normalizedKey === "longitude" ||
    normalizedKey === "lng" ||
    normalizedKey === "lon"
  ) {
    return "longitude";
  }

  if (
    normalizedKey.includes("image") ||
    normalizedKey.includes("thumbnail") ||
    normalizedKey.includes("photo")
  ) {
    return "image";
  }

  if (
    normalizedKey === "url" ||
    normalizedKey.endsWith("url") ||
    normalizedKey.includes("website")
  ) {
    return "url";
  }

  if (
    normalizedKey.includes("amount") ||
    normalizedKey.includes("price") ||
    normalizedKey.includes("cost") ||
    normalizedKey.includes("revenue") ||
    normalizedKey.includes("salary") ||
    normalizedKey.includes("total")
  ) {
    if (typeof value === "number" || typeof value === "string") {
      return "currency";
    }
  }

  if (
    normalizedKey.includes("date") ||
    normalizedKey.includes("time") ||
    normalizedKey.endsWith("at")
  ) {
    if (typeof value === "string") {
      return "datetime";
    }
  }

  if (typeof value === "boolean") {
    return "boolean";
  }

  if (typeof value === "number") {
    return "number";
  }

  if (Array.isArray(value)) {
    return "array";
  }

  if (isObject(value)) {
    return "object";
  }

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
    normalized === "__v" || normalized === "_v" || normalized === "__typename"
  );
};

const inferItemLabel = (entity: string): string => {
  const normalized = entity
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, " ");

  if (normalized.endsWith("ies")) {
    return `${normalized.slice(0, -3)}y`;
  }

  if (
    normalized.endsWith("ses") ||
    normalized.endsWith("xes") ||
    normalized.endsWith("ches") ||
    normalized.endsWith("shes")
  ) {
    return normalized.slice(0, -2);
  }

  if (normalized.endsWith("s")) {
    return normalized.slice(0, -1);
  }

  return normalized || "item";
};

const buildCapabilities = (
  params: any[] = [],
  method = "GET",
): CapabilitiesResult => {
  const capabilities: CapabilitiesResult = {};

  const upperMethod = String(method || "GET").toUpperCase();
  if (upperMethod === "POST" || upperMethod === "PUT") {
    capabilities.create = true;
  }
  if (upperMethod === "PUT" || upperMethod === "PATCH") {
    capabilities.update = true;
  }
  if (upperMethod === "DELETE") {
    capabilities.delete = true;
  }

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

  if (hasAny("query", "q", "search", "keyword", "searchterm")) {
    capabilities.search = true;
  }

  if (hasAny("sort", "sortby", "orderby", "order", "direction")) {
    capabilities.sort = true;
  }

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

  if (hasAny("page", "offset", "limit", "pagesize", "perpage", "skip")) {
    capabilities.pagination = true;
  }

  return capabilities;
};

const hasCapabilities = (capabilities: CapabilitiesResult): boolean => {
  return Object.keys(capabilities).length > 0;
};

const extractPagination = (data: JsonValue): PaginationResult | undefined => {
  if (Array.isArray(data)) {
    return undefined;
  }

  if (!isObject(data)) {
    return undefined;
  }

  let page: number | undefined;
  let totalPages: number | undefined;
  let totalItems: number | undefined;
  let pageSize: number | undefined;

  for (const [key, value] of Object.entries(data)) {
    if (typeof value !== "number") {
      continue;
    }

    const normalizedKey = key.toLowerCase().replace(/[-_\s]/g, "");

    if (["page", "currentpage", "current"].includes(normalizedKey)) {
      page = value;
    }

    if (["totalpages", "pages"].includes(normalizedKey)) {
      totalPages = value;
    }

    if (
      [
        "total",
        "totalcount",
        "totalitems",
        "totalrecords",
        "recordcount",
      ].includes(normalizedKey)
    ) {
      totalItems = value;
    }

    if (["limit", "pagesize", "perpage", "per_page"].includes(normalizedKey)) {
      pageSize = value;
    }
  }

  if (
    page === undefined &&
    totalPages === undefined &&
    totalItems === undefined &&
    pageSize === undefined
  ) {
    for (const value of Object.values(data)) {
      if (!isObject(value)) {
        continue;
      }

      const nested = extractPagination(value);

      if (nested) {
        return nested;
      }
    }
  }

  if (
    page === undefined &&
    totalPages === undefined &&
    totalItems === undefined &&
    pageSize === undefined
  ) {
    return undefined;
  }

  const result: PaginationResult = {};

  if (page !== undefined) {
    result.page = page;
  }

  if (totalPages !== undefined) {
    result.totalPages = totalPages;
  }

  if (totalItems !== undefined) {
    result.total = totalItems;
  }

  if (pageSize !== undefined) {
    result.limit = pageSize;
  }

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

    if (cleaned) {
      return pluralize(cleaned);
    }

    return "items";
  }

  if (isObject(data)) {
    const collection = findRecordCollection(data);

    if (collection?.key) {
      return collection.key;
    }
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
