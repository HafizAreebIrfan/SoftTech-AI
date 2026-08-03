export const SYSTEM_FIELDS = new Set([
  "_id",
  "__v",
  "createdAt",
  "updatedAt",
  "deletedAt",
  "password",
  "token",
  "refreshToken",
  "secret",
  "icon",
  "code",
  "tz_id",
  "createdBy",
  "updatedBy",
]);

export const isVisibleField = (field: string): boolean => !SYSTEM_FIELDS.has(field);

export const getVisibleFields = (record: Record<string, unknown>): string[] =>
  Object.keys(record).filter(isVisibleField);

export const KNOWN_STATUS_VALUES = new Set([
  "pending",
  "completed",
  "cancelled",
  "canceled",
  "failed",
  "delivered",
  "paid",
  "processing",
  "active",
  "inactive",
  "shipped",
  "open",
  "closed",
  "approved",
  "rejected",
]);

export const KNOWN_CURRENCY_FIELDS = new Set([
  "amount",
  "price",
  "subtotal",
  "total",
  "revenue",
  "income",
  "spent",
  "spend",
  "fee",
  "cost",
  "salary",
  "orderamount",
  "totalamount",
  "unitprice",
  "netamount",
]);

export const KNOWN_DATE_FIELDS = new Set([
  "createdat",
  "updatedat",
  "date",
  "timestamp",
  "userdate",
  "orderdate",
  "time",
  "dob",
  "birthdate",
  "expiresat",
  "publishedat",
]);

export const KNOWN_IMAGE_FIELDS = new Set([
  "image",
  "thumbnail",
  "avatar",
  "photo",
  "logo",
  "banner",
  "picture",
  "imageurl",
]);

export const KNOWN_EMAIL_FIELDS = new Set([
  "email",
  "customeremail",
  "useremail",
  "user_email",
  "mail",
]);

export const KNOWN_PHONE_FIELDS = new Set([
  "phone",
  "mobile",
  "contact",
  "phonenumber",
  "userphoneno",
  "userphone",
  "telephone",
]);
