import { PresentationLayout } from "../../../../types/widgetdecider.types";
import {
  PresentationBlock,
  PresentationPlan,
  BuildPresentationPlanOptions,
} from "../../../../interfaces/mcp/widgetdecider.interface";

export const buildPresentationPlan = ({
  entity,
  records,
  fields,
  collection,
  capabilities,
  pagination,
  audience,
  intent,
}: BuildPresentationPlanOptions): PresentationPlan => {
  const numericFields = fields.filter(
    (field) => field.type === "number" || field.type === "currency",
  );

  const imageFields = fields.filter((field) => field.type === "image");

  const statusFields = fields.filter((field) => field.type === "status");

  const dateFields = fields.filter(
    (field) => field.type === "date" || field.type === "datetime",
  );

  const primaryFields = fields.filter((field) => field.primary);

  const entityName = String(entity || collection?.entity || "").toLowerCase();

  const normalizedIntent = String(intent || "").toLowerCase();

  const isComparison =
    normalizedIntent.includes("compare") ||
    normalizedIntent.includes("comparison");

  const hasImages = imageFields.length > 0;
  const hasPrices = fields.some((field) => field.type === "currency");

  const hasStatus = statusFields.length > 0;
  const hasDates = dateFields.length > 0;

  const hasMultipleRecords = records.length > 1;

  const hasPagination =
    Boolean(pagination?.totalPages) || Boolean(collection?.totalPages);

  const isAdmin = audience === "admin" || audience === "both";

  const isProductLike =
    /product|products|item|items|package|packages|service|services|property|properties/.test(
      entityName,
    );

  const isWeatherLike = /weather|forecast|climate|temperature/.test(entityName);

  const isCatalogCandidate =
    (isProductLike || hasPrices) && (hasImages || hasPrices);

  const isDashboardCandidate =
    isAdmin && (hasMultipleRecords || numericFields.length > 0 || hasStatus);

  const blocks: PresentationBlock[] = [];

  let layout: PresentationLayout = "general";

  /*
   * 1. Explicit comparison request
   */
  if (isComparison && hasMultipleRecords) {
    layout = "table";

    blocks.push({
      type: "table",
      fields,
    });
  } else if (isCatalogCandidate && hasMultipleRecords) {
    /*
     * 2. Product/catalog-like data
     */
    layout = "catalog";

    if (capabilities?.filtering || hasPrices || hasStatus) {
      blocks.push({
        type: "filters",
      });
    }

    blocks.push({
      type: "cards",
      fields,
    });
  } else if (isDashboardCandidate) {
    /*
     * 3. Admin & Operational Dashboards
     */
    layout = "dashboard";

    if (numericFields.length > 0 || hasStatus) {
      blocks.push({
        type: "summary",
        fields: numericFields.slice(0, 4),
      });
    }

    if (numericFields.length > 0 && hasDates) {
      blocks.push({
        type: "chart",
        fields: numericFields.slice(0, 2),
        variant: "trend",
      });
    }

    blocks.push({
      type: "table",
      fields,
    });
  } else if (isWeatherLike) {
    /*
     * 4. Weather / forecast
     */
    layout = "dashboard";

    if (numericFields.length > 0) {
      blocks.push({
        type: "summary",
        fields: numericFields.slice(0, 3),
      });
    }

    blocks.push({
      type: "cards",
      fields,
      maxItems: 7,
      variant: "forecast",
    });

    if (numericFields.length > 0 && hasDates) {
      blocks.push({
        type: "chart",
        fields: numericFields.slice(0, 2),
        variant: "weather",
      });
    }
  } else if (hasMultipleRecords) {
    /*
     * 5. Generic collection with multiple records
     */
    layout = "table";

    blocks.push({
      type: "table",
      fields,
    });
  } else {
    /*
     * 6. Single object
     */
    layout = "general";

    blocks.push({
      type: "details",
      fields,
    });
  }

  return {
    layout,
    blocks,

    showPagination: hasPagination,

    showFilters:
      Boolean(capabilities?.filtering) ||
      (isProductLike && (hasPrices || hasStatus)),

    showSorting: Boolean(capabilities?.sorting) && layout === "table",

    primaryFields,
    numericFields,
    imageFields,
    statusFields,
    dateFields,
  };
};
