import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { MantineProvider, ColorSchemeScript } from "@mantine/core";
import "@mantine/core/styles.css";
import "./styles.css";
import { theme } from "./theme.js";
import { migrateLegacyStorage, migrateStorage } from "./shared/storage.js";
import App from "./App.jsx";

/* Expose the two non-Latin faces as CSS variables so styles.css can reach the
   same values the Mantine theme holds. */
const fontVars = `:root{--hebrew-font:${theme.other.hebrew};--translit-font:${theme.other.translit};}`;

/* Both run before the first render, so every hook's initial state reads the
   migrated value rather than a stale one. Order matters: the flat legacy key
   becomes a slice, and then the slice renames apply. */
migrateLegacyStorage();
migrateStorage();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ColorSchemeScript defaultColorScheme="auto" />
    <style>{fontVars}</style>
    <MantineProvider theme={theme} defaultColorScheme="auto">
      <App />
    </MantineProvider>
  </StrictMode>
);
