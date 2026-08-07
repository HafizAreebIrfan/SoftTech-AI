import { ApiSchema, AnalyzerOptions } from "./interfaces";
import { analyzeWithGemini } from "./geminiAnalyzer";
import { analyzeWithGroq } from "./groqAnalyzer";
import { analyzeWithOpenRouter } from "./openrouterAnalyzer";
import { AIPrompt } from "./prompt";
import { addAILogs } from "./ailogsgenerator";

export const analyzeApiResponse = async (
  rawResponse: unknown,
  options?: AnalyzerOptions,
): Promise<ApiSchema> => {
  const MAX_PROMPT_CHARS = 8000;

  const formatSampleJson = (rawResponse: unknown): string => {
    const sampleJson = JSON.stringify(rawResponse, null, 2) || "";
    return sampleJson.length > MAX_PROMPT_CHARS
      ? sampleJson.slice(0, MAX_PROMPT_CHARS) + "\n...[truncated]"
      : sampleJson;
  };
  const sampleJson = formatSampleJson(rawResponse);

  const prompt = AIPrompt({
    options: options,
    sampleJson,
  });
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim()) {
    try {
      return await analyzeWithGemini(options, prompt);
    } catch (geminiErr: any) {
      addAILogs(
        "warn",
        `AI provider failed/exhausted (${geminiErr.message || geminiErr}). Retrying...`,
      );
    }
  }

  if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim()) {
    try {
      return await analyzeWithGroq(options, addAILogs, prompt);
    } catch (groqErr: any) {
      addAILogs(
        "warn",
        `AI provider failed (${groqErr.message || groqErr}). Retrying...`,
      );
    }
  }
  if (process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY.trim()) {
    try {
      return await analyzeWithOpenRouter(options, addAILogs, prompt);
    } catch (openRouterErr: any) {
      addAILogs(
        "warn",
        `AI provider failed (${openRouterErr.message || openRouterErr}). Retrying...`,
      );
    }
  }
};
