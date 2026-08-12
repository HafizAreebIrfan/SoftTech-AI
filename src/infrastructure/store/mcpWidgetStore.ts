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

export const useMcpWidgetStore = create<McpWidgetState>()(
  persist(
    (set) => ({
      toolResult: null,
      setToolResult: (payload) => set({ toolResult: payload }),
      resetToolResult: () => set({ toolResult: null }),
    }),
    {
      name: "mcp-widget-single-store",
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
        app.ontoolresult = (result) => {
          console.log(
            "AI - MCP Bridge Successful",
            result,
            toolResult,
            window.openai?.toolOutput,
          );

          const payload = (result as unknown as McpToolResultPayload) ?? null;

          if (!payload) {
            return;
          }
          setToolResult(payload);
        };
      } catch (e) {
        console.log("Bridge failed to build", e);
      }
    },
  });

  useEffect(() => {
    const initialToolOutput = window.openai?.toolOutput;

    if (initialToolOutput !== undefined) {
      console.log(
        "Initial tool result loaded from window.openai:",
        initialToolOutput,
      );

      const payload = initialToolOutput as McpToolResultPayload;

      setToolResult(payload);
    }

    const handleGlobals = (event: Event) => {
      const customEvent = event as CustomEvent<{
        globals?: OpenAiGlobals;
      }>;

      const output = customEvent.detail?.globals?.toolOutput;

      if (output === undefined) {
        return;
      }
      console.log("Tool result received from openai:set_globals:", output);
      const payload = output as McpToolResultPayload;
      setToolResult(payload);
    };

    window.addEventListener("openai:set_globals", handleGlobals);

    return () => {
      window.removeEventListener("openai:set_globals", handleGlobals);
    };
  }, [setToolResult]);

  return toolResult;
};
