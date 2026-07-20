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
      listItems: Array<{ title: string; description?: string; meta?: string }>;
    }
  | {
      type: "table";
      title?: string;
      tableHeaders: string[];
      tableRows: Array<Array<string | number>>;
    };

export type GenericWidgetContent = {
  title: string;
  subtitle?: string;
  layout: string;
  industry?: string;
  blocks: WidgetBlock[];
};

export const normalizeApiResponseToWidget = (
  apiName: string,
  response: unknown,
  layout: string,
  industry?: string,
): GenericWidgetContent => {
  const blocks = buildBlocks(response);

  return {
    title: apiName,
    subtitle: "Live API response",
    layout: layout || "dashboard",
    industry: normalizeIndustry(industry),
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
  };
};

const normalizeIndustry = (ind?: string): string => {
  if (!ind) return "general";
  const lower = ind.toLowerCase();
  if (lower.includes("weather") || lower.includes("forecast") || lower.includes("data")) return "forecasting";
  if (lower.includes("health") || lower.includes("med") || lower.includes("clinic")) return "health";
  if (lower.includes("food") || lower.includes("restaurant") || lower.includes("dining")) return "food";
  if (lower.includes("transport") || lower.includes("mobility") || lower.includes("ride")) return "transport";
  if (lower.includes("ecom") || lower.includes("store") || lower.includes("shop")) return "ecommerce";
  if (lower.includes("fintech") || lower.includes("finance") || lower.includes("bank")) return "fintech";
  if (lower.includes("saas") || lower.includes("software")) return "saas";
  if (lower.includes("ai") || lower.includes("agent") || lower.includes("auto")) return "ai";
  if (lower.includes("logistic") || lower.includes("ship") || lower.includes("supply")) return "logistics";
  if (lower.includes("travel") || lower.includes("flight") || lower.includes("hotel")) return "travel";
  return lower;
};

const buildBlocks = (response: unknown): WidgetBlock[] => {
  if (Array.isArray(response)) {
    return buildArrayBlocks(response);
  }

  if (isRecord(response)) {
    return buildObjectBlocks(response);
  }

  if (isPrimitive(response)) {
    return [
      {
        type: "keyValue",
        title: "Result",
        keyValueItems: [{ key: "Value", value: stringifyPrimitive(response) }],
      },
    ];
  }

  return [];
};

const buildArrayBlocks = (items: unknown[]): WidgetBlock[] => {
  const records = items.filter(isRecord);

  if (records.length > 0) {
    const headers = Object.keys(records[0]).slice(0, 6);

    return [
      {
        type: "table",
        title: "Items",
        tableHeaders: headers,
        tableRows: records
          .slice(0, 10)
          .map((record) =>
            headers.map((header) => stringifyCell(record[header])),
          ),
      },
    ];
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

const buildObjectBlocks = (record: Record<string, unknown>): WidgetBlock[] => {
  const blocks: WidgetBlock[] = [];

  const allMetrics: WidgetMetric[] = [];
  const allListItems: Array<{ title: string; description?: string; meta?: string }> = [];
  const allKeyValues: WidgetKeyValueItem[] = [];

  const extractItems = (obj: Record<string, unknown>, prefix = "") => {
    for (const [key, value] of Object.entries(obj)) {
      // Avoid raw large nested objects or noise
      if (key === "icon" || key === "code" || key === "tz_id") continue;
      const label = prefix ? `${toLabel(prefix)} ${toLabel(key)}` : toLabel(key);

      if (typeof value === "number") {
        allMetrics.push({ label, value });
      } else if (typeof value === "string" || typeof value === "boolean") {
        allKeyValues.push({ key: label, value: String(value) });
      } else if (isRecord(value)) {
        if (typeof value.text === "string" || typeof value.name === "string") {
          allListItems.push({
            title: label,
            description: String(value.text || value.name || ""),
            meta: String(value.code || value.region || "")
          });
        }
        extractItems(value, key);
      }
    }
  };

  extractItems(record);

  if (allMetrics.length > 0) {
    blocks.push({
      type: "metrics",
      title: "Key Telemetry Metrics",
      metrics: allMetrics.slice(0, 8),
    });
  }

  if (allListItems.length > 0) {
    blocks.push({
      type: "list",
      title: "Observed Conditions",
      listItems: allListItems.slice(0, 8),
    });
  }

  if (allKeyValues.length > 0) {
    blocks.push({
      type: "keyValue",
      title: "System Details",
      keyValueItems: allKeyValues.slice(0, 10),
    });
  }

  // Handle nested arrays (e.g. forecastday)
  for (const [key, value] of Object.entries(record)) {
    if (Array.isArray(value) && value.length > 0) {
      blocks.push(
        ...buildArrayBlocks(value).map((block) => ({
          ...block,
          title: toLabel(key),
        }))
      );
    }
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
