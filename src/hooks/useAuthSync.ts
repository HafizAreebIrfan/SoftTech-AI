import { useEffect } from "react";
import { useAuthStore } from "./useAuth";
import { socket } from "../infrastructure/socket/socketService";
import { verifySession } from "../adapters/api/authApi";
import { router } from "../infrastructure/routes/AppRoutes";
import { showToast } from "../utils";

export const useAuthSync = () => {
  const { isAuthenticated, clearAuth } = useAuthStore();

  useEffect(() => {
    const checkSession = async () => {
      if (isAuthenticated) {
        try {
          await verifySession();
        } catch (error) {
          showToast(
            `Session expired or invalid, logging out ${error}`,
            "error",
          );
          clearAuth();
          router.navigate({ to: "/login", replace: true });
        }
      }
    };
    checkSession();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      socket.connect();

      const onConnectError = (error: Error) => {
        showToast(`Socket connection error: ${error}`, "error");
      };

      socket.on("connect_error", onConnectError);

      return () => {
        socket.off("connect_error", onConnectError);
        socket.disconnect();
      };
    } else {
      socket.disconnect();
    }
  }, [isAuthenticated]);
};
