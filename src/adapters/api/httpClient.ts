import { showToast } from "../../utils/toast";
import { useErrorStore } from "../../infrastructure/store/errorStore";
import { env } from "../../infrastructure/config/env";

const criticalStatuses = [503, 502, 504];

export interface RequestOptions {
  skipRedirect?: boolean;
  silent?: boolean;
  _isRetry?: boolean;
}

const handleHttpError = (res: Response, url: string, options?: RequestOptions) => {
  if (options?.silent) return;

  if (criticalStatuses.includes(res.status) && !options?.skipRedirect) {
    useErrorStore.getState().showErrorModal({
      status: res.status,
      title: `Service Unavailable (${res.status})`,
      message: `The server is temporarily unreachable or undergoing maintenance.`,
      onRetry: () => {
        useErrorStore.getState().clearError();
        window.location.reload();
      },
    });
  } else if (res.status >= 500) {
    showToast(`Server error (${res.status}). Please try again later.`, "error");
  } else if (res.status === 404 && !options?.skipRedirect) {
    showToast("Requested resource not found.", "error");
  }
};

const syncNewToken = (res: Response) => {
  const newToken = res.headers?.get("x-new-token");
  const newRefreshToken = res.headers?.get("x-new-refresh-token");
  if (typeof window !== "undefined") {
    if (newToken) localStorage.setItem("authToken", newToken);
    if (newRefreshToken) localStorage.setItem("refreshToken", newRefreshToken);
  }
};

let sessionExpiredRedirecting = false;

/**
 * Hard-expire the local session: purge both tokens and the persisted auth
 * store, then send the user to /login (with a `session=expired` marker) so
 * no protected screen — onboarding, dashboard, etc. — can be re-entered
 * until they log in again. The signup draft (softtech-signup-store) is kept
 * so the user's onboarding progress survives the re-login.
 */
const forceSessionExpired = async () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem("authToken");
  localStorage.removeItem("refreshToken");
  try {
    // Dynamic import avoids a circular dependency
    // (authStore -> authApi -> httpClient).
    const { useAuthStore } = await import(
      "../../infrastructure/store/authStore"
    );
    useAuthStore.getState().clearAuth();
  } catch (e) {
    console.warn("forceSessionExpired: failed to clear auth store:", e);
  }
  if (sessionExpiredRedirecting || window.location.pathname === "/login") {
    return;
  }
  sessionExpiredRedirecting = true;
  showToast("Your session has expired. Please log in again.", "error");
  window.location.replace("/login?session=expired");
};

const getAuthHeaders = (): Record<string, string> => {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("authToken");
  const refreshToken = localStorage.getItem("refreshToken");
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (refreshToken) headers["x-refresh-token"] = refreshToken;
  return headers;
};

let refreshPromise: Promise<string | null> | null = null;

const performTokenRefresh = async (): Promise<string | null> => {
  if (typeof window === "undefined") return null;
  // Never attempt a silent refresh while on the login screen itself.
  if (window.location.pathname === "/login") return null;

  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const baseUrl = env.isDev ? env.apiBaseUrlLocal : env.apiBaseUrl;
        const refreshToken = localStorage.getItem("refreshToken");
        const refreshRes = await fetch(`${baseUrl}/api/company/refresh-token`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(refreshToken ? { "x-refresh-token": refreshToken } : {}),
          },
          body: JSON.stringify({ refreshToken }),
          credentials: "include",
        });

        if (!refreshRes.ok) {
          // The backend rejected the refresh token itself (invalid / expired
          // / user gone) — both tokens are dead and the session can never be
          // recovered without re-login. Network failures (fetch throws) and
          // rate limiting must NOT log the user out.
          if (refreshRes.status === 401 || refreshRes.status === 404) {
            const sessionErr: any = new Error(
              "Session refresh rejected by server",
            );
            sessionErr.isSessionExpired = true;
            throw sessionErr;
          }
          throw new Error("Refresh failed");
        }

        const data = await refreshRes.json();
        const newAccessToken = data.token || refreshRes.headers.get("x-new-token");
        const newRefreshToken = data.refreshToken || refreshRes.headers.get("x-new-refresh-token");

        if (newAccessToken) {
          localStorage.setItem("authToken", newAccessToken);
        }
        if (newRefreshToken) {
          localStorage.setItem("refreshToken", newRefreshToken);
        }
        return newAccessToken || null;
      } catch (e: any) {
        console.warn("Silent token refresh failed:", e);
        if (e?.isSessionExpired) {
          await forceSessionExpired();
        }
        return null;
      } finally {
        refreshPromise = null;
      }
    })();
  }
  return refreshPromise;
};

