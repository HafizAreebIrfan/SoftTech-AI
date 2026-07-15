"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerGenericWidgetResources = void 0;
const server_1 = require("@modelcontextprotocol/ext-apps/server");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const WIDGET_BASE_URL = "https://softtech-ai-app.onrender.com";
const GENERIC_WIDGET_RESOURCES = [
    {
        name: "Generic Widget",
        uri: "ui://generic/widgets.html",
        url: `${WIDGET_BASE_URL}/widgets.html`,
    },
];
const widgetHtml = fs_1.default
    .readFileSync(path_1.default.join(process.cwd(), "dist", "widgets.html"), "utf8")
    .replaceAll('src="/assets/', `src="${WIDGET_BASE_URL}/assets/`)
    .replaceAll('href="/assets/', `href="${WIDGET_BASE_URL}/assets/`);
console.log(widgetHtml.split("\n").slice(0, 15).join("\n"));
const registerGenericWidgetResources = (server) => {
    GENERIC_WIDGET_RESOURCES.forEach((widget) => {
        (0, server_1.registerAppResource)(server, widget.name, widget.uri, {
            description: "Interactive generic widget visualizer.",
        }, async () => {
            console.log("========== WIDGET RESOURCE REQUESTED ==========");
            console.log("URI:", widget.uri);
            console.log("Serving widget HTML");
            console.log("==============================================");
            return {
                contents: [
                    {
                        uri: widget.uri,
                        mimeType: server_1.RESOURCE_MIME_TYPE,
                        text: widgetHtml,
                        _meta: {
                            "openai/outputTemplate": widget.uri,
                            "openai/widgetAccessible": true,
                            "openai/toolInvocation/invoking": "Loading...",
                            "openai/toolInvocation/invoked": "Loaded",
                            ui: {
                                prefersBorder: true,
                            },
                            csp: {
                                connectDomains: [WIDGET_BASE_URL],
                                resourceDomains: [WIDGET_BASE_URL, "data:"],
                            },
                        },
                    },
                ],
            };
        });
    });
};
exports.registerGenericWidgetResources = registerGenericWidgetResources;
