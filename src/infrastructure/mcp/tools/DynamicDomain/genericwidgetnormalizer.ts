type PrimitiveValue = string | number | boolean | null;

type WidgetMetric = {
  label: string;
  value: string | number;
  tone?: "default" | "good" | "warning" | "danger";
};

type WidgetKeyValueItem = {
  key: string;
  value: string | number;
};

type Pagination = {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize?: number;
};

type Action = {
  id: string;
  label: string;
  action: string;
  variant?: "primary" | "secondary" | "danger";
};

type Filter = {
  id: string;
  label: string;
  type: "text" | "select" | "date" | "number";

  value?: string;

  options?: string[];
};

type TableColumn = {
  key: string;

  label: string;

  type?: "text" | "number" | "currency" | "date" | "status" | "image";

  sortable?: boolean;
};

type Field = {
  id: string;
  name: string;
  label: string;
  type:
    | "text"
    | "email"
    | "password"
    | "number"
    | "textarea"
    | "select"
    | "multiselect";
  placeholder?: string;
  value?: string | number | string[];
  options?: string[];
  required?: boolean;
  description?: string;
};

type ArrayEntity = "table" | "cards" | "timeline" | "map" | "gallery";

type WidgetBlock =
  | {
      type: "metrics";
      title?: string;

      metrics: WidgetMetric[];
    }
  | {
      type: "keyValue";
      title?: string;

      keyValueItems: WidgetKeyValueItem[];
    }
  | {
      type: "list";
      title?: string;

      listItems: {
        title: string;
        description?: string;
        meta?: string;
      }[];
    }
  | {
      type: "table";
      title?: string;

      columns: TableColumn[];

      rows: (string | number)[][];

      pagination?: Pagination;

      filters?: Filter[];

      actions?: Action[];
    }
  | {
      type: "cards";
      title?: string;

      cards: {
        id?: string;

        title: string;

        subtitle?: string;

        image?: string;

        icon?: string;

        badge?: string;

        attributes?: {
          label: string;
          value: string | number;
        }[];

        actions?: Action[];
      }[];

      pagination?: Pagination;

      filters?: Filter[];

      actions?: Action[];
    }
  | {
      type: "timeline";
      title?: string;

      events: {
        id?: string;

        title: string;

        subtitle?: string;

        date: string;

        status?: string;

        icon?: string;
      }[];

      pagination?: Pagination;

      filters?: Filter[];
    }
  | {
      type: "map";
      title?: string;

      markers: {
        id?: string;

        lat: number;

        lng: number;

        title: string;

        description?: string;

        icon?: string;

        badge?: string;
      }[];
    }
  | {
      type: "gallery";
      title?: string;

      subtitle?: string;

      images: {
        url: string;

        title?: string;
      }[];

      pagination?: Pagination;
    }
  | {
      type: "actions";
      title?: string;

      actions: Action[];
    }
  | {
      type: "form";
      title?: string;

      fields: Field[];

      submitAction: string;
    }
  | {
      type: "alert";
      title?: string;

      severity: "info" | "warning" | "error" | "success";

      message: string;
    };

type WidgetMetadata = {
  companyName: string;
  apiName: string;
  generatedAt: string;
  version: string;
};

export type GenericWidgetContent = {
  title: string;
  subtitle?: string;
  layout: string;
  industry?: string;
  blocks: WidgetBlock[];
  metadata?: WidgetMetadata;
};

