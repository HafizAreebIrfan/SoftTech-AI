import {
  KNOWN_CURRENCY_FIELDS,
  KNOWN_DATE_FIELDS,
  KNOWN_IMAGE_FIELDS,
  KNOWN_EMAIL_FIELDS,
  KNOWN_PHONE_FIELDS,
  KNOWN_STATUS_VALUES,
} from "./constants";
import { FieldType } from "./interfaces";

export const isCurrency = (key: string, value: unknown): boolean => {
  const lowerKey = key.toLowerCase();
  if (KNOWN_CURRENCY_FIELDS.has(lowerKey)) return true;
  if (
    typeof value === "string" &&
    /^[$€£¥]\s?\d+(?:\.\d{1,2})?$/.test(value.trim())
  )
    return true;
  return false;
};

export const isDate = (key: string, value: unknown): boolean => {
  const lowerKey = key.toLowerCase();
  if (KNOWN_DATE_FIELDS.has(lowerKey)) return true;
  if (typeof value === "string" && !isNaN(Date.parse(value)) && value.length >= 8) {
    return true;
  }
  return false;
};

export const isImage = (key: string, value: unknown): boolean => {
  const lowerKey = key.toLowerCase();
  if (KNOWN_IMAGE_FIELDS.has(lowerKey)) return true;
  if (
    typeof value === "string" &&
    /\.(jpeg|jpg|gif|png|svg|webp)($|\?)/i.test(value.trim())
  ) {
    return true;
  }
  return false;
};

export const isEmail = (key: string, value: unknown): boolean => {
  const lowerKey = key.toLowerCase();
  if (KNOWN_EMAIL_FIELDS.has(lowerKey)) return true;
  if (typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
    return true;
  }
  return false;
};

export const isPhone = (key: string, value: unknown): boolean => {
  const lowerKey = key.toLowerCase();
  if (KNOWN_PHONE_FIELDS.has(lowerKey)) return true;
  if (
    typeof value === "string" &&
    /^\+?[0-9\s\-()]{7,20}$/.test(value.trim()) &&
    lowerKey.includes("phone")
  ) {
    return true;
  }
  return false;
};

export const isStatus = (key: string, value: unknown): boolean => {
  const lowerKey = key.toLowerCase();
  if (lowerKey.includes("status") || lowerKey.includes("state")) return true;
  if (typeof value === "string" && KNOWN_STATUS_VALUES.has(value.toLowerCase().trim())) {
    return true;
  }
  return false;
};

export const isBoolean = (value: unknown): boolean => {
  return typeof value === "boolean" || value === "true" || value === "false";
};

export const isLatitude = (key: string): boolean => {
  const lower = key.toLowerCase();
  return lower === "lat" || lower === "latitude";
};

export const isLongitude = (key: string): boolean => {
  const lower = key.toLowerCase();
  return lower === "lng" || lower === "longitude" || lower === "lon";
};

export const isURL = (value: unknown): boolean => {
  if (typeof value !== "string") return false;
  return value.startsWith("http://") || value.startsWith("https://");
};

export const detectFieldType = (key: string, value: unknown): FieldType => {
  if (Array.isArray(value)) return "array";
  if (typeof value === "object" && value !== null) return "object";
  if (isBoolean(value)) return "boolean";
  if (isCurrency(key, value)) return "currency";
  if (isStatus(key, value)) return "status";
  if (isImage(key, value)) return "image";
  if (isEmail(key, value)) return "email";
  if (isPhone(key, value)) return "phone";
  if (isLatitude(key)) return "latitude";
  if (isLongitude(key)) return "longitude";
  if (isDate(key, value)) return "date";
  if (typeof value === "number") return "number";
  if (isURL(value)) return "url";
  return "text";
};
