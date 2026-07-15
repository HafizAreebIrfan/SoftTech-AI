import {
  registerAppResource,
  RESOURCE_MIME_TYPE,
} from "@modelcontextprotocol/ext-apps/server";

const WIDGET_BASE_URL = "https://softtech-ai-app.onrender.com";

const GENERIC_WIDGET_RESOURCES = [
  {
    name: "Generic Widget",
    uri: "ui://generic/widgets.html",
    url: `${WIDGET_BASE_URL}/widgets.html`,
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

const resolveRelativeUrl = (relativePath: string, baseUrl: string) => {
  return new URL(relativePath, baseUrl).toString();
};

const inlineRemoteWidgetHtml = async (widgetUrl: string) => {
  let html = "";
  try {
    html = await fetchText(widgetUrl);
    console.log(html);
    html = html.replace(/<link rel="modulepreload"[^>]*>/g, "");
  } catch (e) {
    console.log("Error fetching widget html: ", e);
    return "";
  }

  // 1. Remove modulepreload links to prevent redundant resource preloads

  // 2. Inline stylesheet files
  const stylesheetHrefs = [
    ...html.matchAll(/<link rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g),
  ].map((match) => match[1]);

  for (const href of stylesheetHrefs) {
    const css = await fetchText(resolveWidgetAssetUrl(href));

    html = html.replace(
      new RegExp(
        `<link rel="stylesheet"[^>]*href="${escapeRegExp(href)}"[^>]*>`,
        "g",
      ),
      `<style>${css}</style>`,
    );
  }

  // 3. Inline script modules and resolve their imports as local data URIs
  const scriptSrcs = [
    ...html.matchAll(
      /<script\s+type="module"[^>]*src="([^"]+)"[^>]*><\/script>/g,
    ),
  ].map((match) => match[1]);

  for (const src of scriptSrcs) {
    const absoluteScriptUrl = resolveWidgetAssetUrl(src);
    let jsContent = await fetchText(absoluteScriptUrl);

    // Find relative imports like: from "./index-XXXX.js" or from"./index-XXXX.js"
    const importMatches = [
      ...jsContent.matchAll(/from\s*["'](\.\/[^"']+\.js)["']/g),
    ];

    for (const match of importMatches) {
      const relativePath = match[1];
      const absoluteImportUrl = resolveRelativeUrl(
        relativePath,
        absoluteScriptUrl,
      );
      const importedJs = await fetchText(absoluteImportUrl);
      const dataUri = `data:text/javascript;base64,${Buffer.from(importedJs).toString("base64")}`;

      jsContent = jsContent.replaceAll(match[0], `from "${dataUri}"`);
    }

    html = html.replace(
      new RegExp(
        `<script\\s+type="module"[^>]*src="${escapeRegExp(src)}"[^>]*><\\/script>`,
        "g",
      ),
      `<script type="module">${jsContent}</script>`,
    );
  }

  return rewriteAssetUrls(html);
};

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
            text: await inlineRemoteWidgetHtml(widget.url),
            _meta: {
              ui: {
                prefersBorder: true,
              },
              csp: {
                connectDomains: [WIDGET_BASE_URL],
                resourceDomains: [WIDGET_BASE_URL, "data:"],
                domain: WIDGET_BASE_URL,
                "openai/widgetPrefersBorder": true,
                "openai/widgetCSP": {
                  connect_domains: [WIDGET_BASE_URL],
                  resource_domains: [WIDGET_BASE_URL, "data:"],
                },
                "openai/widgetDomain": WIDGET_BASE_URL,
              },
            },
          },
        ],
      }),
    );
  });
};
