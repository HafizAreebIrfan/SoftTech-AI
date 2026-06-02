import React, { useEffect } from "react";
import { useApplyGlobalThemeVars } from "../infrastructure/store/themeStore";
import { RouterProvider } from '@tanstack/react-router';
import { router } from "../infrastructure/routes/AppRoutes";
import { ToastContainer } from "react-toastify";
import { useAuthStore } from "../infrastructure/store/authStore";
import { socket } from "../infrastructure/socket/socketService";
import { verifySession } from "../adapters/api/authApi";
import "react-toastify/dist/ReactToastify.css";

const App: React.FC = () => {
  useApplyGlobalThemeVars();
  const { isAuthenticated, clearAuth } = useAuthStore();

  // 1. Session verification check on refresh/mount
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
  }, [isAuthenticated, clearAuth]);

  // 2. Socket connection lifecycle
  useEffect(() => {
    if (isAuthenticated) {
      // Connect to the socket server
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

  return (
    <>
      <RouterProvider router={router} />
      <ToastContainer />
    </>
  );
};

export default App;
