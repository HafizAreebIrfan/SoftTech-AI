import {
  registerAppResource,
  RESOURCE_MIME_TYPE,
} from "@modelcontextprotocol/ext-apps/server";

const WIDGET_BASE_URL = "https://softtech-ai-app.onrender.com";

const WEATHER_WIDGETS = [
  {
    name: "Weather Current Widget",
    uri: "ui://weather/current-weather.html",
    url: `${WIDGET_BASE_URL}/weather-card.html`,
  },
  {
    name: "Weather Forecast Widget",
    uri: "ui://weather/forecast-weather.html",
    url: `${WIDGET_BASE_URL}/forecast-card.html`,
  },
  {
    name: "Weather Air Quality Widget",
    uri: "ui://weather/airquality-weather.html",
    url: `${WIDGET_BASE_URL}/airquality-card.html`,
  },
];

const fetchText = async (url: string) => {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  return response.text();
};

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const resolveWidgetAssetUrl = (href: string) =>
  new URL(href, WIDGET_BASE_URL).toString();

const rewriteAssetUrls = (html: string) =>
  html
    .replaceAll('href="/assets/', `href="${WIDGET_BASE_URL}/assets/`)
    .replaceAll('src="/assets/', `src="${WIDGET_BASE_URL}/assets/`);

const inlineRemoteWidgetHtml = async (widgetUrl: string) => {
  let html = await fetchText(widgetUrl);

  const stylesheetHrefs = [
    ...html.matchAll(
      /<link rel="stylesheet" crossorigin href="([^"]+)"\s*\/?>/g,
    ),
  ].map((match) => match[1]);

  for (const href of stylesheetHrefs) {
    const css = await fetchText(resolveWidgetAssetUrl(href));

    html = html.replace(
      new RegExp(
        `<link rel="stylesheet" crossorigin href="${escapeRegExp(href)}"\\s*\\/?>`,
        "g",
      ),
      `<style>${css}</style>`,
    );
  }

  return rewriteAssetUrls(html);
};

export const registerWeatherWidgetResources = (server: any) => {
  WEATHER_WIDGETS.forEach((widget) => {
    registerAppResource(
      server,
      widget.name,
      widget.uri,
      {
        description: "Interactive weather widget for ChatGPT.",
      },
      async () => ({
        contents: [
          {
            uri: widget.uri,
            mimeType: RESOURCE_MIME_TYPE,
            text: await inlineRemoteWidgetHtml(widget.url),
            _meta: {
              ui: {
                prefersBorder: true,
              },
            },
          },
        ],
      }),
    );
  });
};
