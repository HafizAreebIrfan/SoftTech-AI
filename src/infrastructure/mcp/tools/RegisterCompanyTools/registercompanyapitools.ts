import { registerAppTool } from "@modelcontextprotocol/ext-apps/server";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ICompany } from "../../../../domain/types/company.types";
import { genericWidgetOutputSchema } from "../../Schemas/OutputSchema/genericwidgetoutputschema";
import {
  normalizeApiResponseToWidget,
  ActionToolLinks,
} from "../DynamicDomain/genericwidgetnormalizer";
import { translateApiError } from "../../errors/errorTranslator";
import { buildCustomMcpInputSchema } from "../../Schemas/InputSchema/genericwidgetinputschema";
import { formatCheckoutToolResult } from "../CheckoutHandle/index";

// We will extract the HTTP and execution logic into this new file in the next step
import {
  callRegisteredApi,
  isUserAuthRequiredNotice,
  sanitizeResponseBody,
} from "./apihandler";
import { SearchRecoveryInfo } from "./searchrecovery";

export const registerCompanyApiTools = (
  server: McpServer,
  company: ICompany,
) => {
  const apis = company.apis ?? [];
  const companyId = String((company as any)._id || company.companyName || "");

  // Resolve which registered tool implements each CRUD role per entity, so the
  // widget's action buttons can target the real sibling tool (e.g. a list tool
  // linking to its get-by-id tool) instead of the current tool's display name.
  // Generic across companies: derived only from HTTP method + path shape +
  // entity label, never from hardcoded entity/industry names.
  const toolDirectory = buildEntityToolDirectory(apis);

  apis.forEach((api, index) => {
    const apiId = String((api as any)._id || api.name || `api_${index + 1}`);
    const toolName = toToolName(
      api.mcpToolName || api.name || `api_${index + 1}`,
      index,
    );

    const actionTools = resolveActionTools(api, toolDirectory);

    const configuredInputFields = [
      ...(Array.isArray(api.params) ? api.params : []),
      ...(Array.isArray(api.body) ? api.body : []),
    ];

    const customInputSchema = buildCustomMcpInputSchema(configuredInputFields);

    const rawDesc = api.mcpDescription || "";
    let toolDescription = rawDesc;
    if (
      !toolDescription ||
      toolDescription.includes("generic widget response") ||
      toolDescription.includes("Calls ")
    ) {
      const endpoint = String(api.endpoint || "");
      if (endpoint.includes("/categories") || endpoint.includes("/category-list")) {
        toolDescription = `Retrieves the list of all product categories for ${company.companyName}. Use ONLY when the user explicitly asks to see or list available categories.`;
      } else if (endpoint.includes("/category/")) {
        toolDescription = `Retrieves products in a specific category (e.g. categoryname='vehicle', categoryname='womens-bags') from ${company.companyName}. Use when user asks to see or search products by category.`;
      } else if (isDetailEndpoint(api)) {
        toolDescription = `Retrieves the full details for a single item by ID from ${company.companyName}. Use when the user requests details for a specific item.`;
      } else {
        toolDescription = `Fetches ${api.name || "records"} from ${company.companyName}.`;
      }
    }
    const resourceUri = api.mcpResourceUri;

    const method = (api.method || "GET").toUpperCase();
    let readOnlyHint = false;
    let destructiveHint = false;

    if (method === "GET") {
      readOnlyHint = true;
      destructiveHint = false;
    } else if (method === "DELETE") {
      readOnlyHint = false;
      destructiveHint = true;
    } else {
      readOnlyHint = false;
      destructiveHint = false;
    }

    registerAppTool(
      server,
      toolName,
      {
        title: api.name || `API ${index + 1}`,
        description: toolDescription,
        inputSchema: customInputSchema,
        outputSchema: genericWidgetOutputSchema,
        annotations: {
          readOnlyHint,
          destructiveHint,
        },
        _meta: {
          ui: {
            resourceUri,
          },
          "openai/outputTemplate": resourceUri,
          "openai/widgetAccessible": true,
          "openai/toolInvocation/invoking": `Preparing ${api.name || "widget"}...`,
          "openai/toolInvocation/invoked": "Loaded",
        },
      },
      async (input: any, extra: any) => {
        try {
          const req = extra?.req;
          const recovery: SearchRecoveryInfo = {};

          // Delegate the actual HTTP fetching to the Secondary Adapter
          const rawResponse = await callRegisteredApi(
            companyId,
            apiId,
            api,
            input,
            req,
            recovery,
          );

          // 1. Handle Auth Requirement Widget
          if (isUserAuthRequiredNotice(rawResponse)) {
            const authWidget = buildAuthWidget(
              api,
              company,
              method,
              rawResponse.connectUrl,
            );
            return buildMcpSuccessResult(
              authWidget,
              api.name || `API ${index + 1}`,
              company,
              resourceUri,
              method,
            );
          }

          const currentPlatform =
            req?.headers?.["x-platform-type"] ||
            input?.platformType ||
            api.platformType ||
            "web";

          const processedResponse = formatCheckoutToolResult({
            response: rawResponse,
            config: {
              isCheckout: Boolean((api as any).isCheckout),
              webCheckoutUrl: (api as any).webCheckoutUrl,
              mobileDeepLinkUrl:
                (api as any).mobileDeepLinkUrl ?? (api as any).mobileDeepLink,
            },
            platformType: currentPlatform as any,
          });

          // 2. Handle Successful Data Widget
          const effectiveAudience =
            api.audience || company.uiPreference?.audienceDefault || "customer";

          const userRawPrompt = input?.user_raw_prompt;
          const inferredIntent = input?.inferred_intent;

          const widgetContent = normalizeApiResponseToWidget(
            company.companyName,
            api.name || `API ${index + 1}`,
            processedResponse,
            company.uiPreference?.layout,
            company.industry,
            api.apiSchema as any,
            api.params ?? [],
            effectiveAudience as any,
            api.platformType as any,
            method,
            company.uiPreference?.themeColor,
            actionTools,
            userRawPrompt,
            inferredIntent,
            (api as any).webCheckoutUrl,
            toolName,
            input,
          );

          // If the search was empty and we relaxed the query (or still found
          // nothing), tell the model exactly what happened so it narrates the
          // result honestly instead of reporting a plain success.
          const summaryText = applyRecoveryMessaging(widgetContent, recovery);

          return buildMcpSuccessResult(
            widgetContent,
            api.name || `API ${index + 1}`,
            company,
            resourceUri,
            method,
            summaryText,
          );
        } catch (error: any) {
          // 3. Handle Error Widget
          if (isUserAuthRequiredNotice(error)) {
            const authWidget = buildAuthWidget(
              api,
              company,
              method,
              error.connectUrl,
            );
            return buildMcpSuccessResult(
              authWidget,
              api.name || `API ${index + 1}`,
              company,
              resourceUri,
              method,
            );
          }

          const sanitizedErrorMessage = sanitizeResponseBody(
            error?.message || "Service Notice",
          );

          console.error(
            `[MCP Tool Error] ${api.name} (${api.baseUrl}${api.endpoint}):`,
            {
              status: error?.status,
              message: sanitizedErrorMessage,
            },
          );

          const translation = translateApiError(
            error?.status,
            sanitizedErrorMessage,
            api.name || "service",
          );
          const errorWidget = buildErrorWidget(
            api,
            company,
            method,
            translation,
          );

          return buildMcpSuccessResult(
            errorWidget,
            api.name || `API ${index + 1}`,
            company,
            resourceUri,
            method,
          );
        }
      },
    );
  });
};

