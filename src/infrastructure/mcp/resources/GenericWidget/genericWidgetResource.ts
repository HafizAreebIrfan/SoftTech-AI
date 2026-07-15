import {
  registerAppResource,
  RESOURCE_MIME_TYPE,
} from "@modelcontextprotocol/ext-apps/server";
import fs from "fs";
import path from "path";

const WIDGET_BASE_URL = "https://softtech-ai-app.onrender.com";

const GENERIC_WIDGET_RESOURCES = [
  {
    name: "Generic Widget",
    uri: "ui://generic/widgets.html",
    url: `${WIDGET_BASE_URL}/widgets.html`,
  },
];
const widgetHtml = fs.readFileSync(
  path.join(process.cwd(), "dist", "widgets.html"),
  "utf8",
);

console.log(widgetHtml);

export const registerGenericWidgetResources = (server: any) => {
  GENERIC_WIDGET_RESOURCES.forEach((widget) => {
    registerAppResource(
      server,
      widget.name,
      widget.uri,
      {
        description: "Interactive generic widget visualizer.",
      },
      async () => ({
        contents: [
          {
            uri: widget.uri,
            mimeType: RESOURCE_MIME_TYPE,
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
      }),
    );
  });
};
