let nextRequestId = 1;
const pendingRequests = new Map<
  number,
  { resolve: (value: unknown) => void; reject: (reason: unknown) => void }
>();

if (typeof window !== "undefined") {
  window.addEventListener(
    "message",
    (event: MessageEvent) => {
      const message = event.data;
      if (!message || message.jsonrpc !== "2.0") return;
      if (message.id === undefined) return;

      const pending = pendingRequests.get(message.id);
      if (!pending) return;

      pendingRequests.delete(message.id);
      if (message.error) {
        pending.reject(message.error);
      } else {
        pending.resolve(message.result);
      }
    },
    { passive: true },
  );
}

/**
 * Call an MCP tool using the standard JSON-RPC `tools/call` method over
 * postMessage, as documented at
 * https://developers.openai.com/plugins/build/chatgpt-ui
 *
 * Falls back to `window.openai.callTool` (ChatGPT compatibility alias)
 * and then to `sendFollowUpMessage` as a last resort.
 */
export async function callMcpTool(
  toolName: string,
  args: Record<string, unknown>,
): Promise<unknown> {
  // 1. Try standard MCP Apps JSON-RPC bridge first
  if (typeof window !== "undefined" && window.parent) {
    try {
      const id = nextRequestId++;
      const result = await new Promise<unknown>((resolve, reject) => {
        pendingRequests.set(id, { resolve, reject });
        window.parent.postMessage(
          { jsonrpc: "2.0", id, method: "tools/call", params: { name: toolName, arguments: args } },
          "*",
        );
        // Timeout after 15s
        setTimeout(() => {
          if (pendingRequests.has(id)) {
            pendingRequests.delete(id);
            reject(new Error(`Tool call "${toolName}" timed out`));
          }
        }, 15000);
      });
      return result;
    } catch (err) {
      console.warn(`[MCP Bridge] tools/call failed for "${toolName}":`, err);
      // Fall through to next method
    }
  }

  // 2. Try ChatGPT compatibility alias
  const openai = typeof window !== "undefined" ? (window as any).openai : undefined;
  if (openai?.callTool) {
    try {
      return await openai.callTool(toolName, args);
    } catch (err) {
      console.warn(`[MCP Bridge] openai.callTool failed for "${toolName}":`, err);
    }
  }

  // 3. Last resort: send follow-up message
  if (openai?.sendFollowUpMessage) {
    openai.sendFollowUpMessage({
      prompt: `Execute tool "${toolName}" with arguments: ${JSON.stringify(args)}`,
    });
    return null;
  }

  throw new Error(
    `[MCP Bridge] No available method to call tool "${toolName}". ` +
    `window.openai is ${typeof openai}.`,
  );
}

/**
 * Send a follow-up message to ChatGPT via the MCP Apps bridge.
 */
export function sendFollowUpMessage(prompt: string): void {
  const openai = typeof window !== "undefined" ? (window as any).openai : undefined;
  if (openai?.sendFollowUpMessage) {
    openai.sendFollowUpMessage({ prompt });
  } else {
    // Fallback: post JSON-RPC message
    window.parent?.postMessage(
      { jsonrpc: "2.0", method: "ui/message", params: { prompt } },
      "*",
    );
  }
}
