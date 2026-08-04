import { GoogleGenAI } from "@google/genai";
import { ApiSchema, AnalyzerOptions } from "./interfaces";

const MAX_PROMPT_CHARS = 8000;

const formatSampleJson = (rawResponse: unknown): string => {
  const sampleJson = JSON.stringify(rawResponse, null, 2) || "";
  return sampleJson.length > MAX_PROMPT_CHARS
    ? sampleJson.slice(0, MAX_PROMPT_CHARS) + "\n...[truncated]"
    : sampleJson;
};

export const analyzeWithGemini = async (
  rawResponse: unknown,
  options?: AnalyzerOptions,
): Promise<ApiSchema> => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    throw new Error("GEMINI_API_KEY is not configured on the server.");
  }

  const ai = new GoogleGenAI({ apiKey });
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
5. All actual business keys (including orderamount, total, status, username, userdate, etc.) MUST be included in the "fields" array.

Raw API Response Sample:
${sampleJson}`;

  console.log(
    `[GeminiAnalyzer] 🤖 Requesting AI schema from Gemini 3.5 Flash for "${options?.apiName || "API"}"...`,
  );

  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash",
    contents: prompt,
    config: {
      temperature: 0.1,
      responseMimeType: "application/json",
    },
  });

  if (!response.text) {
    throw new Error("Gemini AI returned an empty response text.");
  }

  const parsedSchema = JSON.parse(response.text) as ApiSchema;
  parsedSchema.analyzedAt = new Date().toISOString();

  console.log(
    `[GeminiAnalyzer] ✅ Successfully generated AI schema for "${parsedSchema.entity}" with ${parsedSchema.fields?.length || 0} fields.`,
  );

  return parsedSchema;
};
