import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // Relative asset paths, so the build works from a project-page subpath
  // (user.github.io/repo/) as well as from a user-page root.
  base: "./",
  plugins: [react()],
});
