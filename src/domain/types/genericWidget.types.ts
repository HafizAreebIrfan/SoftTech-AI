import { JsonValue } from "./mcpjsonprimitive.types";
import { CollectionResult } from "./mcpcollection.types";
import { CapabilitiesResult } from "./mcpcapabilities.types";
import { PaginationResult } from "./mcppagination.types";
import { WidgetAudience } from "./widgetaudience.types";
import { PlatformType } from "./widgetplatform.types";

export type GenericWidgetResult = {
  title: string;
  subtitle?: string;
  data: JsonValue;
  collection?: CollectionResult;
  capabilities?: CapabilitiesResult;
  pagination?: PaginationResult;
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
