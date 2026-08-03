import { analyzeFields } from "./fieldAnalyzer";
import { detectEntity } from "./entityDetector";
import { detectLayout } from "./layoutDetector";
import { generateUIHints } from "./uiHints";
import { ApiSchema, AnalyzerOptions, EntityMetadata } from "./interfaces";
import { analyzeWithGemini } from "./geminiAnalyzer";

export const analyzeApiResponse = async (
  rawResponse: unknown,
  options?: AnalyzerOptions,
): Promise<ApiSchema> => {
  // 1. Try Gemini AI Schema Generation First
  const aiSchema = await analyzeWithGemini(rawResponse, options);

  if (aiSchema && aiSchema.fields && aiSchema.fields.length > 0) {
    console.log(
      `[SchemaAnalyzer] 🤖 Returning AI-generated schema from Gemini for ${options?.apiName || "API"}.`,
    );
    return aiSchema;
  }

  // 2. Deterministic Rule-Based Fallback Engine
  console.log(
    `[SchemaAnalyzer] ⚡ Running rule-based schema analyzer for ${options?.apiName || "API"}...`,
  );

  let sampleRecord: Record<string, unknown> | null = null;
  let isList = false;

  if (Array.isArray(rawResponse)) {
    isList = true;
    const firstRecord = rawResponse.find(
      (item) => typeof item === "object" && item !== null,
    );
    if (firstRecord) {
      sampleRecord = firstRecord as Record<string, unknown>;
    }
  } else if (typeof rawResponse === "object" && rawResponse !== null) {
    const records = rawResponse as Record<string, unknown>;
    const listKey = Object.keys(records).find(
      (k) => Array.isArray(records[k]) && (records[k] as unknown[]).length > 0,
    );

    if (listKey) {
      isList = true;
      const firstItem = (records[listKey] as unknown[]).find(
        (item) => typeof item === "object" && item !== null,
      );
      if (firstItem) {
        sampleRecord = firstItem as Record<string, unknown>;
      }
    } else {
      sampleRecord = records;
    }
  }

  const recordToAnalyze = sampleRecord || {};

  const entity = detectEntity(options?.apiName, options?.endpoint, recordToAnalyze);
  const fields = analyzeFields(recordToAnalyze);
  const defaultLayout = detectLayout(entity, fields, isList, options?.industry);
  const uiHints = generateUIHints(defaultLayout, fields);

  const entityMeta: EntityMetadata = {
    entity,
    primaryKey: fields.find((f) => f.primary)?.key,
    titleKey: fields.find((f) => f.type === "text" && !f.hidden)?.key,
    subtitleKey: fields.find((f) => f.type === "email" || f.type === "phone")?.key,
    imageKey: fields.find((f) => f.type === "image")?.key,
    statusKey: fields.find((f) => f.type === "status")?.key,
    dateKey: fields.find((f) => f.type === "date" || f.type === "datetime")?.key,
    amountKey: fields.find((f) => f.type === "currency")?.key,
  };

  return {
    entity,
    defaultLayout,
    fields,
    entityMeta,
    uiHints,
    analyzedAt: new Date().toISOString(),
    rawSample: recordToAnalyze,
  };
};
