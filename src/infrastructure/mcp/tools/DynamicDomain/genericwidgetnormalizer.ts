import {
  WidgetMetric,
  WidgetKeyValueItem,
  WidgetPagination as Pagination,
  WidgetAction as Action,
  WidgetFilter as Filter,
  TableColumn,
  FormField as Field,
  WidgetBlock,
  WidgetMetadata,
  GenericWidgetContent,
} from "../../../../domain/types";

type PrimitiveValue = string | number | boolean | null;
type ArrayEntity = "table" | "cards" | "timeline" | "map" | "gallery" | "chart";

import { ApiSchema, FieldType } from "../../schema_analyzer/interfaces";
import {
  SYSTEM_FIELDS,
  isVisibleField,
  getVisibleFields,
} from "../../schema_analyzer/constants";
import { toLabel } from "../../schema_analyzer/formatter";
import { detectFieldType } from "../../schema_analyzer/typeDetector";

export const normalizeApiResponseToWidget = (
  companyName: string,
  apiName: string,
  response: unknown,
  layout?: string,
  industry?: string,
  apiSchema?: ApiSchema,
): GenericWidgetContent => {
  const effectiveLayout = apiSchema?.defaultLayout || layout || "dashboard";
  const blocks = buildBlocks(response, apiName, apiSchema);

  const metadata: WidgetMetadata = {
    companyName,
    apiName,
    generatedAt: new Date().toISOString(),
    version: "1.0",
  };

  return {
    title: apiName,
    subtitle: "Live API response",
    layout: effectiveLayout,
    industry: industry || "general",
    blocks:
      blocks.length > 0
        ? blocks
        : [
            {
              type: "keyValue",
              title: "Result",
              keyValueItems: [{ key: "Status", value: "No renderable data" }],
            },
          ],
    metadata,
  };
};

const detectArrayEntity = (records: Record<string, unknown>[]): ArrayEntity => {
  if (records.length === 0) {
    return "table";
  }

  const keys = Object.keys(records[0]).map((key) => key.toLowerCase());

  const has = (...names: string[]) => names.some((name) => keys.includes(name));

  // Products, restaurants, hotels, SaaS plans, weather cards
  if (
    has("image", "imageurl", "thumbnail", "photo") ||
    (has("title", "name") &&
      (has("price") || has("amount") || has("icon") || has("badge")))
  ) {
    return "cards";
  }

  // Orders, deliveries, tracking, history
  if (has("date", "createdat", "updatedat", "time") && has("status")) {
    return "timeline";
  }

  // GPS / Maps
  if (has("lat", "latitude") && has("lng", "longitude", "lon")) {
    return "map";
  }

  // Charts & Analytics
  if (
    has("month", "year", "quarter", "day", "category") &&
    has("amount", "price", "count", "total", "revenue", "sales", "qty")
  ) {
    return "chart";
  }

  // Images
  if (
    has("url", "image", "imageurl", "photo") &&
    !has("price") &&
    !has("amount")
  ) {
    return "gallery";
  }

  return "table";
};

const getColumnType = (key: string, sampleValue?: unknown): TableColumn["type"] => {
  const type = detectFieldType(key, sampleValue);
  if (
    type === "currency" ||
    type === "date" ||
    type === "status" ||
    type === "image" ||
    type === "number"
  ) {
    return type;
  }
  return "text";
};

const buildBlocks = (
  response: unknown,
  apiName?: string,
  apiSchema?: ApiSchema,
): WidgetBlock[] => {
  if (Array.isArray(response)) {
    return buildArrayBlocks(response, apiName, undefined, apiSchema);
  }

  if (isRecord(response)) {
    return buildObjectBlocks(response, apiName, apiSchema);
  }

  if (isPrimitive(response)) {
    return [
      {
        type: "keyValue",
        title: "Result",
        keyValueItems: [
          {
            key: "Value",
            value: stringifyPrimitive(response),
          },
        ],
      },
    ];
  }

  return [
    {
      type: "alert",
      severity: "warning",
      title: "Unsupported Response",
      message: "Unable to render response.",
    },
  ];
};

