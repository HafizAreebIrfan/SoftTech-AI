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
  if (!href || typeof href !== "string") return;
  const safeHref = href.trim();
  if (!safeHref.startsWith("http://") && !safeHref.startsWith("https://")) {
    return;
  }

  const applyUrl = () => {
    const openai =
      typeof window !== "undefined"
        ? (window as any).openai ||
          (window.parent as any)?.openai ||
          (window.top as any)?.openai
        : undefined;

    if (typeof window !== "undefined") {
      (window as any).__OPEN_IN_APP_URL__ = safeHref;
    }

    try {
      if (typeof openai?.setOpenInAppUrl === "function") {
        try {
          openai.setOpenInAppUrl({ href: safeHref });
        } catch {
          openai.setOpenInAppUrl(safeHref);
        }
      }
      // Broadcast to parent frame across all standard host message conventions
      if (typeof window !== "undefined" && window.parent && window.parent !== window) {
        window.parent.postMessage(
          { jsonrpc: "2.0", method: "ui/setOpenInAppUrl", params: { href: safeHref } },
          "*",
        );
        window.parent.postMessage(
          { jsonrpc: "2.0", method: "setOpenInAppUrl", params: { href: safeHref } },
          "*",
        );
        window.parent.postMessage(
          { type: "setOpenInAppUrl", href: safeHref },
          "*",
        );
        window.parent.postMessage(
          { action: "setOpenInAppUrl", url: safeHref },
          "*",
        );
      }
    } catch (err) {
      console.warn("[MCP Bridge] setOpenInAppUrl failed:", err);
    }
  };

  // Run immediately
  applyUrl();

  // Retry in case window.openai is injected asynchronously by ChatGPT/host
  if (typeof window !== "undefined") {
    setTimeout(applyUrl, 300);
    setTimeout(applyUrl, 1000);
  }
}

/**
 * Pure string templating for registered redirect URLs. Replaces every `{key}`
 * token with `extra[key]` (e.g. a user-selected option) or `record[key]` —
 * matched context-aware and case-insensitively.
 * Ensures location IDs, car/product IDs, dates, and insurance tiers never clash.
 */
