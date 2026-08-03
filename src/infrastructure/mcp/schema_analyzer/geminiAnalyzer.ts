import { GoogleGenAI } from "@google/genai";
import { ApiSchema, AnalyzerOptions } from "./interfaces";

export const analyzeWithGemini = async (
  rawResponse: unknown,
  options?: AnalyzerOptions,
): Promise<ApiSchema | null> => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.trim() === "") {
    console.log(
      "GEMINI_API_KEY not found in environment, skipping AI analysis.",
    );
    return null;
  }

  const ai = new GoogleGenAI({ apiKey });

  const sampleJson = JSON.stringify(rawResponse, null, 2);
  const truncatedSample =
    sampleJson.length > 8000
      ? sampleJson.slice(0, 8000) + "\n...[truncated]"
      : sampleJson;

  const prompt = `You are a Senior Staff API Schema & UI Architect.
Analyze the following raw API response sample from an API named "${options?.apiName || "Unknown API"}" (Endpoint: "${options?.endpoint || "N/A"}", Industry: "${options?.industry || "General"}").

Your task is to analyze the fields, infer their semantic data types, select the best UI layout, and output a valid JSON object matching this EXACT schema structure:

{
  "entity": "entity_name (e.g. orders, products, weather, customers, bookings, packages, transactions)",
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
${truncatedSample}`;

  try {
    console.log(
      `Analyzing API response with Google GenAI SDK (gemini-3.5-flash) for "${options?.apiName || "API"}"...`,
    );

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        temperature: 0.1,
        responseMimeType: "application/json",
      },
    });

    const responseText = response.text;

    if (!responseText) {
      console.warn("Empty response text received from Gemini.");
      return null;
    }

    const cleanedJson = responseText
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();

    const parsedSchema = JSON.parse(cleanedJson) as ApiSchema;
    parsedSchema.analyzedAt = new Date().toISOString();
    parsedSchema.rawSample = rawResponse;

    console.log(
      `Successfully generated AI schema for entity "${parsedSchema.entity}" with ${parsedSchema.fields?.length || 0} fields and layout "${parsedSchema.defaultLayout}".`,
    );

    return parsedSchema;
  } catch (error) {
    console.error("Gemini AI analysis failed:", error);
    return null;
  }
};
