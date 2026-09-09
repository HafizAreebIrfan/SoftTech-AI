import {
  useMcpWidgetStore,
  extractToolResult,
} from "../infrastructure/store/mcpWidgetStore";

/**
 * MCP Bridge — calls tools via the OpenAI Apps SDK.
 *
 * Priority order (based on verified working path):
 *   1. window.openai.callTool  — the documented, working Apps SDK method
 *   2. sendFollowUpMessage     — asks the model to run the tool (non-deterministic)
 *   3. postMessage JSON-RPC    — last resort, not answered by ChatGPT sandbox
 */

export async function callMcpTool(
  toolName: string,
  args: Record<string, unknown>,
): Promise<unknown> {
  console.log(
    `[MCP Bridge] → Calling tool "${toolName}" with args:`,
    JSON.parse(JSON.stringify(args)),
  );

  const openai =
    typeof window !== "undefined" ? (window as any).openai : undefined;

  // 1. Try the documented Apps SDK callTool first — this actually works
  if (openai?.callTool) {
    console.log(
      `[MCP Bridge] → Calling window.openai.callTool("${toolName}")`,
    );
    try {
      const result = await openai.callTool(toolName, args);
      console.log(
        `[MCP Bridge] ✓ callTool succeeded for "${toolName}":`,
        result,
      );
      return result;
    } catch (err) {
      console.warn(
        `[MCP Bridge] ✗ callTool failed for "${toolName}":`,
        err,
      );
      // Fall through to next method
    }
  }

  // 2. Ask the model to execute the tool (non-deterministic, no result)
  if (openai?.sendFollowUpMessage) {
    const prompt = `Execute tool "${toolName}" with arguments: ${JSON.stringify(args)}`;
    console.log(
      `[MCP Bridge] → Falling back to sendFollowUpMessage for "${toolName}"`,
    );
    openai.sendFollowUpMessage({ prompt });
    console.log(
      `[MCP Bridge] ✓ Follow-up message sent for "${toolName}" (no direct result expected)`,
    );
    return null;
  }

  // 3. Last resort: postMessage JSON-RPC (ChatGPT may not answer)
  console.warn(
    `[MCP Bridge] → Last resort: postMessage tools/call for "${toolName}"`,
  );
  try {
    const id = Date.now();
    const result = await new Promise<unknown>((resolve, reject) => {
      const handler = (event: MessageEvent) => {
        const msg = event.data;
        if (msg?.jsonrpc === "2.0" && msg.id === id) {
          window.removeEventListener("message", handler);
          if (msg.error) reject(msg.error);
          else resolve(msg.result);
        }
      };
      window.addEventListener("message", handler);
      window.parent?.postMessage(
        {
          jsonrpc: "2.0",
          id,
          method: "tools/call",
          params: { name: toolName, arguments: args },
        },
        "*",
      );
      setTimeout(() => {
        window.removeEventListener("message", handler);
        reject(new Error(`Tool call "${toolName}" timed out`));
      }, 10000);
    });
    console.log(`[MCP Bridge] ✓ postMessage succeeded for "${toolName}":`, result);
    return result;
  } catch (err) {
    console.error(`[MCP Bridge] ✗ All methods failed for "${toolName}":`, err);
    throw new Error(
      `[MCP Bridge] No available method to call tool "${toolName}". ` +
        `window.openai is ${typeof openai}.`,
    );
  }
}

/**
 * Send a follow-up message to ChatGPT via the MCP Apps bridge.
 */
export function sendFollowUpMessage(prompt: string): void {
  const openai =
    typeof window !== "undefined" ? (window as any).openai : undefined;
  if (openai?.sendFollowUpMessage) {
    console.log(`[MCP Bridge] → sendFollowUpMessage:`, prompt);
    openai.sendFollowUpMessage({ prompt });
  } else {
    console.log(`[MCP Bridge] → postMessage ui/message:`, prompt);
    window.parent?.postMessage(
      { jsonrpc: "2.0", method: "ui/message", params: { prompt } },
      "*",
    );
  }
}

export type WidgetDisplayMode = "inline" | "fullscreen" | "pip";

/**
 * Ask the host to change the widget display mode (Apps SDK). The host decides
 * whether to grant it; feature-detected so it's a no-op on hosts that lack it
 * (the widget simply stays inline). Generic — no company-specific logic.
 */
export async function requestDisplayMode(
  mode: WidgetDisplayMode,
): Promise<boolean> {
  const openai =
    typeof window !== "undefined" ? (window as any).openai : undefined;
  if (!openai?.requestDisplayMode) {
    return false;
  }
  try {
    const result = await openai.requestDisplayMode({ mode });
    const granted = result?.mode ?? mode;
    console.log(
      `[MCP Bridge] → requestDisplayMode("${mode}") → granted "${granted}"`,
    );
    return granted === mode;
  } catch (err) {
    console.warn(`[MCP Bridge] ✗ requestDisplayMode("${mode}") failed:`, err);
    return false;
  }
}

/**
 * Get the initial tool input passed by the AI model.
 */
export function getToolInput(): Record<string, any> | undefined {
  const openai =
    typeof window !== "undefined" ? (window as any).openai : undefined;
  return openai?.toolInput || (window as any).__WIDGET_DATA__?.toolInput;
}

/**
 * Re-render the widget with a freshly fetched tool result from an MCP tool call.
 */
