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
    // Inspect if response contains a nested list (e.g. { data: [...], orders: [...] })
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

  // 1. Entity Detection
  const entity = detectEntity(options?.apiName, options?.endpoint, recordToAnalyze);

  // 2. Field Analysis
  const fields = analyzeFields(recordToAnalyze);

  // 3. Layout Detection
  const defaultLayout = detectLayout(entity, fields, isList, options?.industry);

  // 4. UI Hints Generation
  const uiHints = generateUIHints(defaultLayout, fields);

  // 5. Entity Metadata Extraction
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

  // 6. Optional AI Fallback Enhancement via Gemini API
  const aiSchema = await analyzeWithGemini(rawResponse, options);

  return {
    entity: aiSchema?.entity || entity,
    defaultLayout: aiSchema?.defaultLayout || defaultLayout,
    fields: aiSchema?.fields || fields,
    entityMeta: aiSchema?.entityMeta || entityMeta,
    uiHints: aiSchema?.uiHints || uiHints,
    analyzedAt: new Date().toISOString(),
    rawSample: recordToAnalyze,
  };
};
