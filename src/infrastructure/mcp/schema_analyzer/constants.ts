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