const buildArrayBlocks = (
  items: unknown[],
  apiName?: string,
  pagination?: Pagination,
  apiSchema?: ApiSchema,
): WidgetBlock[] => {
  const records = items.filter(isRecord);

  if (records.length === 0) {
    return [
      {
        type: "list",
        title: "Items",
        listItems: items.slice(0, 10).map((item, index) => ({
          title: `Item ${index + 1}`,
          description: stringifyCell(item),
        })),
      },
    ];
  }

  const entity = detectArrayEntity(records);

  switch (entity) {
    case "table": {
      const blocks: WidgetBlock[] = [];
      const collectionLabel = apiName ? toLabel(apiName) : "Items";
      const metrics = buildSummaryMetrics(records, apiName, apiSchema);

      if (metrics.length > 0) {
        blocks.push({
          type: "metrics",
          title: "Summary Overview",
          metrics,
        });
      }

      let columns: TableColumn[];
      if (apiSchema?.fields && apiSchema.fields.length > 0) {
        columns = apiSchema.fields
          .filter((f) => !f.hidden)
          .map((f) => ({
            key: f.key,
            label: f.label,
            type:
              f.type === "currency" ||
              f.type === "date" ||
              f.type === "status" ||
              f.type === "image" ||
              f.type === "number"
                ? f.type
                : "text",
            sortable: f.sortable ?? true,
          }));
      } else {
        const sampleRecord = records[0];
        const headers = getVisibleFields(sampleRecord).filter((key) => {
          const val = sampleRecord[key];
          if (Array.isArray(val) || (typeof val === "object" && val !== null))
            return false;
          return true;
        });
        columns = headers.map((header) => ({
          key: header,
          label: toLabel(header),
          type: getColumnType(header),
          sortable: true,
        }));
      }

      const filters: Filter[] | undefined = apiSchema?.fields
        ?.filter((f) => f.filterable)
        ?.map((f) => ({
          id: f.key,
          label: f.label,
          type:
            f.type === "date" || f.type === "datetime"
              ? "date"
              : f.type === "number" || f.type === "currency"
              ? "number"
              : "text",
        }));

      const actions: Action[] | undefined = apiName
        ? [
            {
              id: "refresh",
              label: "Refresh",
              action: apiName,
              variant: "primary",
            },
          ]
        : undefined;

      blocks.push({
        type: "table",
        title: `${collectionLabel} List`,
        columns,
        rows: records
          .slice(0, 10)
          .map((record) =>
            columns.map((col) => stringifyCell(record[col.key])),
          ),
        pagination,
        filters: filters && filters.length > 0 ? filters : undefined,
        actions,
      });
      return blocks;
    }
    case "cards": {
      return [
        {
          type: "cards",
          title: apiName ? toLabel(apiName) : "Items",
          cards: records.map((record) => {
            const itemId = String(record.id ?? record._id ?? "");
            const rawEntityLabel = apiName ? toLabel(apiName).replace(/^(get|call|list|update|edit|delete|fetch)\s+/i, "") : "Item";
            const entityLabel = rawEntityLabel.trim() || "Item";

            return {
              id: itemId,
              title: String(
                record.title ?? record.name ?? record.label ?? record.packagename ?? record.productName ?? "Untitled",
              ),
              subtitle: String(record.description ?? record.subtitle ?? ""),
              image: typeof record.image === "string" ? record.image : undefined,
              icon: typeof record.icon === "string" ? record.icon : undefined,
              badge: typeof record.status === "string" ? record.status : undefined,
              attributes: Object.entries(record)
                .filter(
                  ([key]) =>
                    ![
                      "id",
                      "_id",
                      "title",
                      "name",
                      "description",
                      "subtitle",
                      "image",
                      "icon",
                      "status",
                    ].includes(key),
                )
                .slice(0, 6)
                .map(([label, value]) => ({
                  label: toLabel(label),
                  value: stringifyCell(value),
                })),
              actions: [
                {
                  id: `edit-${itemId}`,
                  label: `Edit ${entityLabel}`,
                  action: "open_edit_mode",
                  variant: "secondary",
                },
                {
                  id: `select-${itemId}`,
                  label: `Select ${entityLabel}`,
                  action: "open_checkout_drawer",
                  variant: "primary",
                },
              ],
            };
          }),
        },
      ];
    }
    case "timeline": {
      return [
        {
          type: "timeline",
          title: apiName ? toLabel(apiName) : "Timeline",

          events: records.map((record) => ({
            id: String(record.id ?? record._id ?? ""),

            title: String(record.title ?? record.name ?? "Event"),

            subtitle: String(record.description ?? ""),

            date: String(record.date ?? record.createdAt ?? ""),

            status:
              typeof record.status === "string" ? record.status : undefined,
          })),
        },
      ];
    }
    case "map": {
      return [
        {
          type: "map",
          title: apiName ? toLabel(apiName) : "Locations",

          markers: records.map((record) => ({
            lat: Number(record.lat ?? record.latitude),

            lng: Number(record.lng ?? record.longitude ?? record.lon),

            title: String(record.title ?? record.name ?? ""),

            description:
              typeof record.description === "string"
                ? record.description
                : undefined,
          })),
        },
      ];
    }
    case "gallery": {
      return [
        {
          type: "gallery",
          title: apiName ? toLabel(apiName) : "Gallery",

          images: records.map((record) => ({
            url: String(record.url ?? record.image ?? record.imageUrl),

            title: typeof record.title === "string" ? record.title : undefined,
          })),
        },
      ];
    }
    case "chart": {
      const sample = records[0];
      const xAxisKey =
        apiSchema?.fields?.find((f) => f.type === "date" || f.type === "text")?.key ||
        Object.keys(sample).find((k) => isVisibleField(k)) ||
        "id";
      const numericKeys =
        apiSchema?.fields?.filter((f) => f.type === "currency" || f.type === "number").map((f) => f.key) ||
        Object.keys(sample).filter((k) => isVisibleField(k) && typeof sample[k] === "number");

      return [
        {
          type: "chart",
          title: apiName ? toLabel(apiName) : "Analytics Chart",
          chartType: "bar",
          xAxisKey,
          dataKeys: numericKeys.length > 0 ? numericKeys : [Object.keys(sample)[0]],
          series: records.slice(0, 12),
        },
      ];
    }
  }

  return [
    {
      type: "list",
      title: "Items",
      listItems: items.slice(0, 10).map((item, index) => ({
        title: `Item ${index + 1}`,
        description: stringifyCell(item),
      })),
    },
  ];
};

