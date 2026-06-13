import { readFileSync } from "node:fs";
import path from "node:path";
import {
  registerAppResource,
  RESOURCE_MIME_TYPE,
} from "@modelcontextprotocol/ext-apps/server";

const WIDGET_URI = "ui://weather/current-weather.html";
const DIST_DIR = path.resolve(process.cwd(), "dist");
const WIDGET_HTML_PATH = path.join(DIST_DIR, "weather-card.html");

const inlineWeatherWidgetHtml = () => {
  const html = readFileSync(WIDGET_HTML_PATH, "utf8");

  const stylesheetHrefs = [...html.matchAll(/<link rel="stylesheet" crossorigin href="([^"]+)"\s*\/?>(?:<\/link>)?/g)].map(
    (match) => match[1],
  );
  const modulePreloads = [...html.matchAll(/<link rel="modulepreload" crossorigin href="([^"]+)"\s*\/?>(?:<\/link>)?/g)].map(
    (match) => match[1],
  );
  const scriptMatch = html.match(
    /<script type="module" crossorigin src="([^"]+)"><\/script>/,
  );

  let inlinedHtml = html;

  stylesheetHrefs.forEach((href) => {
    const cssPath = path.join(DIST_DIR, href.replace(/^\//, ""));
    const css = readFileSync(cssPath, "utf8");
    inlinedHtml = inlinedHtml.replace(
      new RegExp(`<link rel="stylesheet" crossorigin href="${href.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"\\s*\\/?>`, "g"),
      `<style>${css}</style>`,
    );
  });

  modulePreloads.forEach((href) => {
    const modulePath = path.join(DIST_DIR, href.replace(/^\//, ""));
    const moduleSource = readFileSync(modulePath, "utf8");
    inlinedHtml = inlinedHtml.replace(
      new RegExp(`<link rel="modulepreload" crossorigin href="${href.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"\\s*\\/?>`, "g"),
      `<script type="module">${moduleSource}</script>`,
    );
  });

  if (scriptMatch) {
    const scriptHref = scriptMatch[1];
    const scriptPath = path.join(DIST_DIR, scriptHref.replace(/^\//, ""));
    const scriptSource = readFileSync(scriptPath, "utf8");
    inlinedHtml = inlinedHtml.replace(
      scriptMatch[0],
      `<script type="module">${scriptSource}</script>`,
    );
  }

  return inlinedHtml;
};

export const registerCurrentWeatherWidgetResource = (server: any) => {
  registerAppResource(
    server,
    "Weather Current Widget",
    WIDGET_URI,
    {
      description: "Interactive current weather card for ChatGPT.",
    },
    async () => ({
      contents: [
        {
          uri: WIDGET_URI,
          mimeType: RESOURCE_MIME_TYPE,
          text: inlineWeatherWidgetHtml(),
          _meta: {
            ui: {
              prefersBorder: true,
            },
          },
        },
      ],
    }),
  );
};