export function interpolateTemplate(
  template: string,
  record: Record<string, unknown> = {},
  extra: Record<string, unknown> = {},
): string {
  if (!template) return "";

  return template.replace(/\{([^}]+)\}/g, (_match, rawKey, offset, fullString) => {
    let key = String(rawKey).trim();
    let lower = key.toLowerCase();

    // Check query parameter context preceding this placeholder (e.g. "pickupLocationId={id}")
    const preceding = fullString.slice(0, offset);
    const paramMatch = preceding.match(/([a-zA-Z0-9_-]+)=$/);
    const paramName = paramMatch ? paramMatch[1].toLowerCase() : "";

    // Contextual parameter inference: if key is generic "id", use the query param name
    if (lower === "id" || lower === "itemid" || lower === "val") {
      if (
        paramName.includes("pickup") ||
        (paramName.includes("location") && !paramName.includes("dropoff"))
      ) {
        key = "pickupLocationId";
        lower = "pickuplocationid";
      } else if (paramName.includes("dropoff") || paramName.includes("return")) {
        key = "dropoffLocationId";
        lower = "dropofflocationid";
      } else if (paramName.includes("car") || paramName.includes("vehicle")) {
        key = "carId";
        lower = "carid";
      } else if (paramName.includes("product") || paramName.includes("item")) {
        key = "productId";
        lower = "productid";
      }
    }

    // 1. Exact match in extra (user-selected options or explicit call params have highest priority)
    if (key in extra && extra[key] !== undefined && extra[key] !== null) {
      return encodeURIComponent(String(extra[key]));
    }
    for (const k of Object.keys(extra)) {
      if (k.toLowerCase() === lower && extra[k] !== undefined && extra[k] !== null) {
        return encodeURIComponent(String(extra[k]));
      }
    }

    // 2. Exact match in record (scalars only, not objects)
    if (
      key in record &&
      record[key] !== undefined &&
      record[key] !== null &&
      typeof record[key] !== "object"
    ) {
      return encodeURIComponent(String(record[key]));
    }
    for (const k of Object.keys(record)) {
      if (
        k.toLowerCase() === lower &&
        record[k] !== undefined &&
        record[k] !== null &&
        typeof record[k] !== "object"
      ) {
        return encodeURIComponent(String(record[k]));
      }
    }

    // 3. Semantic Fallbacks (Specific checks FIRST so they are never shadowed)

    // A. Locations (pickupLocationId, dropoffLocationId, locationId)
    if (
      lower.includes("location") ||
      lower.includes("pickup") ||
      lower.includes("dropoff") ||
      lower.includes("branch")
    ) {
      const locObj = (record.location || extra.location) as any;
      if (lower.includes("dropoff")) {
        const dVal =
          extra.dropoffLocationId ??
          extra.dropoffLocation ??
          extra.dropoffId ??
          extra.pickupLocationId ??
          extra.locationId ??
          record.dropoffLocationId ??
          record.locationId ??
          locObj?.id ??
          locObj?._id;
        if (dVal !== undefined && dVal !== null) return encodeURIComponent(String(dVal));
      }
      const lVal =
        extra.pickupLocationId ??
        extra.locationId ??
        extra.pickupLocation ??
        extra.location ??
        record.pickupLocationId ??
        record.locationId ??
        locObj?.id ??
        locObj?._id;
      if (lVal !== undefined && lVal !== null) return encodeURIComponent(String(lVal));
    }

    // B. Dates (pickupDate, dropoffDate, startDate, endDate, date, dateto)
    if (
      lower.includes("pickup") ||
      lower.includes("start") ||
      lower === "date" ||
      lower === "datefrom"
    ) {
      const dVal =
        extra.pickupDate ??
        extra.startDate ??
        extra.date ??
        extra.datefrom ??
        record.pickupDate ??
        record.startDate ??
        record.date ??
        new Date().toISOString().split("T")[0];
      if (dVal !== undefined && dVal !== null) return encodeURIComponent(String(dVal));
    }

    if (
      lower.includes("dropoff") ||
      lower.includes("end") ||
      lower === "dateto"
    ) {
      const dVal =
        extra.dropoffDate ??
        extra.endDate ??
        extra.dateto ??
        record.dropoffDate ??
        record.endDate ??
        record.dateto;
      if (dVal !== undefined && dVal !== null && dVal !== "") return encodeURIComponent(String(dVal));
    }

    // C. Tier / Insurance
    if (lower.includes("insurance") || lower === "tier") {
      const tVal =
        extra.insuranceTier ??
        extra.insurancetier ??
        extra.tier ??
        record.insuranceTier ??
        record.insurancetier ??
        record.tier;
      if (tVal !== undefined && tVal !== null) return encodeURIComponent(String(tVal));
    }

    // D. Quantity
    if (lower === "qty" || lower === "quantity" || lower === "count") {
      const qVal = extra.quantity ?? extra.qty ?? record.quantity ?? record.qty ?? 1;
      return encodeURIComponent(String(qVal));
    }

    // E. Price / Total
    if (
      lower === "price" ||
      lower === "total" ||
      lower === "amount" ||
      lower.includes("rate")
    ) {
      const pVal =
        extra.total ??
        extra.price ??
        record.$price ??
        record.price ??
        record.pricePerDay ??
        record.dailyRate ??
        record.amount;
      if (pVal !== undefined && pVal !== null) return encodeURIComponent(String(pVal));
    }

    // F. Entity / Car / Product ID (Strict check so it doesn't match location keys)
    if (
      lower === "id" ||
      lower === "carid" ||
      lower === "productid" ||
      lower === "itemid" ||
      lower === "_id"
    ) {
      const idVal = record.id ?? record._id ?? extra.carId ?? extra.productId ?? extra.id ?? extra._id;
      if (idVal !== undefined && idVal !== null) return encodeURIComponent(String(idVal));
    }

    return "";
  });
}

