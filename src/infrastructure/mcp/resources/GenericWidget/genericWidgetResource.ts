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

export const registerGenericWidgetResources = (server: any) => {
  GENERIC_WIDGET_RESOURCES.forEach((widget) => {
    registerAppResource(
      server,
      widget.name,
      widget.uri,
      {
        description: "Interactive generic widget visualizer.",
      },
      async () => {
        const response = await fetch(`${WIDGET_BASE_URL}/widgets.html`);

        if (!response.ok) {
          throw new Error(`Failed to fetch widget HTML: ${response.status}`);
        }

        let widgetHtml = await response.text();

        widgetHtml = widgetHtml
          .replaceAll('src="/assets/', `src="${WIDGET_BASE_URL}/assets/`)
          .replaceAll('href="/assets/', `href="${WIDGET_BASE_URL}/assets/`);
        return {
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
        };
      },
    );
  });
};
