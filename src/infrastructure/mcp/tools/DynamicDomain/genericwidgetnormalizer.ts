import { ApiSchema, FieldType } from "../../schema_analyzer/interfaces";
import { GenericWidgetResult } from "../../../../domain/types/genericWidget.types";
import { JsonValue } from "../../../../domain/types/mcpjsonprimitive.types";
import { CapabilitiesResult } from "../../../../domain/types/mcpcapabilities.types";
import { CollectionResult } from "../../../../domain/types/mcpcollection.types";
import { PaginationResult } from "../../../../domain/types/mcppagination.types";

export const normalizeApiResponseToWidget = (
  companyName: string,
  apiName: string,
  response: unknown,
  layout?: string,
  industry?: string,
  apiSchema?: ApiSchema,
  apiParams: any[] = [],
): GenericWidgetResult => {
  const data = normalizeJsonValue(response);

  const collection = buildCollectionMetadata(apiName, data, layout, apiSchema);

  const capabilities = buildCapabilities(apiParams);

  const pagination = extractPagination(data);

  return {
    title: apiName || "API Result",

    subtitle: "Live API response",

    data,

    ...(collection ? { collection } : {}),

    ...(hasCapabilities(capabilities) ? { capabilities } : {}),

    ...(pagination ? { pagination } : {}),

    metadata: {
      companyName,
      apiName,
      ...(industry ? { industry } : {}),
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
): CollectionResult | undefined => {
  const entity = apiSchema?.entity || inferEntityName(apiName, data);

  if (!entity) {
    return undefined;
  }

  const result: CollectionResult = {
    entity,
  };

  const selectedLayout = apiSchema?.defaultLayout || layout;

  if (selectedLayout) {
    result.layout = selectedLayout;
  }

  if (Array.isArray(data)) {
    result.total = data.length;
  }

  return result;
};

const buildCapabilities = (params: any[] = []): CapabilitiesResult => {
  const capabilities: CapabilitiesResult = {};

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

  if (hasAny("sort", "sortby", "sortby", "orderby", "order", "direction")) {
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
    const arrayKey = Object.keys(data).find((key) => Array.isArray(data[key]));

    if (arrayKey) {
      return arrayKey;
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
