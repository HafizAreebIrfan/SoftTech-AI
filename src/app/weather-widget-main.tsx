import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import CardWidget from "../presentation/widgets/card";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <CardWidget />
  </StrictMode>,
);
