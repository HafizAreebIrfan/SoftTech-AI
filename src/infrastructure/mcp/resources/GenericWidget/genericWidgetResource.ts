import {
  registerAppResource,
  RESOURCE_MIME_TYPE,
} from "@modelcontextprotocol/ext-apps/server";
import { ICompany } from "../../../../domain/types/company.types";

const WIDGET_BASE_URL = "https://softtech-ai-app.onrender.com";
const WIDGET_SERVER_URL = "https://softtech-ai.onrender.com";

export const registerGenericWidgetResources = (
  server: any,
  company: ICompany,
) => {
  registerAppResource(
    server,
    "Widgets",
    "ui://generic/widgets.html",
    {
      description: "Interactive Widgets visualizer.",
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
        
        /* Base reset */
        body {
          background: transparent;
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }

        /* Modern Shimmer Animation */
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }

        /* Light Mode (Default) */
        .skeleton-box {
          animation: shimmer 2.5s infinite linear;
          background: linear-gradient(to right, #f1f5f9 4%, #e2e8f0 25%, #f1f5f9 36%);
          background-size: 1000px 100%;
          border-radius: 8px;
        }

        /* Dark Mode Support */
        @media (prefers-color-scheme: dark) {
          .skeleton-box {
            background: linear-gradient(to right, rgba(255,255,255,0.05) 4%, rgba(255,255,255,0.1) 25%, rgba(255,255,255,0.05) 36%);
            background-size: 1000px 100%;
          }
        }

        .container {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          max-width: 100%;
          box-sizing: border-box;
        }
        
        .header-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 12px;
        }

        .list-group {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
      </style>
    </head>
    <body>
      <div id="root">
        <div class="container">
          
          <!-- Title & Subtitle Skeleton -->
          <div class="header-group">
            <div class="skeleton-box" style="height: 28px; width: 35%; border-radius: 6px;"></div>
            <div class="skeleton-box" style="height: 16px; width: 60%; border-radius: 4px;"></div>
          </div>

          <!-- Top Metrics / Cards Skeleton -->
          <div class="metrics-grid">
            <div class="skeleton-box" style="height: 90px;"></div>
            <div class="skeleton-box" style="height: 90px;"></div>
            <div class="skeleton-box" style="height: 90px;"></div>
          </div>

          <!-- List / Table Skeleton -->
          <div class="list-group">
            <div class="skeleton-box" style="height: 60px;"></div>
            <div class="skeleton-box" style="height: 60px;"></div>
            <div class="skeleton-box" style="height: 60px;"></div>
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
            uri: "ui://generic/widgets.html",

            mimeType: RESOURCE_MIME_TYPE,
            text: widgetHtml,
            _meta: {
              "openai/outputTemplate": "ui://generic/widgets.html",
              "openai/widgetAccessible": true,
              "openai/toolInvocation/invoking": "Loading...",
              "openai/toolInvocation/invoked": "Loaded",
              ui: {
                prefersBorder: true,
                domain: WIDGET_SERVER_URL,
                csp: {
                  connectDomains: [WIDGET_BASE_URL, WIDGET_SERVER_URL],
                  resourceDomains: [WIDGET_BASE_URL, WIDGET_SERVER_URL],
                },
              },
            },
          },
        ],
      };
    },
  );
};
