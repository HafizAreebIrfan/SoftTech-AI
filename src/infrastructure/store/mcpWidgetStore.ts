import { create } from "zustand";
import { useEffect } from "react";
import { useApp } from "@modelcontextprotocol/ext-apps/react";

import {
  McpToolResultPayload,
  OpenAiGlobals,
  McpWidgetState,
} from "../../domain/entities/GenericWidget";

export const TOOL_RESULT_NOTIFICATION = "ui/notifications/tool-result";

export const useMcpWidgetStore = create<McpWidgetState>((set) => ({
  toolResult: null,
  setToolResult: (payload) => set({ toolResult: payload }),
  resetToolResult: () => set({ toolResult: null }),
}));

export const useMcpToolResult = () => {
  const { toolResult, setToolResult } = useMcpWidgetStore();
  useApp({
    appInfo: {
      name: `${toolResult?.structuredContent?.title}`,
      version: "1.0.0",
    },
    capabilities: {},
    onAppCreated: (app) => {
      try {
        app.ontoolresult = (result) => {
          console.log("AI - MCP Bridge Sucessfull", result);
          setToolResult((result as unknown as McpToolResultPayload) ?? null);
        };
      } catch (e) {
        console.log("Bridge fails to build", e);
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

      setToolResult(initialToolOutput ?? null);
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

      setToolResult(output ?? null);
    };

    window.addEventListener("openai:set_globals", handleGlobals);

    return () => {
      window.removeEventListener("openai:set_globals", handleGlobals);
    };
  }, [setToolResult]);

  return toolResult;
};
