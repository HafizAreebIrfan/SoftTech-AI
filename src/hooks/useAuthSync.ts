import { useEffect } from "react";
import { useAuthStore } from "./useAuth";
import { socket } from "../infrastructure/socket/socketService";
import { verifySession } from "../adapters/api/authApi";
import { showToast } from "../utils";

export const useAuthSync = () => {
  const { isAuthenticated, authReady, setAuth, clearAuth, setAuthReady } = useAuthStore();

  useEffect(() => {
    const bootstrapAuth = async () => {
      try {
        const session = await verifySession();
        if (session?.user) {
          setAuth(session.user);
        } else {
          clearAuth();
        }
      } catch (error) {
        clearAuth();
        if (import.meta.env.DEV) {
          console.debug("Auth session bootstrap failed:", error);
        }
      } finally {
        setAuthReady(true);
      }
    };

    bootstrapAuth();
  }, [clearAuth, setAuth, setAuthReady]);

  useEffect(() => {
    if (!authReady) {
      return;
    }

    if (isAuthenticated) {
      socket.connect();

      const onConnectError = (error: Error) => {
        showToast(`Socket connection error: ${error.message}`, "error");
      };

      socket.on("connect_error", onConnectError);

      return () => {
        socket.off("connect_error", onConnectError);
        socket.disconnect();
      };
    }

    socket.disconnect();
  }, [authReady, isAuthenticated]);
};
