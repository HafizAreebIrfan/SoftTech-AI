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
          <style>
            ${CSS}
            @keyframes pulseSkeleton { 0%, 100% { opacity: 0.8; } 50% { opacity: 0.25; } }
            .skeleton-box { background: rgba(255, 255, 255, 0.08); animation: pulseSkeleton 1.5s ease-in-out infinite; border-radius: 12px; }
          </style>
        </head>
        <body style="background: transparent; margin: 0; padding: 0;">
          <div id="root">
            <div style="padding: 16px; display: flex; flex-direction: column; gap: 12px;">
              <div class="skeleton-box" style="height: 24px; width: 40%;"></div>
              <div class="skeleton-box" style="height: 14px; width: 70%;"></div>
              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-top: 8px;">
                <div class="skeleton-box" style="height: 80px;"></div>
                <div class="skeleton-box" style="height: 80px;"></div>
              </div>
            </div>
          </div>
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
