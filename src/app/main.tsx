import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import QueryProvider from "./providers/QueryProvider";
import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.min.js";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryProvider>
      <App />
    </QueryProvider>
  </StrictMode>,
);
