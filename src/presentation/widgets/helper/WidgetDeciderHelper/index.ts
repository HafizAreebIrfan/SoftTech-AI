import { PresentationLayout } from "../../../../types/widgetdecider.types";
import {
  PresentationBlock,
  PresentationPlan,
  BuildPresentationPlanOptions,
} from "../../../../interfaces/mcp/widgetdecider.interface";
import { capOn } from "../AudienceHelper";
import { extractCoordinates } from "../geoHelper";

export const buildPresentationPlan = ({
  fields,
  collection,
  capabilities,
  pagination,
  records = [],
  audience,
  mapEnabled,
}: BuildPresentationPlanOptions): PresentationPlan => {
  const purpose = collection?.purpose;

  let explicitLayout = (collection?.layout || "auto").toLowerCase();

  // Purpose-based routing: when the backend declares a purpose, it takes
  // precedence over auto-detection.
  if (purpose === "profile") {
    explicitLayout = "profile";
  } else if (purpose === "utility" || purpose === "action") {
    explicitLayout = "general";
  } else if (explicitLayout === "auto") {
    const hasCoordinates =
      records.length > 0 &&
      records.some(
        (r, idx) => extractCoordinates(r as Record<string, any>, idx) !== null,
      );

    if (hasCoordinates && mapEnabled === true) {
      explicitLayout = "mapcatalog";
    } else if (records.length === 1) {
      explicitLayout = "general";
    } else if (audience === "admin") {
      explicitLayout = "table";
    } else {
      explicitLayout = "catalog";
    }
  }

  const blocks: PresentationBlock[] = [];

  const hasFiltering = capOn(capabilities, "filter");
  const hasSorting = capOn(capabilities, "sort");
  const hasPaginationCapability = capOn(capabilities, "paginate", "pagination");
  const hasPagination =
    Boolean(pagination?.totalPages) || Boolean(collection?.totalPages);

  if (explicitLayout === "catalog" || explicitLayout === "mapcatalog") {
    if (hasFiltering) {
      blocks.push({ type: "filters" });
    }
    blocks.push({ type: "cards", fields });
  } else if (explicitLayout === "table") {
    blocks.push({ type: "table", fields });
  } else if (explicitLayout === "dashboard") {
    blocks.push({ type: "summary", fields });
    blocks.push({ type: "chart" });
    blocks.push({ type: "table", fields });
  } else if (explicitLayout === "profile") {
    blocks.push({ type: "details", fields });
  } else {
    blocks.push({ type: "details", fields });
  }

  let finalLayout: PresentationLayout = "general";
  if (
    ["catalog", "mapcatalog", "table", "dashboard", "general", "profile"].includes(
      explicitLayout,
    )
  ) {
    finalLayout = explicitLayout as PresentationLayout;
  }

  return {
    layout: finalLayout,
    blocks,
    showPagination: hasPagination || hasPaginationCapability,
    showFilters: hasFiltering,
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
