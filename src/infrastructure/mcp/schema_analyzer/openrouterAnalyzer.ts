import { ApiSchema, AnalyzerOptions } from "./interfaces";

export const analyzeWithOpenRouter = async (
  options?: AnalyzerOptions,
  logFn?: (level: "info" | "warn" | "error", msg: string) => void,
  prompt?: string,
): Promise<ApiSchema> => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    throw new Error(
      "OPENROUTER_API_KEY is not configured on the server environment.",
    );
  }

  logFn?.("info", `Requesting AI schema analysis for ${options?.apiName}`);

  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey.trim()}`,
        "HTTP-Referer": "https://softtechai.onrender.com",
        "X-Title": "SoftTech AI Schema Analyzer",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemma-4-31b-it:free",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
      }),
    },
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(
      `AI returned HTTP ${response.status}: ${errText} for "${options?.apiName}"`,
    );
  }

  const data = await response.json();
  let content = data.choices?.[0]?.message?.content;
  if (!content || !content.trim()) {
    throw new Error(
      `AI returned empty response content for "${options?.apiName}"`,
    );
  }

  content = content
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
  const parsedSchema = JSON.parse(content) as ApiSchema;
  parsedSchema.analyzedAt = new Date().toISOString();

  logFn?.(
    "info",
    `AI successfully generated schema for "${parsedSchema.entity}" with ${parsedSchema.fields?.length}`,
  );

  return parsedSchema;
};
