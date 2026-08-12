import { McpToolResultPayload } from "../../../../domain/entities/GenericWidget";

export interface CombinedWidgetResult {
  title: string;
  subtitle?: string;

  data: Record<string, unknown>;

  collections: Array<{
    toolIndex: number;
    title: string;
    collection: any;
    data: unknown[];
    structuredContent: any;
  }>;

  capabilities: Record<string, boolean>;

  audience?: string;
  platformType?: string;
  intent?: string;
}

export const combineToolResults = (
  results: McpToolResultPayload[],
): CombinedWidgetResult | null => {
  if (!results || !results.length) {
    return null;
  }

  const getContent = (res: any) => res?.structuredContent ?? res;

  const validResults = results.filter((result) => {
    const content = getContent(result);
    return content && typeof content === "object" && content.data;
  });

  if (!validResults.length) {
    return null;
  }

  const collections = validResults.map((result, index) => {
    const content = getContent(result);

    const collection = content?.collection;

    const dataPath = collection?.dataPath;

    let data: unknown[] = [];

    if (dataPath) {
      const parts = dataPath.split(".");

      let current: any = content?.data;

      for (const part of parts) {
        if (current === undefined || current === null) {
          break;
        }

        current = current[part];
      }

      if (Array.isArray(current)) {
        data = current;
      } else if (current !== undefined && current !== null) {
        data = [current];
      }
    } else if (Array.isArray(content?.data)) {
      data = content.data;
    } else if (content?.data && typeof content.data === "object") {
      data = [content.data];
    }

    return {
      toolIndex: index,

      title: content?.title || `Data ${index + 1}`,

      collection,

      data,

      structuredContent: content,
    };
  });

  const combinedData: Record<string, unknown> = {};

  collections.forEach((item, index) => {
    const entity = item.collection?.entity || `data${index + 1}`;

    combinedData[entity] = item.data;
  });

  const capabilities: Record<string, boolean> = {};

  validResults.forEach((result) => {
    const content = getContent(result);

    const resultCapabilities = content?.capabilities;

    if (!resultCapabilities) {
      return;
    }

    Object.entries(resultCapabilities).forEach(([key, value]) => {
      if (value === true) {
        capabilities[key] = true;
      }
    });
  });

  const firstContent = getContent(validResults[0]);

  return {
    title: firstContent?.title || "Data",

    subtitle:
      validResults.length > 1
        ? "Combined API results"
        : firstContent?.subtitle,

    data: combinedData,

    collections,

    capabilities,

    audience: firstContent?.audience,

    platformType: firstContent?.platformType,

    intent: firstContent?.intent,
  };
};
