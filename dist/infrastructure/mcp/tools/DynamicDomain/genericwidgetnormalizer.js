"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeApiResponseToWidget = void 0;
const normalizeApiResponseToWidget = (apiName, response, layout) => {
    const blocks = buildBlocks(response);
    return {
        title: apiName,
        subtitle: "Live API response",
        layout: layout || "dashboard",
        blocks: blocks.length > 0
            ? blocks
            : [
                {
                    type: "keyValue",
                    title: "Result",
                    keyValueItems: [{ key: "Status", value: "No renderable data" }],
                },
            ],
    };
};
exports.normalizeApiResponseToWidget = normalizeApiResponseToWidget;
const buildBlocks = (response) => {
    if (Array.isArray(response)) {
        return buildArrayBlocks(response);
    }
    if (isRecord(response)) {
        return buildObjectBlocks(response);
    }
    if (isPrimitive(response)) {
        return [
            {
                type: "keyValue",
                title: "Result",
                keyValueItems: [{ key: "Value", value: stringifyPrimitive(response) }],
            },
        ];
    }
    return [];
};
const buildArrayBlocks = (items) => {
    const records = items.filter(isRecord);
    if (records.length > 0) {
        const headers = Object.keys(records[0]).slice(0, 6);
        return [
            {
                type: "table",
                title: "Items",
                tableHeaders: headers,
                tableRows: records
                    .slice(0, 10)
                    .map((record) => headers.map((header) => stringifyCell(record[header]))),
            },
        ];
    }
    return [
        {
            type: "list",
            title: "Items",
            listItems: items.slice(0, 10).map((item, index) => ({
                title: `Item ${index + 1}`,
                description: stringifyCell(item),
            })),
        },
    ];
};
const buildObjectBlocks = (record) => {
    const entries = Object.entries(record);
    const primitiveEntries = entries.filter(([, value]) => isPrimitive(value));
    const arrayEntries = entries.filter(([, value]) => Array.isArray(value));
    const objectEntries = entries.filter(([, value]) => isRecord(value) && !Array.isArray(value));
    const blocks = [];
    const numericEntries = primitiveEntries.filter(([, value]) => typeof value === "number");
    if (numericEntries.length > 0) {
        blocks.push({
            type: "metrics",
            title: "Metrics",
            metrics: numericEntries.slice(0, 6).map(([key, value]) => ({
                label: toLabel(key),
                value: value,
            })),
        });
    }
    if (primitiveEntries.length > 0) {
        blocks.push({
            type: "keyValue",
            title: "Details",
            keyValueItems: primitiveEntries.slice(0, 8).map(([key, value]) => ({
                key: toLabel(key),
                value: stringifyPrimitive(value),
            })),
        });
    }
    for (const [key, value] of arrayEntries.slice(0, 2)) {
        blocks.push(...buildArrayBlocks(value).map((block) => ({
            ...block,
            title: toLabel(key),
        })));
    }
    for (const [key, value] of objectEntries.slice(0, 2)) {
        const nested = value;
        const nestedItems = Object.entries(nested)
            .filter(([, itemValue]) => isPrimitive(itemValue))
            .slice(0, 8)
            .map(([itemKey, itemValue]) => ({
            key: toLabel(itemKey),
            value: stringifyPrimitive(itemValue),
        }));
        if (nestedItems.length > 0) {
            blocks.push({
                type: "keyValue",
                title: toLabel(key),
                keyValueItems: nestedItems,
            });
        }
    }
    return blocks;
};
const isRecord = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
const isPrimitive = (value) => ["string", "number", "boolean"].includes(typeof value) || value === null;
const stringifyPrimitive = (value) => value === null ? "N/A" : String(value);
const stringifyCell = (value) => {
    if (isPrimitive(value)) {
        return stringifyPrimitive(value);
    }
    if (Array.isArray(value)) {
        return `${value.length} items`;
    }
    if (isRecord(value)) {
        return "Object";
    }
    return "";
};
const toLabel = (value) => value
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
