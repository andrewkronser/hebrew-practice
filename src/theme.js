import { createTheme } from "@mantine/core";

/* Tekhelet — the blue of the biblical dye — as a Mantine colour ramp.
   Index 6 is the shade Mantine uses for filled buttons and active states. */
const tekhelet = [
  "#eef2fc", "#dae2f4", "#b2c1e8", "#879edd", "#6480d3",
  "#4e6ecd", "#4265cc", "#3354b5", "#2c4aa2", "#223f8f",
];

export const theme = createTheme({
  primaryColor: "tekhelet",
  colors: { tekhelet },
  fontFamily: "Montserrat, system-ui, sans-serif",
  headings: {
    fontFamily: "Montserrat, system-ui, sans-serif",
    fontWeight: "600",
    sizes: { h1: { fontSize: "1.6rem", lineHeight: "1.3" } },
  },
  defaultRadius: "md",
  cursorType: "pointer",
  other: {
    /* Montserrat carries no Hebrew and no transliteration diacritics, so two
       further faces do that work: a Hebrew text serif for the glyphs, and
       Gentium for marks like h-with-dot-below and p-with-macron. */
    hebrew: "'Frank Ruhl Libre', 'David Libre', serif",
    translit: "'Gentium Book Plus', 'Charis SIL', Georgia, serif",
  },
});
