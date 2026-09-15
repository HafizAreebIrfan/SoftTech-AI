/**
 * MCP AI Tool Description Generator & Formatter
 *
 * Synthesizes or polishes tool descriptions dynamically using:
 * - HTTP method (GET, POST, PUT, PATCH, DELETE)
 * - Endpoint path (e.g. /api/cars, /api/cars/{id}, /users/bookings/{id}/cancel)
 * - Parameters (query params, path params, headers)
 * - Body schema (payload attributes)
 * - AI Schema (analyzed schema, entity name, response keys)
 * - Company Name & Industry
 *
 * Fully domain-agnostic with zero hardcoded industries.
 */

export interface GenerateDescriptionInput {
  apiName?: string;
  method?: string;
  endpoint?: string;
  companyName?: string;
  industry?: string;
  params?: any[];
  body?: any[];
  apiQueryParams?: string | any;
  apiSchema?: {
    entity?: string;
    toolDescription?: string;
    properties?: Record<string, any>;
    required?: string[];
    [key: string]: any;
  };
}

export const extractDynamicParamKeys = (input: GenerateDescriptionInput): string[] => {
  const keys = new Set<string>();

  // 1. From params array
  if (Array.isArray(input.params)) {
    for (const p of input.params) {
      if (!p) continue;
      if (typeof p === "string") {
        p.split(",").forEach((k) => keys.add(k.trim()));
      } else if (typeof p === "object") {
        const k = p.key || p.name || p.param;
        if (k) keys.add(String(k).replace(/[{}]/g, "").trim());
      }
    }
  }

  // 2. From apiQueryParams string
  if (typeof input.apiQueryParams === "string" && input.apiQueryParams.trim()) {
    try {
      const parsed = JSON.parse(input.apiQueryParams);
      if (Array.isArray(parsed)) {
        parsed.forEach((p) => {
          const k = p.key || p.name;
          if (k) keys.add(String(k).replace(/[{}]/g, "").trim());
        });
      } else if (typeof parsed === "object") {
        Object.keys(parsed).forEach((k) => keys.add(k.trim()));
      }
    } catch {
      input.apiQueryParams.split(/[&,]/).forEach((pair) => {
        const k = pair.split("=")[0]?.trim();
        if (k) keys.add(k.replace(/[{}]/g, ""));
      });
    }
  }

  // 3. From body array
  if (Array.isArray(input.body)) {
    for (const b of input.body) {
      if (!b) continue;
      if (typeof b === "string") {
        b.split(",").forEach((k) => keys.add(k.trim()));
      } else if (typeof b === "object") {
        const k = b.key || b.name || b.field;
        if (k) keys.add(String(k).replace(/[{}]/g, "").trim());
      }
    }
  }

  // 4. From apiSchema
  if (input.apiSchema?.properties) {
    Object.keys(input.apiSchema.properties).forEach((k) => {
      if (!k.startsWith("$") && !k.startsWith("_")) {
        keys.add(k);
      }
    });
  }

  // Exclude standard pagination noise
  const skip = new Set(["page", "limit", "offset", "skip", "pagesize"]);
  return Array.from(keys).filter((k) => k && !skip.has(k.toLowerCase()));
};

export const inferEntity = (endpoint: string, apiName: string): string => {
  let decoded = endpoint;
  try {
    decoded = decodeURIComponent(endpoint);
  } catch {
    decoded = endpoint;
  }
  const cleanEp = decoded
    .split("?")[0]
    .replace(/https?:\/\/[^/]+/i, "")
    .replace(/\/api\//i, "")
    .replace(/\{[^}]+\}/g, "")
    .replace(/%7B[^%]+%7D/gi, "")
    .replace(/:[a-zA-Z0-9_-]+/g, "");

  const segments = cleanEp.split("/").filter(Boolean);
  const skipWords = /^(get|list|search|filter|find|fetch|all|create|update|delete|availability|status|cancel|pay|checkout)$/i;

  for (let i = segments.length - 1; i >= 0; i--) {
    const seg = segments[i].toLowerCase();
    if (!skipWords.test(seg) && !seg.includes("%7")) {
      return seg;
    }
  }

  const cleanName = apiName
    .replace(/^(get|fetch|list|search|find|retrieve|load|check)\s+/i, "")
    .replace(/\s+(availability|details|status|list)$/i, "")
    .trim()
    .toLowerCase();
  return cleanName || "records";
};

