// Test-only: a single classic (IIFE) script, because jsdom does not execute
// <script type="module">. Not part of the deployed build.
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist-test",
    rollupOptions: {
      input: "src/main.jsx",
      output: { format: "iife", inlineDynamicImports: true, entryFileNames: "bundle.js", assetFileNames: "bundle.css" },
    },
  },
});
