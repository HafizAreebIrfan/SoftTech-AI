import { AILogEntry } from "../../../domain/interface/ailogsinterface";

const AILogsBuffer: AILogEntry[] = [];
export const getAILogs = (): AILogEntry[] => [...AILogsBuffer];

export const addAILogs = (
  level: "info" | "warn" | "error",
  message: string,
) => {
  const entry: AILogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
  };
  AILogsBuffer.push(entry);
  if (AILogsBuffer.length > 200) AILogsBuffer.shift();
  console.log(`[AI Analyzer][${level.toUpperCase()}] ${message}`);
};
