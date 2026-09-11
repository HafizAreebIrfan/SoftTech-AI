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
import { mcpRequestContext } from "../../../../adapters/http/controllers/mcp/mcptransportlayer";
import { generateMcpDescription } from "./mcpDescriptionGenerator";

// We will extract the HTTP and execution logic into this new file in the next step
import {
  callRegisteredApi,
  isUserAuthRequiredNotice,
  sanitizeResponseBody,
} from "./apihandler";
import { SearchRecoveryInfo, STOPWORDS, toggleNumber } from "./searchrecovery";

/**
 * Entity-agnostic extraction of the primary record array from normalized
 * widgetContent. Never keys off entity/industry/company names: it honors the
 * analyzer's collection.dataPath (single-segment leaf only — a nested dataPath's
 * cleaned array is collapsed to a top-level leaf key by the normalizer while the
 * original nested copy is left uncleaned, so we must not dot-walk it), then
 * falls back to the first array-of-objects property, then any array. Returns
 * null for a single record or scalar payload (nothing to iterate over).
 */
const getRecordsArray = (
  widgetContent: any,
): { array: any[]; ownerKey?: string } | null => {
  const data = widgetContent?.data;
  if (data === null || data === undefined) return null;
  if (Array.isArray(data)) return { array: data };
  if (typeof data !== "object") return null;

  // (a) analyzer-declared data path — leaf segment as a top-level array key
  const dataPath = String(widgetContent?.collection?.dataPath || "").trim();
  const leaf = dataPath.includes(".")
    ? dataPath.split(".").pop() || ""
    : dataPath;
  if (leaf && Array.isArray(data[leaf])) {
    return { array: data[leaf], ownerKey: leaf };
  }

  // (b) first property whose value is an array of objects
  for (const [key, val] of Object.entries(data as Record<string, any>)) {
    if (
      Array.isArray(val) &&
      val.some((v) => v && typeof v === "object" && !Array.isArray(v))
    ) {
      return { array: val, ownerKey: key };
    }
  }

  // (c) first array property of any kind
  for (const [key, val] of Object.entries(data as Record<string, any>)) {
    if (Array.isArray(val)) return { array: val, ownerKey: key };
  }

  return null;
};

/**
 * Extracts pure business data records from normalized widgetContent for
 * structuredContent. Unwraps common collection wrappers via getRecordsArray;
 * a single-record or scalar payload is returned as-is.
 */
