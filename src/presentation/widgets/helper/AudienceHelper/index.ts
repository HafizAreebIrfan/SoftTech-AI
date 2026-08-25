import type {
  WidgetAction,
  WidgetAudience,
  Capabilities,
} from "../../../../domain/entities/GenericWidget";

/**
 * Audience / action helpers.
 *
 * Everything here is derived from the data already present in a tool response
 * (action ids/tools, capability flags, audience) — never from entity or
 * company/industry names — so it stays generic across every company.
 */

export type ActionRole = "mutate" | "view" | "commerce" | "other";

const MUTATE_RE = /(create|update|edit|delete|remove|add|save|new)/i;
const VIEW_RE = /(view|detail|select|single|show|open|get|read)/i;
const COMMERCE_RE =
  /(buy|purchase|checkout|order|cart|book|reserve|pay|subscribe)/i;

const actionText = (action: unknown): string => {
  const a = (action || {}) as { id?: string; tool?: string };
  return `${a.id ?? ""} ${a.tool ?? ""}`.toLowerCase();
};

/** Classify an action by intent so the UI can place/gate it per audience. */
export const classifyAction = (action: unknown): ActionRole => {
  const text = actionText(action);
  // Commerce first: "order"/"book"/"reserve" are purchases, not mutations.
  if (COMMERCE_RE.test(text)) return "commerce";
  if (MUTATE_RE.test(text)) return "mutate";
  if (VIEW_RE.test(text)) return "view";
  return "other";
};

/** First action that fetches a single record (get-by-id) — powers card→detail. */
export const findDetailTool = (
  actions: WidgetAction[] = [],
): WidgetAction | undefined =>
  actions.find((a) => Boolean(a?.tool) && classifyAction(a) === "view");

/**
 * Tolerant capability read. Backend emits `filter`/`sort`/`pagination`/`create`…
 * while the entity type declares `canFilter`/`canSort`/… — accept either, and
 * allow aliases (e.g. "paginate" vs "pagination").
 */
export const capOn = (
  capabilities: Capabilities | undefined,
  ...keys: string[]
): boolean => {
  if (!capabilities) return false;
  const cap = capabilities as Record<string, boolean | undefined>;
  return keys.some((key) => {
    const canKey = "can" + key.charAt(0).toUpperCase() + key.slice(1);
    return Boolean(cap[canKey] ?? cap[key]);
  });
};

export interface WidgetPermissions {
  /** Admin-only: create/update/delete affordances may be shown. */
  canMutate: boolean;
  /** Everyone may view/read. */
  canView: boolean;
  /** Customer-only: purchase/checkout affordances make sense. */
  canPurchase: boolean;
}

/**
 * Derive what the current audience is allowed to do. Customers can NEVER mutate
 * (defense-in-depth even if a mutating action slipped through), so admin and
 * customer surfaces never merge.
 */
export const getPermissions = (
  audience: WidgetAudience | undefined,
  capabilities: Capabilities | undefined,
  actions: WidgetAction[] = [],
): WidgetPermissions => {
  const isAdmin = audience === "admin";
  const hasMutateAction = actions.some((a) => classifyAction(a) === "mutate");
  const hasMutateCap = capOn(capabilities, "create", "update", "delete");
  const hasCommerceAction = actions.some(
    (a) => classifyAction(a) === "commerce",
  );

  return {
    canMutate: isAdmin && (hasMutateAction || hasMutateCap),
    canView: true,
    canPurchase: !isAdmin && hasCommerceAction,
  };
};
