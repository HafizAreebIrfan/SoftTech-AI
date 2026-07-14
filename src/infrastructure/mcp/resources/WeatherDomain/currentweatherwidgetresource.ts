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

const inlineWeatherWidgetHtml = (widgetUrl: string) => `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="stylesheet" href="/assets/weatherCard-YjrL11lu.css">
    <title>Weather Widget</title>
    <style>
      html, body, iframe {
        width: 100%;
        height: 100%;
        margin: 0;
        border: 0;
      }
    </style>
  </head>
  <body>
    <iframe src="${widgetUrl}" title="Weather Widget"></iframe>
    <script type="module" crossorigin src="/assets/weatherCard-BmFwow1m.js"></script>
  </body>
</html>
`;

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
            text: inlineWeatherWidgetHtml(widget.url),
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
