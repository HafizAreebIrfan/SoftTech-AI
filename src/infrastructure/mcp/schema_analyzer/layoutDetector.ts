import { FieldMetadata } from "./interfaces";

export const detectLayout = (
  entity: string,
  fields: FieldMetadata[],
  isList: boolean,
  industry?: string,
): string => {
  const hasImage = fields.some((f) => f.type === "image");
  const hasMap = fields.some((f) => f.type === "latitude" || f.type === "longitude");
  const hasTimeline = fields.some((f) => f.type === "date" || f.type === "datetime") && fields.some((f) => f.type === "status");

  if (hasMap) return "map";
  if (entity === "products" || (hasImage && isList)) return "cards";
  if (entity === "packages" || entity === "bookings" || (hasTimeline && entity.includes("track"))) return "timeline";
  if (entity === "gallery" || (hasImage && !fields.some((f) => f.type === "currency"))) return "gallery";
  if (entity === "weather" || entity === "dashboard" || entity === "analytics") return "dashboard";

  if (isList) return "table";
  return "dashboard";
};
