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

export const ACTIVE_COMPANY_KEY = "mcp_last_active_company";

export const sanitizeCompanyKey = (val: string): string => {
  return val.toLowerCase().trim().replace(/[^a-z0-9_-]/g, "_") || "default";
};

export const extractCompanyKey = (payload?: unknown): string => {
  if (typeof window !== "undefined") {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlCompany =
        params.get("companySlug") ||
        params.get("company") ||
        params.get("mcpSlug") ||
        params.get("companyId");
      if (urlCompany) {
        return sanitizeCompanyKey(urlCompany);
      }
    } catch {}
  }

  const raw = (payload || {}) as Record<string, any>;
  const sc = (raw.structuredContent || raw) as Record<string, any>;
  const meta = (sc.metadata ||
    raw._meta?.widget?.metadata ||
    raw._meta?.metadata ||
    {}) as Record<string, any>;
  const auth = (sc.authStrategy ||
    meta.authStrategy ||
    {}) as Record<string, any>;

  const candidate =
    meta.companySlug ||
    meta.mcpSlug ||
    sc.companySlug ||
    sc.mcpSlug ||
    meta.companyId ||
    meta.companyName ||
    auth.companySlug ||
    auth.companyName ||
    sc.companyName ||
    (typeof window !== "undefined" &&
      (window as any).__WIDGET_METADATA__?.companyName) ||
    "default";

  return sanitizeCompanyKey(String(candidate));
};

const getInitialToolResult = (): McpToolResultPayload | null => {
  if (typeof window === "undefined") return null;

  try {
    // 1. Prefer fresh per-instance host tool output
    const bootstrap =
      (window as any).__SOFTTECH_AI_WIDGET_BOOTSTRAP__ ||
      (window as any).openai?.toolOutput;

    const extractedBootstrap = extractToolResult(bootstrap);
    if (extractedBootstrap) return extractedBootstrap;

    // Determine current active company
    const activeCompanyKey =
      extractCompanyKey() ||
      localStorage.getItem(ACTIVE_COMPANY_KEY) ||
      "default";
    const companyVarName = `company_${activeCompanyKey}`;

    // 2. Check openai.widgetState isolated company variables
    const widgetState = (window as any).openai?.widgetState;
    if (widgetState && typeof widgetState === "object") {
      if (
        widgetState[companyVarName] &&
        typeof widgetState[companyVarName] === "object"
      ) {
        const compEntry = widgetState[companyVarName];
        const compPayload = compEntry?.payload || compEntry;
        const compExtracted = extractToolResult(compPayload);
        if (compExtracted) return compExtracted;
      }
      if (widgetState.companies && typeof widgetState.companies === "object") {
        const compPayload = widgetState.companies[activeCompanyKey];
        const compExtracted = extractToolResult(compPayload);
        if (compExtracted) return compExtracted;
      }
      // If widgetState has direct payload for the active company
      const directExtracted = extractToolResult(widgetState);
      if (directExtracted) {
        const payloadCompany = extractCompanyKey(directExtracted);
        if (payloadCompany === activeCompanyKey || activeCompanyKey === "default") {
          return directExtracted;
        }
      }
    }

    // 3. Check localStorage for this company's isolated key
    const companyStorageKey = `mcp_widget_result_${activeCompanyKey}`;
    const companySaved = localStorage.getItem(companyStorageKey);
    if (companySaved) {
      const parsed = JSON.parse(companySaved);
      if (
        parsed &&
        typeof parsed === "object" &&
        "savedAt" in parsed &&
        "payload" in parsed
      ) {
        if (Date.now() - Number(parsed.savedAt) <= STORAGE_TTL_MS) {
          return extractToolResult(parsed.payload);
        }
      } else {
        return extractToolResult(parsed);
      }
    }

    // 4. Fallback to legacy shared storage key if matching
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (
        parsed &&
        typeof parsed === "object" &&
        "savedAt" in parsed &&
        "payload" in parsed
      ) {
        if (Date.now() - Number((parsed as any).savedAt) <= STORAGE_TTL_MS) {
          return extractToolResult((parsed as any).payload);
        }
      } else {
        return extractToolResult(parsed);
      }
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
        const companyKey = extractCompanyKey(payload);
        const companyVarName = `company_${companyKey}`;
        const companyStorageKey = `mcp_widget_result_${companyKey}`;

        // Save company-scoped state in localStorage and track active company
        localStorage.setItem(
          companyStorageKey,
          JSON.stringify({ savedAt: Date.now(), companyKey, payload }),
        );
        localStorage.setItem(ACTIVE_COMPANY_KEY, companyKey);

        // Keep legacy shared key updated with active result as fallback
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ savedAt: Date.now(), companyKey, payload }),
        );

        if ((window as any).openai?.setWidgetState) {
          const prev = (window as any).openai.widgetState || {};
          const prevCompanies = prev.companies || {};

          // Store each company mcp widget state in its OWN dedicated variable/key
          // so ChatGPT model never conflates different companies or hallucinates stale data
          (window as any).openai.setWidgetState({
            ...prev,
            activeCompany: companyKey,
            [companyVarName]: {
              savedAt: Date.now(),
              companyKey,
              payload,
            },
            companies: {
              ...prevCompanies,
              [companyKey]: payload,
            },
            // Active view payload keys for host display
            structuredContent: payload.structuredContent,
            content: payload.content,
            _meta: payload._meta,
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
        const activeKey =
          localStorage.getItem(ACTIVE_COMPANY_KEY) || "default";
        localStorage.removeItem(`mcp_widget_result_${activeKey}`);
        localStorage.removeItem(STORAGE_KEY);

        if ((window as any).openai?.setWidgetState) {
          const prev = (window as any).openai.widgetState || {};
          const companyVarName = `company_${activeKey}`;
          const updatedCompanies = { ...(prev.companies || {}) };
          delete updatedCompanies[activeKey];

          const updatedState = { ...prev };
          delete updatedState[companyVarName];
          updatedState.companies = updatedCompanies;
          updatedState.structuredContent = null;
          updatedState.content = null;

          (window as any).openai.setWidgetState(updatedState);
        }
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

  updateActiveSubViewData: (data: unknown) => {
    set((state) => {
      if (state.subViewHistory.length === 0) return state;
      const lastIndex = state.subViewHistory.length - 1;
      const lastView = state.subViewHistory[lastIndex];
      const updatedView = {
        ...lastView,
        data:
          typeof lastView.data === "object" &&
          typeof data === "object" &&
          lastView.data &&
          data
            ? { ...lastView.data, ...data }
            : data,
      };
      const newHistory = [...state.subViewHistory];
      newHistory[lastIndex] = updatedView;
      return { subViewHistory: newHistory };
    });
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
