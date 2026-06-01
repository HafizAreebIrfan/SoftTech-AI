import React from "react";
import { useApplyGlobalThemeVars } from "../infrastructure/store/themeStore";
import { RouterProvider } from '@tanstack/react-router'
import { router } from "../infrastructure/routes/AppRoutes";

const App: React.FC = () => {
  useApplyGlobalThemeVars();

  return (
    <>
      <RouterProvider router={router} />
    </>
  );
};

export default App;
