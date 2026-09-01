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
    const store = (window as any).__MCP_WIDGET_STORE__;
    if (store?.getState?.()?.setToolResult) {
      store.getState().setToolResult(result);
      return true;
    }
  } catch (err) {
    console.warn("[MCP Bridge] applyReQueryResult error:", err);
  }
  return false;
}

