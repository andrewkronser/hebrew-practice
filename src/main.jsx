import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { MantineProvider, ColorSchemeScript } from "@mantine/core";
import "@mantine/core/styles.css";
import "./styles.css";
import { theme } from "./theme.js";
import App from "./App.jsx";

/* Expose the two non-Latin faces as CSS variables so styles.css can reach the
   same values the Mantine theme holds. */
const fontVars = `:root{--hebrew-font:${theme.other.hebrew};--translit-font:${theme.other.translit};}`;

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ColorSchemeScript defaultColorScheme="auto" />
    <style>{fontVars}</style>
    <MantineProvider theme={theme} defaultColorScheme="auto">
      <App />
    </MantineProvider>
  </StrictMode>
);
