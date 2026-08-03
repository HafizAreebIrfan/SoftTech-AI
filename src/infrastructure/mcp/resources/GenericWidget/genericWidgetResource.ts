import {
  registerAppResource,
  RESOURCE_MIME_TYPE,
} from "@modelcontextprotocol/ext-apps/server";

const WIDGET_BASE_URL = "https://softtech-ai-app.onrender.com";
const WIDGET_SERVER_URL = "https://softtech-ai.onrender.com";
const WIDGET_NGROK_URL = "https://scone-hatchling-relenting.ngrok-free.dev";

const GENERIC_WIDGET_RESOURCES = [
  {
    name: "Widgets",
    uri: "ui://generic/widgets.html",
  },
];

export const registerGenericWidgetResources = (server: any) => {
  GENERIC_WIDGET_RESOURCES.forEach((widget) => {
    registerAppResource(
      server,
      widget.name,
      widget.uri,
      {
        description: "Interactive " + widget.name + " visualizer.",
      },
      async () => {
        const HTML = await fetch(`${WIDGET_BASE_URL}/widget.js`).then((r) =>
          r.text(),
        );
        const CSS = await fetch(`${WIDGET_BASE_URL}/widget.css`).then((r) =>
          r.text(),
        );
        const widgetHtml = `
         <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <title>Generic Widget</title>
          <style>${CSS}</style>
        </head>
        <body>
          <div id="root"></div>
          <script type="module">${HTML}</script>
        </body>
      </html>
        `;

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
                  domain: WIDGET_SERVER_URL,
                  csp: {
                    connectDomains: [
                      WIDGET_BASE_URL,
                      WIDGET_NGROK_URL,
                      WIDGET_SERVER_URL,
                    ],
                    resourceDomains: [
                      WIDGET_BASE_URL,
                      WIDGET_NGROK_URL,
                      WIDGET_SERVER_URL,
                    ],
                  },
                },
              },
            },
          ],
        };
      },
    );
  });
};
