// import { StrictMode } from "react";
// import { createRoot } from "react-dom/client";
// import { GenericWidgetRenderer } from "../presentation/widgets/components/GenericWidgets";

// createRoot(document.getElementById("root")!).render(
//   <StrictMode>
//     <GenericWidgetRenderer />
//   </StrictMode>,
// );
const root = document.getElementById("root");

root!.innerHTML = `
<h1 style="color:white">
Widget Loaded
</h1>
`;
