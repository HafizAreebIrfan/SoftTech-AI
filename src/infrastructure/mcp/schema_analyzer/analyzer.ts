import { ApiSchema, AnalyzerOptions } from "./interfaces";
import { analyzeWithGemini, addAILogs } from "./geminiAnalyzer";
import { analyzeWithGroq } from "./groqAnalyzer";
import { analyzeWithOpenRouter } from "./openrouterAnalyzer";
import { generateHeuristicSchema } from "./heuristicAnalyzer";

export const analyzeApiResponse = async (
  rawResponse: unknown,
  options?: AnalyzerOptions,
): Promise<ApiSchema> => {
  // 1. Try Gemini AI (if key is set)
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim()) {
    try {
      return await analyzeWithGemini(rawResponse, options);
    } catch (geminiErr: any) {
      addAILogs(
        "warn",
        `Gemini AI provider failed/exhausted (${geminiErr.message || geminiErr}). Attempting fallbacks...`,
      );
    }
  }

  // 2. Try Groq Cloud AI (if key is set)
  if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim()) {
    try {
      return await analyzeWithGroq(rawResponse, options, addAILogs);
    } catch (groqErr: any) {
      addAILogs(
        "warn",
        `Groq Cloud provider failed (${groqErr.message || groqErr}). Attempting next fallback...`,
      );
    }
  }

  // 3. Try OpenRouter Free Tier AI (if key is set)
  if (process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY.trim()) {
    try {
      return await analyzeWithOpenRouter(rawResponse, options, addAILogs);
    } catch (openRouterErr: any) {
      addAILogs(
        "warn",
        `OpenRouter Free Tier provider failed (${openRouterErr.message || openRouterErr}). Attempting next fallback...`,
      );
    }
  }

  // 5. 100% Fail-Safe Rule-Based Heuristic Schema (Guarantees zero app crashes!)
  addAILogs(
    "info",
    `⚙️ Generated Rule-Based Heuristic Schema for "${options?.apiName || "API"}" (100% Fail-Safe Active).`,
  );
  return generateHeuristicSchema(rawResponse, options);
};
