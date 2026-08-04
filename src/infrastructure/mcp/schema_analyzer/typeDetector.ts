import { FieldType } from "./interfaces";

export const detectFieldType = (key: string, value: unknown): FieldType => {
  if (Array.isArray(value)) return "array";
  if (typeof value === "object" && value !== null) return "object";
  if (typeof value === "boolean" || value === "true" || value === "false") return "boolean";
  if (typeof value === "number") return "number";
  if (typeof value === "string") {
    const lowerKey = key.toLowerCase();
    if (lowerKey.includes("price") || lowerKey.includes("amount") || lowerKey.includes("cost") || lowerKey.includes("fee")) return "currency";
    if (lowerKey.includes("status") || lowerKey.includes("state")) return "status";
    if (lowerKey.includes("image") || lowerKey.includes("photo") || lowerKey.includes("avatar")) return "image";
    if (lowerKey.includes("date") || lowerKey.includes("time")) return "date";
    if (lowerKey.includes("email")) return "email";
    if (value.startsWith("http://") || value.startsWith("https://")) return "url";
  }
  return "text";
};
