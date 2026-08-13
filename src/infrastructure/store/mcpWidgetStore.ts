import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useEffect } from "react";
import { useApp } from "@modelcontextprotocol/ext-apps/react";

import {
  McpToolResultPayload,
  OpenAiGlobals,
  McpWidgetState,
} from "../../domain/entities/GenericWidget";

export const TOOL_RESULT_NOTIFICATION = "ui/notifications/tool-result";
const WIDGET_SNAPSHOT_KEY = "softtech-ai:mcp-widget-snapshot";
let lastSyncedWidgetState: string | null = null;

const extractToolResultPayload = (
  value: unknown,
): McpToolResultPayload | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const maybeSnapshot = value as Record<string, unknown>;

  if ("structuredContent" in maybeSnapshot || "content" in maybeSnapshot) {
    return maybeSnapshot as unknown as McpToolResultPayload;
  }

  if ("toolResult" in maybeSnapshot) {
    const nested = (maybeSnapshot as { toolResult?: unknown }).toolResult;
    if (nested && typeof nested === "object") {
      return nested as unknown as McpToolResultPayload;
    }
  }

  return maybeSnapshot as unknown as McpToolResultPayload;
};

const syncWidgetState = (payload: McpToolResultPayload | null) => {
  if (typeof window === "undefined") return;
  if (!window.openai?.setWidgetState) return;

  try {
    const serialized = payload ? JSON.stringify(payload) : "null";
    if (serialized === lastSyncedWidgetState) {
      return;
    }

    lastSyncedWidgetState = serialized;
    window.openai.setWidgetState(
      payload as unknown as Record<string, unknown> | null,
    );
  } catch {
    // Ignore host widget-state write failures and keep local fallbacks.
  }
};

const readBootstrapSnapshot = (): McpToolResultPayload | null => {
  if (typeof window === "undefined") return null;

  const bootstrapSnapshot = window.__SOFTTECH_AI_WIDGET_BOOTSTRAP__;
  if (bootstrapSnapshot && typeof bootstrapSnapshot === "object") {
    return extractToolResultPayload(bootstrapSnapshot);
  }

  return null;
};

const readWidgetSnapshot = (): McpToolResultPayload | null => {
  if (typeof window === "undefined") return null;

  const bootstrapSnapshot = readBootstrapSnapshot();
  if (bootstrapSnapshot) {
    return bootstrapSnapshot;
  }

  const widgetState = window.openai?.widgetState;
  const widgetSnapshot = extractToolResultPayload(widgetState);
  if (widgetSnapshot) {
    return widgetSnapshot;
  }

  try {
    const rawSnapshot = window.localStorage.getItem(WIDGET_SNAPSHOT_KEY);
    if (rawSnapshot) {
      try {
        const parsed = JSON.parse(rawSnapshot) as McpToolResultPayload;
        if (parsed && typeof parsed === "object") {
          return parsed;
        }
      } catch {
        // Ignore malformed snapshots and fall back to host state.
      }
    }
  } catch {
    // Ignore storage access failures in embedded contexts.
  }

  const toolOutput = window.openai?.toolOutput;
  if (toolOutput && typeof toolOutput === "object") {
    return toolOutput as McpToolResultPayload;
  }

  return null;
};

