export type TableColumn = {
  key: string;
  label: string;
  type?: "text" | "number" | "currency" | "date" | "status" | "image";
  sortable?: boolean;
};
