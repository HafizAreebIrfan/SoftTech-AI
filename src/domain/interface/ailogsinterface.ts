export interface AILogEntry {
  timestamp: string;
  level: "info" | "warn" | "error";
  message: string;
}
