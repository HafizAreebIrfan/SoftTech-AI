import type {
  FieldSchema,
  CollectionResult,
  WidgetAudience,
} from "../../domain/entities/GenericWidget";
import type { PresentationBlock } from "./widgetdecider.interface";

export interface DetailFieldProps {
  field: FieldSchema;
  record: unknown;
}

export interface DetailBlockProps {
  block?: PresentationBlock;
  records?: unknown[];
  fields?: FieldSchema[];
  collection?: CollectionResult;
  actions?: any[];
  audience?: WidgetAudience;
  onBack?: () => void;
  metadata?: Record<string, any>;
  /**
   * Rendering context. "default" (full-screen detail sub-view) owns its own
   * host display mode. "mapDock" is a compact panel docked over a parent-owned
   * fullscreen map (car-rental map view) — it must NOT request/restore the
   * host display mode itself, and lays out as a single narrow column.
   */
  variant?: "default" | "mapDock";
}
