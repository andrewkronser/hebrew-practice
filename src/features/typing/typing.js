/* Typing-specific logic. The confidence engine lives in shared/progression.js.

   Prompts come from the vocabulary bank, which is what keeps them honest:

   - Letters are drilled bare.
   - A niqqud can't be typed on its own, so its prompt is a real consonant+point
     cluster lifted out of an actual word. That makes impossible pointings
     unreachable by construction — if a combination was never in a real word, it
     can never be offered.
   - Whole words come later: unpointed while you only know letters, pointed once
     you know the points they need. */

import { CURRICULUM as LETTERS, NIQQUD, hebrewToKey } from "../../shared/hebrewKeyboard.js";
import { WORD_BANK } from "../vocabulary/data.js";
import {
  baseProgress, activeItems, shakyItems, shouldUnlock as shouldUnlockItems,
  gateLabel as gateLabelItems, pickWeak,
} from "../../shared/progression.js";

export const WORD_CHANCE = 0.3;   // how often a word displaces a single prompt
export const WORDS_FROM = 12;     // items unlocked before words appear

/* One ordered list, as the engine expects.

   Points are interleaved among the letters rather than queued behind all 27.
   Stacking them at the end meant pointed words — the thing you actually need to
   type for class — only became reachable at the very end of the curriculum.
   Nearly every point can be drilled once three or four letters exist, so the
   only real constraints are which letters carry them: the shin and sin dots
   need ש, hataf patah needs ע or א, hataf segol needs א.

   Letters keep their own relative order (home row, index fingers outward, then
   top row, then bottom). */
const SEQUENCE = [
  "k-f", "k-j", "k-d", "k-k",
  "n-qamats",
  "k-s",
  "n-segol",
  "k-l", "k-a",
  "n-tsere",
  "k-;", "k-g",
  "n-patah",
  "k-h", "k-r",
  "n-holam",
  "k-u",
  "n-sheva",
  "k-e", "k-i",
  "n-dagesh",
  "k-o", "k-p",
  "n-hiriq",
  "k-t",
  "n-shin",
  "k-y", "k-v",
  "n-sin",
  "k-n", "k-c",
  "n-hpatah",
  "k-m", "k-x",
  "n-qubuts",
  "k-,", "k-z",
  "n-hsegol",
  "k-.", "k-b",
  "n-hqamats",
];

export const CURRICULUM = (() => {
  const byId = new Map([
    ...LETTERS.map((l) => [l.id, l]),
    ...NIQQUD.map((n) => [n.id, { ...n, point: true }]),
  ]);
  const out = SEQUENCE.map((id, i) => {
    const item = byId.get(id);
    if (!item) throw new Error(`SEQUENCE names an unknown item: ${id}`);
    return { ...item, idx: i };
  });
  if (out.length !== byId.size) {
    throw new Error(`SEQUENCE covers ${out.length} of ${byId.size} items`);
  }
  return out;
})();

export const emptyProgress = () => ({ ...baseProgress(1), introOf: 0 });
export const active = (unlocked) => activeItems(CURRICULUM, unlocked);
export const shaky = (unlocked, stats) => shakyItems(CURRICULUM, unlocked, stats);
export const shouldUnlock = (progress) => shouldUnlockItems(progress, CURRICULUM);
export const gateLabel = (progress) => gateLabelItems(progress, CURRICULUM);
export const pickItem = (progress, lastId) => pickWeak(CURRICULUM, progress, lastId);

/** Every character the learner has met so far — letters and points alike. */
export const unlockedChars = (unlocked) => new Set(active(unlocked).map((k) => k.he));

/* Every point, accent and cantillation mark. */
const POINTS = /[֑-ׇ]/g;
export const stripPoints = (s) => s.replace(POINTS, "");

const isLetter = (ch) => /[א-ת]/.test(ch);

/** Split a pointed word into base-letter clusters: ד + its marks, then ע + its marks. */
export function clusters(word) {
  const out = [];
  for (const ch of word) {
    if (isLetter(ch) || !out.length) out.push(ch);
    else out[out.length - 1] += ch;
  }
  return out;
}

/* --------------------------------------------------------------- the pools -- */

export const POINTED_WORDS = WORD_BANK.map((w) => ({
  id: `p-${w.key}`,
  he: w.he,
  gloss: w.glosses[0],
  chars: [...new Set(w.he)],
  word: true,
  pointed: true,
}));

export const BARE_WORDS = (() => {
  const seen = new Map();
  for (const w of WORD_BANK) {
    const bare = stripPoints(w.he).trim();
    if (!bare || seen.has(bare)) continue;
    seen.set(bare, {
      id: `w-${bare}`,
      he: bare,
      gloss: w.glosses[0],
      chars: [...new Set(bare)],
      word: true,
    });
  }
  return [...seen.values()];
})();

