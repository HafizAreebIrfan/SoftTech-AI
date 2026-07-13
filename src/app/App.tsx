import React from "react";
import { useApplyGlobalThemeVars } from "../infrastructure/store/themeStore";
import { RouterProvider } from "@tanstack/react-router";
import { router } from "../infrastructure/routes/AppRoutes";
import { ToastContainer } from "react-toastify";
import { useAuthSync } from "../hooks";
import { useAuthStore } from "../infrastructure/store/authStore";
import "react-toastify/dist/ReactToastify.css";
import AppLoading from "../presentation/components/common/apploading";

const App: React.FC = () => {
  useApplyGlobalThemeVars();
  useAuthSync();

  const authReady = useAuthStore((state) => state.authReady);

  if (!authReady) {
    return <AppLoading />;
  }

  return (
    <>
      <RouterProvider router={router} />
      <ToastContainer />
    </>
  );
};

export default App;
