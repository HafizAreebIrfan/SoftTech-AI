import { PresentationLayout } from "../../../../types/widgetdecider.types";
import {
  PresentationBlock,
  PresentationPlan,
  BuildPresentationPlanOptions,
} from "../../../../interfaces/mcp/widgetdecider.interface";
import type { FieldSchema } from "../../../../domain/entities/GenericWidget";

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
  const normalizedIntent = String(intent || "").toLowerCase();

  const isMeaningfulNumericField = (field: { key: string; label: string }) => {
    const key = field.key.toLowerCase();
    const label = field.label.toLowerCase();
    if (
      key.includes("epoch") ||
      label.includes("epoch") ||
      key.includes("timestamp") ||
      label.includes("timestamp")
    )
      return false;
    if (
      key === "code" ||
      key === "tz_id" ||
      key === "is_day" ||
      key === "is_moon_up" ||
      key === "is_sun_up"
    )
      return false;
    return true;
  };

  const numericFields = fields.filter(
    (field) =>
      (field.type === "number" || field.type === "currency") &&
      isMeaningfulNumericField(field),
  );

  const imageFields = fields.filter((field) => field.type === "image");

  const statusFields = fields.filter((field) => field.type === "status");

  const dateFields = fields.filter(
    (field) => field.type === "date" || field.type === "datetime",
  );

  const primaryFields = fields.filter((field) => field.primary);

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

  const entityName = String(entity || collection?.entity || "").toLowerCase();

  const isWeatherLike =
    /weather|forecast|climate|temperature/.test(entityName) ||
    fields.some((f) =>
      /temp_|maxtemp|mintemp|weather|forecast/.test(f.key.toLowerCase()),
    );

  const isCatalogCandidate =
    hasMultipleRecords && (hasImages || hasPrices || hasStatus);

  const isDashboardCandidate =
    isAdmin && hasMultipleRecords && (numericFields.length > 0 || hasStatus);

  const blocks: PresentationBlock[] = [];

  const hasFiltering = Boolean(capabilities?.canFilter);

  const hasSorting = Boolean(capabilities?.canSort);

  const hasPaginationCapability = Boolean(capabilities?.canPaginate);

  let layout: PresentationLayout = "general";

  const explicitLayout = (collection?.layout || "").toLowerCase();

  if (
    explicitLayout === "dashboard" ||
    (collection?.metrics && collection.metrics.length > 0) ||
    (collection?.charts && collection.charts.length > 0)
  ) {
    layout = "dashboard";

    if (
      (collection?.metrics && collection.metrics.length > 0) ||
      numericFields.length > 0 ||
      hasStatus
    ) {
      blocks.push({
        type: "summary",
        fields: numericFields.slice(0, 4),
      });
    }

    if (
      (collection?.charts && collection.charts.length > 0) ||
      (numericFields.length > 0 && hasDates && hasMultipleRecords)
    ) {
      blocks.push({
        type: "chart",
        fields: numericFields.slice(0, 2),
        variant: "trend",
      });
    }

    if (hasImages || (isCatalogCandidate && !isAdmin)) {
      blocks.push({ type: "cards", fields });
    } else {
      blocks.push({ type: "table", fields });
    }
  } else if (explicitLayout === "catalog") {
    layout = "catalog";

    if (hasFiltering || hasPrices || hasStatus) {
      blocks.push({ type: "filters" });
    }

    blocks.push({ type: "cards", fields });
  } else if (explicitLayout === "table") {
    layout = "table";
    blocks.push({ type: "table", fields });
  } else if (explicitLayout === "general") {
    layout = "general";
    blocks.push({ type: "details", fields });
  } else if (isComparison && hasMultipleRecords) {
    layout = "table";
    blocks.push({ type: "table", fields });
  } else if (isWeatherLike) {
    layout = "dashboard";

    if (numericFields.length > 0) {
      blocks.push({
        type: "summary",
        fields: numericFields.slice(0, 4),
      });
    }

    blocks.push({
      type: "details",
      fields,
    });
  } else if (isCatalogCandidate && hasMultipleRecords) {
    layout = "catalog";

    if (hasFiltering || hasPrices || hasStatus) {
      blocks.push({ type: "filters" });
    }

    blocks.push({ type: "cards", fields });
  } else if (isDashboardCandidate) {
    layout = "dashboard";

    if (numericFields.length > 0 || hasStatus) {
      blocks.push({
        type: "summary",
        fields: numericFields.slice(0, 4),
      });
    }

    if (numericFields.length > 0 && hasDates && hasMultipleRecords) {
      blocks.push({
        type: "chart",
        fields: numericFields.slice(0, 2),
        variant: "trend",
      });
    }

    blocks.push({ type: "table", fields });
  } else if (hasMultipleRecords) {
    layout = "table";
    blocks.push({ type: "table", fields });
  } else {
    layout = "general";
    blocks.push({ type: "details", fields });
  }

  return {
    layout,
    blocks,

    showPagination: hasPagination || hasPaginationCapability,

    showFilters: hasFiltering || hasPrices || hasStatus,

    showSorting: hasSorting && layout === "table",

    primaryFields,
    numericFields,
    imageFields,
    statusFields,
    dateFields,
  };
};