export const get = async (
  url: string,
  options?: RequestOptions,
): Promise<any> => {
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        ...getAuthHeaders(),
      },
      credentials: "include",
    });
    syncNewToken(res);

    if (
      res.status === 401 &&
      !options?._isRetry &&
      !url.includes("/login") &&
      !url.includes("/refresh-token")
    ) {
      const refreshedToken = await performTokenRefresh();
      if (refreshedToken) {
        return get(url, { ...options, _isRetry: true });
      }
    }

    if (!res.ok) {
      handleHttpError(res, url, options);
      const errorData = await res.json().catch(() => ({}));
      throw new Error(
        errorData.error ||
          errorData.message ||
          errorData.msg ||
          `HTTP error! status: ${res.status}`,
      );
    }
    return res.json();
  } catch (error: any) {
    if (!options?.silent) {
      console.error("Centralized API Get Error:", error);
      if (
        error.message &&
        (error.message.includes("Failed to fetch") ||
          error.message.includes("fetch"))
      ) {
        showToast("Server is unreachable. Please try again later.", "error");
      }
    }
    throw error;
  }
};

export const post = async (
  url: string,
  payload: unknown,
  options?: RequestOptions,
): Promise<any> => {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(payload),
      credentials: "include",
    });
    syncNewToken(res);

    if (
      res.status === 401 &&
      !options?._isRetry &&
      !url.includes("/login") &&
      !url.includes("/refresh-token")
    ) {
      const refreshedToken = await performTokenRefresh();
      if (refreshedToken) {
        return post(url, payload, { ...options, _isRetry: true });
      }
    }

    if (!res.ok) {
      handleHttpError(res, url, options);
      const errorData = await res.json().catch(() => ({}));
      throw new Error(
        errorData.error ||
          errorData.message ||
          errorData.msg ||
          `HTTP error! status: ${res.status}`,
      );
    }

    return res.json();
  } catch (error: any) {
    if (!options?.silent) {
      console.error("Centralized API Post Error:", error);
      if (
        error.message &&
        (error.message.includes("Failed to fetch") ||
          error.message.includes("fetch"))
      ) {
        showToast("Server is unreachable. Please try again later.", "error");
      }
    }
    throw error;
  }
};

export const put = async (
  url: string,
  payload: unknown,
  options?: RequestOptions,
): Promise<any> => {
  try {
    const res = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(payload),
      credentials: "include",
    });
    syncNewToken(res);

    if (
      res.status === 401 &&
      !options?._isRetry &&
      !url.includes("/login") &&
      !url.includes("/refresh-token")
    ) {
      const refreshedToken = await performTokenRefresh();
      if (refreshedToken) {
        return put(url, payload, { ...options, _isRetry: true });
      }
    }

    if (!res.ok) {
      handleHttpError(res, url, options);
      const errorData = await res.json().catch(() => ({}));
      throw new Error(
        errorData.error ||
          errorData.message ||
          errorData.msg ||
          `HTTP error! status: ${res.status}`,
      );
    }

    return res.json();
  } catch (error: any) {
    if (!options?.silent) {
      console.error("Centralized API Put Error:", error);
      if (
        error.message &&
        (error.message.includes("Failed to fetch") ||
          error.message.includes("fetch"))
      ) {
        showToast("Server is unreachable. Please try again later.", "error");
      }
    }
    throw error;
  }
};



