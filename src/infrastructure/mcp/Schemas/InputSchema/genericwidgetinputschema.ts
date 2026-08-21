import { z } from "zod";
import { ApiParam } from "../../../../domain/types/apiparam.types";

const createField = (param: ApiParam): z.ZodTypeAny => {
  let field: z.ZodTypeAny;

  switch (param.type) {
    case "number":
      field = z.number();
      break;

    case "boolean":
      field = z.boolean();
      break;

    default:
      field = z.string();
  }

  const normalizedKey = String(
    param.inputName || param.key || "",
  ).toLowerCase();
  let smartDescription = param.description
    ? param.description
    : `Provide the value for ${param.inputName || param.key}.`;

  // Inject instructions to force the LLM to guess missing values
  if (
    normalizedKey.includes("date") ||
    normalizedKey.includes("time") ||
    normalizedKey.includes("day")
  ) {
    smartDescription +=
      " If the user omits this, calculate a logical date based on today's current date.";
  } else if (
    normalizedKey.includes("city") ||
    normalizedKey.includes("location") ||
    normalizedKey.includes("country")
  ) {
    smartDescription +=
      " If the user omits a location, automatically use their current known city or country.";
  } else {
    smartDescription +=
      " If the user omits this required detail, infer a highly probable default value from their prompt context instead of asking them for clarification.";
  }

  return field.describe(smartDescription);
};

export const buildCustomMcpInputSchema = (
  params: ApiParam[] = [],
): z.ZodObject<any> => {
  const shape: Record<string, z.ZodTypeAny> = {};

  // 1. Inject global context fields for every tool
  shape["user_raw_prompt"] = z
    .string()
    .optional()
    .describe("Pass the exact raw text the user typed.");

  shape["inferred_intent"] = z
    .string()
    .optional()
    .describe("Summarize the user's main goal in 3 to 5 words.");

  // 2. Map the dynamic parameters with smart descriptions
  for (const param of params) {
    if (!param?.isDynamic) continue;

    const apiKey = String(param.key || "")
      .replace(/^\{|\}$/g, "")
      .trim();

    if (!apiKey) continue;

    const inputName = param.inputName?.trim() || apiKey;

    // Optional: You can make Zod fields optional so the tool execution doesn't hard-crash,
    // allowing your backend to handle missing data gracefully.
    shape[inputName] = createField(param).optional();
  }

  return z.object(shape);
};
