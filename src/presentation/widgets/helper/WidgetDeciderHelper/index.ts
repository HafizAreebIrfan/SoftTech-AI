import { PresentationLayout } from "../../../../types/widgetdecider.types";
import {
  PresentationBlock,
  PresentationPlan,
  BuildPresentationPlanOptions,
} from "../../../../interfaces/mcp/widgetdecider.interface";

export const buildPresentationPlan = ({
  fields,
  collection,
  capabilities,
  pagination,
}: BuildPresentationPlanOptions): PresentationPlan => {
  // 1. Trust the backend's explicit layout choice. Default to 'general'.
  const explicitLayout = (collection?.layout || "general").toLowerCase();

  const blocks: PresentationBlock[] = [];

  const hasFiltering = Boolean(capabilities?.canFilter);
  const hasSorting = Boolean(capabilities?.canSort);
  const hasPaginationCapability = Boolean(capabilities?.canPaginate);
  const hasPagination =
    Boolean(pagination?.totalPages) || Boolean(collection?.totalPages);

  const hasPrices = fields.some((field) => field.type === "currency");
  const hasStatus = fields.some((field) => field.type === "status");

  // 2. Map blocks directly based on the confirmed layout
  if (explicitLayout === "catalog") {
    if (hasFiltering || hasPrices || hasStatus) {
      blocks.push({ type: "filters" });
    }
    blocks.push({ type: "cards", fields });
  } else if (explicitLayout === "table") {
    blocks.push({ type: "table", fields });
  } else if (explicitLayout === "dashboard") {
    blocks.push({ type: "summary", fields });
    blocks.push({ type: "chart" }); // You can add variants later if needed
    blocks.push({ type: "table", fields });
  } else {
    blocks.push({ type: "details", fields });
  }

  // Ensure the layout matches a known type
  let finalLayout: PresentationLayout = "general";
  if (["catalog", "table", "dashboard", "general"].includes(explicitLayout)) {
    finalLayout = explicitLayout as PresentationLayout;
  }

  return {
    layout: finalLayout,
    blocks,

    showPagination: hasPagination || hasPaginationCapability,
    showFilters: hasFiltering || hasPrices || hasStatus,
    showSorting: hasSorting && finalLayout === "table",

    primaryFields: fields.filter((field) => field.primary),
    numericFields: fields.filter(
      (field) => field.type === "number" || field.type === "currency",
    ),
    imageFields: fields.filter((field) => field.type === "image"),
    statusFields: fields.filter((field) => field.type === "status"),
    dateFields: fields.filter(
      (field) => field.type === "date" || field.type === "datetime",
    ),
  };
};
