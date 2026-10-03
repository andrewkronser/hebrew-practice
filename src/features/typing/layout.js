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

   Niqqud live on the AltGr (⌥ on macOS) layer and are deliberately absent:
   the published tables I could reach disagreed about which keys carry dagesh
   and qubuts, and macOS uses a different scheme again. Rather than print a
   chart that teaches a wrong finger, the trainer covers letters and real
   unpointed words. */

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
