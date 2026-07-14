import { create } from "zustand";
import { useEffect } from "react";
import { McpToolResultPayload, OpenAiGlobals } from "../../domain/entities/GenericWidget";

export const TOOL_RESULT_NOTIFICATION = "ui/notifications/tool-result";

interface McpWidgetState {
  toolResult: McpToolResultPayload | null;
  setToolResult: (payload: McpToolResultPayload | null) => void;
  resetToolResult: () => void;
}

export const useMcpWidgetStore = create<McpWidgetState>((set) => ({
  toolResult: null,
  setToolResult: (payload) => set({ toolResult: payload }),
  resetToolResult: () => set({ toolResult: null }),
}));

export const previewGenericToolResult: McpToolResultPayload = {
  structuredContent: {
    title: "System Integration Dashboard",
    subtitle: "Connected APIs telemetry logs and webhooks status",
    blocks: [
      {
        type: "metrics",
        title: "Key Performance Indicators",
        metrics: [
          {
            label: "API Latency",
            value: "142 ms",
            tone: "good",
            change: "-18ms",
            changeTone: "good"
          },
          {
            label: "Active Webhooks",
            value: "2,481",
            tone: "default",
            change: "+12 today",
            changeTone: "default"
          },
          {
            label: "Error Rate",
            value: "4.12%",
            tone: "danger",
            change: "+1.2%",
            changeTone: "danger"
          }
        ]
      },
      {
        type: "keyValue",
        title: "Integration Configuration",
        keyValueItems: [
          { key: "Gateway URL", value: "https://api.softtech.ai/v1", tone: "default" },
          { key: "SSL Verification", value: "Enabled", tone: "good" },
          { key: "API Key Rotation", value: "Required (30d)", tone: "warning" }
        ]
      },
      {
        type: "list",
        title: "Recent Triggers",
        listItems: [
          { title: "customer.created", description: "Successfully routed to CRM hook", icon: "bolt", tone: "good", meta: "200 OK" },
          { title: "invoice.payment_failed", description: "Retry scheduled for tomorrow", icon: "help", tone: "warning", meta: "402 Failure" },
          { title: "auth.user_deleted", description: "Cleaned up customer session data", icon: "lock", tone: "default", meta: "Processed" }
        ]
      },
      {
        type: "table",
        title: "Recent API Requests Logs",
        tableHeaders: ["Timestamp", "Endpoint", "Status", "Duration"],
        tableRows: [
          ["14:10:22", "/v1/users", { value: "201 Created", tone: "good" }, "120ms"],
          ["14:09:15", "/v1/charges", { value: "402 Failed", tone: "danger" }, "240ms"],
          ["14:08:01", "/v1/webhooks", { value: "200 Success", tone: "good" }, "98ms"]
        ]
      }
    ]
  }
};

/**
 * Hook to synchronize OpenAI App SDK/MCP message actions with Zustand store
 * and return the current toolResult.
 */
export const useMcpToolResult = () => {
  const { toolResult, setToolResult } = useMcpWidgetStore();

  useEffect(() => {
    // Initial read
    if (window.openai?.toolOutput) {
      setToolResult(window.openai.toolOutput);
    }

    const handleGlobals = (event: Event) => {
      const customEvent = event as CustomEvent<{ globals?: OpenAiGlobals }>;
      setToolResult(customEvent.detail?.globals?.toolOutput ?? null);
    };

    const handleMessage = (event: MessageEvent) => {
      if (event.source !== window.parent) return;

      const message = event.data;
      if (message?.method === TOOL_RESULT_NOTIFICATION) {
        setToolResult(message.params ?? null);
      }
    };

    window.addEventListener("openai:set_globals", handleGlobals);
    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("openai:set_globals", handleGlobals);
      window.removeEventListener("message", handleMessage);
    };
  }, [setToolResult]);

  return toolResult ?? previewGenericToolResult;
};
