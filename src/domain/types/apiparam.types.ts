export type ApiParam = {
  key: string;
  value?: unknown;
  isDynamic?: boolean;
  type?: "string" | "number" | "boolean";
  inputName?: string;
  description?: string;
};
