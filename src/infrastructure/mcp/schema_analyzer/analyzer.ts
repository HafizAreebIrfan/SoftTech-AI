import { ApiSchema, AnalyzerOptions } from "./interfaces";
import { analyzeWithGemini } from "./geminiAnalyzer";

export const analyzeApiResponse = async (
  rawResponse: unknown,
  options?: AnalyzerOptions,
): Promise<ApiSchema> => {
  return await analyzeWithGemini(rawResponse, options);
};