export const generateNewMcpDescription = (input: GenerateDescriptionInput): string => {
  const companyName = input.companyName?.trim() || "the company";
  const endpoint = String(input.endpoint || "").trim();
  const method = String(input.method || "GET").toUpperCase();
  const apiName = String(input.apiName || "").trim();

  const rawEntity = input.apiSchema?.entity;
  const isInvalidEntity =
    !rawEntity ||
    typeof rawEntity !== "string" ||
    rawEntity.includes("{") ||
    rawEntity.includes("%7");
  const entity = String(
    !isInvalidEntity ? rawEntity : inferEntity(endpoint, apiName),
  ).toLowerCase();

  const singularEntity = entity.endsWith("ies")
    ? `${entity.slice(0, -3)}y`
    : entity.endsWith("s") && !entity.endsWith("ss")
      ? entity.slice(0, -1)
      : entity;

  const filterKeys = extractDynamicParamKeys(input);
  const paramText =
    filterKeys.length > 0 ? filterKeys.slice(0, 8).join(", ") : "";

  // 1. Categories / options discovery
  const epLower = endpoint.toLowerCase();
  const isOptionsList =
    method === "GET" &&
    (epLower.includes("/categories") ||
      epLower.includes("/category-list") ||
      epLower.includes("/category_list") ||
      /categories|category list/i.test(apiName));
  if (isOptionsList) {
    return `Lists the available categories/options from ${companyName}. Use it to discover valid filter values, then call the matching list or category tool with the chosen value. Its result is for selecting a value, not for display.`;
  }

  // 2. Availability Check
  if (endpoint.includes("/availability") || /availab/i.test(apiName)) {
    return `Checks availability for ${entity} from ${companyName}.${paramText ? ` Supported parameters: ${paramText}.` : ""}`;
  }

  // 3. Single Item Details by ID (GET only)
  const isDetailEndpoint =
    method === "GET" &&
    (endpoint.includes("{id}") ||
      endpoint.includes(":id") ||
      /%7Bid%7D/i.test(endpoint)) &&
    !endpoint.includes("/availability");

  if (
    isDetailEndpoint ||
    (method === "GET" && /detail|get\s*single/i.test(apiName))
  ) {
    return `Retrieves details for a single ${singularEntity} by ID from ${companyName}.`;
  }

  // 4. Create / Action (POST)
  if (method === "POST") {
    if (
      /pay|cancel|checkout|book|reserve|subscribe/i.test(apiName) ||
      /pay|cancel|checkout|book/i.test(endpoint)
    ) {
      return `Processes ${apiName.toLowerCase() || "request"} for ${singularEntity} in ${companyName}.${paramText ? ` Supported parameters: ${paramText}.` : ""}`;
    }
    return `Creates a new ${singularEntity} in ${companyName}.${paramText ? ` Supported parameters: ${paramText}.` : ""}`;
  }

  // 5. Update / Action (PUT / PATCH)
  if (method === "PUT" || method === "PATCH") {
    if (
      /cancel|pay|status|toggle|approve|reject/i.test(apiName) ||
      /cancel|pay|status|toggle|approve|reject/i.test(endpoint)
    ) {
      return `Updates status or processes ${apiName.toLowerCase()} for ${singularEntity} in ${companyName}.${paramText ? ` Supported parameters: ${paramText}.` : ""}`;
    }
    return `Updates an existing ${singularEntity} in ${companyName}.${paramText ? ` Supported parameters: ${paramText}.` : ""}`;
  }

  // 6. Delete Record (DELETE)
  if (method === "DELETE") {
    return `Deletes a ${singularEntity} from ${companyName}.`;
  }

  // 7. Search / List Records (GET)
  if (method === "GET") {
    const isSearchOrFilter =
      filterKeys.length > 0 ||
      /search|filter|find/i.test(endpoint) ||
      /search|filter|find/i.test(apiName);
    const actionVerb = isSearchOrFilter ? "Searches and retrieves" : "Lists";
    return `${actionVerb} ${entity} from ${companyName}.${paramText ? ` Supported parameters: ${paramText}.` : ""}`;
  }

  return `Executes ${apiName || method} for ${entity} from ${companyName}.${paramText ? ` Supported parameters: ${paramText}.` : ""}`;
};

export const formatMcpDescriptionWithAi = (
  currentText: string,
  input: GenerateDescriptionInput,
): string => {
  const trimmed = currentText?.trim() || "";
  if (!trimmed) {
    return generateNewMcpDescription(input);
  }

  const companyName = input.companyName?.trim() || "the company";
  const filterKeys = extractDynamicParamKeys(input);
  const paramText =
    filterKeys.length > 0 ? filterKeys.slice(0, 8).join(", ") : "";

  // Strip generic boilerplate
  let cleaned = trimmed
    .replace(/^calls\s+.*?\s+and\s+returns\s+a\s+generic\s+widget\s+response\.?/i, "")
    .replace(/returns a generic widget response\.?/gi, "")
    .replace(/do not call repeatedly\.?/gi, "")
    .trim();

  if (!cleaned) {
    return generateNewMcpDescription(input);
  }

  cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  if (!cleaned.endsWith(".")) cleaned += ".";

  // Ensure company name is naturally associated if not present
  if (
    !cleaned.toLowerCase().includes(companyName.toLowerCase()) &&
    companyName !== "the company"
  ) {
    cleaned = cleaned.replace(/\.$/, ` from ${companyName}.`);
  }

  // Append supported parameters if missing
  if (
    paramText &&
    !cleaned.toLowerCase().includes("parameters:") &&
    !cleaned.toLowerCase().includes("supported parameters")
  ) {
    cleaned += ` Supported parameters: ${paramText}.`;
  }

  return cleaned;
};