const extractCleanData = (widgetContent: any): any => {
  const found = getRecordsArray(widgetContent);
  return found ? found.array : widgetContent?.data;
};

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

    const toolDescription = generateMcpDescription(api, company);
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

    const authStrategy = (company as any).authStrategy;
    const isOauthConfigured =
      authStrategy?.strategyType === "oauth2" ||
      Boolean(authStrategy?.authorizationServer) ||
      Boolean(authStrategy?.authorizationEndpoint) ||
      api.authType === "oauth_user" ||
      api.authType === "oauth2" ||
      api.authType === "oauth";

    const isToolAuthRequired = Boolean(
      api.requiresAuth ||
      api.authType === "oauth_user" ||
      api.authType === "bearer" ||
      api.authType === "apikey" ||
      (method !== "GET" && isOauthConfigured)
    );

    const scopes = Array.isArray(authStrategy?.scopes) && authStrategy.scopes.length > 0
      ? authStrategy.scopes
      : (Array.isArray(api.oauth?.scopes) && api.oauth.scopes.length > 0 ? api.oauth.scopes : ["read", "write"]);

    const securitySchemes: any[] = isOauthConfigured
      ? (isToolAuthRequired ? [{ type: "oauth2", scopes }] : [{ type: "noauth" }, { type: "oauth2", scopes }])
      : [{ type: "noauth" }];

    // Registration-gated deep links the company opted into. Passed to the
    // normalizer so it can surface the enabled ones in widget metadata; the
    // widget renders each redirect button only when its URL is present.
    const checkoutLinks = authStrategy
      ? {
          hasGlobalCheckout: authStrategy.hasGlobalCheckout,
          globalCheckoutUrl: authStrategy.globalCheckoutUrl,
          hasProductPages: authStrategy.hasProductPages,
          shopCatalogUrl: authStrategy.shopCatalogUrl,
          productItemUrlTemplate: authStrategy.productItemUrlTemplate,
        }
      : undefined;

    registerAppTool(
      server,
      toolName,
      {
        title: api.name || `API ${index + 1}`,
        description: toolDescription,
        inputSchema: customInputSchema,
        outputSchema: genericWidgetOutputSchema,
        securitySchemes,
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
      } as any,
      async (input: any, extra: any) => {
        try {
          const store = mcpRequestContext.getStore();
          const req = extra?.req || store?.req;
          const authHeader = store?.authHeader || req?.headers?.authorization;

          console.log(`[MCP Tool Invocation] → Executing "${toolName}" (${api.name || apiId}) for "${company.companyName}"`, {
            hasAuthHeader: Boolean(authHeader),
            authHeaderPreview: authHeader ? `${authHeader.substring(0, 18)}...` : "NONE",
            sessionId: store?.sessionId || extra?.sessionId || "(none)",
            inputArgs: input,
          });

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
              undefined,
              true,
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
            (api as any).streamUrl,
            checkoutLinks,
          );

          const summaryText = applyRecoveryMessaging(widgetContent, recovery);

          // Narrow a padded result set down to what the user actually asked for
          // (e.g. an API that returned every city because it couldn't map the
          // requested city to its opaque id). Skipped when search recovery has
          // already made a deliberate breadth decision, to avoid double-filtering.
          const relevanceNote =
            !recovery.recovered && !recovery.empty
              ? applyRelevanceFilter(widgetContent, {
                  userRawPrompt,
                  inferredIntent,
                  entity:
                    widgetContent.collection?.entity ||
                    api.apiSchema?.entity ||
                    api.name,
                })
              : undefined;
          const finalSummary = summaryText || relevanceNote;

          // Search matched nothing and recovery could only fall back to the
          // full, unfiltered catalog. Don't render an irrelevant list — point
          // the model at the sibling category/options tool so it can pivot
          // using the user's own term instead of presenting the whole catalog.
          const pivotNote = buildSearchPivot(recovery, actionTools, toolName);
          if (pivotNote) {
            console.log(
              `[MCP Tool Response] "${toolName}" search for "${recovery.originalQuery}" matched nothing; pivoting model to sibling tool(s) instead of the full catalog.`
            );
            return {
              content: [{ type: "text" as const, text: pivotNote }],
              structuredContent: {
                title: String(widgetContent.title || api.name || "Results"),
                data: [],
                total: 0,
              },
            };
          }

          const hasRecords = checkHasValidRecords(widgetContent);
          const entityLabel =
            widgetContent.collection?.entity ||
            api.apiSchema?.entity ||
            api.name ||
            "items";

          // If no valid records found (e.g. empty search / 0 items), return text-only so ChatGPT answers in chat without empty widgets
          if (!hasRecords) {
            console.log(
              `[MCP Tool Response] No valid records for "${toolName}" — suppressing widget UI to prevent empty widgets. Returning text-only.`
            );
            return {
              content: [
                {
                  type: "text" as const,
                  text:
                    finalSummary ||
                    `No ${entityLabel} found matching the search criteria from ${company.companyName}.`,
                },
              ],
              structuredContent: {
                title: String(widgetContent.title || api.name || "Results"),
                data: [],
                total: 0,
              },
            };
          }

          // Suppress duplicate widgets in the same session
          const sessionKey = store?.sessionId || extra?.sessionId || companyId;
          const signature = getWidgetDataSignature(widgetContent);

          if (signature && isDuplicateWidget(sessionKey, `${toolName}:${signature}`)) {
            console.log(
              `[MCP Tool Response] Suppressed duplicate widget for "${toolName}" — already displayed in session ${sessionKey}.`
            );
            const cleanData = extractCleanData(widgetContent);
            return {
              content: [
                {
                  type: "text" as const,
                  text: `The matching ${entityLabel} from ${company.companyName} are already displayed in the widget above.`,
                },
              ],
              structuredContent: {
                title: String(widgetContent.title || api.name || "Results"),
                data: cleanData,
                total:
                  typeof widgetContent.collection?.total === "number"
                    ? widgetContent.collection.total
                    : Array.isArray(cleanData)
                      ? cleanData.length
                      : 1,
              },
            };
          }

          return buildMcpSuccessResult(
            widgetContent,
            api.name || `API ${index + 1}`,
            company,
            resourceUri,
            method,
            finalSummary,
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
              undefined,
              true,
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

          // Fail-safe: on a genuine service failure, return a TEXT-ONLY result
          // with no structuredContent and no widget template. With nothing to
          // render, the host hides the widget and shows this text instead of a
          // broken/empty UI (Apps SDK: "with none, there's nothing to render").
          const errorText = [translation.userMessage, translation.actionSuggestion]
            .filter(Boolean)
            .join(" ");

          return {
            content: [
              {
                type: "text" as const,
                text:
                  errorText ||
                  "The service is temporarily unavailable. Please try again shortly.",
              },
            ],
            structuredContent: {
              title: String(api.name || "Error"),
              data: { error: sanitizedErrorMessage },
            },
            isError: true,
          };
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

const buildMcpSuccessResult = (
  widgetContent: any,
  apiName: string,
  company: ICompany,
  resourceUri?: string,
  method = "GET",
  summaryText?: string,
  isAuthChallenge = false,
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
    // Background UI engine configuration for widget iframe:
    widget: {
      title: widgetContent.title,
      subtitle: widgetContent.subtitle,
      collection: widgetContent.collection,
      capabilities: widgetContent.capabilities,
      pagination: widgetContent.pagination,
      actions: widgetContent.actions,
      audience: widgetContent.audience,
      platformtype: widgetContent.platformtype,
      metadata: widgetContent.metadata,
    },
  };

  if (isAuthChallenge) {
    const resourceMetadataUrl = `https://softtech-ai.onrender.com/mcp/${company.mcpSlug || ""}/.well-known/oauth-protected-resource`;
    metaObject["mcp/www_authenticate"] = [
      `Bearer resource_metadata="${resourceMetadataUrl}", error="insufficient_scope", error_description="Account authorization is required to access ${company.companyName}"`,
    ];
  }

  // Extract pure, clean data records for structuredContent:
  const cleanData = extractCleanData(widgetContent);

  // Clean structuredContent: only clean business data is exposed to ChatGPT & user
  const cleanStructuredContent: Record<string, any> = {
    title: String(widgetContent.title || apiName || "Results"),
    ...(widgetContent.subtitle ? { subtitle: widgetContent.subtitle } : {}),
    data: cleanData,
    ...(typeof widgetContent.collection?.total === "number"
      ? { total: widgetContent.collection.total }
      : Array.isArray(cleanData)
        ? { total: cleanData.length }
        : {}),
  };

  return {
    structuredContent: cleanStructuredContent,
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

/**
 * When deterministic search recovery could only return results by dropping the
 * query entirely (the user's term matched nothing, so the API returned its full,
 * unfiltered catalog), rendering that catalog would show data unrelated to the
 * request. If a sibling category/options tool exists for this entity, this
 * returns a model-facing instruction to pivot to it using the user's ORIGINAL
 * term — so ChatGPT makes the correct follow-up call instead of presenting the
 * whole list. Returns undefined when no pivot applies (normal results, a real
 * relaxed term, or no sibling tool to pivot to).
 *
 * Generic across every company/industry: the term is whatever the user typed
 * (recovery.originalQuery, sourced from this tool's own search input), and the
 * targets are real registered sibling tool names resolved from HTTP method +
 * path shape — never a hardcoded category/entity/company vocabulary.
 */
const buildSearchPivot = (
  recovery: SearchRecoveryInfo,
  actionTools: ActionToolLinks,
  currentTool: string,
): string | undefined => {
  // Only the collapse-to-full-catalog outcome has a blank effectiveQuery; every
  // other recovered outcome carries a real/parenthetical query and is relevant.
  if (!recovery.recovered || recovery.effectiveQuery?.trim()) return undefined;

  const term = String(recovery.originalQuery || "").trim();
  if (!term) return undefined;

  // Never pivot back to the tool we're already in (avoids a self-loop).
  const categoryTool =
    actionTools.categoryTool && actionTools.categoryTool !== currentTool
      ? actionTools.categoryTool
      : undefined;
  const optionsTool =
    actionTools.optionsTool && actionTools.optionsTool !== currentTool
      ? actionTools.optionsTool
      : undefined;

  if (!categoryTool && !optionsTool) return undefined;

  const categoryParam = actionTools.categoryParam || "category";

  const steps: string[] = [];
  if (categoryTool) {
    steps.push(
      `call the \`${categoryTool}\` tool with ${categoryParam}="${term}" (the term may be a category rather than free text)`,
    );
  }
  if (optionsTool) {
    steps.push(
      categoryTool
        ? `if that returns nothing, call the \`${optionsTool}\` tool to list the available options and retry with the closest one to "${term}"`
        : `call the \`${optionsTool}\` tool to list the available options, then retry with the closest one to "${term}"`,
    );
  }

  return (
    `A text search for "${term}" found no direct matches, so only the full unfiltered list is available — do not present it as the answer. ` +
    `Instead, ${steps.join(", and ")}. ` +
    `Do not tell the user these are matches for "${term}"; use the follow-up tool result to answer.`
  );
};

/**
 * True when `re` (a word-boundary token regex) matches some scalar VALUE in the
 * record. Scans string/number fields and descends one level into nested objects
 * and arrays. Skips identifier keys (id / _id / *id) and media/link keys so
 * opaque foreign keys and URLs never produce a spurious match. Generic across
 * every company/entity — it looks at field shape, never field names.
 */
const recordMatchesToken = (value: any, re: RegExp, depth = 0): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === "string" || typeof value === "number") {
    return re.test(String(value));
  }
  if (depth > 1) return false;
  if (Array.isArray(value)) {
    return value.some((item) => recordMatchesToken(item, re, depth + 1));
  }
  if (typeof value === "object") {
    for (const [key, val] of Object.entries(value as Record<string, any>)) {
      const k = key.toLowerCase();
      if (k === "id" || k === "_id" || k.endsWith("id")) continue;
      if (/image|thumbnail|photo|url|link|icon/.test(k)) continue;
      if (recordMatchesToken(val, re, depth + 1)) return true;
    }
  }
  return false;
};

/**
 * Writes a trimmed record array back into widgetContent in its original shape
 * and reconciles the precomputed aggregates so header counts stay honest.
 * Returns false (leaving widgetContent untouched) for shapes it can't safely
 * rewrite. Only ever called with a positive, non-empty subset.
 */
const writeBackRecords = (
  widgetContent: any,
  ownerKey: string | undefined,
  filtered: any[],
): boolean => {
  if (Array.isArray(widgetContent.data)) {
    widgetContent.data = filtered;
  } else if (
    ownerKey &&
    !ownerKey.includes(".") &&
    widgetContent.data &&
    typeof widgetContent.data === "object"
  ) {
    widgetContent.data = { ...widgetContent.data, [ownerKey]: filtered };
  } else {
    return false;
  }

  // metrics/charts/pagination were derived from the FULL set by the normalizer
  // and ride into _meta.widget; drop them so a trimmed list never shows a stale
  // "Total: 24" header or a 24-row chart. total is corrected to the subset.
  if (widgetContent.collection && typeof widgetContent.collection === "object") {
    widgetContent.collection.total = filtered.length;
    delete widgetContent.collection.metrics;
    delete widgetContent.collection.charts;
  }
  delete widgetContent.pagination;

  return true;
};

/**
 * Conservative, entity-agnostic relevance narrowing.
 *
 * Many upstream APIs filter on opaque ids the model can't supply (e.g. a
 * `locationId` cuid the user named only as "karachi"), so the call comes back
 * padded with irrelevant rows. This trims the set to rows matching the
 * DISCRIMINATING tokens in the user's phrasing — a token counts only when it
 * matches at least one row but NOT all of them, so it genuinely partitions the
 * set. Tokens that match every row (entity/category words) or no row
 * (filler/typos) are ignored; if nothing discriminates, the data is left
 * unchanged. The result is therefore always a non-empty proper subset of the
 * API's own rows, or the original set — it never empties or fabricates.
 *
 * Only runs when the widget holds the complete result set (not a page window)
 * and never touches single-record detail views. Returns a short model-facing
 * note when it trimmed, else undefined.
 */
const applyRelevanceFilter = (
  widgetContent: any,
  ctx: { userRawPrompt?: string; inferredIntent?: string; entity?: unknown },
): string | undefined => {
  const found = getRecordsArray(widgetContent);
  if (!found || found.array.length < 2) return undefined;
  const records = found.array;

  // Hold-complete-set gate: never trim a window of a larger, paged result —
  // reporting a low count over a partial set would mislead.
  const collTotal = widgetContent.collection?.total;
  if (typeof collTotal === "number" && collTotal > records.length) {
    return undefined;
  }
  const totalPages = widgetContent.pagination?.totalPages;
  if (typeof totalPages === "number" && totalPages > 1) return undefined;

  const promptText = `${ctx.userRawPrompt || ""} ${ctx.inferredIntent || ""}`
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ");
  if (!promptText.trim()) return undefined;

  // The entity noun describes the whole set (e.g. "cars"), so it must never act
  // as a filter token — drop it and its singular/plural variant.
  const entityWords = new Set<string>();
  for (const w of String(ctx.entity || "")
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)) {
    entityWords.add(w);
    const toggled = toggleNumber(w);
    if (toggled) entityWords.add(toggled.toLowerCase());
  }

  const tokens = Array.from(
    new Set(
      promptText
        .split(/\s+/)
        .map((t) => t.trim())
        .filter((t) => t.length >= 3)
        .filter((t) => !STOPWORDS.has(t))
        .filter((t) => !entityWords.has(t)),
    ),
  );
  if (tokens.length === 0) return undefined;

  // Keep only tokens that PARTITION the set (match some rows, not all). Each
  // token also matches via its singular/plural variant to kill number mismatch.
  const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const discriminators: RegExp[] = [];

  for (const token of tokens) {
    const variants = [token];
    const toggled = toggleNumber(token);
    if (toggled && toggled.toLowerCase() !== token) {
      variants.push(toggled.toLowerCase());
    }
    const re = new RegExp(`\\b(?:${variants.map(escape).join("|")})\\b`, "i");

    let count = 0;
    for (const r of records) if (recordMatchesToken(r, re)) count++;
    if (count >= 1 && count < records.length) discriminators.push(re);
  }

  if (discriminators.length === 0) return undefined;

  const filtered = records.filter((r) =>
    discriminators.every((re) => recordMatchesToken(r, re)),
  );
  if (filtered.length === 0 || filtered.length === records.length) {
    return undefined;
  }

  if (!writeBackRecords(widgetContent, found.ownerKey, filtered)) {
    return undefined;
  }

  widgetContent.subtitle = `Showing ${filtered.length} of ${records.length} matching your request`;
  return `Filtered the ${records.length} returned result(s) down to the ${filtered.length} relevant to the user's request. Present only these as the matches and do not mention the ones that were filtered out.`;
};

/**
 * Inspects normalized widgetContent to determine if it actually contains
 * meaningful business records.
 * Returns false when 0 records are found (e.g. empty search array, collection.total === 0),
 * suppressing empty widgets so ChatGPT narrates the answer in chat instead.
 */
const checkHasValidRecords = (widgetContent: any): boolean => {
  if (!widgetContent) return false;
  const d = widgetContent.data;
  if (d === null || d === undefined) return false;

  // 1. Explicit collection total
  if (
    widgetContent.collection &&
    typeof widgetContent.collection.total === "number"
  ) {
    if (widgetContent.collection.total <= 0) return false;
  }

  // 2. Collection array (generic, entity-agnostic — no hardcoded key names)
  const found = getRecordsArray(widgetContent);
  if (found) return found.array.length > 0;

  // 3. Single object: reject empty/error messages, else require meaningful keys
  if (typeof d === "object") {
    if (
      typeof d.message === "string" &&
      /no\s+(records|items|results|data|found)/i.test(d.message)
    ) {
      return false;
    }
    if (d.error || d.notFound) {
      return false;
    }

    const meaningfulKeys = Object.keys(d).filter(
      (k) =>
        !k.startsWith("$") &&
        !["__v", "_id", "status", "success"].includes(k),
    );
    if (meaningfulKeys.length === 0) return false;

    return true;
  }

  return true;
};

/**
 * Generates a lightweight signature for widget content data to detect and prevent
 * duplicate widgets within the same conversation session.
 */
const getWidgetDataSignature = (widgetContent: any): string | null => {
  const found = getRecordsArray(widgetContent);
  if (found) {
    if (found.array.length === 0) return null;
    return found.array
      .map((item: any) => item?.id || item?._id || item?.$title || JSON.stringify(item))
      .sort()
      .join("|");
  }

  const d = widgetContent?.data;
  if (d && typeof d === "object") {
    const id = d.id || d._id || d.$title;
    if (id) return `item:${id}`;
  }

  return null;
};

interface SessionWidgetEntry {
  signature: string;
  timestamp: number;
}
const recentSessionWidgets = new Map<string, SessionWidgetEntry[]>();

const isDuplicateWidget = (sessionKey: string, signature: string): boolean => {
  const now = Date.now();
  const TTL = 3 * 60 * 1000; // 3 minutes cache

  const entries = (recentSessionWidgets.get(sessionKey) || []).filter(
    (e) => now - e.timestamp < TTL
  );

  const found = entries.some((e) => e.signature === signature);
  if (!found) {
    entries.push({ signature, timestamp: now });
    recentSessionWidgets.set(sessionKey, entries);
  }
  return found;
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
