import { useEffect } from "react";
import { useAuthStore } from "./useAuth";
import { socket } from "../infrastructure/socket/socketService";
import { verifySession } from "../adapters/api/authApi";
import { router } from "../infrastructure/routes/AppRoutes";

export const useAuthSync = () => {
  const { isAuthenticated, clearAuth } = useAuthStore();

  // 1. Session verification check on refresh/mount (runs only once on initial app load)
  useEffect(() => {
    const checkSession = async () => {
      if (isAuthenticated) {
        try {
          await verifySession();
        } catch (error) {
          console.error("Session expired or invalid, logging out:", error);
          clearAuth();
          router.navigate({ to: "/login", replace: true });
        }
      }
    };
    checkSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. Socket connection lifecycle
  useEffect(() => {
    if (isAuthenticated) {
      socket.connect();

      const onConnect = () => {
        console.log("Socket connected on frontend:", socket.id);
      };

      const onConnectError = (error: Error) => {
        console.error("Socket connection error:", error);
      };

      socket.on("connect", onConnect);
      socket.on("connect_error", onConnectError);

      return () => {
        socket.off("connect", onConnect);
        socket.off("connect_error", onConnectError);
        socket.disconnect();
      };
    } else {
      socket.disconnect();
    }
  }, [isAuthenticated]);
};
