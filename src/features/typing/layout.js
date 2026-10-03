/* The Israeli standard Hebrew keyboard (SI-1452), as it sits on QWERTY.

   Verified against Microsoft's published layout tables for Hebrew (Standard),
   kbdhebl3. Worth knowing: an earlier extraction of the same table came back
   shifted two places on the top row — it ended with "]" and "[" where the real
   layout has them on the bracket keys — so the row below was checked twice.

   This is NOT the phonetic "Hebrew – QWERTY" layout that macOS also ships,
   where letters sit on sound-alike keys (א on A, ב on B). That one is a
   different table entirely, and by Wikipedia's account isn't well standardised
   across platforms. If that's the one you want, it drops in here as a second
   ROWS/ORDER pair and nothing else changes.

   Niqqud sit on a modifier layer and differ by platform, so both are below.

   Windows (SI-1452 layer 3, AltGr): taken from the published standard draft,
   which lists each point by the Hebrew letter on its key; translated here
   through the letter table above. It agrees with Microsoft's own table on 9 of
   14, and every disagreement is Microsoft's bottom row shifted one place right
   — the same extraction fault already seen on the top row — so the standard is
   followed.

   macOS (⌥): the number row runs 1-0 through hataf-patah, hataf-qamats,
   hataf-segol, hiriq, tsere, patah, qamats, qubuts, segol, holam, with sheva
   and dagesh off to the side. A second source put sheva on ⌥0, holam on ⌥O and
   dagesh on ⌥~; the sequential run is the more systematic account and is used
   here. Those three are the least certain cells in this file.

   None of this gates the trainer: answers are graded on the character produced,
   so a wrong hint costs you one hunt for a key, not a wrong answer. */

export const LAYOUT_NAME = "Hebrew (Standard) — SI-1452";

/** Physical rows, left to right. `key` is the QWERTY cap, `he` what it types. */
export const ROWS = [
  [
    { key: "q", he: "/" }, { key: "w", he: "'" }, { key: "e", he: "ק" },
    { key: "r", he: "ר" }, { key: "t", he: "א" }, { key: "y", he: "ט" },
    { key: "u", he: "ו" }, { key: "i", he: "ן" }, { key: "o", he: "ם" },
    { key: "p", he: "פ" },
  ],
  [
    { key: "a", he: "ש" }, { key: "s", he: "ד" }, { key: "d", he: "ג" },
    { key: "f", he: "כ" }, { key: "g", he: "ע" }, { key: "h", he: "י" },
    { key: "j", he: "ח" }, { key: "k", he: "ל" }, { key: "l", he: "ך" },
    { key: ";", he: "ף" }, { key: "'", he: "," },
  ],
  [
    { key: "z", he: "ז" }, { key: "x", he: "ס" }, { key: "c", he: "ב" },
    { key: "v", he: "ה" }, { key: "b", he: "נ" }, { key: "n", he: "מ" },
    { key: "m", he: "צ" }, { key: ",", he: "ת" }, { key: ".", he: "ץ" },
    { key: "/", he: "." },
  ],
];

/* Which finger owns each key, for the colour bands on the reference map. */
const FINGERS = {
  q: "l-pinky", a: "l-pinky", z: "l-pinky",
  w: "l-ring", s: "l-ring", x: "l-ring",
  e: "l-mid", d: "l-mid", c: "l-mid",
  r: "l-index", f: "l-index", v: "l-index", t: "l-index", g: "l-index", b: "l-index",
  y: "r-index", h: "r-index", n: "r-index", u: "r-index", j: "r-index", m: "r-index",
  i: "r-mid", k: "r-mid", ",": "r-mid",
  o: "r-ring", l: "r-ring", ".": "r-ring",
  p: "r-pinky", ";": "r-pinky", "'": "r-pinky", "/": "r-pinky",
};
export const fingerFor = (key) => FINGERS[key] ?? "none";

/** Only the keys that type a Hebrew letter — punctuation keys aren't drilled. */
const isHebrewLetter = (ch) => /[א-ת]/.test(ch);

export const LETTER_KEYS = ROWS.flat().filter((k) => isHebrewLetter(k.he));

/** QWERTY key -> Hebrew letter, and the reverse. */
export const keyToHebrew = new Map(ROWS.flat().map((k) => [k.key, k.he]));
export const hebrewToKey = new Map(LETTER_KEYS.map((k) => [k.he, k.key]));

/* Introduction order: home row first and index fingers outward, then the top
   row, then the bottom — the usual typing-trainer progression, which is a
   different ordering problem from the transliteration curriculum's (that one
   separates look-alike glyphs; this one builds from the strongest fingers). */
const ORDERED_KEYS = [
  // home row, index outward
  "f", "j", "d", "k", "s", "l", "a", ";", "g", "h",
  // top row
  "r", "u", "e", "i", "o", "p", "t", "y",
  // bottom row
  "v", "n", "c", "m", "x", ",", "z", ".", "b",
];

export const CURRICULUM = ORDERED_KEYS.map((key, i) => {
  const he = keyToHebrew.get(key);
  return { id: `k-${key}`, key, he, idx: i, finger: fingerFor(key) };
});

export const FINAL_FORMS = new Set(["ך", "ם", "ן", "ף", "ץ"]);

/* ------------------------------------------------------------------ niqqud --

   `win` is the QWERTY key held with AltGr; `mac` the key held with ⌥.
   Ordered by how often a beginner meets them. */

export const NIQQUD = [
  { id: "n-patah",   he: "\u05B7", name: "patah",        win: "p",  mac: "6" },
  { id: "n-qamats",  he: "\u05B8", name: "qamats",       win: "e",  mac: "7" },
  { id: "n-segol",   he: "\u05B6", name: "segol",        win: "x",  mac: "9" },
  { id: "n-tsere",   he: "\u05B5", name: "tsere",        win: "m",  mac: "5" },
  { id: "n-hiriq",   he: "\u05B4", name: "hiriq",        win: "j",  mac: "4" },
  { id: "n-holam",   he: "\u05B9", name: "holam",        win: "u",  mac: "0" },
  { id: "n-sheva",   he: "\u05B0", name: "sheva",        win: "a",  mac: ";" },
  { id: "n-dagesh",  he: "\u05BC", name: "dagesh",       win: "s",  mac: "," },
  { id: "n-qubuts",  he: "\u05BB", name: "qubuts",       win: "\\", mac: "8" },
  { id: "n-shin",    he: "\u05C1", name: "shin dot",     win: "w",  mac: "\u21E7;" },
  { id: "n-sin",     he: "\u05C2", name: "sin dot",      win: "q",  mac: "\u21E7'" },
  { id: "n-hpatah",  he: "\u05B2", name: "hataf patah",  win: "[",  mac: "1" },
  { id: "n-hqamats", he: "\u05B3", name: "hataf qamats", win: "r",  mac: "2" },
  { id: "n-hsegol",  he: "\u05B1", name: "hataf segol",  win: "c",  mac: "3" },
];

export const niqqudById = new Map(NIQQUD.map((n) => [n.he, n]));

/** Key hint for the chosen platform, as a printable combo. */
export function niqqudHint(point, os) {
  const n = niqqudById.get(point);
  if (!n) return null;
  return os === "mac" ? `\u2325${n.mac.toUpperCase()}` : `AltGr+${n.win.toUpperCase()}`;
}
