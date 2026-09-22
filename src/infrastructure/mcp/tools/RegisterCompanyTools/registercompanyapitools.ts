import { registerAppTool } from "@modelcontextprotocol/ext-apps/server";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ICompany } from "../../../../domain/types/company.types";
import { genericWidgetOutputSchema } from "../../Schemas/OutputSchema/genericwidgetoutputschema";
import {
  normalizeApiResponseToWidget,
  ActionToolLinks,
  isLocationEntity,
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
 * Strips all $-prefixed widget UI metadata keys (e.g. $title, $price, $status, $image, $description)
 * so structuredContent exposes only clean, pure business data to the LLM and user.
 */
const stripInternalWidgetKeys = (val: any): any => {
  if (Array.isArray(val)) {
    return val.map(stripInternalWidgetKeys);
  }
  if (val && typeof val === "object") {
    const clean: Record<string, any> = {};
    for (const [k, v] of Object.entries(val)) {
      if (k.startsWith("$")) continue;
      clean[k] = stripInternalWidgetKeys(v);
    }
    return clean;
  }
  return val;
};

/**
 * Extracts pure business data records from normalized widgetContent for
 * structuredContent. Unwraps common collection wrappers via getRecordsArray;
 * a single-record or scalar payload is returned as-is.
 */
export const extractCleanData = (widgetContent: any): any => {
  const found = getRecordsArray(widgetContent);
  const raw = found ? found.array : widgetContent?.data;
  return stripInternalWidgetKeys(raw);
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
  // Ensure guaranteed unique tool names across all registered APIs
  const usedToolNames = new Set<string>();
  const apiToolNames: string[] = apis.map((api, index) => {
    const base = toToolName(
      api.mcpToolName || api.name || `api_${index + 1}`,
      index,
    );
    let name = base;
    let count = 2;
    while (usedToolNames.has(name)) {
      name = `${base}_${count}`;
      count++;
    }
    usedToolNames.add(name);
    return name;
  });

  const toolDirectory = buildEntityToolDirectory(apis, apiToolNames);

  apis.forEach((api, index) => {
    const apiId = String((api as any)._id || api.name || `api_${index + 1}`);
    const toolName = apiToolNames[index];

    const actionTools = resolveActionTools(api, toolDirectory);
    const isLocationTool = isLocationEntity(api.apiSchema?.entity as string | undefined, api.name, api.endpoint);

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

    const isWidgetEnabled =
      api.isWidgetEnabled !== undefined
        ? Boolean(api.isWidgetEnabled)
        : (api as any).uiConfig?.uiEnabled !== false;

    const isMapViewEnabled =
      api.isMapViewEnabled !== undefined
        ? Boolean(api.isMapViewEnabled)
        : Boolean((api as any).uiConfig?.mapEnabled);

    const isAppTool = isWidgetEnabled || isMapViewEnabled;

    const toolHandler = async (input: any, extra: any) => {
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
              isCheckout: isLocationTool ? false : Boolean((api as any).isCheckout),
              webCheckoutUrl: isLocationTool ? undefined : (api as any).webCheckoutUrl,
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

          // Per-item date-availability verdicts (e.g. "is car X free next
          // week?") are ANSWERS, not browsable collections — rendering them
          // as a generic widget would replace the rich catalog/grid the user
          // is looking at with a near-empty single-record card. Return the
          // verdict as text (no _meta → no widget) so the model narrates it.
          // Fully generic: detected from the registered endpoint's shape
          // (GET + item path param + availability path/name), never an
          // entity/industry name.
          if (isAvailabilityEndpoint(api)) {
            const verdict = describeAvailabilityVerdict(
              processedResponse,
              input,
            );
            if (verdict) {
              console.log(
                `[MCP Tool Response] "${toolName}" is a per-item availability check — returning a text verdict instead of a widget.`,
              );
              return {
                content: [{ type: "text" as const, text: verdict }],
                structuredContent: {
                  title: String(api.name || "Availability"),
                  data: (processedResponse as any)?.data ?? processedResponse ?? null,
                  total: 0,
                },
              };
            }
          }

          // Helper tools (availability, stock-check, coupon validation, etc.)
          // support main tools (listing, detail, search) but should never
          // render their own widget. When the current tool is registered as a
          // helper, return text-only so the model narrates the answer without
          // a generic single-record card. Data-driven: flagged during tool
          // registration by buildEntityToolDirectory, not by entity/industry
          // name.
          if (actionTools.helperTools?.has(toolName)) {
            console.log(
              `[MCP Tool Response] "${toolName}" is a helper tool — returning text-only (no widget).`,
            );
            return {
              content: [{ type: "text" as const, text: `${api.name || toolName} result received.` }],
              structuredContent: {
                title: String(api.name || toolName),
                data: (processedResponse as any)?.data ?? processedResponse ?? null,
                total: 0,
              },
            };
          }

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

          // Classify tool purpose from HTTP method + endpoint shape + response
          // data. This drives the frontend's layout routing and commerce guard.
          const toolPurpose = classifyToolPurpose(api, processedResponse);
          if (widgetContent.collection) {
            widgetContent.collection.purpose = toolPurpose;
          }

          let locationSummary: string | undefined;
          if (toolPurpose === "location" || isLocationTool) {
            const rawRecs = Array.isArray(widgetContent.data)
              ? widgetContent.data
              : widgetContent.data && typeof widgetContent.data === "object"
                ? [widgetContent.data]
                : [];
            const sampleRec: any = rawRecs[0];
            const nestedItems =
              sampleRec?.cars ||
              sampleRec?.products ||
              sampleRec?.items ||
              sampleRec?.vehicles ||
              sampleRec?.inventory;
            if (Array.isArray(nestedItems) && nestedItems.length > 0) {
              const itemLabels = nestedItems
                .slice(0, 5)
                .map((it: any) => {
                  const name = (it.make && it.model ? `${it.make} ${it.model}` : it.name || it.title || it.model || it.id || "").trim();
                  const price = it.dailyRate || it.price || it.rate || it.cost;
                  const curr = it.currency || "PKR";
                  return price ? `${name} (${curr} ${price}/day)` : name;
                })
                .filter(Boolean)
                .join(", ");
              const more = nestedItems.length > 5 ? ` and ${nestedItems.length - 5} more` : "";
              locationSummary = `${sampleRec.name || "Branch"} in ${sampleRec.city || "the branch"} has ${nestedItems.length} available items: ${itemLabels}${more}.`;
            }
          }

          const summaryText = locationSummary || applyRecoveryMessaging(widgetContent, recovery);

          // Narrow a padded result set down to what the user actually asked for
          // (e.g. an API that returned every city because it couldn't map the
          // requested city to its opaque id). Runs on normal results AND on the
          // recovery outcome where the query was dropped entirely and the API
          // returned its full catalog — that fallback is exactly the padded set
          // this filter exists to trim (a user term like a city still names a
          // subset, so the discriminating-token partition applies). Still
          // skipped for the other recovery outcomes, which already carry a real
          // relaxed query, and for empty results.
          const isFullCatalogFallback =
            Boolean(recovery.recovered) && !recovery.effectiveQuery?.trim();

          // 1. First apply generic, schema-driven attribute filter based on explicit tool inputs
          // (e.g. city, seats, category, color, brand, price, limit)
          const structuredFilterNote = applyGenericAttributeFilter(
            widgetContent,
            input,
            api.apiSchema,
          );

          // 2. Second apply keyword / text relevance partition filtering
          // ONLY run relevance filtering when recovery fell back to the entire raw catalog (isFullCatalogFallback === true).
          // For regular successful searches, the upstream API results are trusted and must NOT be sliced down.
          const relevanceNote =
            isFullCatalogFallback
              ? applyRelevanceFilter(widgetContent, {
                  userRawPrompt,
                  entity:
                    widgetContent.collection?.entity ||
                    api.apiSchema?.entity ||
                    api.name,
                })
              : undefined;

          // A successful trim already produced the relevant subset — it IS the
          // answer to what the user asked — so it wins over the generic
          // "nearest matches, invite to refine" recovery messaging.
          const finalSummary = structuredFilterNote || relevanceNote || summaryText;

          // Search matched nothing and recovery could only fall back to the
          // full, unfiltered catalog. If the relevance filter could NOT trim
          // that catalog to the user's term (no sibling tool either), don't
          // render the irrelevant list — point the model at the sibling
          // category/options tool so it can pivot using the user's own term.
          // When the trim DID succeed, the trimmed subset is the answer and
          // the pivot is skipped (the follow-up tool would only re-ask the
          // same thing).
          const pivotNote = relevanceNote
            ? undefined
            : buildSearchPivot(recovery, actionTools, toolName);
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

          // A discovery/options tool (e.g. a categories/options list) exists so
          // the model can pick a valid value for a follow-up call — its output is
          // selection metadata, not a user-facing result. Return it text-only so
          // no widget renders; only actual-result tools (search/list/category/
          // detail) show UI. Generic: keyed off the optionsTool role, not names.
          if (actionTools.optionsTool && toolName === actionTools.optionsTool) {
            const options = extractCleanData(widgetContent);
            const names = Array.isArray(options)
              ? Array.from(
                  new Set(options.map(optionLabel).filter(Boolean)),
                ).join(", ")
              : "";
            console.log(
              `[MCP Tool Response] "${toolName}" is a discovery/options tool — returning options as text-only (no widget).`
            );
            return {
              content: [
                {
                  type: "text" as const,
                  text: names
                    ? `Available ${entityLabel} options: ${names}. Choose the one closest to the user's request and call the matching list or category tool with it — do not present this list to the user as the final answer.`
                    : finalSummary ||
                      `No ${entityLabel} options are available from ${company.companyName}.`,
                },
              ],
              structuredContent: {
                title: String(widgetContent.title || api.name || "Options"),
                data: options,
                total: Array.isArray(options) ? options.length : options ? 1 : 0,
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

          const isWidgetEnabled =
            api.isWidgetEnabled !== undefined
              ? api.isWidgetEnabled
              : (api as any).uiConfig?.uiEnabled !== false;

          const isMapViewEnabled =
            api.isMapViewEnabled !== undefined
              ? api.isMapViewEnabled
              : Boolean((api as any).uiConfig?.mapEnabled);

          return buildMcpSuccessResult(
            widgetContent,
            api.name || `API ${index + 1}`,
            company,
            resourceUri,
            method,
            finalSummary,
            false,
            isWidgetEnabled,
            { mapEnabled: isMapViewEnabled },
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
      };

      if (isAppTool) {
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
          toolHandler,
        );
      } else {
        server.registerTool(
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
          } as any,
          toolHandler,
        );
      }
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
  uiEnabled?: boolean,
  extraMetadata?: Record<string, any>,
) => {
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
    ...(widgetContent.pagination ? { pagination: widgetContent.pagination } : {}),
  };

  const isMapOnly = uiEnabled === false && Boolean(extraMetadata?.mapEnabled);

  // If widgets are disabled for this tool (and map view is not enabled),
  // return pure text and structured data without ANY _meta.
  // This ensures ChatGPT operates as a standard text/structured MCP tool without provisioning or rendering an empty iframe container.
  if (uiEnabled === false && !isMapOnly) {
    return {
      structuredContent: cleanStructuredContent,
      content: [
        {
          type: "text" as const,
          text:
            summaryText ||
            `${widgetContent.title || apiName} results retrieved successfully.`,
        },
      ],
    };
  }

  if (isMapOnly && widgetContent.collection) {
    cleanStructuredContent.collection = {
      ...widgetContent.collection,
      layout: "mapcatalog",
    };
  }

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
      collection: isMapOnly && widgetContent.collection
        ? { ...widgetContent.collection, layout: "mapcatalog" }
        : widgetContent.collection,
      capabilities: widgetContent.capabilities,
      pagination: widgetContent.pagination,
      actions: widgetContent.actions,
      audience: widgetContent.audience,
      platformtype: widgetContent.platformtype,
      metadata: {
        ...widgetContent.metadata,
        uiEnabled: isMapOnly ? false : true,
        ...(isMapOnly ? { mapOnly: true, mapEnabled: true } : {}),
        ...(company.googleMapsApiKey ? { googleMapsApiKey: company.googleMapsApiKey } : {}),
        ...extraMetadata,
      },
    },
  };

  if (isAuthChallenge) {
    const resourceMetadataUrl = `https://softtech-ai.onrender.com/mcp/${company.mcpSlug || ""}/.well-known/oauth-protected-resource`;
    metaObject["mcp/www_authenticate"] = [
      `Bearer resource_metadata="${resourceMetadataUrl}", error="insufficient_scope", error_description="Account authorization is required to access ${company.companyName}"`,
    ];
  }

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
 * Renders a per-item date-availability tool's response as a short text verdict
 * the model can narrate. Reads generic availability signals from the response
 * shape (a boolean under an availability-ish key, remaining-quantity counters,
 * conflict counters, date/range arrays) — never entity/industry names. Returns
 * undefined when the response carries no recognizable signal (the caller then
 * falls through to the normal widget path).
 */
const describeAvailabilityVerdict = (
  response: any,
  input?: Record<string, any>,
): string | undefined => {
  const data =
    response && typeof response === "object" && "data" in response
      ? (response.data ?? response)
      : response;
  const obj =
    data && typeof data === "object" && !Array.isArray(data) ? data : null;
  if (!obj) return undefined;

  // A boolean availability signal (available / isAvailable / free / open).
  const boolKey = Object.keys(obj).find(
    (k) =>
      typeof obj[k] === "boolean" &&
      /availab|free|open|bookab/i.test(k),
  );
  // Numeric counters (remainingQuantity / availableCount / slotsLeft / conflicts).
  const numEntries = Object.entries(obj).filter(
    ([k, v]) =>
      typeof v === "number" &&
      /remaining|availab|left|count|total|conflict|booked|slot/i.test(k),
  );

  if (boolKey === undefined && numEntries.length === 0) return undefined;

  const range: string[] = [];
  const start = String(input?.startDate || input?.start || input?.from || "");
  const end = String(input?.endDate || input?.to || "");
  if (/^\d{4}-\d{2}-\d{2}/.test(start)) range.push(start.slice(0, 10));
  if (/^\d{4}-\d{2}-\d{2}/.test(end)) range.push(end.slice(0, 10));

  const isAvailable = boolKey !== undefined ? Boolean(obj[boolKey]) : undefined;
  const conflictCount = numEntries.find(([k]) =>
    /conflict|booked/i.test(k),
  )?.[1] as number | undefined;
  const remaining = numEntries.find(([k]) =>
    /remaining|left/i.test(k),
  )?.[1] as number | undefined;

  const parts: string[] = [];
  if (isAvailable === true) parts.push("the item IS available");
  else if (isAvailable === false) parts.push("the item is NOT available for the requested dates");
  if (conflictCount !== undefined && conflictCount > 0)
    parts.push(`${conflictCount} conflicting booking(s) in that period`);
  if (remaining !== undefined)
    parts.push(`${remaining} unit(s) remaining`);

  const when = range.length === 2 ? ` for ${range[0]} to ${range[1]}` : "";
  return parts.length > 0
    ? `Availability check${when}: ${parts.join("; ")}. State this clearly to the user and suggest nearby free dates if it is not available.`
    : undefined;
};

/**
 * Best-effort human-readable label for one option/category item, used to render
 * a discovery/options tool's result as text. Handles a plain string/number or an
 * object (prefers common display keys, else the first non-id/non-media string).
 * Generic: keys off value shape + common label field names, never entity names.
 */
const optionLabel = (item: any): string => {
  if (item === null || item === undefined) return "";
  if (typeof item === "string" || typeof item === "number") {
    return String(item).trim();
  }
  if (typeof item === "object") {
    for (const key of ["name", "label", "title", "slug", "value", "category"]) {
      const v = (item as any)[key];
      if (typeof v === "string" && v.trim()) return v.trim();
      if (typeof v === "number") return String(v);
    }
    // Fallback: first non-id, non-media string value.
    for (const [key, v] of Object.entries(item as Record<string, any>)) {
      const k = key.toLowerCase();
      if (/id$/.test(k)) continue;
      if (/image|thumbnail|photo|url|link|icon/.test(k)) continue;
      if (typeof v === "string" && v.trim()) return v.trim();
    }
  }
  return "";
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
  if (depth > 0) return false; // Do not scan deep nested sub-objects like location descriptions
  if (Array.isArray(value)) {
    return value.some((item) => recordMatchesToken(item, re, depth + 1));
  }
  if (typeof value === "object") {
    for (const [key, val] of Object.entries(value as Record<string, any>)) {
      const k = key.toLowerCase();
      if (k === "id" || k === "_id" || k.endsWith("id")) continue;
      if (/image|thumbnail|photo|url|link|icon|location|address|branch|metadata/.test(k)) continue;
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
 * Generic, schema-driven in-memory attribute filtering.
 * Resolves any input parameter extracted by the tool (e.g. city, seats, category, color, brand, maxPrice, limit)
 * dynamically against the API schema (apiSchema.fields) and collection metadata (collection.fields)
 * or record properties, without hardcoding any domain- or industry-specific names.
 */
const getNestedValue = (obj: any, path: string): any => {
  if (!obj || typeof obj !== "object") return undefined;
  const parts = path.split(".");
  let current = obj;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    current = current[part];
  }
  return current;
};

const resolveRecordValue = (
  record: any,
  paramKey: string,
  schemaFields: any[] = [],
): any => {
  if (!record || typeof record !== "object") return undefined;
  const normKey = paramKey.toLowerCase().replace(/[^a-z0-9]/g, "");

  // 1. Try schema fields (from apiSchema.fields or collection.fields)
  if (Array.isArray(schemaFields) && schemaFields.length > 0) {
    const matchedField = schemaFields.find((f: any) => {
      const fKey = String(f.key || "").toLowerCase().replace(/[^a-z0-9]/g, "");
      const fPath = String(f.path || "").toLowerCase().replace(/[^a-z0-9]/g, "");
      const fLabel = String(f.label || "").toLowerCase().replace(/[^a-z0-9]/g, "");
      return (
        fKey === normKey ||
        fPath === normKey ||
        fPath.endsWith(normKey) ||
        fLabel === normKey
      );
    });

    if (matchedField?.path) {
      const val = getNestedValue(record, matchedField.path);
      if (val !== undefined && val !== null) return val;
    }
  }

  // 2. Direct property match on record
  if (record[paramKey] !== undefined && record[paramKey] !== null) {
    return record[paramKey];
  }

  // 3. Case-insensitive / normalized top-level key match
  for (const [k, v] of Object.entries(record)) {
    if (k.toLowerCase().replace(/[^a-z0-9]/g, "") === normKey) {
      if (v !== undefined && v !== null) return v;
    }
  }

  // 4. One-level nested object scan (e.g. record.location.city, record.address.city, record.details.color)
  for (const [parentKey, subObj] of Object.entries(record)) {
    if (
      subObj &&
      typeof subObj === "object" &&
      !Array.isArray(subObj) &&
      !parentKey.startsWith("$")
    ) {
      for (const [k, v] of Object.entries(subObj)) {
        if (k.toLowerCase().replace(/[^a-z0-9]/g, "") === normKey) {
          if (v !== undefined && v !== null) return v;
        }
      }
    }
  }

  return undefined;
};

const recordMatchesParam = (
  recordVal: any,
  inputVal: any,
  paramKey: string,
): boolean => {
  if (recordVal === undefined || recordVal === null) return false;
  const keyLower = paramKey.toLowerCase();

  // 1. String comparison
  if (typeof inputVal === "string") {
    const targetStr = inputVal.trim().toLowerCase();
    if (!targetStr) return true;

    if (Array.isArray(recordVal)) {
      return recordVal.some((item) =>
        String(item).toLowerCase().includes(targetStr),
      );
    }
    return String(recordVal).toLowerCase().includes(targetStr);
  }

  // 2. Numeric comparison
  if (
    typeof inputVal === "number" ||
    (!isNaN(Number(inputVal)) && inputVal !== "")
  ) {
    const targetNum = typeof inputVal === "number" ? inputVal : Number(inputVal);
    const recNum =
      typeof recordVal === "number"
        ? recordVal
        : parseFloat(String(recordVal).replace(/[^0-9.-]/g, ""));
    if (isNaN(recNum)) return true;

    // Minimum capacity / count / rating check
    if (
      /seat|capacit|min|guest|passenger|rating|score|qty|stock/i.test(keyLower)
    ) {
      return recNum >= targetNum;
    }
    // Maximum budget / cost / fee check
    if (/max|budget|price|cost|fee|rate/i.test(keyLower)) {
      return recNum <= targetNum;
    }
    // Default: exact equality
    return recNum === targetNum;
  }

  // 3. Boolean comparison
  if (typeof inputVal === "boolean") {
    return Boolean(recordVal) === inputVal;
  }

  return true;
};

export const applyGenericAttributeFilter = (
  widgetContent: any,
  input: any,
  apiSchema?: any,
): string | undefined => {
  if (!input || typeof input !== "object") return undefined;
  const found = getRecordsArray(widgetContent);
  if (!found || found.array.length === 0) return undefined;
  let records = found.array;
  const initialCount = records.length;
  const filterDescriptions: string[] = [];

  const schemaFields = [
    ...(Array.isArray(apiSchema?.fields) ? apiSchema.fields : []),
    ...(Array.isArray(widgetContent.collection?.fields)
      ? widgetContent.collection.fields
      : []),
  ];

  const SYSTEM_KEYS = new Set([
    "user_raw_prompt",
    "inferred_intent",
    "platformtype",
    "platformType",
    "params",
    "headers",
    "body",
  ]);

  // 1. Handle business attributes dynamically against schema and records FIRST
  for (const [key, val] of Object.entries(input)) {
    if (SYSTEM_KEYS.has(key) || key.startsWith("$")) continue;
    if (/^(limit|pagesize|page_size|count|take|perpage|per_page)$/i.test(key))
      continue;
    if (val === undefined || val === null || String(val).trim() === "") continue;
    if (typeof val === "object" && !Array.isArray(val)) continue;

    // Check if any record in the dataset possesses this attribute
    const hasField = records.some(
      (r) => resolveRecordValue(r, key, schemaFields) !== undefined,
    );
    if (!hasField) continue;

    const matched = records.filter((r) => {
      const recVal = resolveRecordValue(r, key, schemaFields);
      return recordMatchesParam(recVal, val, key);
    });

    if (matched.length < records.length) {
      records = matched;
      filterDescriptions.push(`${key}: ${val}`);
    }
  }

  // 2. Handle explicit limit / pagination LAST (after business attributes are filtered)
  for (const [key, val] of Object.entries(input)) {
    if (SYSTEM_KEYS.has(key) || key.startsWith("$")) continue;
    if (/^(limit|pagesize|page_size|count|take|perpage|per_page)$/i.test(key)) {
      const numLimit =
        typeof val === "number" ? val : parseInt(String(val || ""), 10);
      if (!isNaN(numLimit) && numLimit > 0 && records.length > numLimit) {
        records = records.slice(0, numLimit);
      }
    }
  }

  if (records.length !== initialCount) {
    writeBackRecords(widgetContent, found.ownerKey, records);
    if (widgetContent.collection) {
      widgetContent.collection.total = records.length;
    }
    const criteria =
      filterDescriptions.length > 0
        ? ` (${filterDescriptions.join(", ")})`
        : "";
    if (records.length > 0) {
      widgetContent.subtitle = `Showing ${records.length} matching your request${criteria}`;
      return `Filtered results to ${records.length} matching options${criteria}.`;
    } else {
      widgetContent.subtitle = `No matching options found${criteria}`;
      return `No results found matching your criteria${criteria}.`;
    }
  }

  return undefined;
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
 * Returns a short model-facing note when it trimmed, else undefined.
 */
const CONVERSATIONAL_STOPWORDS = new Set([
  "rental", "rentals", "rent", "trip", "trips", "booking", "bookings", "book",
  "reserve", "reservation", "reservations", "service", "services",
  "best", "good", "great", "cheap", "affordable", "luxury", "budget",
  "need", "want", "like", "looking", "please", "suggest", "find",
  "available", "availability", "option", "options", "item", "items",
  "product", "products", "order", "orders", "dates", "date", "from", "under"
]);

const applyRelevanceFilter = (
  widgetContent: any,
  ctx: { userRawPrompt?: string; inferredIntent?: string; entity?: unknown },
): string | undefined => {
  const found = getRecordsArray(widgetContent);
  if (!found || found.array.length < 2) return undefined;
  const records = found.array;

  const totalPages = widgetContent.pagination?.totalPages;
  if (typeof totalPages === "number" && totalPages > 1) return undefined;

  // Never use inferredIntent for word partitioning - only direct user words
  const promptText = (ctx.userRawPrompt || "")
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
        .filter((t) => !CONVERSATIONAL_STOPWORDS.has(t))
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

  // Score each record by how many discriminators it matches
  const scored = records.map((r) => {
    let score = 0;
    for (const re of discriminators) {
      if (recordMatchesToken(r, re)) score++;
    }
    return { record: r, score };
  });

  const maxScore = Math.max(...scored.map((s) => s.score));
  if (maxScore === 0) return undefined;

  // Filter to records matching the highest relevance score
  const filtered = scored
    .filter((s) => s.score === maxScore || (maxScore > 1 && s.score >= maxScore - 1))
    .map((s) => s.record);

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

/**
 * True for a per-item date-availability / booking-calendar endpoint (e.g.
 * /cars/{id}/availability?startDate&endDate, /rooms/{id}/calendar,
 * /items/{id}/slots). Detected from endpoint path + name shape — never an
 * entity or industry name — and required to carry a path item param so plain
 * list endpoints that merely mention "availability" (e.g. /available-cars)
 * are not captured.
 */
const isAvailabilityEndpoint = (api: any): boolean => {
  const endpoint = String(api?.endpoint || "");
  const method = String(api?.method || "GET").toUpperCase();
  if (method !== "GET") return false;
  if (!hasPathParam(endpoint)) return false;
  const name = String(api?.name || "").toLowerCase();
  return (
    /\/availability\b|\/availability[/?]|\/calendar|\/slots?\b|\/vacanc|\/bookings?\//i.test(
      endpoint,
    ) || /availability|calendar|vacanc|slots?\b/.test(name)
  );
};

const isDetailEndpoint = (api: any): boolean => {
  const endpoint = String(api?.endpoint || "");
  const method = String(api?.method || "GET").toUpperCase();
  if (method !== "GET") return false;

  // Filter endpoints (e.g. /category/{categoryname}, /type/{type}) are NOT single item detail endpoints
  if (/\/category\/|\/categories\/|\/type\/|\/tag\/|\/department\/|\/filter\//i.test(endpoint)) {
    return false;
  }

  // Availability / calendar endpoints are per-item SUB-resources, not the
  // record itself — they must never occupy the detail role (that would make
  // the widget's "View Details" call them instead of the real get-by-id).
  if (isAvailabilityEndpoint(api)) return false;

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

/**
 * Classifies the data purpose for a tool response. Data-driven: uses HTTP
 * method + endpoint path shape + response shape to determine whether the
 * result is browsable product data, user profile data, utility metadata,
 * a mutation action, or analytics. Never keys off entity/industry/company
 * names — only generic signals like path segments, field shapes, and
 * HTTP verbs.
 */
const classifyToolPurpose = (
  api: any,
  response: any,
): "product" | "profile" | "utility" | "action" | "analytics" | "location" => {
  const method = String(api?.method || "GET").toUpperCase();
  const endpoint = String(api?.endpoint || "").toLowerCase();
  const name = String(api?.name || "").toLowerCase();

  // 1. Mutations are always "action"
  if (method === "POST" || method === "PUT" || method === "PATCH" || method === "DELETE") {
    return "action";
  }

  // 2. Location / branch / shop endpoints → "location"
  if (
    /\/locations?\b|\/branch(es)?\b|\/shops?\b|\/stores?\b|\/warehouses?\b|\/offices?\b/i.test(endpoint) ||
    /locations?|branch(es)?|shops?|stores?|warehouse|office/i.test(name) ||
    /^(locations?|branches?|shops?|stores?)$/i.test(String(api?.apiSchema?.entity || ""))
  ) {
    return "location";
  }

  // 2. Profile / user / account endpoints → "profile"
  if (
    /\/user\b|\/profile|\/account|\/me\b|\/my\b|\/customer\b/i.test(endpoint) ||
    /profile|account|my\s|user\s|customer/i.test(name)
  ) {
    return "profile";
  }

  // 3. Analytics / spending / reports → "analytics"
  if (
    /\/analytics|\/spending|\/reports?|\/stats|\/insights|\/summary|\/dashboard/i.test(endpoint) ||
    /analytics|spending|report|stat|insight|summary/i.test(name)
  ) {
    return "analytics";
  }

  // 4. Commercial shape check (price + image or price) → "product"
  const data = response && typeof response === "object" && "data" in response
    ? response.data
    : response;
  const records = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
  if (records.length > 0) {
    const sample = records[0];
    if (sample && typeof sample === "object") {
      const hasPrice = Object.keys(sample).some(
        (k) => /price|amount|cost|fee|rate|fare|total/i.test(k),
      );
      const hasImage = Object.keys(sample).some(
        (k) => /image|photo|thumbnail|avatar|cover|picture|img|logo|banner|gallery/i.test(k),
      );
      if (hasPrice || hasImage) return "product";
    }
  }

  // 5. Utility / metadata / options / filters → "utility"
  if (
    /\/categories|\/category-list|\/options|\/filters?|\/tags?|\/genres?|\/brands?|\/departments?/i.test(endpoint) ||
    /category\s*list|options?\s*list|filter\s*list|tag\s*list/i.test(name) ||
    /^(categories|options|filters|tags|brands)$/i.test(name)
  ) {
    return "utility";
  }

  // 6. Review / rating endpoints → "utility" (not browsable products)
  if (
    /\/reviews?|\/ratings?|\/feedback|\/testimonials?/i.test(endpoint) ||
    /review|rating|feedback|testimonial/i.test(name)
  ) {
    return "utility";
  }

  // 7. Default: "product" for GET list endpoints (browsable data)
  return "product";
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
  apiToolNames?: string[],
): Map<string, ActionToolLinks> => {
  const directory = new Map<string, ActionToolLinks>();
  const getToolId = (api: any, index: number) =>
    apiToolNames?.[index] ||
    toToolName(api.mcpToolName || api.name || `api_${index + 1}`, index);

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
          globalOptionsTool = getToolId(api, index);
        }
      }
    }
  });

  // 2. Second pass: map CRUD and facet roles per entity
  apis.forEach((api, index) => {
    const key = entityKeyFor(api);
    if (!key) return;

    const toolId = getToolId(api, index);
    const method = String(api.method || "GET").toUpperCase();
    const endpoint = String(api?.endpoint || "").toLowerCase();
    const roles = directory.get(key) || {};

    if (globalOptionsTool && !roles.optionsTool) {
      roles.optionsTool = globalOptionsTool;
    }

    if (method === "GET") {
      if (isAvailabilityEndpoint(api)) {
        // Per-item date availability / booking calendar — its own role so the
        // widget's booking calendar and the model both get a dedicated tool.
        if (!roles.availability) roles.availability = toolId;
        // Mark as helper: availability checks support detail views but should
        // never render their own widget (text verdict only).
        if (!roles.helperTools) roles.helperTools = new Set();
        roles.helperTools.add(toolId);
      } else if (isDetailEndpoint(api)) {
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
