/**
 * Utility to get the ChatGPT chat URL from the widget iframe context,
 * and to detect checkout completion for redirect-back flow.
 */

/** Try to read the ChatGPT conversation URL from the parent frame. */
export function getChatUrl(): string | null {
  try {
    if (window.top && window.top.location && window.top.location.href) {
      const href = window.top.location.href;
      if (href.startsWith("http") && href.includes("chatgpt.com")) {
        return href.split("#")[0].split("?")[0];
      }
    }
  } catch {
    // Cross-origin — try referrer fallback
  }
  try {
    const ref = document.referrer;
    if (ref && ref.includes("chatgpt.com")) {
      return ref.split("#")[0].split("?")[0];
    }
  } catch {
    // Ignore
  }
  return null;
}

/** Append chat_url param to a checkout URL. */
export function appendChatUrlToCheckout(checkoutUrl: string): string {
  const chatUrl = getChatUrl();
  if (!chatUrl) return checkoutUrl;
  try {
    const url = new URL(checkoutUrl);
    url.searchParams.set("chat_url", chatUrl);
    return url.toString();
  } catch {
    const separator = checkoutUrl.includes("?") ? "&" : "?";
    return `${checkoutUrl}${separator}chat_url=${encodeURIComponent(chatUrl)}`;
  }
}

const CHECKOUT_STORAGE_KEY = "softtech_checkout_pending";
const CHECKOUT_TIMESTAMP_KEY = "softtech_checkout_timestamp";

/**
 * Mark that a checkout was initiated (called from widget before window.open).
 */
export function markCheckoutPending(): void {
  try {
    sessionStorage.setItem(CHECKOUT_STORAGE_KEY, "true");
    sessionStorage.setItem(CHECKOUT_TIMESTAMP_KEY, String(Date.now()));
  } catch {
    // Ignore
  }
}

/**
 * Check if there was a pending checkout that completed (user returned).
 * Returns true if checkout was pending and has now completed.
 */
export function isCheckoutCompleted(): boolean {
  try {
    const pending = sessionStorage.getItem(CHECKOUT_STORAGE_KEY);
    if (pending !== "true") return false;
    // If pending flag exists and user is back in the widget, assume completion
    clearCheckoutPending();
    return true;
  } catch {
    return false;
  }
}

/** Clear the pending checkout flag. */
export function clearCheckoutPending(): void {
  try {
    sessionStorage.removeItem(CHECKOUT_STORAGE_KEY);
    sessionStorage.removeItem(CHECKOUT_TIMESTAMP_KEY);
  } catch {
    // Ignore
  }
}

export interface CheckoutMonitorOptions {
  onSuccess?: () => void;
  onClosed?: () => void;
  pollIntervalMs?: number;
}

/**
 * Monitor a checkout window for closure (user completed or closed checkout).
 * Also listens for a postMessage from the checkout page.
 *
 * Returns a cleanup function to stop monitoring.
 */
export function monitorCheckoutWindow(
  checkoutWindow: Window | null,
  options: CheckoutMonitorOptions = {},
): () => void {
  const { onSuccess, onClosed, pollIntervalMs = 1500 } = options;
  let stopped = false;
  let pollTimer: ReturnType<typeof setInterval> | null = null;

  const cleanup = () => {
    stopped = true;
    if (pollTimer) clearInterval(pollTimer);
    window.removeEventListener("message", handleMessage);
  };

  const handleMessage = (event: MessageEvent) => {
    if (stopped) return;
    const data = event.data;
    if (data && data.type === "checkout-success") {
      cleanup();
      onSuccess?.();
    }
  };

  window.addEventListener("message", handleMessage);

  if (!checkoutWindow) {
    // No window reference — assume success after short delay
    setTimeout(() => {
      if (!stopped) {
        cleanup();
        onSuccess?.();
      }
    }, 2000);
    return cleanup;
  }

  // Poll for window closure
  pollTimer = setInterval(() => {
    if (stopped) return;
    try {
      if (checkoutWindow.closed) {
        cleanup();
        onClosed?.();
      }
    } catch {
      // Cross-origin access may throw — treat as closed
      cleanup();
      onClosed?.();
    }
  }, pollIntervalMs);

  return cleanup;
}
