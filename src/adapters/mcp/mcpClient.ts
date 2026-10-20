import { env } from "../../infrastructure/config/env";

export interface McpExecutionResult {
  success: boolean;
  source: "mcp-server" | "direct-api";
  latencyMs: number;
  toolName: string;
  statusCode?: number;
  requestPayload: any;
  responsePayload: any;
  rawResponseText?: string;
  structuredData?: any[];
  singleRecord?: any;
  textMessage?: string;
  error?: string;
}

export interface McpToolCallParams {
  mcpSlug?: string;
  companyId?: string;
  apiIndex?: number;
  toolName: string;
  prompt: string;
  endpoint?: string;
  method?: string;
  headers?: any[];
  params?: any[];
  authType?: string;
  credentials?: string;
  customArgs?: Record<string, any>;
}

const getBaseUrl = (): string => {
  return env.isDev ? env.apiBaseUrlLocal : env.apiBaseUrl;
};

/**
 * Extracts key-value parameter pairs from tool query params or prompt text
 */
const buildToolArguments = (
  prompt: string,
  paramsList?: any[],
  customArgs?: Record<string, any>,
): Record<string, any> => {
  const args: Record<string, any> = {
    user_raw_prompt: prompt,
    inferred_intent: prompt.slice(0, 40),
    ...customArgs,
  };

  // If the tool has defined default query params, include them
  if (Array.isArray(paramsList)) {
    for (const p of paramsList) {
      if (p && p.key) {
        args[p.key] = p.value !== undefined ? p.value : "";
      }
    }
  }

  return args;
};

/**
 * Helper to read SSE Streamable HTTP response chunk
 */
const readSseResponse = async (
  response: Response,
  timeoutMs = 8000,
): Promise<{ rawText: string; jsonRpcResult: any }> => {
  if (!response.body) {
    const text = await response.text();
    return { rawText: text, jsonRpcResult: parseJsonRpc(text) };
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  const readPromise = new Promise<{ rawText: string; jsonRpcResult: any }>(
    async (resolve, reject) => {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          // Look for data: event line in the SSE stream
          const match = buffer.match(/data:\s*(\{[\s\S]*?\})(?:\r?\n|$)/);
          if (match && match[1]) {
            try {
              const parsed = JSON.parse(match[1]);
              reader.cancel().catch(() => {});
              resolve({ rawText: buffer, jsonRpcResult: parsed });
              return;
            } catch {
              // chunk may be partial, keep reading
            }
          }
        }
        resolve({ rawText: buffer, jsonRpcResult: parseJsonRpc(buffer) });
      } catch (err) {
        reject(err);
      }
    },
  );

  const timeoutPromise = new Promise<{ rawText: string; jsonRpcResult: any }>(
    (_, reject) => setTimeout(() => reject(new Error("MCP Response timeout")), timeoutMs),
  );

  return Promise.race([readPromise, timeoutPromise]);
};

const parseJsonRpc = (raw: string): any => {
  try {
    const clean = raw.replace(/^data:\s*/gm, "").trim();
    return JSON.parse(clean);
  } catch {
    return null;
  }
};

/**
 * Primary function: Executes real MCP tool call against live backend MCP server
 * using Model Context Protocol JSON-RPC 2.0 over Streamable HTTP transport.
 */
