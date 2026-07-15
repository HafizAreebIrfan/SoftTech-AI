import { create } from "zustand";
import { useEffect } from "react";
import {
  McpToolResultPayload,
  OpenAiGlobals,
} from "../../domain/entities/GenericWidget";
import { useApp } from "@modelcontextprotocol/ext-apps/react";
import { App } from "@modelcontextprotocol/ext-apps";

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
            changeTone: "good",
          },
          {
            label: "Active Webhooks",
            value: "2,481",
            tone: "default",
            change: "+12 today",
            changeTone: "default",
          },
          {
            label: "Error Rate",
            value: "4.12%",
            tone: "danger",
            change: "+1.2%",
            changeTone: "danger",
          },
        ],
      },
      {
        type: "keyValue",
        title: "Integration Configuration",
        keyValueItems: [
          {
            key: "Gateway URL",
            value: "https://api.softtech.ai/v1",
            tone: "default",
          },
          { key: "SSL Verification", value: "Enabled", tone: "good" },
          { key: "API Key Rotation", value: "Required (30d)", tone: "warning" },
        ],
      },
      {
        type: "list",
        title: "Recent Triggers",
        listItems: [
          {
            title: "customer.created",
            description: "Successfully routed to CRM hook",
            icon: "bolt",
            tone: "good",
            meta: "200 OK",
          },
          {
            title: "invoice.payment_failed",
            description: "Retry scheduled for tomorrow",
            icon: "help",
            tone: "warning",
            meta: "402 Failure",
          },
          {
            title: "auth.user_deleted",
            description: "Cleaned up customer session data",
            icon: "lock",
            tone: "default",
            meta: "Processed",
          },
        ],
      },
      {
        type: "table",
        title: "Recent API Requests Logs",
        tableHeaders: ["Timestamp", "Endpoint", "Status", "Duration"],
        tableRows: [
          [
            "14:10:22",
            "/v1/users",
            { value: "201 Created", tone: "good" },
            "120ms",
          ],
          [
            "14:09:15",
            "/v1/charges",
            { value: "402 Failed", tone: "danger" },
            "240ms",
          ],
          [
            "14:08:01",
            "/v1/webhooks",
            { value: "200 Success", tone: "good" },
            "98ms",
          ],
        ],
      },
    ],
  },
};

/**
 * Hook to synchronize OpenAI App SDK/MCP message actions with Zustand store
 * and return the current toolResult.
 */
export const useMcpToolResult = () => {
  const { toolResult, setToolResult } = useMcpWidgetStore();

  const { isConnected, error } = useApp({
    appInfo: { name: "GenericWidget", version: "1.0.0" },
    capabilities: {},
    onAppCreated: (app: App) => {
      // Called when ChatGPT passes the tool input arguments to the widget
      app.ontoolinput = (params: any) => {
        console.log("[ChatGPT Bridge] 📥 ontoolinput received (tool arguments):", params);
        // Sometimes arguments are passed directly, or wrapped in a tool_call
      };
      
      // Called when the backend returns the tool result and ChatGPT forwards it
      app.ontoolresult = (params: any) => {
        console.log("[ChatGPT Bridge] ✅ ontoolresult received (correct data returned?):", params);
        
        // If the params contains the expected structure
        if (params && params.structuredContent) {
          setToolResult(params as McpToolResultPayload);
        } else if (params && params.content) {
           // Maybe it's wrapped? We fallback to setting params directly
          setToolResult(params as McpToolResultPayload);
        } else {
           setToolResult(params as McpToolResultPayload);
        }
      };

      // Handle host context changes if needed
      app.onhostcontextchanged = (params: any) => {
        console.log("[ChatGPT Bridge] 🔄 host context changed:", params);
        // Can read globals here if needed, or theme changes
        if (params?.globals?.toolOutput) {
           setToolResult(params.globals.toolOutput as McpToolResultPayload);
        }
      };
    },
  });

  useEffect(() => {
    if (isConnected) {
      console.log("[ChatGPT Bridge] 🤝 JSON-RPC Handshake Successful! ChatGPT bridged correctly.");
    }
  }, [isConnected]);

  useEffect(() => {
    if (error) {
      console.error("[ChatGPT Bridge] ❌ JSON-RPC Handshake Error:", error);
    }
  }, [error]);

  return toolResult ?? previewGenericToolResult;
};