// --- Helper Functions for Formatting ---

const buildAuthWidget = (
  api: any,
  company: ICompany,
  method: string,
  connectUrl: string,
) => ({
  title: `${api.name || "API"} Connection Required`,
  subtitle: `Account authorization is required to access ${company.companyName}.`,
  data: {
    status: "Account Not Connected",
    connectUrl,
  },
  layout: company.uiPreference?.layout ?? "dashboard",
  industry: company.industry ?? "general",
  blocks: [
    {
      type: "keyValue",
      title: "Authorization Needed",
      keyValueItems: [
        { key: "Status", value: "Account Not Connected" },
        { key: "Connect Account", value: connectUrl },
      ],
    },
  ],
  metadata: {
    companyName: company.companyName,
    apiName: api.name,
    httpMethod: method,
    isAction: method !== "GET",
    generatedAt: new Date().toISOString(),
  },
});

const buildErrorWidget = (
  api: any,
  company: ICompany,
  method: string,
  translation: any,
) => ({
  title: api.name || "Service Notice",
  subtitle: translation.userMessage,
  data: {
    status: "Service Notice",
    message: translation.userMessage,
    actionSuggestion: translation.actionSuggestion,
  },
  layout: company.uiPreference?.layout ?? "dashboard",
  industry: company.industry ?? "general",
  blocks: [
    {
      type: "keyValue",
      title: "Service Status",
      keyValueItems: [
        { key: "Status", value: "Unable to retrieve records" },
        { key: "Action", value: translation.actionSuggestion },
      ],
    },
  ],
  metadata: {
    companyName: company.companyName,
    apiName: api.name,
    httpMethod: method,
    isAction: method !== "GET",
    generatedAt: new Date().toISOString(),
  },
});

