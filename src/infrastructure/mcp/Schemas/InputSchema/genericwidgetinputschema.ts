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

  return param.description
    ? field.describe(param.description)
    : field.describe(`Value for ${param.inputName || param.key}`);
};

export const buildCustomMcpInputSchema = (
  params: ApiParam[] = [],
): z.ZodObject<any> => {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const param of params) {
    if (!param?.isDynamic) continue;

    const apiKey = String(param.key || "")
      .replace(/^\{|\}$/g, "")
      .trim();

    if (!apiKey) continue;

    const inputName = param.inputName?.trim() || apiKey;

    shape[inputName] = createField(param);
  }

  return z.object(shape);
};
