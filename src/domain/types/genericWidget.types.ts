import { JsonValue } from "./mcpjsonprimitive.types";
import { CollectionResult } from "./mcpcollection.types";
import { CapabilitiesResult } from "./mcpcapabilities.types";
import { PaginationResult } from "./mcppagination.types";

export type GenericWidgetResult = {
  title: string;
  subtitle?: string;
  data: JsonValue;
  collection?: CollectionResult;
  capabilities?: CapabilitiesResult;
  pagination?: PaginationResult;
  metadata?: Record<string, JsonValue>;
};
