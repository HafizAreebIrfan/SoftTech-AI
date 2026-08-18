import { create } from "zustand";
import { useEffect } from "react";
import { useApp } from "@modelcontextprotocol/ext-apps/react";

import {
  McpToolResultPayload,
  McpWidgetState,
} from "../../domain/entities/GenericWidget";

export const TOOL_RESULT_NOTIFICATION = "ui/notifications/tool-result";
const STORAGE_KEY = "last_mcp_widget_result";

const isMcpToolResultPayload = (
  value: unknown,
): value is McpToolResultPayload => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const payload = value as Record<string, unknown>;

  return "structuredContent" in payload || "content" in payload;
};

const extractToolResult = (value: unknown): McpToolResultPayload | null => {
  if (isMcpToolResultPayload(value)) {
    return value;
  }

  return null;
};

const getInitialToolResult = (): McpToolResultPayload | null => {
  if (typeof window === "undefined") return null;

  try {
    const bootstrap =
      (window as any).__SOFTTECH_AI_WIDGET_BOOTSTRAP__ ||
      (window as any).openai?.widgetState ||
      (window as any).openai?.toolOutput;

    const extracted = extractToolResult(bootstrap);
    if (extracted) return extracted;

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return extractToolResult(parsed);
    }
  } catch (e) {
    console.error("[MCP Widget] Failed restoring state:", e);
  }

  return null;
};

export const useMcpWidgetStore = create<McpWidgetState>((set) => ({
  toolResult: getInitialToolResult(),

  setToolResult: (payload) => {
    if (!payload) {
      return;
    }

    console.log("[MCP Widget] ui/notifications/tool-result received:", payload);

    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
        if ((window as any).openai?.setWidgetState) {
          (window as any).openai.setWidgetState(payload);
        }
      }
    } catch (e) {
      console.warn("[MCP Widget] Save state error:", e);
    }

    set({
      toolResult: payload,
    });
  },

  resetToolResult: () => {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (e) {
      // ignore
    }
    set({
      toolResult: null,
    });
  },
}));

export const useMcpToolResult = () => {
  const toolResult = useMcpWidgetStore((state) => state.toolResult);
  const setToolResult = useMcpWidgetStore((state) => state.setToolResult);

  useApp({
    appInfo: {
      name: toolResult?.structuredContent?.title || "SoftTech AI Widget",
      version: "1.0.0",
    },

    capabilities: {},

    onAppCreated: (app) => {
      console.log("[MCP Widget] App created");

      app.ontoolresult = (result) => {
        console.log("[MCP Widget] ontoolresult:", result);
        const payload = extractToolResult(result);
        if (payload) {
          setToolResult(payload);
        }
      };
    },
  });

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;

      if (!message || typeof message !== "object") {
        return;
      }

      if (
        message.jsonrpc !== "2.0" ||
        message.method !== TOOL_RESULT_NOTIFICATION
      ) {
        return;
      }

      console.log("[MCP Widget] JSON-RPC tool result notification:", message);

      const payload = extractToolResult(message.params);

      if (!payload) {
        console.warn(
          "[MCP Widget] Invalid tool result params:",
          message.params,
        );
        return;
      }

      setToolResult(payload);
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [setToolResult]);

  return toolResult;
};
