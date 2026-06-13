export interface WeatherStructuredContent {
  city: string;
  temperature: number;
  condition: string;
  windDirection: string;
  windSpeed: number;
  high: number;
  low: number;
  feelsLike: number;
  humidity: number;
}

export interface WeatherToolMeta {
  source?: string;
  lastFetched?: string;
}

export interface WeatherCardViewModel {
  city: string;
  temperature: string;
  condition: string;
  wind: string;
  feelsLike: string;
  humidity: string;
  highLow: string;
  source?: string;
  lastUpdated?: string;
}

export interface WeatherToolContentBlock {
  type?: string;
  text?: string;
}

export interface WeatherToolResultPayload {
  structuredContent?: unknown;
  content?: WeatherToolContentBlock[];
  _meta?: unknown;
}

export interface WeatherToolResultNotification {
  jsonrpc: "2.0";
  method: string;
  params?: WeatherToolResultPayload;
}

export interface OpenAiGlobals {
  toolInput?: unknown;
  toolOutput?: WeatherToolResultPayload | null;
}

export interface OpenAiSetGlobalsEventDetail {
  globals?: OpenAiGlobals;
}