const buildMcpSuccessResult = (
  widgetContent: any,
  apiName: string,
  company: ICompany,
  resourceUri?: string,
  method = "GET",
  summaryText?: string,
) => {
  const metaObject: Record<string, any> = {
    ui: { resourceUri },
    "openai/outputTemplate": resourceUri,
    "openai/widgetAccessible": true,
    "openai/toolInvocation/invoking":
      method !== "GET" ? `Executing ${apiName}...` : `Loading ${apiName}...`,
    "openai/toolInvocation/invoked":
      method !== "GET" ? "Action completed" : "Loaded",
    company: company.companyName,
    lastFetched: new Date().toISOString(),
    "softtech/action": method !== "GET",
    "softtech/httpMethod": method,
    "softtech/apiName": apiName,
  };

  return {
    structuredContent: widgetContent,
    content: [
      {
        type: "text" as const,
        text: summaryText || `${widgetContent.title || apiName} rendered`,
      },
    ],
    _meta: metaObject,
  };
};

/**
 * Turns the deterministic search-recovery outcome into (a) a user-visible
 * subtitle on the widget and (b) a summary string for the model. Returns
 * undefined when the search behaved normally so the default text is used.
 */
const applyRecoveryMessaging = (
  widgetContent: any,
  recovery: SearchRecoveryInfo,
): string | undefined => {
  if (recovery.recovered) {
    const hasTerm = Boolean(recovery.effectiveQuery?.trim());
    const shown = hasTerm ? `"${recovery.effectiveQuery}"` : "the full catalog";

    widgetContent.subtitle = hasTerm
      ? `Closest matches for ${shown}`
      : "Showing all available options";

    return `No exact match was found for "${recovery.originalQuery}". Showing the closest available results (${shown}). Tell the user these are the nearest matches to their request rather than an exact match, and invite them to refine.`;
  }

  if (recovery.empty) {
    widgetContent.subtitle = "No matching results";
    const forPart = recovery.originalQuery
      ? ` for "${recovery.originalQuery}"`
      : "";

    return `No results were found${forPart} even after automatically trying broader and alternative keywords. Tell the user nothing matched, offer to show all available options, and suggest a different search term. Do not claim the request succeeded.`;
  }

  return undefined;
};

const toToolName = (name: string, index: number) => {
  const normalized = String(name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return normalized ? normalized : `api_${index + 1}`;
};

const PATH_PARAM_RE = /\{[^}]+\}|:[a-zA-Z0-9_-]+/;

const hasPathParam = (endpoint?: string): boolean =>
  PATH_PARAM_RE.test(String(endpoint || ""));

const isDetailEndpoint = (api: any): boolean => {
  const endpoint = String(api?.endpoint || "");
  const method = String(api?.method || "GET").toUpperCase();
  if (method !== "GET") return false;

  // Filter endpoints (e.g. /category/{categoryname}, /type/{type}) are NOT single item detail endpoints
  if (/\/category\/|\/categories\/|\/type\/|\/tag\/|\/department\/|\/filter\//i.test(endpoint)) {
    return false;
  }

  // Endpoints with ID parameters (e.g. /{id}, /:id, /{productId}, /{packageId}, /{itemId})
  const pathIdParamRegex =
    /\{(?:[a-zA-Z0-9_-]*id|_id|uuid|item|record|code|key)\}|:(?:[a-zA-Z0-9_-]*id|_id|uuid|item|record|code|key)\b/i;
  if (pathIdParamRegex.test(endpoint)) {
    return true;
  }

  // Or name explicitly indicates detail / single item inspection
  const name = String(api?.name || "").toLowerCase();
  if (name.includes("detail") || name.includes("get by id") || name.includes("single")) {
    return true;
  }

  // If path param exists and is NOT a category/type/slug/filter
  if (hasPathParam(endpoint) && !/category|type|status|genre|slug|filter/i.test(endpoint)) {
    return true;
  }

  return false;
};