export const runLiveMcpSimulation = async (
  params: McpToolCallParams,
): Promise<McpExecutionResult> => {
  const startTime = Date.now();
  const baseUrl = getBaseUrl();
  const slug = (params.mcpSlug || "").trim().toLowerCase();

  const toolArguments = buildToolArguments(
    params.prompt,
    params.params,
    params.customArgs,
  );

  // If slug exists, attempt true MCP JSON-RPC protocol execution
  if (slug) {
    try {
      const mcpUrl = `${baseUrl}/mcp/${encodeURIComponent(slug)}`;

      // Step 1: Initialize MCP session
      const initPayload = {
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2024-11-05",
          capabilities: {},
          clientInfo: {
            name: "SoftTechMcpInspectorClient",
            version: "1.0.0",
          },
        },
      };

      const initRes = await fetch(mcpUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json, text/event-stream",
        },
        body: JSON.stringify(initPayload),
      });

      if (!initRes.ok) {
        throw new Error(`MCP Initialize returned HTTP ${initRes.status}`);
      }

      const sessionId =
        initRes.headers.get("mcp-session-id") ||
        initRes.headers.get("Mcp-Session-Id");

      // Read init body to free socket
      if (initRes.body) {
        const initReader = initRes.body.getReader();
        await initReader.read().catch(() => {});
        initReader.cancel().catch(() => {});
      }

      // Step 2: Confirm notifications/initialized
      const notifHeaders: Record<string, string> = {
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
      };
      if (sessionId) {
        notifHeaders["mcp-session-id"] = sessionId;
      }

      const sessionQuery = sessionId ? `?sessionId=${encodeURIComponent(sessionId)}` : "";

      await fetch(`${mcpUrl}${sessionQuery}`, {
        method: "POST",
        headers: notifHeaders,
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "notifications/initialized",
        }),
      }).catch(() => {});

      // Step 3: Call tools/call
      const callPayload = {
        jsonrpc: "2.0",
        id: 2,
        method: "tools/call",
        params: {
          name: params.toolName,
          arguments: toolArguments,
        },
      };

      const callHeaders: Record<string, string> = {
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
      };
      if (sessionId) {
        callHeaders["mcp-session-id"] = sessionId;
      }

      const callRes = await fetch(`${mcpUrl}${sessionQuery}`, {
        method: "POST",
        headers: callHeaders,
        body: JSON.stringify(callPayload),
      });

      const { rawText, jsonRpcResult } = await readSseResponse(callRes, 10000);
      const latencyMs = Date.now() - startTime;

      if (jsonRpcResult?.error) {
        return {
          success: false,
          source: "mcp-server",
          latencyMs,
          toolName: params.toolName,
          statusCode: callRes.status,
          requestPayload: callPayload,
          responsePayload: jsonRpcResult,
          rawResponseText: rawText,
          error: jsonRpcResult.error.message || "MCP tool returned an error",
        };
      }

      const result = jsonRpcResult?.result;
      const structuredData =
        result?.structuredContent?.data ||
        (Array.isArray(result?.content) ? null : result?.data);
      const singleRecord =
        !Array.isArray(structuredData) && typeof structuredData === "object"
          ? structuredData
          : null;
      const dataArray = Array.isArray(structuredData) ? structuredData : null;

      const textMsg =
        result?.content?.find((c: any) => c.type === "text")?.text ||
        result?.message ||
        `Tool "${params.toolName}" executed successfully.`;

      return {
        success: true,
        source: "mcp-server",
        latencyMs,
        toolName: params.toolName,
        statusCode: 200,
        requestPayload: callPayload,
        responsePayload: jsonRpcResult,
        rawResponseText: rawText,
        structuredData: dataArray || (singleRecord ? [singleRecord] : []),
        singleRecord: singleRecord || dataArray?.[0],
        textMessage: textMsg,
      };
    } catch (mcpErr: any) {
      console.warn(
        `[MCP Client] MCP server invocation failed, attempting direct execution fallback:`,
        mcpErr,
      );
    }
  }

  // Fallback: Direct API execution if endpoint is available
  if (params.endpoint) {
    return await executeDirectApiCall(params, startTime);
  }

  return {
    success: false,
    source: "mcp-server",
    latencyMs: Date.now() - startTime,
    toolName: params.toolName,
    requestPayload: { tool: params.toolName, arguments: toolArguments },
    responsePayload: null,
    error: "No active MCP slug or endpoint configured to execute.",
  };
};

/**
 * Direct API Call Fallback: directly calls the registered endpoint with genuine HTTP request
 */
export const executeDirectApiCall = async (
  params: McpToolCallParams,
  startTime = Date.now(),
): Promise<McpExecutionResult> => {
  let url = params.endpoint || "";
  const method = (params.method || "GET").toUpperCase();
  const headersObj: Record<string, string> = {
    Accept: "application/json",
  };

  if (params.headers && Array.isArray(params.headers)) {
    for (const h of params.headers) {
      if (h && h.key && h.value) headersObj[h.key] = h.value;
    }
  }

  if (params.authType === "Bearer Token" && params.credentials) {
    headersObj["Authorization"] = `Bearer ${params.credentials}`;
  } else if (params.authType === "API Key" && params.credentials) {
    headersObj["x-api-key"] = params.credentials;
  }

  // Attach query params if GET
  if (method === "GET" && params.params && Array.isArray(params.params)) {
    const urlObj = new URL(url, window.location.origin);
    for (const p of params.params) {
      if (p && p.key && p.value) {
        urlObj.searchParams.set(p.key, p.value);
      }
    }
    url = urlObj.toString();
  }

  const reqDetails = {
    url,
    method,
    headers: headersObj,
  };

  try {
    const response = await fetch(url, {
      method,
      headers: headersObj,
    });

    const latencyMs = Date.now() - startTime;
    const text = await response.text();
    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = { raw: text };
    }

    let items: any[] = [];
    if (Array.isArray(parsed)) {
      items = parsed;
    } else if (parsed && typeof parsed === "object") {
      if (Array.isArray(parsed.data)) items = parsed.data;
      else if (Array.isArray(parsed.items)) items = parsed.items;
      else if (Array.isArray(parsed.results)) items = parsed.results;
      else if (Array.isArray(parsed.cars)) items = parsed.cars;
      else if (Array.isArray(parsed.products)) items = parsed.products;
      else items = [parsed];
    }

    return {
      success: response.ok,
      source: "direct-api",
      latencyMs,
      toolName: params.toolName,
      statusCode: response.status,
      requestPayload: reqDetails,
      responsePayload: parsed,
      rawResponseText: text,
      structuredData: items,
      singleRecord: items[0],
      textMessage: response.ok
        ? `Successfully called ${params.toolName} directly at ${url}`
        : `Endpoint returned HTTP ${response.status}`,
      error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`,
    };
  } catch (err: any) {
    return {
      success: false,
      source: "direct-api",
      latencyMs: Date.now() - startTime,
      toolName: params.toolName,
      requestPayload: reqDetails,
      responsePayload: null,
      error: err.message || "Failed to reach endpoint directly (possible CORS or network error)",
    };
  }
};