export function applyReQueryResult(result: unknown): boolean {
  if (!result) return false;
  try {
    const payload = extractToolResult(result) || (result as any);
    if (payload) {
      useMcpWidgetStore.getState().setToolResult(payload);
      return true;
    }
  } catch (err) {
    console.warn("[MCP Bridge] applyReQueryResult error:", err);
  }
  return false;
}

/**
 * Open a URL outside the widget sandbox. Prefers the Apps SDK `openExternal`
 * (which respects the host's redirect_domains allow-list); falls back to
 * `window.open` on hosts that don't expose it. Generic — the href is supplied
 * by the caller (an interpolated, company-registered URL), never hardcoded.
 */
export function openExternalUrl(href: string): void {
  if (!href) return;
  const openai =
    typeof window !== "undefined" ? (window as any).openai : undefined;
  try {
    if (openai?.openExternal) {
      openai.openExternal({ href });
      return;
    }
  } catch (err) {
    console.warn("[MCP Bridge] openExternal failed, falling back:", err);
  }
  if (typeof window !== "undefined") {
    window.open(href, "_blank", "noopener,noreferrer");
  }
}

/**
 * Override the target of the ChatGPT fullscreen header "Open in {app}" button
 * (Apps SDK `setOpenInAppUrl`). Feature-detected no-op on hosts that lack it.
 * The href is a company-registered catalog URL passed by the caller.
 */
export function setOpenInApp(href: string): void {
  if (!href) return;
  const openai =
    typeof window !== "undefined" ? (window as any).openai : undefined;
  try {
    if (openai?.setOpenInAppUrl) {
      openai.setOpenInAppUrl({ href });
    }
  } catch (err) {
    console.warn("[MCP Bridge] setOpenInAppUrl failed:", err);
  }
}

/**
 * Pure string templating for registered redirect URLs. Replaces every `{key}`
 * token with `extra[key]` (e.g. a user-selected option) or, failing that,
 * `record[key]` — matched case-insensitively so `{insurancetier}` resolves an
 * `insuranceTier` field. Unknown tokens collapse to empty (the company's
 * destination page prompts for whatever it still needs). Values are
 * URL-encoded. Never keys off entity/company names.
 */
export function interpolateTemplate(
  template: string,
  record: Record<string, unknown> = {},
  extra: Record<string, unknown> = {},
): string {
  if (!template) return "";

  const lookup = (rawKey: string): unknown => {
    const key = rawKey.trim();
    if (key in extra && extra[key] !== undefined && extra[key] !== null) {
      return extra[key];
    }
    if (key in record && record[key] !== undefined && record[key] !== null) {
      return record[key];
    }

    const lower = key.toLowerCase();

    // 1. Case-insensitive exact search in extra & record
    for (const src of [extra, record]) {
      for (const k of Object.keys(src)) {
        if (k.toLowerCase() === lower && src[k] !== undefined && src[k] !== null) {
          return src[k];
        }
      }
    }

    // 2. Generic Semantic Fallbacks
    // Entity / Product / Item / Car IDs
    if (lower === "id" || lower.endsWith("id")) {
      const idVal = record.id ?? record._id ?? extra.id ?? extra._id;
      if (idVal !== undefined && idVal !== null) return idVal;
    }

    // Location IDs
    if (lower.includes("location")) {
      const locObj = (record.location || extra.location) as any;
      const locVal =
        extra[key] ??
        record[key] ??
        record.locationId ??
        locObj?.id ??
        locObj?._id ??
        record.pickupLocationId ??
        record.dropoffLocationId ??
        record.id;
      if (locVal !== undefined && locVal !== null) return locVal;
    }

    // Dates
    if (lower.includes("pickup") || lower.includes("start") || lower === "date" || lower === "datefrom") {
      const dVal =
        extra.pickupDate ??
        extra.startDate ??
        extra.date ??
        extra.datefrom ??
        record.pickupDate ??
        record.startDate ??
        record.date ??
        new Date().toISOString().split("T")[0];
      if (dVal !== undefined && dVal !== null) return dVal;
    }

    if (lower.includes("dropoff") || lower.includes("end") || lower === "dateto") {
      const dVal =
        extra.dropoffDate ??
        extra.endDate ??
        extra.dateto ??
        record.dropoffDate ??
        record.endDate ??
        record.dateto;
      if (dVal !== undefined && dVal !== null && dVal !== "") return dVal;
    }

    // Tier / Insurance
    if (lower.includes("insurance") || lower === "tier") {
      const tVal =
        extra.insuranceTier ??
        extra.insurancetier ??
        extra.tier ??
        record.insuranceTier ??
        record.insurancetier ??
        record.tier;
      if (tVal !== undefined && tVal !== null) return tVal;
    }

    // Quantity
    if (lower === "qty" || lower === "quantity" || lower === "count") {
      return extra.quantity ?? extra.qty ?? record.quantity ?? record.qty ?? 1;
    }

    // Price / Total
    if (lower === "price" || lower === "total" || lower === "amount") {
      return (
        extra.total ??
        extra.price ??
        record.$price ??
        record.price ??
        record.dailyRate ??
        record.amount
      );
    }

    return undefined;
  };

  return template.replace(/\{([^}]+)\}/g, (_match, rawKey) => {
    const value = lookup(String(rawKey));
    if (value === undefined || value === null || typeof value === "object") {
      return "";
    }
    return encodeURIComponent(String(value));
  });
}

