import type { OpenAiGlobals, WeatherToolResultPayload } from "../domain/entities/WeatherWidget";

declare global {
  interface Window {
    openai?: OpenAiGlobals & {
      callTool?: (toolName: string, args?: unknown) => Promise<WeatherToolResultPayload | null | undefined>;
      requestClose?: () => Promise<void> | void;
      requestDisplayMode?: (options: { mode: "inline" | "pip" | "fullscreen" }) => Promise<void>;
    };
  }

  interface WindowEventMap {
    "openai:set_globals": CustomEvent<{
      globals?: OpenAiGlobals;
    }>;
  }
}

export {};