const firstPathSegment = (endpoint?: string): string => {
  const clean = String(endpoint || "").split("?")[0];
  for (const segment of clean.split("/")) {
    const seg = segment.trim();
    if (seg && !PATH_PARAM_RE.test(seg)) return seg.toLowerCase();
  }
  return "";
};

/**
 * Normalizes an entity label so the list, get-by-id, update and delete tools
 * for the same thing group under one key. Uses the AI schema's entity when
 * present, otherwise the first static path segment. Crudely singularized so
 * "products" and "product" collapse together.
 */
const entityKeyFor = (api: any): string => {
  const fromSchema = String(api?.apiSchema?.entity || "")
    .trim()
    .toLowerCase();
  const base = fromSchema || firstPathSegment(api?.endpoint);
  return base.replace(/s$/, "");
};

/**
 * Groups a company's APIs by entity and records the registered tool id that
 * plays each CRUD role & facet role:
 * - GET + an ID path parameter => detail (get-by-id)
 * - POST => create
 * - PUT/PATCH => update
 * - DELETE => delete
 * - GET + category/filter parameter or /category/{x} path => categoryTool
 * - GET + /categories or /category-list or name has 'categories' => optionsTool
 */
const buildEntityToolDirectory = (
  apis: any[],
): Map<string, ActionToolLinks> => {
  const directory = new Map<string, ActionToolLinks>();

  // 1. First pass: find optionsTool (e.g. call_product_categories or call_product_category_list)
  let globalOptionsTool: string | undefined;
  apis.forEach((api, index) => {
    const endpoint = String(api?.endpoint || "").toLowerCase();
    const name = String(api?.name || "").toLowerCase();
    const method = String(api?.method || "GET").toUpperCase();
    if (method === "GET") {
      if (
        endpoint.includes("/categories") ||
        endpoint.includes("/category-list") ||
        endpoint.includes("/category_list") ||
        name.includes("categories") ||
        name.includes("category list")
      ) {
        if (!globalOptionsTool) {
          globalOptionsTool = toToolName(
            api.mcpToolName || api.name || `api_${index + 1}`,
            index,
          );
        }
      }
    }
  });

  // 2. Second pass: map CRUD and facet roles per entity
  apis.forEach((api, index) => {
    const key = entityKeyFor(api);
    if (!key) return;

    const toolId = toToolName(
      api.mcpToolName || api.name || `api_${index + 1}`,
      index,
    );
    const method = String(api.method || "GET").toUpperCase();
    const endpoint = String(api?.endpoint || "").toLowerCase();
    const roles = directory.get(key) || {};

    if (globalOptionsTool && !roles.optionsTool) {
      roles.optionsTool = globalOptionsTool;
    }

    if (method === "GET") {
      if (isDetailEndpoint(api)) {
        roles.detail = toolId;
      } else if (
        endpoint.includes("/category/") ||
        endpoint.includes("/categories/") ||
        endpoint.includes("/type/") ||
        endpoint.includes("/tag/") ||
        endpoint.includes("/filter/") ||
        (Array.isArray(api.params) &&
          api.params.some((p: any) =>
            /category|type|slug|genre|tag/i.test(p?.key || p?.inputName || ""),
          ))
      ) {
        if (!roles.categoryTool) {
          roles.categoryTool = toolId;
          const paramObj = Array.isArray(api.params)
            ? api.params.find((p: any) =>
                /category|type|slug|genre|tag/i.test(
                  p?.key || p?.inputName || "",
                ),
              )
            : undefined;
          roles.categoryParam =
            paramObj?.inputName ||
            String(paramObj?.key || "")
              .replace(/^\{|\}$/g, "")
              .trim() ||
            "categoryname";
        }
      } else {
        if (!roles.listTool) {
          roles.listTool = toolId;
        }
      }
    } else if (method === "POST") {
      if (!roles.create) roles.create = toolId;
    } else if (method === "PUT" || method === "PATCH") {
      if (!roles.update) roles.update = toolId;
    } else if (method === "DELETE") {
      if (!roles.delete) roles.delete = toolId;
    }

    directory.set(key, roles);
  });

  return directory;
};

/** The CRUD sibling tool ids that share this api's entity. */
const resolveActionTools = (
  api: any,
  directory: Map<string, ActionToolLinks>,
): ActionToolLinks => directory.get(entityKeyFor(api)) || {};