/* Qubuts and hataf qamats happen not to occur anywhere in the vocabulary bank,
   so there is no cluster to lift. These are attested clusters from elsewhere in
   the Bible, with the word each comes from, rather than a made-up carrier. Each
   avoids depending on a point introduced later than its own. */
const EXTRA_CLUSTERS = {
  "\u05BB": ["\u05E1\u05BB", "\u05D7\u05BB"],              // סֻכָּה booth, חֻקָּה statute
  "\u05B3": ["\u05E2\u05B3", "\u05D0\u05B3", "\u05D7\u05B3"], // נָעֳמִי Naomi, אֳנִיָּה ship, חֳלִי sickness
};

/** point character -> real clusters containing it, drawn from actual words. */
export const CLUSTERS_BY_POINT = (() => {
  const map = new Map(NIQQUD.map((n) => [n.he, new Set()]));
  for (const w of WORD_BANK) {
    for (const c of clusters(w.he)) {
      if (c.length < 2) continue;
      for (const ch of c) if (map.has(ch)) map.get(ch).add(c);
    }
  }
  for (const [point, list] of Object.entries(EXTRA_CLUSTERS)) {
    for (const c of list) map.get(point)?.add(c);
  }
  return new Map([...map].map(([k, v]) => [k, [...v]]));
})();

export function typableWords(unlocked, pool) {
  const known = unlockedChars(unlocked);
  return pool.filter((w) => w.chars.every((c) => known.has(c)));
}

/** Clusters for this point whose every character is already unlocked. */
export function clustersFor(point, unlocked) {
  const known = unlockedChars(unlocked);
  return (CLUSTERS_BY_POINT.get(point) ?? []).filter((c) => [...c].every((ch) => known.has(ch)));
}

/* --------------------------------------------------------------- choosing -- */

const sample = (arr) => arr[Math.floor(Math.random() * arr.length)];

/** Build the thing the learner actually types for a given curriculum item. */
export function promptFor(item, unlocked) {
  if (!item.point) return item.he;
  const options = clustersFor(item.he, unlocked);
  /* Before any carrier letter is unlocked there may be no real cluster yet;
     fall back to the same ב carrier the other trainers use. */
  return options.length ? sample(options) : `ב${item.he}`;
}

/** The next card: an introduction, a word, or a single item. */
export function pickNext(progress, lastId) {
  const { unlocked } = progress;

  if (progress.introOf !== null && progress.introOf !== undefined) {
    const item = CURRICULUM[progress.introOf];
    return { item, prompt: promptFor(item, progress.introOf + 1), isIntro: true };
  }

  const pool = [
    ...typableWords(unlocked, BARE_WORDS),
    ...typableWords(unlocked, POINTED_WORDS),
  ];

  if (pool.length >= 3 && unlocked >= WORDS_FROM && Math.random() < WORD_CHANCE) {
    const w = sample(pool);
    if (w.id !== lastId) return { item: w, prompt: w.he, isIntro: false };
  }

  const item = pickItem(progress, lastId);
  return { item, prompt: promptFor(item, unlocked), isIntro: false };
}

/* ---------------------------------------------------------------- grading --

   Graded on the character produced, not the physical key, so it works with
   whatever Hebrew input source the OS provides.

   If no Hebrew input is active the user types Latin, and nothing would ever be
   right. So a Latin character is accepted when it is the key that *would* have
   produced the expected letter — you still practise the position — and the page
   says it has fallen back to that. Points have no bare-key equivalent, so they
   genuinely need a Hebrew input source. */

/* Marks are compared in canonical order, not the order you happened to type
   them in. דַּ is stored as dalet + patah + dagesh, but pressing dagesh before
   the vowel produces dalet + dagesh + patah — a different string that renders
   identically, so without this you would be told your answer was wrong while it
   looked exactly like the prompt. Unicode gives every Hebrew point a distinct
   canonical combining class, so reordering is well defined and cannot collapse
   two genuinely different pointings.

   NFD rather than NFC: it also expands a precomposed presentation form (U+FB2A
   שׁ, which a paste might bring in) into its letter and dot, and it can never
   compose in the other direction. */
export const canonical = (s) => String(s).normalize("NFD");

/** Length in code points after normalising — what the caller should gate on. */
export const canonicalLength = (s) => [...canonical(s)].length;

export function gradeChar(typed, expected) {
  if (typed === expected) return "hebrew";
  const key = hebrewToKey.get(expected);
  if (key && typed.toLowerCase() === key) return "position";
  return "wrong";
}

export function gradeAttempt(typed, target) {
  const want = [...canonical(target)];
  const got = [...canonical(typed)];
  if (got.length !== want.length) return { correct: false, positionMode: false, marks: [] };
  const marks = want.map((ch, i) => gradeChar(got[i], ch));
  return {
    correct: marks.every((m) => m !== "wrong"),
    positionMode: marks.some((m) => m === "position"),
    marks,
  };
}
