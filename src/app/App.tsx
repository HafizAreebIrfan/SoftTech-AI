import React from "react";
import { useApplyGlobalThemeVars } from "../infrastructure/store/themeStore";
import { RouterProvider } from '@tanstack/react-router';
import { router } from "../infrastructure/routes/AppRoutes";
import { ToastContainer } from "react-toastify";
import { useAuthSync } from "../hooks";
import "react-toastify/dist/ReactToastify.css";
import { SpeedInsights } from "@vercel/speed-insights/react"
import { Analytics } from "@vercel/analytics/next"

const App: React.FC = () => {
  useApplyGlobalThemeVars();
  useAuthSync();

  return (
    <>
      <RouterProvider router={router} />
      <ToastContainer />
      <SpeedInsights />
      <Analytics/>
    </>
  );
};

export default App;
