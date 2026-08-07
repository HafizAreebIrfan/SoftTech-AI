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
  "fields": [
    {
      "key": "raw_field_key",
      "label": "Human Readable Label",
      "type": "text | number | currency | date | datetime | image | email | phone | status | boolean | latitude | longitude | url | object | array",
      "hidden": false,
      "primary": false,
    }
  ],
}

Rules:
1. Include every actual business field returned by the API.
2. Preserve the exact original API field name in "key".
3. Generate a human-readable "label".
4. Infer the semantic type from both the field name and its value.
5. Use "currency" for prices, amounts, costs, fees, revenue, totals, etc.
6. Use "status" for status/state fields.
7. Use "date" or "datetime" for date/time values.
8. Use "image" for image URLs.
9. Use "email" for email addresses.
10. Use "phone" for phone numbers.
11. Use "latitude" and "longitude" for geographic coordinates.
12. Mark internal technical fields such as _id and __v as hidden.
13. Mark fields that uniquely identify an entity as primary when appropriate.
14. Do not omit business fields simply because they are nested, optional, or currently empty.
15. Do not generate UI behavior such as search, sorting, filtering, pagination, charts, or actions.
16. Do not generate entityMeta or uiHints.
17. Return ONLY the JSON object. No markdown and no explanation.

Raw API Response Sample:
${sampleJson}`;
};
