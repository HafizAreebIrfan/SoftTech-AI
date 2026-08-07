import { ApiSchema, AnalyzerOptions } from "./interfaces";

export const analyzeWithGroq = async (
  options?: AnalyzerOptions,
  logFn?: (level: "info" | "warn" | "error", msg: string) => void,
  prompt?: string,
): Promise<ApiSchema> => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    throw new Error(
      "GROQ_API_KEY is not configured on the server environment.",
    );
  }

  logFn?.("info", `Requesting AI schema analysis for ${options?.apiName}`);

  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey.trim()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        response_format: { type: "json_object" },
      }),
    },
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(
      `AI returned HTTP ${response.status}: ${errText} for api ${options?.apiName}`,
    );
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content || !content.trim()) {
    throw new Error(`AI returned empty response content.`);
  }

  const parsedSchema = JSON.parse(content) as ApiSchema;
  parsedSchema.analyzedAt = new Date().toISOString();

  logFn?.(
    "info",
    `AI successfully generated schema for "${parsedSchema.entity}" with ${parsedSchema.fields?.length}`,
  );

  return parsedSchema;
};
