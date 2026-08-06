import { ApiSchema, AnalyzerOptions } from "./interfaces";

const MAX_PROMPT_CHARS = 8000;

const formatSampleJson = (rawResponse: unknown): string => {
  const sampleJson = JSON.stringify(rawResponse, null, 2) || "";
  return sampleJson.length > MAX_PROMPT_CHARS
    ? sampleJson.slice(0, MAX_PROMPT_CHARS) + "\n...[truncated]"
    : sampleJson;
};

export const analyzeWithOpenRouter = async (
  rawResponse: unknown,
  options?: AnalyzerOptions,
  logFn?: (level: "info" | "warn" | "error", msg: string) => void,
): Promise<ApiSchema> => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    throw new Error(
      "OPENROUTER_API_KEY is not configured on the server environment.",
    );
  }

  const sampleJson = formatSampleJson(rawResponse);
  const prompt = `You are a Senior Staff API Schema & UI Architect.
Analyze the following raw API response sample from an API named "${options?.apiName || "Unknown API"}" (Endpoint: "${options?.endpoint || "N/A"}", Industry: "${options?.industry || "General"}").

Output a valid JSON object matching this EXACT schema structure:
{
  "entity": "entity_name (e.g. orders, products, weather, customers, bookings, packages)",
  "defaultLayout": "table | cards | dashboard | timeline | gallery | map | chart | form",
  "fields": [
    {
      "key": "raw_field_key",
      "label": "Human Readable Label",
      "type": "text | number | currency | date | datetime | image | email | phone | status | boolean | latitude | longitude | url | object | array",
      "hidden": false,
      "primary": false,
      "sortable": true,
      "searchable": true,
      "filterable": true
    }
  ],
  "entityMeta": {
    "entity": "entity_name",
    "primaryKey": "id_key",
    "titleKey": "title_or_name_key",
    "subtitleKey": "subtitle_or_email_key",
    "imageKey": "image_url_key",
    "statusKey": "status_key",
    "dateKey": "date_key",
    "amountKey": "price_or_amount_key"
  },
  "uiHints": {
    "search": true,
    "sorting": true,
    "filters": true,
    "pagination": true,
    "bulkActions": false,
    "editable": false,
    "chart": false,
    "map": false
  }
}

Rules:
1. Return ONLY the raw JSON object. Do not include markdown code blocks (\`\`\`json), explanations, or notes.
2. Identify currency fields (amount, price, cost, fee, revenue) as type "currency".
3. Identify status fields (status, state) as type "status".
4. Mark internal metadata (_id, __v, password, token, secret) as "hidden": true.
5. All actual business keys MUST be included in the "fields" array.

Raw API Response Sample:
${sampleJson}`;

  logFn?.(
    "info",
    `🌐 Requesting AI schema analysis from OpenRouter Free Tier (meta-llama/llama-3.3-70b-instruct:free)...`,
  );

  const startTime = Date.now();
  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey.trim()}`,
        "HTTP-Referer": "https://softtechai.com",
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

  const duration = Date.now() - startTime;
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(
      `OpenRouter API returned HTTP ${response.status}: ${errText}`,
    );
  }

  const data = await response.json();
  let content = data.choices?.[0]?.message?.content;
  if (!content || !content.trim()) {
    throw new Error(`OpenRouter returned empty response content.`);
  }

  content = content
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
  const parsedSchema = JSON.parse(content) as ApiSchema;
  parsedSchema.analyzedAt = new Date().toISOString();

  logFn?.(
    "info",
    `✅ OpenRouter successfully generated schema for "${parsedSchema.entity}" with ${parsedSchema.fields?.length || 0} fields in ${duration}ms.`,
  );

  return parsedSchema;
};
