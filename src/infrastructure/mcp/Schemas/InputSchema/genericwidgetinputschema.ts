import { z } from "zod";
import { ApiParam } from "../../../../domain/types/apiparam.types";

const createField = (param: ApiParam): z.ZodTypeAny => {
  let field: z.ZodTypeAny;

  switch (param.type) {
    case "number":
      field = z.union([z.number(), z.string()]);
      break;

    case "boolean":
      field = z.union([z.boolean(), z.string()]);
      break;

    // Structured request-body fields: let the model pass a real object/array
    // instead of being forced into a string (which then reached the API as a
    // quoted JSON blob). Generic for any company's POST/PUT/PATCH body.
    case "object":
      field = z.record(z.string(), z.any());
      break;

    case "array":
      field = z.array(z.any());
      break;

    default:
      field = z.union([z.string(), z.number()]);
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

  // When a company configured a default, tell the model so it does not need to
  // guess a value for this field.
  if (
    param.defaultValue !== undefined &&
    param.defaultValue !== null &&
    String(param.defaultValue) !== ""
  ) {
    smartDescription += ` If the user does not specify this, it defaults to "${param.defaultValue}".`;
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

  // Always accept an `id`: the widget's action buttons invoke get-by-id style
  // tools (view / update / delete a single record) with `{ id }`. Optional and
  // accepts string or number, so it never interferes with list/search calls.
  // A company-registered param named `id` (below) overrides this default.
  shape["id"] = z
    .union([z.string(), z.number()])
    .optional()
    .describe(
      "Identifier of a specific record to fetch, update, or delete. Leave empty for list or search requests.",
    );

  shape["_id"] = z
    .union([z.string(), z.number()])
    .optional()
    .describe("Alternative identifier (e.g. MongoDB _id) of a specific record.");

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
