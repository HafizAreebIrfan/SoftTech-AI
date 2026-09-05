/**
 * Utility to convert OpenAPI / JSON Schema definitions into clean, realistic mock sample responses.
 */

export function schemaToMock(schema: any, depth = 0, maxDepth = 4): any {
  if (!schema || depth > maxDepth) return {};

  // If example is directly provided
  if (schema.example !== undefined) return schema.example;
  if (schema.default !== undefined) return schema.default;
  if (Array.isArray(schema.examples) && schema.examples.length > 0) {
    return schema.examples[0];
  }

  // Handle $ref if unresolved (fallback to name if known)
  if (schema.$ref && typeof schema.$ref === "string") {
    const refName = schema.$ref.split("/").pop();
    return { id: "sample-id", name: `Sample ${refName}` };
  }

  // Handle allOf / anyOf / oneOf
  if (Array.isArray(schema.allOf) && schema.allOf.length > 0) {
    let merged = {};
    for (const sub of schema.allOf) {
      merged = { ...merged, ...schemaToMock(sub, depth + 1, maxDepth) };
    }
    return merged;
  }
  if (Array.isArray(schema.oneOf) && schema.oneOf.length > 0) {
    return schemaToMock(schema.oneOf[0], depth + 1, maxDepth);
  }
  if (Array.isArray(schema.anyOf) && schema.anyOf.length > 0) {
    return schemaToMock(schema.anyOf[0], depth + 1, maxDepth);
  }

  const type = schema.type;

  if (type === "string") {
    if (schema.enum && schema.enum.length > 0) return schema.enum[0];
    if (schema.format === "date-time") return new Date().toISOString();
    if (schema.format === "date") return "2026-09-05";
    if (schema.format === "email") return "user@example.com";
    if (schema.format === "uri" || schema.format === "url")
      return "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400";
    if (schema.format === "uuid") return "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
    if (schema.format === "binary") return "binary_data";
    return "Sample text";
  }

  if (type === "number" || type === "integer") {
    if (schema.enum && schema.enum.length > 0) return schema.enum[0];
    if (schema.minimum !== undefined) return schema.minimum;
    return type === "integer" ? 1 : 99.99;
  }

  if (type === "boolean") {
    return true;
  }

  if (type === "array") {
    if (schema.items) {
      const mockItem = schemaToMock(schema.items, depth + 1, maxDepth);
      return [mockItem, mockItem];
    }
    return [];
  }

  if (type === "object" || schema.properties) {
    const obj: Record<string, any> = {};
    const props = schema.properties || {};

    for (const key of Object.keys(props)) {
      const propSchema = props[key];
      if (propSchema.example !== undefined) {
        obj[key] = propSchema.example;
      } else if (propSchema.default !== undefined) {
        obj[key] = propSchema.default;
      } else if (key.toLowerCase().includes("id")) {
        obj[key] = `${key}_101`;
      } else if (key.toLowerCase().includes("email")) {
        obj[key] = "customer@example.com";
      } else if (key.toLowerCase().includes("phone")) {
        obj[key] = "+1-555-0199";
      } else if (
        key.toLowerCase().includes("image") ||
        key.toLowerCase().includes("photo") ||
        key.toLowerCase().includes("avatar")
      ) {
        obj[key] =
          "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=500";
      } else if (key.toLowerCase().includes("name") || key.toLowerCase().includes("title")) {
        obj[key] = `Sample ${key.charAt(0).toUpperCase() + key.slice(1)}`;
      } else if (key.toLowerCase().includes("price") || key.toLowerCase().includes("amount")) {
        obj[key] = 120.0;
      } else if (key.toLowerCase().includes("status")) {
        obj[key] = "active";
      } else {
        obj[key] = schemaToMock(propSchema, depth + 1, maxDepth);
      }
    }

    return obj;
  }

  return {};
}
