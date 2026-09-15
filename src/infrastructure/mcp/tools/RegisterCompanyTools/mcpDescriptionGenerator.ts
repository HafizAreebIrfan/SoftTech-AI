/**
 * Generalized MCP Tool Description Generator
 *
 * Dynamically synthesizes concise, accurate, and professional tool descriptions
 * for LLMs (like ChatGPT) based strictly on generic API metadata (HTTP method,
 * entity name, endpoint structure, and registered parameters).
 * Fully multi-tenant and domain-agnostic — contains zero hardcoded company or
 * industry logic.
 */

export interface DynamicParam {
  key?: string;
  name?: string;
  isDynamic?: boolean;
  value?: any;
}

export const isStaleOrInvalidDescription = (desc?: string): boolean => {
  if (!desc || typeof desc !== "string") return true;
  const d = desc.trim().toLowerCase();
  if (d.length < 15) return true;
  if (d.includes("generic widget response")) return true;
  if (d.startsWith("calls ")) return true;
  if (d.includes("do not call repeatedly")) return true;
  return false;
};

export const generateMcpDescription = (
  api: any,
  company?: { companyName?: string; industry?: string },
  options?: { forceRegenerate?: boolean },
): string => {
  if (!api) return "Calls a registered company API.";

  if (!options?.forceRegenerate) {
    // 1. If AI schema analysis generated a clean toolDescription, use it
    const aiDesc = api.apiSchema?.toolDescription;
    if (typeof aiDesc === "string" && !isStaleOrInvalidDescription(aiDesc)) {
      return aiDesc.trim();
    }

    // 2. If a custom, high-quality description was provided in mcpDescription, respect it
    const existingDesc =
      typeof api.mcpDescription === "string" ? api.mcpDescription.trim() : "";
    if (existingDesc && !isStaleOrInvalidDescription(existingDesc)) {
      return existingDesc;
    }
  }

  const companyName = company?.companyName || "the company";
  const endpoint = String(api.endpoint || api.apiEndpoint || "").trim();
  const method = String(api.method || api.apiMethod || "GET").toUpperCase();
  const apiName = String(api.name || api.apiName || "").trim();
  const rawEntity = api.apiSchema?.entity;
  const isInvalidEntity = !rawEntity || typeof rawEntity !== "string" || rawEntity.includes("{") || rawEntity.includes("%7");
  const entity = String(!isInvalidEntity ? rawEntity : inferEntityFromEndpoint(endpoint, apiName)).toLowerCase();
  const singularEntity = entity.endsWith("ies")
    ? `${entity.slice(0, -3)}y`
    : entity.endsWith("s") && !entity.endsWith("ss")
      ? entity.slice(0, -1)
      : entity;

  // Extract dynamic parameters
  const params: DynamicParam[] = [
    ...(Array.isArray(api.params) ? api.params : []),
    ...(Array.isArray(api.body) ? api.body : []),
  ];

  const filterKeys = params
    .map((p) => String(p.key || p.name || "").replace(/[{}]/g, "").trim())
    .filter((k) => k && !["page", "limit", "offset", "skip"].includes(k.toLowerCase()));

  const paramText = filterKeys.length > 0 ? filterKeys.join(", ") : "";

  // 2b. Categories / options discovery tool (the list of valid filter values).
  // Described as a helper so the model uses its result to pick a value for a
  // follow-up call rather than presenting it as the answer. Mirrors the
  // optionsTool role detection in buildEntityToolDirectory (path/name shape).
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

  // 3. Availability Check
  if (endpoint.includes("/availability") || /availab/i.test(apiName)) {
    return `Checks availability for ${entity} from ${companyName}.${paramText ? ` Supported parameters: ${paramText}.` : ""}`;
  }

  // 4. Single Item Details by ID (GET only)
  const isDetailEndpoint =
    method === "GET" &&
    (endpoint.includes("{id}") || endpoint.includes(":id") || /%7Bid%7D/i.test(endpoint)) &&
    !endpoint.includes("/availability");

  if (isDetailEndpoint || (method === "GET" && /detail|get\s*single/i.test(apiName))) {
    return `Retrieves details for a single ${singularEntity} by ID from ${companyName}.`;
  }

  // 5. Create / Action (POST)
  if (method === "POST") {
    if (/pay|cancel|checkout|book|reserve|subscribe/i.test(apiName) || /pay|cancel|checkout|book/i.test(endpoint)) {
      return `Processes ${apiName.toLowerCase() || "request"} for ${singularEntity} in ${companyName}.${paramText ? ` Supported parameters: ${paramText}.` : ""}`;
    }
    return `Creates a new ${singularEntity} in ${companyName}.${paramText ? ` Supported parameters: ${paramText}.` : ""}`;
  }

  // 6. Update / Action (PUT / PATCH)
  if (method === "PUT" || method === "PATCH") {
    if (/cancel|pay|status|toggle|approve|reject/i.test(apiName) || /cancel|pay|status|toggle|approve|reject/i.test(endpoint)) {
      return `Updates status or processes ${apiName.toLowerCase()} for ${singularEntity} in ${companyName}.${paramText ? ` Supported parameters: ${paramText}.` : ""}`;
    }
    return `Updates an existing ${singularEntity} in ${companyName}.${paramText ? ` Supported parameters: ${paramText}.` : ""}`;
  }

  // 7. Delete Record (DELETE)
  if (method === "DELETE") {
    return `Deletes a ${singularEntity} from ${companyName}.`;
  }

  // 8. Search / List Records (GET)
  if (method === "GET") {
    const isSearchOrFilter = filterKeys.length > 0 || /search|filter|find/i.test(endpoint) || /search|filter|find/i.test(apiName);
    const actionVerb = isSearchOrFilter ? "Searches and retrieves" : "Lists";
    const qualificationHint = isSearchOrFilter
      ? ` Call this tool once key search criteria (such as ${paramText || "location, dates, or budget"}) are known. If the user's inquiry is broad, planning-focused, or missing key details, ask clarifying questions first to gather their preferences before invoking.`
      : "";
    return `${actionVerb} ${entity} from ${companyName}.${paramText ? ` Supported parameters: ${paramText}.` : ""}${qualificationHint}`;
  }

  // 9. Fallback
  return `Executes ${apiName || method} for ${entity} from ${companyName}.${paramText ? ` Supported parameters: ${paramText}.` : ""}`;
};

const inferEntityFromEndpoint = (endpoint: string, apiName: string): string => {
  let decoded = endpoint;
  try {
    decoded = decodeURIComponent(endpoint);
  } catch {
    decoded = endpoint;
  }
  const cleanEp = decoded
    .split("?")[0]
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