const writeWidgetSnapshot = (payload: McpToolResultPayload | null) => {
  if (typeof window === "undefined") return;

  if (!payload) {
    try {
      window.localStorage.removeItem(WIDGET_SNAPSHOT_KEY);
    } catch {
      // Ignore storage access failures in embedded contexts.
    }
    return;
  }

  try {
    window.localStorage.setItem(WIDGET_SNAPSHOT_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage access failures in embedded contexts.
  }
};

export const useMcpWidgetStore = create<McpWidgetState>()(
  persist(
    (set) => ({
      toolResult: readWidgetSnapshot(),
      setToolResult: (payload) => {
        console.log("[MCP STORE DEBUG] setToolResult called with:", payload);
        set({ toolResult: payload });
        writeWidgetSnapshot(payload);
        syncWidgetState(payload);
      },
      resetToolResult: () => {
        console.log("[MCP STORE DEBUG] resetToolResult called");
        set({ toolResult: null });
        writeWidgetSnapshot(null);
        syncWidgetState(null);
      },
    }),
    {
      name: "mcp-widget-single-store",
      merge: (_persistedState, currentState) => currentState,
    },
  ),
);

export const useMcpToolResult = () => {
  const { toolResult, setToolResult } = useMcpWidgetStore();

  useApp({
    appInfo: {
      name:
        toolResult?.structuredContent?.title ||
        (toolResult as any)?.title ||
        "Widget",
      version: "1.0.0",
    },

    capabilities: {},

    onAppCreated: (app) => {
      try {
        console.log("[MCP STORE DEBUG] Ext-Apps App created:", app);
        app.ontoolresult = (result) => {
          console.log("[MCP STORE DEBUG] Ext-Apps ontoolresult received:", result);
          const payload = (result as unknown as McpToolResultPayload) ?? null;
          if (payload) {
            setToolResult(payload);
          }
        };
      } catch (e) {
        console.error("[MCP STORE DEBUG] Ext-Apps bridge failed:", e);
      }
    },
  });

  useEffect(() => {
    console.log("[MCP STORE DEBUG] Mounting useMcpToolResult hook. Current state:", toolResult);

    // 1. Immediate check on mount
    const initialSnapshot = readWidgetSnapshot();
    if (initialSnapshot) {
      console.log("[MCP STORE DEBUG] Restored widget snapshot on mount:", initialSnapshot);
      if (!toolResult) {
        setToolResult(initialSnapshot);
      } else {
        syncWidgetState(toolResult);
      }
    } else {
      console.log("[MCP STORE DEBUG] No widget snapshot available on mount:", window.openai);
    }

    // 2. Short polling fallback (to catch late host injection in ChatGPT webview)
    let pollCount = 0;
    const pollInterval = setInterval(() => {
      pollCount++;
      const currentSnapshot = readWidgetSnapshot();
      if (currentSnapshot) {
        console.log(`[MCP STORE DEBUG] Late widget snapshot detected at poll #${pollCount}:`, currentSnapshot);
        if (!toolResult) {
          setToolResult(currentSnapshot);
        }
        clearInterval(pollInterval);
      } else if (pollCount >= 10) {
        clearInterval(pollInterval);
      }
    }, 200);

    // 3. Listen to CustomEvent "openai:set_globals"
    const handleGlobals = (event: Event) => {
      const customEvent = event as CustomEvent<{ globals?: OpenAiGlobals }>;
      const output = customEvent.detail?.globals?.toolOutput;
      console.log("[MCP STORE DEBUG] Event openai:set_globals fired with output:", output);
      if (output && typeof output === "object") {
        setToolResult(extractToolResultPayload(output));
      }
    };

    // 4. Listen to postMessage from host window
    const handlePostMessage = (event: MessageEvent) => {
      try {
        if (event.data && typeof event.data === "object") {
          if (event.data.type === "openai:set_globals" || event.data.toolOutput) {
            const output = event.data.toolOutput || event.data.globals?.toolOutput;
            if (output && typeof output === "object") {
              console.log("[MCP STORE DEBUG] postMessage toolOutput received:", output);
              setToolResult(extractToolResultPayload(output));
            }
          }
        }
      } catch {
        // ignore cross-origin postMessage parse failures
      }
    };

    window.addEventListener("openai:set_globals", handleGlobals);
    window.addEventListener("message", handlePostMessage);

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener("openai:set_globals", handleGlobals);
      window.removeEventListener("message", handlePostMessage);
    };
  }, [setToolResult]);

  return toolResult;
};
