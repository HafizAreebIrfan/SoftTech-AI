import { FieldMetadata, UIHints } from "./interfaces";

export const generateUIHints = (
  layout: string,
  fields: FieldMetadata[],
): UIHints => {
  const hasSearchable = fields.some((f) => f.searchable);
  const hasSortable = fields.some((f) => f.sortable);
  const hasFilterable = fields.some((f) => f.filterable);
  const hasMap = fields.some((f) => f.type === "latitude" || f.type === "longitude");

  return {
    search: hasSearchable,
    sorting: hasSortable,
    filters: hasFilterable,
    pagination: layout === "table" || layout === "cards" || layout === "timeline",
    bulkActions: false,
    editable: false,
    chart: layout === "dashboard" || layout === "chart",
    map: hasMap || layout === "map",
    cards: layout === "cards",
  };
};
