/* Facts about Hebrew letters that more than one drill needs.

   Kept apart from hebrewKeyboard.js, which is about where letters sit on a
   keyboard, and from the feature modules, which are about what each drill does
   with them. */

/** The five letters that change shape at the end of a word, and their pairs. */
export const FINAL_PAIRS = [
  ["ך", "כ"], // ך כ
  ["ם", "מ"], // ם מ
  ["ן", "נ"], // ן נ
  ["ף", "פ"], // ף פ
  ["ץ", "צ"], // ץ צ
];

const MEDIAL_OF = new Map(FINAL_PAIRS);
const FINAL_OF = new Map(FINAL_PAIRS.map(([f, m]) => [m, f]));

export const isFinalForm = (ch) => MEDIAL_OF.has(ch);

/** Collapse a final form to its medial letter, so position stops mattering. */
export const toMedial = (ch) => MEDIAL_OF.get(ch) ?? ch;

/** The shape a letter takes at the end of a word. */
export const toFinal = (ch) => FINAL_OF.get(ch) ?? ch;

/** Both shapes of every letter collapsed, for comparing spellings. */
export const foldFinals = (s) => [...s].map(toMedial).join("");

/** Write a sequence of letters the way Hebrew does, final shape at the end. */
export const withFinalForm = (letters) =>
  letters.map((ch, i) => (i === letters.length - 1 ? toFinal(ch) : toMedial(ch)));

export const LETTER = /[א-ת]/;
export const isLetter = (ch) => LETTER.test(ch);

/** The gutturals, plus rêš, which shares their refusal to be doubled. */
export const GUTTURALS = new Set(["א", "ה", "ח", "ע"]); // א ה ח ע
export const RESH = "ר";
export const isGuttural = (ch) => GUTTURALS.has(ch);

/** Just the consonants of a pointed word, marks stripped. */
export const consonantsOf = (word) => [...String(word).normalize("NFD")].filter(isLetter);
