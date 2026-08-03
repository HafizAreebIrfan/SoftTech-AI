export type WidgetFilter = {
  id: string;
  label: string;
  type: "text" | "select" | "date" | "number";
  value?: string;
  options?: string[];
};
