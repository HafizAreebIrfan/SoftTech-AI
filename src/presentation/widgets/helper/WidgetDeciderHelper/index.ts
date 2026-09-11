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
}: BuildPresentationPlanOptions): PresentationPlan => {
  // 1. Resolve the layout: trust the backend's data-driven decision
  //    (collection.layout), and only infer when it is genuinely undeclared
  //    ("auto"/missing) — then strictly from generic, company/industry-agnostic
  //    signals (record geometry, audience, record count), never entity/industry
  //    name lists.
  let explicitLayout = (collection?.layout || "auto").toLowerCase();

  if (explicitLayout === "auto") {
    const hasCoordinates =
      records.length > 0 &&
      records.some(
        (r, idx) => extractCoordinates(r as Record<string, any>, idx) !== null,
      );

    if (hasCoordinates) {
      explicitLayout = "mapcatalog";
    } else if (records.length === 1) {
      explicitLayout = "general";
    } else if (audience === "admin") {
      explicitLayout = "table";
    } else {
      // 0 or many plain records for a non-admin audience: catalog so filters
      // and empty states still render.
      explicitLayout = "catalog";
    }
  }

  const blocks: PresentationBlock[] = [];

  // Capabilities: tolerate both the entity naming (canFilter/canSort/canPaginate)
  // and the backend naming (filter/sort/pagination).
  const hasFiltering = capOn(capabilities, "filter");
  const hasSorting = capOn(capabilities, "sort");
  const hasPaginationCapability = capOn(capabilities, "paginate", "pagination");
  const hasPagination =
    Boolean(pagination?.totalPages) || Boolean(collection?.totalPages);

  // 2. Map blocks directly based on the confirmed layout
  if (explicitLayout === "catalog" || explicitLayout === "mapcatalog") {
    // Only surface a filter UI when the company's API actually supports
    // filtering — never merely because a price/status column is present.
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
  } else {
    blocks.push({ type: "details", fields });
  }

  // Ensure the layout matches a known type
  let finalLayout: PresentationLayout = "general";
  if (
    ["catalog", "mapcatalog", "table", "dashboard", "general"].includes(
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
