import { GoogleGenAI } from "@google/genai";
import { ApiSchema, AnalyzerOptions } from "./interfaces";
import { addAILogs } from "./ailogsgenerator";

export const analyzeWithGemini = async (
  options?: AnalyzerOptions,
  prompt?: string,
): Promise<ApiSchema> => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    const errMsg =
      "GEMINI_API_KEY is not configured on the server environment.";
    addAILogs("error", errMsg);
    throw new Error(errMsg);
  }

  const ai = new GoogleGenAI({ apiKey });

  let responseText = "";

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: prompt,
      config: {
        temperature: 0.1,
        responseMimeType: "application/json",
      },
    });

    responseText = response.text || "";
  } catch (primaryErr: any) {
    addAILogs(
      "warn",
      `gemini-3.5-flash-lite failed (${primaryErr.message || primaryErr}).`,
    );
  }

  if (!responseText || !responseText.trim()) {
    const errMsg = `AI returned empty response text for "${options?.apiName}"`;
    addAILogs("error", errMsg);
    throw new Error(errMsg);
  }

  const parsedSchema = JSON.parse(responseText) as ApiSchema;
  parsedSchema.analyzedAt = new Date().toISOString();

  addAILogs(
    "info",
    `AI successfully generated schema for "${parsedSchema.entity}" with ${parsedSchema.fields?.length}`,
  );

  return parsedSchema;
};
