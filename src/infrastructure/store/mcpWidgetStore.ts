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
  _meta: {
    company: "WeatherWay",
    source: "https://api.weatherapi.com/v1/forecast.json?q=Karachi&days=3",
    lastFetched: new Date().toISOString(),
    isPreview: true,
  },
  content: [
    {
      type: "text",
      text: "Get Weather Data: 3 widget block(s) returned.",
    },
  ],
  structuredContent: {
    title: "Karachi Weather",
    subtitle: "Current conditions and 3-day forecast",
    layout: "dashboard",
    blocks: [
      {
        type: "metrics",
        title: "Current Conditions",
        metrics: [
          {
            label: "Temperature",
            value: "32°C",
            tone: "warning",
            change: "Feels like 38°C",
            changeTone: "danger",
          },
          {
            label: "Humidity",
            value: "78%",
            tone: "default",
          },
          {
            label: "Wind Speed",
            value: "14 km/h",
            tone: "good",
            change: "SW",
            changeTone: "default",
          },
        ],
      },
      {
        type: "keyValue",
        title: "Location Details",
        keyValueItems: [
          { key: "Region", value: "Sindh", tone: "default" },
          { key: "Country", value: "Pakistan", tone: "default" },
          { key: "Local Time", value: "16:25", tone: "good" },
        ],
      },
      {
        type: "table",
        title: "3-Day Forecast",
        tableHeaders: ["Date", "Condition", "Max Temp", "Min Temp"],
        tableRows: [
          ["Today", { value: "Sunny", tone: "warning" }, "34°C", "28°C"],
          [
            "Tomorrow",
            { value: "Partly Cloudy", tone: "default" },
            "33°C",
            "27°C",
          ],
          ["Day 3", { value: "Rain Showers", tone: "good" }, "30°C", "26°C"],
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
  useApp({
    appInfo: {
      name: toolResult?.structuredContent.title || "Your MCP",
      version: "1.0.0",
    },
    capabilities: {},
    onAppCreated: (app) => {
      app.ontoolresult = (result) => {
        console.log("[MCP Apps Bridge] ✅ tool result via useApp:", result);
        setToolResult((result as unknown as McpToolResultPayload) ?? null);
      };
    },
  });
  useEffect(() => {
    if (window.openai?.toolOutput) {
      console.log(
        "[ChatGPT Bridge] 📥 Initial toolResult loaded from window.openai:",
        window.openai.toolOutput,
      );
      setToolResult(window.openai.toolOutput as McpToolResultPayload);
    }

    const handleGlobals = (event: Event) => {
      const customEvent = event as CustomEvent<{ globals?: OpenAiGlobals }>;
      const output = customEvent.detail?.globals?.toolOutput;
      if (output === undefined) return;
      console.log("[ChatGPT Bridge] 🔄 openai:set_globals received:", output);
      setToolResult((output as McpToolResultPayload) ?? null);
    };

    window.addEventListener("openai:set_globals", handleGlobals);
    return () =>
      window.removeEventListener("openai:set_globals", handleGlobals);
  }, [setToolResult]);

  return toolResult ?? previewGenericToolResult;
};
