import {
  Capabilities,
  CollectionResult,
  FieldSchema,
  Pagination,
  PlatformType,
  WidgetAudience,
} from "../../domain/entities/GenericWidget";
import {
  PresentationBlockType,
  PresentationLayout,
} from "../../types/widgetdecider.types";

export interface PresentationBlock {
  type: PresentationBlockType;
  fields?: FieldSchema[];
  maxItems?: number;
  variant?: string;
}

export interface PresentationPlan {
  layout: PresentationLayout;

  blocks: PresentationBlock[];

  showPagination: boolean;
  showFilters: boolean;
  showSorting: boolean;

  primaryFields: FieldSchema[];
  numericFields: FieldSchema[];
  imageFields: FieldSchema[];
  statusFields: FieldSchema[];
  dateFields: FieldSchema[];
}

export interface BuildPresentationPlanOptions {
  entity?: string;
  records: unknown[];
  fields: FieldSchema[];
  collection?: CollectionResult;
  capabilities?: Capabilities;
  pagination?: Pagination;
  platformType?: PlatformType;
  audience?: WidgetAudience;
  intent?: string;
  /** Company toggle: when false, map layout is suppressed even if records have coordinates. */
  mapEnabled?: boolean;
}
