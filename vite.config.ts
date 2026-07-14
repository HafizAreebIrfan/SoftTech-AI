/// <reference types="node" />

import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      input: {
        app: resolve(process.cwd(), "index.html"),
        Widgets: resolve(process.cwd(), "widgets.html"),
      },
    },
  },
});