const extractPaginationMeta = (
  record: Record<string, unknown>,
  apiName?: string,
): Pagination | undefined => {
  let page: number | undefined;
  let totalPages: number | undefined;
  let totalItems: number | undefined;
  let pageSize: number | undefined;

  const explicitTotalKeys = [
    "totalcount",
    "total_count",
    "totalitems",
    "total_items",
    "totalrecords",
    "total_records",
    "total",
  ];
  const genericTotalKeys = [
    "recordcount",
    "record_count",
    "count",
    "results",
    "items",
  ];

  for (const [k, v] of Object.entries(record)) {
    if (typeof v !== "number") continue;
    const lower = k.toLowerCase();

    if (
      lower === "page" ||
      lower === "currentpage" ||
      lower === "current_page" ||
      lower === "offset"
    ) {
      if (page === undefined || page === 1) page = v;
    } else if (
      lower === "totalpages" ||
      lower === "total_pages" ||
      lower === "pages"
    ) {
      totalPages = v;
    } else if (explicitTotalKeys.includes(lower)) {
      totalItems = v;
    } else if (genericTotalKeys.includes(lower) && totalItems === undefined) {
      totalItems = v;
    } else if (
      lower === "limit" ||
      lower === "pagesize" ||
      lower === "page_size" ||
      lower === "perpage" ||
      lower === "per_page"
    ) {
      pageSize = v;
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

  return {
    page: page ?? 1,
    totalPages: totalPages ?? 1,
    totalItems: totalItems ?? 0,
    pageSize,
    tool: apiName,
  };
};

const buildObjectBlocks = (
  record: Record<string, unknown>,
  apiName?: string,
  apiSchema?: ApiSchema,
): WidgetBlock[] => {
  const blocks: WidgetBlock[] = [];
  const allKeyValues: WidgetKeyValueItem[] = [];
  const pagination = extractPaginationMeta(record, apiName);

  if (
    apiSchema?.fields &&
    (apiSchema.defaultLayout === "form" || apiSchema.uiHints?.editable)
  ) {
    const formFields: Field[] = apiSchema.fields
      .filter((f) => !f.hidden)
      .map((f) => ({
        id: f.key,
        name: f.key,
        label: f.label,
        type:
          f.type === "number" || f.type === "currency"
            ? "number"
            : f.type === "email"
            ? "email"
            : "text",
        required: false,
      }));

    if (formFields.length > 0) {
      blocks.push({
        type: "form",
        title: apiName ? `Submit ${toLabel(apiName)}` : "Form Input",
        fields: formFields,
        submitAction: apiName || "submit",
      });
    }
  }

  for (const [key, value] of Object.entries(record)) {
    if (!isVisibleField(key)) {
      continue;
    }

    const lower = key.toLowerCase();

    // Explicit metrics block inside response
    if (
      (lower === "metrics" || lower === "statistics" || lower === "totals") &&
      isRecord(value)
    ) {
      const items = buildKeyValueItems(value).map((kv) => ({
        label: kv.key,
        value: kv.value,
      }));
      if (items.length > 0) {
        blocks.push({
          type: "metrics",
          title: toLabel(key),
          metrics: items,
        });
      }
      continue;
    }

    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      allKeyValues.push({
        key: toLabel(key),
        value: String(value),
      });

      continue;
    }
    if (Array.isArray(value)) {
      blocks.push(...buildArrayBlocks(value, key, pagination));
      continue;
    }
    if (isRecord(value)) {
      const items = buildKeyValueItems(value);
      if (items.length > 0) {
        blocks.push({
          type: "keyValue",
          title: toLabel(key),
          keyValueItems: items,
        });
      }

      continue;
    }
  }

  if (allKeyValues.length > 0) {
    blocks.push({
      type: "keyValue",
      title: "Details",
      keyValueItems: allKeyValues.slice(0, 15),
    });
  }

  return blocks;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isPrimitive = (value: unknown): value is PrimitiveValue =>
  ["string", "number", "boolean"].includes(typeof value) || value === null;

const stringifyPrimitive = (value: PrimitiveValue) =>
  value === null ? "N/A" : String(value);

const formatNestedValue = (value: unknown): string => {
  if (isPrimitive(value)) {
    return stringifyPrimitive(value);
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return "N/A";
    if (value.every(isPrimitive)) {
      return value.map(stringifyPrimitive).join(", ");
    }
    return value
      .slice(0, 5)
      .map((item) => formatNestedValue(item))
      .join(" | ");
  }
  if (isRecord(value)) {
    const entries = Object.entries(value)
      .filter(([k, v]) => isVisibleField(k) && (isPrimitive(v) || typeof v === "object"))
      .slice(0, 6);
    if (entries.length === 0) return "N/A";
    return entries
      .map(([k, v]) => `${toLabel(k)}: ${isPrimitive(v) ? stringifyPrimitive(v) : formatNestedValue(v)}`)
      .join(", ");
  }
  return "";
};

const stringifyCell = (value: unknown) => {
  if (isPrimitive(value)) {
    return stringifyPrimitive(value);
  }
  return formatNestedValue(value);
};

const buildKeyValueItems = (
  record: Record<string, unknown>,
  prefix = "",
): WidgetKeyValueItem[] => {
  const items: WidgetKeyValueItem[] = [];
  for (const [k, v] of Object.entries(record)) {
    if (!isVisibleField(k)) continue;
    const label = prefix ? `${prefix} ${toLabel(k)}` : toLabel(k);
    if (isPrimitive(v)) {
      items.push({ key: label, value: stringifyPrimitive(v) });
    } else if (isRecord(v)) {
      const nested = buildKeyValueItems(v, label);
      if (nested.length > 0) {
        items.push(...nested);
      } else {
        items.push({ key: label, value: formatNestedValue(v) });
      }
    } else if (Array.isArray(v)) {
      items.push({ key: label, value: formatNestedValue(v) });
    }
  }
  return items;
};

const buildSummaryMetrics = (
  records: Record<string, unknown>[],
  apiName?: string,
  apiSchema?: ApiSchema,
): WidgetMetric[] => {
  const metrics: WidgetMetric[] = [];
  const collectionLabel = apiName ? toLabel(apiName) : "Items";
  metrics.push({
    label: collectionLabel.toLowerCase().endsWith("s")
      ? `Total ${collectionLabel}`
      : `Total ${collectionLabel}s`,
    value: records.length,
    tone: "default",
  });

  if (apiSchema?.fields && apiSchema.fields.length > 0) {
    const schemaNumericFields = apiSchema.fields.filter(
      (f) => !f.hidden && (f.type === "currency" || f.type === "number"),
    );

    schemaNumericFields.slice(0, 3).forEach((field) => {
      let sum = 0;
      let count = 0;
      records.forEach((rec) => {
        const val = rec[field.key];
        if (typeof val === "number") {
          sum += val;
          count++;
        } else if (typeof val === "string") {
          const parsed = parseFloat(val.replace(/[^0-9.]/g, ""));
          if (!isNaN(parsed)) {
            sum += parsed;
            count++;
          }
        }
      });

      if (count > 0) {
        metrics.push({
          label: field.label.startsWith("Total")
            ? field.label
            : `Total ${field.label}`,
          value: field.type === "currency" ? `$${sum.toFixed(2)}` : sum,
          tone: "good",
        });
      }
    });

    return metrics;
  }

  const numericFields = new Map<string, { sum: number; count: number; type: FieldType }>();
  records.forEach((record) => {
    Object.entries(record).forEach(([key, val]) => {
      if (!isVisibleField(key)) return;
      const type = detectFieldType(key, val);

      if (type === "currency" || type === "number") {
        let num = 0;
        if (typeof val === "number") {
          num = val;
        } else if (typeof val === "string") {
          num = parseFloat(val.replace(/[^0-9.]/g, ""));
        }

        if (!isNaN(num)) {
          const stats = numericFields.get(key) || { sum: 0, count: 0, type };
          stats.sum += num;
          stats.count += 1;
          numericFields.set(key, stats);
        }
      }
    });
  });

  Array.from(numericFields.entries())
    .slice(0, 3)
    .forEach(([key, stats]) => {
      const label = toLabel(key);
      metrics.push({
        label: label.startsWith("Total") ? label : `Total ${label}`,
        value: stats.type === "currency" ? `$${stats.sum.toFixed(2)}` : stats.sum,
        tone: "good",
      });
    });

  return metrics;
};
