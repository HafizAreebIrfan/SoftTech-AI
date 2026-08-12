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

const generateGroupId = () =>
  `group_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

export const useMcpWidgetStore = create<McpWidgetState>()(
  persist(
    (set) => ({
      toolResult: null,

      toolResults: [],

      resultGroupId: null,

      setToolResult: (payload) =>
        set({
          toolResult: payload,
        }),

      addToolResult: (payload) =>
        set((state) => ({
          toolResults: [...state.toolResults, payload],
        })),

      setResultGroupId: (groupId) =>
        set({
          resultGroupId: groupId,
        }),

      resetToolResult: () =>
        set({
          toolResult: null,
          toolResults: [],
          resultGroupId: null,
        }),
    }),

    {
      name: "mcp-widget-store",

      partialize: (state) => ({
        toolResult: state.toolResult,
        toolResults: state.toolResults,
        resultGroupId: state.resultGroupId,
      }),
    },
  ),
);

export const useMcpToolResult = () => {
  const {
    toolResult,
    setToolResult,
    addToolResult,
    resultGroupId,
    setResultGroupId,
  } = useMcpWidgetStore();

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

          /*
           * If there is no active group,
           * start a new one.
           */
          if (!resultGroupId) {
            setResultGroupId(generateGroupId());
          }

          setToolResult(payload);

          addToolResult(payload);
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

      /*
       * Initial page load should NOT
       * automatically create another
       * result group if one already exists.
       */
      if (!resultGroupId) {
        setResultGroupId(generateGroupId());
      }

      setToolResult(payload);

      addToolResult(payload);
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

      if (!resultGroupId) {
        setResultGroupId(generateGroupId());
      }

      setToolResult(payload);

      addToolResult(payload);
    };

    window.addEventListener("openai:set_globals", handleGlobals);

    return () => {
      window.removeEventListener("openai:set_globals", handleGlobals);
    };
  }, [setToolResult, addToolResult, resultGroupId, setResultGroupId]);

  return toolResult;
};
