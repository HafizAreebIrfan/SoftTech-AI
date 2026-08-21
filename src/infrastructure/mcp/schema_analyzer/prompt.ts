import { AnalyzerOptions } from "./interfaces";

export const AIPrompt = ({
  options,
  sampleJson,
}: {
  options: AnalyzerOptions;
  sampleJson: string;
}) => {
  return `You are an API response schema analyzer.
Analyze the following raw API response sample from an API named "${options?.apiName}" (Endpoint: "${options?.endpoint}", Industry: "${options?.industry}").

Your job is to identify the business entity and every meaningful field returned by the API.
Return a JSON object matching this EXACT schema structure:
{
  "entity": "entity_name (e.g. orders, products, weather, customers, bookings, packages)",
  "dataPath": "dot.notation.path.to.records",
  "fields": [
    {
      "key": "raw_field_key",
      "label": "Human Readable Label",
      "type": "text | number | currency | date | datetime | image | email | phone | status | boolean | latitude | longitude | url | object | array",
      "path": "dot_notation_path",
      "hidden": false,
      "primary": false,
      "uiRole": "title | description | price | image | status | metric | null"
    }
  ]
}

DATA PATH RULES:

1. Identify the dot-notation path to the array containing the business records and return it as "dataPath".
2. If the root API response itself is an array of records, return an empty string for "dataPath".
3. Field "path" must be relative to one individual record, not include "dataPath".

PATH RULES:

1. "key" must contain only the original field name.

2. "path" must contain the complete path from the collection item to that field using dot notation.

3. For a top-level field, the path is the same as the key.

Example:
{
  "key": "username",
  "path": "username"
}

4. For a nested field, include every parent object in the path.

Example raw data:
{
  "customer": {
    "name": "Areeb",
    "contact": {
      "phone": "03321234567"
    }
  }
}

The fields must include:

{
  "key": "name",
  "path": "customer.name"
}

and:

{
  "key": "phone",
  "path": "customer.contact.phone"
}

5. If the same key appears in multiple locations, preserve the same key but use the complete path to distinguish the fields.

Example:
{
  "customer": {
    "name": "Areeb"
  },
  "company": {
    "name": "SoftTech AI"
  }
}

Return:

{
  "key": "name",
  "path": "customer.name"
}

and:

{
  "key": "name",
  "path": "company.name"
}

6. For arrays, identify the fields inside the array items when those fields represent meaningful business data.

Example:
{
  "orders": [
    {
      "id": "123",
      "customer": {
        "name": "Areeb"
      }
    }
  ]
}

The fields should include:

{
  "key": "id",
  "path": "orders.id"
}

and:

{
  "key": "name",
  "path": "orders.customer.name"
}

However, if the API's collection is already the array being analyzed, omit the collection wrapper from the field path.

Example collection item:
{
  "id": "123",
  "customer": {
    "name": "Areeb"
  }
}

Return:

{
  "key": "id",
  "path": "id"
}

and:

{
  "key": "name",
  "path": "customer.name"
}

UI ROLE RULES:
You must predict the primary visual role of a field for a generic user interface card. 
1. Assign "title" to the main identifying name of the record (e.g., hotel name, package name, product name, city name).
2. Assign "description" to a secondary string that summarizes the item (e.g., short summary, category, sub-title).
3. Assign "price" to the primary cost or monetary amount.
4. Assign "image" to the main display photo or thumbnail URL.
5. Assign "status" to the primary state or availability field.
6. Assign "metric" to the most important non-monetary numerical value (e.g., temperature for weather, rating for a hotel, stock price for finance).
7. ONLY assign a uiRole if the field strongly matches the definition. If it does not, return null.
8. NEVER assign the same uiRole (like "title" or "price") to more than one field in the same collection. Pick the most important one.

FIELD RULES:
1. Include every meaningful business field returned by the API.
2. Preserve the exact original API field name in "key".
3. Always provide "path".
4. Generate a human-readable "label".
5. Infer the semantic type from both the field name and its value.
6. Use "currency" for prices, amounts, costs, fees, revenue, totals, etc.
7. Use "status" for status/state fields.
8. Use "date" or "datetime" for date/time values.
9. Use "image" for image URLs.
10. Use "email" for email addresses.
11. Use "phone" for phone numbers.
12. Use "latitude" and "longitude" for geographic coordinates.
13. Mark internal technical fields such as "_id" and "__v" as hidden.
14. Mark fields that uniquely identify an entity as primary when appropriate.
15. Do not omit business fields simply because they are nested, optional, or currently empty.
16. Objects should use type "object".
17. Arrays should use type "array".
18. Do not generate UI behavior such as search, sorting, filtering, pagination, charts, or actions.
19. Do not generate entityMeta or uiHints.
20. Return ONLY the JSON object. No markdown and no explanation.

Raw API Response Sample:
${sampleJson}`;
};
