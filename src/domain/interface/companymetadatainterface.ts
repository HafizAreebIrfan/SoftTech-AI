import { McpDomain, McpToolMode } from "../types/mcpmetadata";

export interface McpIntentMetadata {
  supported: string[];
  unsupported?: string[];
  keywords?: string[];
  examplePrompts: string[];
}

export interface McpToolFieldMetadata {
  key: string;
  type: string;
  description: string;
  required: boolean;
  example?: string | number | boolean;
}

export interface McpToolMetadata {
  id: string;
  canonicalName: string;
  displayName: string;
  description: string;
  mode: McpToolMode;
  tags: string[];
  enabledByDefault: boolean;
  input: McpToolFieldMetadata[];
  output: McpToolFieldMetadata[];
  examplePrompts: string[];
}

export interface McpApiSample {
  label: string;
  request: Record<string, unknown>;
  response: Record<string, unknown>;
}

export interface McpApiMappingMetadata {
  toolId: string;
  endpointName: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  authType: "none" | "api_key" | "bearer" | "basic" | "custom";
  inputFieldMap: Record<string, string>;
  outputFieldMap: Record<string, string>;
  samples: McpApiSample[];
}

export interface CompanyMcpMetadata {
  companyId: string;
  companySlug: string;
  serverName: string;
  serverVersion: string;
  domain: McpDomain;
  summary: string;
  recommendationHints: string[];
  intents: McpIntentMetadata;
  tools: McpToolMetadata[];
  apiMappings: McpApiMappingMetadata[];
}
