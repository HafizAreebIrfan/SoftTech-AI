export type ApiParam = {
  key: string;
  value?: unknown;
  /**
   * Value sent when the parameter is dynamic but the caller (the model) omits
   * it. Kept separate from `value` (which is only an example for the model /
   * the static value for non-dynamic params) so a configured default actually
   * reaches the upstream API. Never applied to free-text search params.
   */
  defaultValue?: unknown;
  isDynamic?: boolean;
  type?: "string" | "number" | "boolean" | "object" | "array";
  inputName?: string;
  description?: string;
};
