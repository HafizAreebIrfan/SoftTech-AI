import { registerAppTool } from "@modelcontextprotocol/ext-apps/server";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ICompany } from "../../../../domain/types/company.types";
import { genericWidgetOutputSchema } from "../../Schemas/OutputSchema/genericwidgetoutputschema";
import { normalizeApiResponseToWidget } from "../DynamicDomain/genericwidgetnormalizer";
import { translateApiError } from "../../errors/errorTranslator";
import { buildCustomMcpInputSchema } from "../../Schemas/InputSchema/genericwidgetinputschema";
import { formatCheckoutToolResult } from "../CheckoutHandle/index";

// We will extract the HTTP and execution logic into this new file in the next step
import {
  callRegisteredApi,
  isUserAuthRequiredNotice,
  sanitizeResponseBody,
} from "./apihandler";

export const registerCompanyApiTools = (
  server: McpServer,
  company: ICompany,
) => {
  const apis = company.apis ?? [];
  const companyId = String((company as any)._id || company.companyName || "");

  apis.forEach((api, index) => {
    const apiId = String((api as any)._id || api.name || `api_${index + 1}`);
    const toolName = toToolName(
      api.mcpToolName || api.name || `api_${index + 1}`,
      index,
    );

    const configuredInputFields = [
      ...(Array.isArray(api.params) ? api.params : []),
      ...(Array.isArray(api.body) ? api.body : []),
    ];

    const customInputSchema = buildCustomMcpInputSchema(configuredInputFields);

    const toolDescription =
      api.mcpDescription ||
      `Calls ${company.companyName} -> ${
        api.name || `API ${index + 1}`
      } and returns the API result as an interactive widget.`;
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

          // Delegate the actual HTTP fetching to the Secondary Adapter
          const rawResponse = await callRegisteredApi(
            companyId,
            apiId,
            api,
            input,
            req,
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
              mobileDeepLinkUrl: (api as any).mobileDeepLinkUrl,
            },
            platformType: currentPlatform as any,
          });

          // 2. Handle Successful Data Widget
          const effectiveAudience =
            api.audience || company.uiPreference?.audienceDefault || "customer";

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
          );

          return buildMcpSuccessResult(
            widgetContent,
            api.name || `API ${index + 1}`,
            company,
            resourceUri,
            method,
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
        text: `${widgetContent.title || apiName} rendered`, // Note: You can embed raw data here later if you want the LLM to read it clearly
      },
    ],
    _meta: metaObject,
  };
};

const toToolName = (name: string, index: number) => {
  const normalized = String(name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return normalized ? normalized : `api_${index + 1}`;
};
