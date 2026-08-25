import { JsonValue } from "./mcpjsonprimitive.types";
import { CollectionResult } from "./mcpcollection.types";
import { CapabilitiesResult } from "./mcpcapabilities.types";
import { PaginationResult } from "./mcppagination.types";
import { WidgetAudience } from "./widgetaudience.types";
import { PlatformType } from "./widgetplatform.types";

/**
 * A widget action button. `tool` is the registered MCP tool id the widget
 * invokes via `callTool(tool, { id })`. `requiresItem` marks actions that need
 * a specific record id; `requiresConfirmation`/`confirmationMessage` gate
 * destructive ones. Mirrors the frontend `WidgetAction` contract.
 */
export type WidgetAction = {
  id: string;
  label: string;
  tool?: string;
  enabled?: boolean;
  requiresItem?: boolean;
  requiresConfirmation?: boolean;
  confirmationMessage?: string;
};

export type GenericWidgetResult = {
  title: string;
  subtitle?: string;
  data: JsonValue;
  collection?: CollectionResult;
  capabilities?: CapabilitiesResult;
  pagination?: PaginationResult;
  actions?: WidgetAction[];
  metadata?: Record<string, JsonValue>;
  audience?: WidgetAudience;
  platformtype?: PlatformType;
};

export type McpContentItem = {
  type?: string;
  text?: string;
  [key: string]: unknown;
};

export type McpToolResultPayload = {
  structuredContent: GenericWidgetResult;
  content?: McpContentItem[];
  _meta?: Record<string, unknown>;
};
