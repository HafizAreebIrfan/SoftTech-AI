import { create } from "zustand";
import {
  OpenAiGlobals,
  WeatherCardViewModel,
  WeatherStructuredContent,
  WeatherToolMeta,
  WeatherToolResultPayload,
} from "../../domain/entities/WeatherWidget";

export const WEATHER_RESULT_NOTIFICATION = "ui/notifications/tool-result";

export const previewWeatherToolResult: WeatherToolResultPayload = {
  structuredContent: {
    city: "Karachi",
    temperature: 31,
    condition: "Sunny",
    windDirection: "SW",
    windSpeed: 24,
    high: 34,
    low: 28,
    feelsLike: 37,
    humidity: 71,
  },
  _meta: {
    source: "weatherapi.com",
    lastFetched: new Date().toISOString(),
  },
  content: [{ type: "text", text: "Karachi: 31C, Sunny, humidity 71%" }],
};

interface WeatherWidgetState {
  bridgeConnected: boolean;
  toolResult: WeatherToolResultPayload | null;
  receiveToolResult: (payload: WeatherToolResultPayload | null) => void;
  syncFromOpenAiGlobals: (globals?: OpenAiGlobals) => void;
  resetToolResult: () => void;
}

/**
 * Validates that the payload coming from MCP contains the weather fields
 * our card needs before we try to render them.
 */
export const isWeatherStructuredContent = (
  value: unknown,
): value is WeatherStructuredContent => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.city === "string" &&
    typeof candidate.temperature === "number" &&
    typeof candidate.condition === "string" &&
    typeof candidate.windDirection === "string" &&
    typeof candidate.windSpeed === "number" &&
    typeof candidate.high === "number" &&
    typeof candidate.low === "number" &&
    typeof candidate.feelsLike === "number" &&
    typeof candidate.humidity === "number"
  );
};

/**
 * Validates the optional presentation metadata that accompanies the MCP result.
 */
export const isWeatherToolMeta = (value: unknown): value is WeatherToolMeta => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    (candidate.source === undefined || typeof candidate.source === "string") &&
    (candidate.lastFetched === undefined ||
      typeof candidate.lastFetched === "string")
  );
};

const formatTimestamp = (value?: string) => {
  if (!value) {
    return undefined;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

/**
 * Converts a raw MCP tool result into the exact shape the weather card UI renders.
 */
export const adaptWeatherToolResult = (
  payload: WeatherToolResultPayload,
): WeatherCardViewModel | null => {
  if (!isWeatherStructuredContent(payload.structuredContent)) {
    return null;
  }

  const meta = isWeatherToolMeta(payload._meta) ? payload._meta : undefined;

  return {
    city: payload.structuredContent.city,
    temperature: `${payload.structuredContent.temperature}C`,
    condition: payload.structuredContent.condition,
    wind: `${payload.structuredContent.windDirection} • ${payload.structuredContent.windSpeed} kph`,
    feelsLike: `${payload.structuredContent.feelsLike}C`,
    humidity: `${payload.structuredContent.humidity}%`,
    highLow: `${payload.structuredContent.high}C / ${payload.structuredContent.low}C`,
    source: meta?.source,
    lastUpdated: formatTimestamp(meta?.lastFetched),
  };
};

export const useWeatherWidgetStore = create<WeatherWidgetState>((set) => ({
  bridgeConnected: false,
  toolResult: null,
  receiveToolResult: (payload) =>
    set({
      bridgeConnected: true,
      toolResult: payload,
    }),
  syncFromOpenAiGlobals: (globals) =>
    set({
      bridgeConnected: Boolean(globals?.toolOutput),
      toolResult: globals?.toolOutput ?? null,
    }),
  resetToolResult: () =>
    set({
      bridgeConnected: false,
      toolResult: null,
    }),
}));
