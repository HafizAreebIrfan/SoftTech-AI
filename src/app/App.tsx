import React, { useEffect } from "react";
import { useApplyGlobalThemeVars } from "../infrastructure/store/themeStore";
import { RouterProvider } from '@tanstack/react-router';
import { router } from "../infrastructure/routes/AppRoutes";
import { ToastContainer } from "react-toastify";
import { useAuthStore } from "../infrastructure/store/authStore";
import { socket } from "../infrastructure/socket/socketService";
import "react-toastify/dist/ReactToastify.css";

const App: React.FC = () => {
  useApplyGlobalThemeVars();
  const { isAuthenticated } = useAuthStore();

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
