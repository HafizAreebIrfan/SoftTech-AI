import { create } from "zustand";
import { useEffect } from "react";
import { useApp } from "@modelcontextprotocol/ext-apps/react";

import {
  McpToolResultPayload,
  McpWidgetState,
} from "../../domain/entities/GenericWidget";

export const TOOL_RESULT_NOTIFICATION = "ui/notifications/tool-result";
const STORAGE_KEY = "last_mcp_widget_result";
// Guard the localStorage fallback: a persisted result older than this is
// ignored on restore, so a widget the user has moved on from can't reappear
// after a server error → recovery. (#7)
const STORAGE_TTL_MS = 15 * 60 * 1000;

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
  const meta = payload._meta as Record<string, unknown> | undefined;
  if (sc && typeof sc === "object") {
    return Boolean(
      sc.data !== undefined ||
        sc.collection !== undefined ||
        sc.blocks !== undefined ||
        (meta && typeof meta === "object" && meta.widget) ||
        (Array.isArray(payload.content) &&
          payload.content.some(
            (c: any) => c.text && typeof c.text === "string" && c.text.length > 50,
          )),
    );
  }

  return true;
};

/**
 * True only when a result actually carries widget UI data: a `_meta.widget`
 * block, or `structuredContent` with `data`/`collection`/`blocks`. Text-only
 * or error results return false so we can drop the widget and let the host
 * show its text answer instead of persisting a data-less payload. (#7)
 */
export const hasWidgetPayload = (value: unknown): boolean => {
  if (!value || typeof value !== "object") return false;
  const payload = value as Record<string, unknown>;
  const meta = payload._meta as Record<string, unknown> | undefined;
  if (meta && typeof meta === "object" && meta.widget) return true;
  const sc = payload.structuredContent as Record<string, unknown> | undefined;
  if (sc && typeof sc === "object") {
    return (
      sc.data !== undefined ||
      sc.collection !== undefined ||
      sc.blocks !== undefined
    );
  }
  return false;
};

export const extractToolResult = (
  value: unknown,
): McpToolResultPayload | null => {
  if (!isMcpToolResultPayload(value)) {
    return null;
  }

  const rawObj = (value || {}) as unknown as Record<string, unknown>;
  const structuredContent = (rawObj.structuredContent || {}) as Record<
    string,
    unknown
  >;
  const meta = (rawObj._meta || {}) as Record<string, unknown>;
  const widgetMeta = (meta.widget || {}) as Record<string, unknown>;

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
    title:
      (widgetMeta.title as string) ||
      (structuredContent.title as string) ||
      "Widget",
    subtitle:
      (widgetMeta.subtitle as string) ||
      (structuredContent.subtitle as string),
    data:
      structuredContent.data !== undefined
        ? structuredContent.data
        : widgetMeta.data || {},
    collection: widgetMeta.collection || structuredContent.collection,
    capabilities: widgetMeta.capabilities || structuredContent.capabilities,
    pagination: widgetMeta.pagination || structuredContent.pagination,
    actions: widgetMeta.actions || structuredContent.actions,
    audience: widgetMeta.audience || structuredContent.audience,
    platformtype: widgetMeta.platformtype || structuredContent.platformtype,
    metadata: widgetMeta.metadata || structuredContent.metadata,
    ...widgetMeta,
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
    // Prefer the FRESH per-instance host tool output over our own persisted
    // widgetState, so a reopened / newly-mounted widget shows its own result
    // instead of the last one we saved (fixes cross-widget contamination). (#7)
    const bootstrap =
      (window as any).__SOFTTECH_AI_WIDGET_BOOTSTRAP__ ||
      (window as any).openai?.toolOutput ||
      (window as any).openai?.widgetState;

    const extracted = extractToolResult(bootstrap);
    if (extracted) return extracted;

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Freshness-stamped envelope { savedAt, payload }: ignore stale entries so
      // a widget the user has moved on from can't reappear on restore. (#7)
      if (
        parsed &&
        typeof parsed === "object" &&
        "savedAt" in parsed &&
        "payload" in parsed
      ) {
        if (Date.now() - Number((parsed as any).savedAt) > STORAGE_TTL_MS) {
          return null;
        }
        return extractToolResult((parsed as any).payload);
      }
      // Legacy bare payload (saved before the envelope existed).
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
        // Freshness-stamped so getInitialToolResult can expire stale restores.
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ savedAt: Date.now(), payload }),
        );
        if ((window as any).openai?.setWidgetState) {
          const prev = (window as any).openai.widgetState || {};
          // Merge into (don't replace) host widgetState, and clear the shared
          // TableBlock modal keys so a new result never reopens a stale table
          // detail. payload keys (structuredContent/content/_meta) don't
          // collide with TableBlock's records/selectedRecord/... keys. (#7)
          (window as any).openai.setWidgetState({
            ...prev,
            ...payload,
            selectedRecord: null,
            editingRecord: null,
            isCreating: false,
          });
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

if (typeof window !== "undefined") {
  (window as any).__MCP_WIDGET_STORE__ = useMcpWidgetStore;
}

export const useMcpToolResult = () => {
  const toolResult = useMcpWidgetStore((state) => state.toolResult);
  const setToolResult = useMcpWidgetStore((state) => state.setToolResult);
  const resetToolResult = useMcpWidgetStore((state) => state.resetToolResult);

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
        // Text-only / error result → drop any widget so the host shows its
        // text answer instead of a stale or empty UI. (#7)
        if (!hasWidgetPayload(result)) {
          resetToolResult();
          return;
        }
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

      if (!hasWidgetPayload(message.params)) {
        // Text-only / error result → drop any widget so the host shows text. (#7)
        resetToolResult();
        return;
      }

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
  }, [setToolResult, resetToolResult]);

  return toolResult;
};
