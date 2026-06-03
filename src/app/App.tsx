import React from "react";
import { useApplyGlobalThemeVars } from "../infrastructure/store/themeStore";
import { RouterProvider } from "@tanstack/react-router";
import { router } from "../infrastructure/routes/AppRoutes";
import { ToastContainer } from "react-toastify";
import { useAuthSync } from "../hooks";
import { useAuthStore } from "../infrastructure/store/authStore";
import "react-toastify/dist/ReactToastify.css";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Analytics } from "@vercel/analytics/react";

const App: React.FC = () => {
  useApplyGlobalThemeVars();
  useAuthSync();

  const authReady = useAuthStore((state) => state.authReady);

  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
        <div className="text-center space-y-2">
          <div className="text-lg font-semibold">Loading session...</div>
          <div className="text-sm text-slate-400">Restoring your authentication state</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <RouterProvider router={router} />
      <ToastContainer />
      <SpeedInsights />
      <Analytics />
    </>
  );
};

export default App;
