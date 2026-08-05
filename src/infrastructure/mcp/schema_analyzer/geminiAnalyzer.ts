import { GoogleGenAI } from "@google/genai";
import { ApiSchema, AnalyzerOptions } from "./interfaces";

const MAX_PROMPT_CHARS = 8000;

interface GeminiLogEntry {
  timestamp: string;
  level: "info" | "warn" | "error";
  message: string;
}

const geminiLogsBuffer: GeminiLogEntry[] = [];

export const addGeminiLog = (
  level: "info" | "warn" | "error",
  message: string,
) => {
  const entry: GeminiLogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
  };
  geminiLogsBuffer.push(entry);
  if (geminiLogsBuffer.length > 200) geminiLogsBuffer.shift();
  console.log(`[GeminiAnalyzer][${level.toUpperCase()}] ${message}`);
};

export const getGeminiLogs = (): GeminiLogEntry[] => [...geminiLogsBuffer];

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
    const errMsg =
      "GEMINI_API_KEY is not configured on the server environment.";
    addGeminiLog("error", errMsg);
    throw new Error(errMsg);
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

  addGeminiLog(
    "info",
    `Requesting AI schema analysis for "${options?.apiName || "API"}" (${options?.endpoint || "URL"}). Prompt length: ${sampleJson.length} chars.`,
  );

  let responseText = "";
  const startTime = Date.now();

  try {
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: prompt,
      config: {
        temperature: 0.1,
        responseMimeType: "application/json",
      },
    });

    responseText = response.text || "";
  } catch (primaryErr: any) {
    addGeminiLog(
      "warn",
      `gemini-1.5-flash failed (${primaryErr.message || primaryErr}). Falling back to gemini-2.0-flash...`,
    );

    const fallbackResponse = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        temperature: 0.1,
        responseMimeType: "application/json",
      },
    });

    responseText = fallbackResponse.text || "";
  }

  const duration = Date.now() - startTime;

  if (!responseText || !responseText.trim()) {
    const errMsg = `Gemini AI returned empty response text for "${options?.apiName || "API"}" after ${duration}ms.`;
    addGeminiLog("error", errMsg);
    throw new Error(errMsg);
  }

  const parsedSchema = JSON.parse(responseText) as ApiSchema;
  parsedSchema.analyzedAt = new Date().toISOString();

  addGeminiLog(
    "info",
    `Gemini AI successfully generated schema for "${parsedSchema.entity}" with ${parsedSchema.fields?.length || 0} fields in ${duration}ms.`,
  );

  return parsedSchema;
};
