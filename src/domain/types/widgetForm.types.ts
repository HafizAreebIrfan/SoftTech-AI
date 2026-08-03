export type FormField = {
  id: string;
  name: string;
  label: string;
  type:
    | "text"
    | "email"
    | "password"
    | "number"
    | "textarea"
    | "select"
    | "multiselect";
  placeholder?: string;
  value?: string | number | string[];
  options?: string[];
  required?: boolean;
  description?: string;
};
