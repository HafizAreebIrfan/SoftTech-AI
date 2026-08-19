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

  if (!("structuredContent" in payload) && !("content" in payload)) {
    return false;
  }

  const sc = payload.structuredContent as Record<string, unknown> | undefined;
  if (sc && typeof sc === "object") {
    return Boolean(
      sc.data !== undefined ||
        sc.collection !== undefined ||
        sc.blocks !== undefined ||
        (Array.isArray(payload.content) &&
          payload.content.some(
            (c: any) => c.text && typeof c.text === "string" && c.text.length > 50,
          )),
    );
  }

  return true;
};

const extractToolResult = (value: unknown): McpToolResultPayload | null => {
  if (!isMcpToolResultPayload(value)) {
    return null;
  }

  const rawObj = (value || {}) as unknown as Record<string, unknown>;
  const structuredContent = (rawObj.structuredContent || {}) as Record<
    string,
    unknown
  >;

  let summaryText = "";
  if (Array.isArray(rawObj.content) && rawObj.content.length > 0) {
    const textItem = rawObj.content.find(
      (c: any) =>
        c &&
        c.type === "text" &&
        typeof c.text === "string" &&
        c.text.length > 0,
    );
    if (textItem && textItem.text) {
      summaryText = textItem.text;
    }
  }

  const mergedStructuredContent = {
    title: (structuredContent.title as string) || "Widget",
    data: structuredContent.data || {},
    ...structuredContent,
    ...(summaryText ? { summary: summaryText } : {}),
  };

  return {
    structuredContent: mergedStructuredContent as any,
    content: rawObj.content as any,
    _meta: rawObj._meta as any,
  };
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
  subViewHistory: [],

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
      subViewHistory: [],
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
      subViewHistory: [],
    });
  },

  pushSubView: (view) => {
    set((state) => ({
      subViewHistory: [...state.subViewHistory, view],
    }));
  },

  popSubView: () => {
    set((state) => ({
      subViewHistory: state.subViewHistory.slice(0, -1),
    }));
  },

  clearSubViews: () => {
    set({ subViewHistory: [] });
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