export const normalizeApiResponseToWidget = (
  companyName: string,
  apiName: string,
  response: unknown,
  layout?: string,
  industry?: string,
): GenericWidgetContent => {
  const blocks = buildBlocks(response, apiName);

  return {
    title: apiName,
    subtitle: "Live API response",
    layout: layout || "dashboard",
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
    metadata: {
      companyName,
      apiName,
      generatedAt: new Date().toISOString(),
      version: "1",
    },
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
const ignoredFields = new Set([
  "_id",
  "__v",
  "createdAt",
  "updatedAt",
  "deletedAt",
  "password",
  "token",
  "secret",
  "icon",
  "code",
  "tz_id",
]);

const getColumnType = (key: string): TableColumn["type"] => {
  const lower = key.toLowerCase();

  if (
    lower.includes("price") ||
    lower.includes("amount") ||
    lower.includes("cost") ||
    lower.includes("revenue")
  ) {
    return "currency";
  }

  if (
    lower.includes("date") ||
    lower.includes("created") ||
    lower.includes("updated")
  ) {
    return "date";
  }

  if (lower.includes("status")) {
    return "status";
  }

  if (lower.includes("image") || lower.includes("photo")) {
    return "image";
  }

  return "text";
};

const buildBlocks = (response: unknown, apiName?: string): WidgetBlock[] => {
  if (Array.isArray(response)) {
    return buildArrayBlocks(response, apiName);
  }

  if (isRecord(response)) {
    return buildObjectBlocks(response, apiName);
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
      const metrics = buildSummaryMetrics(records, apiName);

      if (metrics.length > 0) {
        blocks.push({
          type: "metrics",
          title: "Summary Overview",
          metrics,
        });
      }

      const headers = Object.keys(records[0]).slice(0, 6);
      blocks.push({
        type: "table",
        title: `${collectionLabel} List`,
        columns: headers.map((header) => ({
          key: header,
          label: toLabel(header),
          type: getColumnType(header),
          sortable: true,
        })),
        rows: records
          .slice(0, 10)
          .map((record) =>
            headers.map((header) => stringifyCell(record[header])),
          ),
        pagination,
      });
      return blocks;
    }
    case "cards": {
      return [
        {
          type: "cards",
          title: apiName ? toLabel(apiName) : "Items",
          cards: records.map((record) => ({
            id: String(record.id ?? record._id ?? ""),

            title: String(
              record.title ?? record.name ?? record.label ?? "Untitled",
            ),

            subtitle: String(record.description ?? record.subtitle ?? ""),

            image: typeof record.image === "string" ? record.image : undefined,

            icon: typeof record.icon === "string" ? record.icon : undefined,

            badge:
              typeof record.status === "string" ? record.status : undefined,

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
          })),
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
): Pagination | undefined => {
  let page: number | undefined;
  let totalPages: number | undefined;
  let totalItems: number | undefined;
  let pageSize: number | undefined;

  for (const [k, v] of Object.entries(record)) {
    if (typeof v !== "number") continue;
    const lower = k.toLowerCase();

    if (
      lower === "page" ||
      lower === "currentpage" ||
      lower === "current_page" ||
      lower === "offset"
    ) {
      page = v;
    } else if (
      lower === "totalpages" ||
      lower === "total_pages" ||
      lower === "pages"
    ) {
      totalPages = v;
    } else if (
      lower === "totalitems" ||
      lower === "total_items" ||
      lower === "totalrecords" ||
      lower === "total_records" ||
      lower === "recordcount" ||
      lower === "record_count" ||
      lower === "total" ||
      lower === "count" ||
      lower === "results" ||
      lower === "items"
    ) {
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
  };
};

const buildObjectBlocks = (
  record: Record<string, unknown>,
  apiName?: string,
): WidgetBlock[] => {
  const blocks: WidgetBlock[] = [];
  const allMetrics: WidgetMetric[] = [];
  const allKeyValues: WidgetKeyValueItem[] = [];
  const pagination = extractPaginationMeta(record);
  const ignoredFields = new Set([
    "_id",
    "__v",
    "password",
    "token",
    "refreshToken",
    "createdAt",
    "updatedAt",
  ]);
  const metricKeys = [
    "total",
    "count",
    "amount",
    "price",
    "sales",
    "revenue",
    "income",
    "orders",
    "customers",
    "users",
    "qty",
    "quantity",
    "cost",
    "profit",
  ];

  for (const [key, value] of Object.entries(record)) {
    const lower = key.toLowerCase();

    if (ignoredFields.has(key)) {
      continue;
    }
    if (
      typeof value === "number" &&
      metricKeys.some((metric) => lower.includes(metric))
    ) {
      allMetrics.push({
        label: toLabel(key),
        value,
      });

      continue;
    }

    if (typeof value === "string" || typeof value === "boolean") {
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
  if (allMetrics.length > 0) {
    blocks.push({
      type: "metrics",
      title: "Key Telemetry Metrics",
      metrics: allMetrics.slice(0, 8),
    });
  }

  if (allKeyValues.length > 0) {
    blocks.push({
      type: "keyValue",
      title: "System Details",
      keyValueItems: allKeyValues.slice(0, 10),
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

const stringifyCell = (value: unknown) => {
  if (isPrimitive(value)) {
    return stringifyPrimitive(value);
  }

  if (Array.isArray(value)) {
    return `${value.length} items`;
  }

  if (isRecord(value)) {
    return "Object";
  }

  return "";
};

const toLabel = (value: string) =>
  value
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const buildKeyValueItems = (
  record: Record<string, unknown>,
): WidgetKeyValueItem[] =>
  Object.entries(record)
    .filter(
      ([, v]) =>
        typeof v === "string" ||
        typeof v === "number" ||
        typeof v === "boolean",
    )
    .map(([k, v]) => ({
      key: toLabel(k),
      value: String(v),
    }));

const buildSummaryMetrics = (
  records: Record<string, unknown>[],
  apiName?: string,
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

  const numericFields = new Map<string, { sum: number; count: number }>();
  records.forEach((record) => {
    Object.entries(record).forEach(([key, val]) => {
      const lowerKey = key.toLowerCase();
      if (
        typeof val === "number" &&
        (lowerKey.includes("amount") ||
          lowerKey.includes("total") ||
          lowerKey.includes("price") ||
          lowerKey.includes("qty") ||
          lowerKey.includes("quantity") ||
          lowerKey.includes("sales") ||
          lowerKey.includes("cost") ||
          lowerKey.includes("fee"))
      ) {
        const stats = numericFields.get(key) || { sum: 0, count: 0 };
        stats.sum += val;
        stats.count += 1;
        numericFields.set(key, stats);
      } else if (typeof val === "string") {
        const parsed = parseFloat(val.replace(/[^0-9.]/g, ""));
        if (
          !isNaN(parsed) &&
          (lowerKey.includes("amount") ||
            lowerKey.includes("total") ||
            lowerKey.includes("price") ||
            lowerKey.includes("cost") ||
            lowerKey.includes("fee") ||
            lowerKey.includes("sales"))
        ) {
          const stats = numericFields.get(key) || { sum: 0, count: 0 };
          stats.sum += parsed;
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
      const isPrice =
        (key.toLowerCase().includes("price") ||
          key.toLowerCase().includes("amount") ||
          key.toLowerCase().includes("cost") ||
          key.toLowerCase().includes("fee") ||
          key.toLowerCase().includes("sales") ||
          key.toLowerCase().includes("revenue") ||
          key.toLowerCase().includes("income") ||
          key.toLowerCase().includes("spend") ||
          key.toLowerCase().includes("spent") ||
          key.toLowerCase().includes("total")) &&
        !key.toLowerCase().includes("count") &&
        !key.toLowerCase().includes("orders") &&
        !key.toLowerCase().includes("pages") &&
        !key.toLowerCase().includes("customers") &&
        !key.toLowerCase().includes("qty") &&
        !key.toLowerCase().includes("quantity") &&
        !key.toLowerCase().includes("items") &&
        !key.toLowerCase().includes("users") &&
        !key.toLowerCase().includes("page") &&
        !key.toLowerCase().includes("number") &&
        !key.toLowerCase().includes("no");

      metrics.push({
        label: label.startsWith("Total") ? label : `Total ${label}`,
        value: isPrice ? `$${stats.sum.toFixed(2)}` : stats.sum,
        tone: "good",
      });
    });

  return metrics;
};
