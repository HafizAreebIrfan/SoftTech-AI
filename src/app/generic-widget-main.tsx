import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { GenericWidgetRenderer } from "../presentation/widgets/components/GenericWidgets";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <div
      style={{
        color: "white",
        background: "#222",
        padding: "20px",
        fontSize: "20px",
      }}
    >
      React Mounted
    </div>
    <GenericWidgetRenderer />
  </StrictMode>,
);
