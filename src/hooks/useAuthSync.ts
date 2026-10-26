import { useEffect } from "react";
import { useAuthStore } from "./useAuth";
import { verifySession } from "../adapters/api/authApi";

import { useSignupStore } from "../infrastructure/store/signupStore";

export const useAuthSync = () => {
  const { setAuth, clearAuth, setAuthReady } = useAuthStore();

  useEffect(() => {
    let isCancelled = false;
    const getUserInfo = async () => {
      try {
        const session = await verifySession();
        if (isCancelled) return;
        if (session?.user) {
          setAuth(session.user);
          if (typeof window !== "undefined") {
            if (session.token) localStorage.setItem("authToken", session.token);
            if (session.refreshToken) localStorage.setItem("refreshToken", session.refreshToken);
          }
          useSignupStore.getState().syncFromUser?.(session.user);
        } else {
          const hasTokens = typeof window !== "undefined" && (localStorage.getItem("authToken") || localStorage.getItem("refreshToken"));
          if (!hasTokens) {
            clearAuth();
          }
        }
      } catch (error: any) {
        if (!isCancelled) {
          const msg = String(error?.message || "");
          const isNetworkError =
            msg.includes("Failed to fetch") ||
            msg.includes("load failed") ||
            msg.includes("NetworkError") ||
            msg.includes("unreachable");
          const isAuthError =
            /\b(401|403)\b/.test(msg) ||
            /unauthor|forbidden|not authenticated|invalid or expired|refresh token|authentication required/i.test(
              msg,
            );
          const hasTokens =
            typeof window !== "undefined" &&
            (localStorage.getItem("authToken") ||
              localStorage.getItem("refreshToken"));
          // No tokens at all → definitely logged out. Tokens present but the
          // server explicitly rejected the session (silent refresh already
          // failed somewhere) → treat as logged out too. Network outages
          // must NOT clear auth — the user stays logged in locally.
          if (!hasTokens || (isAuthError && !isNetworkError)) {
            clearAuth();
            if (hasTokens && typeof window !== "undefined") {
              localStorage.removeItem("authToken");
              localStorage.removeItem("refreshToken");
            }
          }
        }
      } finally {
        if (!isCancelled) {
          setAuthReady(true);
        }
      }
    };

    getUserInfo();
    return () => {
      isCancelled = true;
    };
  }, [setAuth, clearAuth, setAuthReady]);
};
