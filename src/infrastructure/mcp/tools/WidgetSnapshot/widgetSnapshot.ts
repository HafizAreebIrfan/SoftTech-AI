import { CompanyModel } from "../../../../adapters/persistence/models/companies/register/companyinfo";
import { ICompany } from "../../../../domain/types/company.types";
import { McpToolResultPayload } from "../../../../domain/types/genericWidget.types";

const DEFAULT_WIDGET_RESOURCE_URI = "ui://generic/widgets.html";

type CompanyWidgetSnapshotDocument = {
  latestWidgetSnapshot?: McpToolResultPayload | null;
};

const normalizeKey = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const getCompanyWidgetResourceUri = (
  company: Pick<ICompany, "mcpSlug" | "companyName">,
) => {
  const slug = normalizeKey(
    String(company.mcpSlug || company.companyName || ""),
  );

  if (!slug) {
    return DEFAULT_WIDGET_RESOURCE_URI;
  }

  return `ui://generic/${slug}/widgets.html`;
};

export const getCompanyWidgetResourceUris = (company: ICompany) => {
  const uris = new Set<string>();
  uris.add(getCompanyWidgetResourceUri(company));

  for (const api of company.apis ?? []) {
    if (api?.mcpResourceUri && typeof api.mcpResourceUri === "string") {
      uris.add(api.mcpResourceUri);
    }
  }

  return [...uris];
};

export const persistCompanyWidgetSnapshot = async (
  company: Pick<ICompany, "mcpSlug">,
  payload: McpToolResultPayload,
) => {
  const slug = String(company.mcpSlug || "")
    .trim()
    .toLowerCase();

  if (!slug) {
    return;
  }

  try {
    await CompanyModel.updateOne(
      { mcpSlug: slug },
      {
        $set: {
          latestWidgetSnapshot: payload,
          latestWidgetSnapshotUpdatedAt: new Date(),
        },
      },
    );
  } catch (error) {
    console.error("[MCP Snapshot] Failed to persist company widget snapshot:", {
      slug,
      error,
    });
  }
};

export const loadCompanyWidgetSnapshot = async (
  company: Pick<ICompany, "mcpSlug">,
) => {
  const slug = String(company.mcpSlug || "")
    .trim()
    .toLowerCase();

  if (!slug) {
    return null;
  }

  try {
    const result = (await CompanyModel.findOne(
      { mcpSlug: slug },
      { latestWidgetSnapshot: 1 },
    ).lean()) as CompanyWidgetSnapshotDocument | null;

    return result?.latestWidgetSnapshot ?? null;
  } catch (error) {
    console.error("[MCP Snapshot] Failed to load company widget snapshot:", {
      slug,
      error,
    });
    return null;
  }
};

export const serializeWidgetBootstrap = (
  payload: McpToolResultPayload | null,
) => {
  if (!payload) {
    return [
      "window.__SOFTTECH_AI_WIDGET_BOOTSTRAP__ = null;",
      "window.openai = window.openai || {};",
      "window.openai.widgetState = { toolResult: null };",
    ].join("\n");
  }

  const json = JSON.stringify(payload).replace(/</g, "\\u003c");

  return [
    `window.__SOFTTECH_AI_WIDGET_BOOTSTRAP__ = ${json};`,
    "window.openai = window.openai || {};",
    `window.openai.widgetState = { toolResult: window.__SOFTTECH_AI_WIDGET_BOOTSTRAP__ };`,
  ].join("\n");
};
