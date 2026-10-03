/* Typing-specific logic. The confidence engine lives in shared/progression.js.

   Words are drawn from the vocabulary bank with their points stripped, which
   does two useful things: the letter sequences are real Hebrew rather than
   invented drills, and stripping sidesteps diacritic combinations that never
   actually occur — you can't type an impossible pointing if every prompt came
   from a real word in the first place. */

import { CURRICULUM, hebrewToKey } from "./layout.js";
import { WORD_BANK } from "../vocabulary/data.js";
import {
  baseProgress, activeItems, shakyItems, shouldUnlock as shouldUnlockItems,
  gateLabel as gateLabelItems, pickWeak,
} from "../../shared/progression.js";

export const WORD_CHANCE = 0.3;   // how often a word displaces a single letter
export const WORDS_FROM = 12;     // letters unlocked before words appear

export const emptyProgress = () => ({ ...baseProgress(1), introOf: 0 });
export const active = (unlocked) => activeItems(CURRICULUM, unlocked);
export const shaky = (unlocked, stats) => shakyItems(CURRICULUM, unlocked, stats);
export const shouldUnlock = (progress) => shouldUnlockItems(progress, CURRICULUM);
export const gateLabel = (progress) => gateLabelItems(progress, CURRICULUM);
export const pickLetter = (progress, lastId) => pickWeak(CURRICULUM, progress, lastId);

/* Every point, accent and cantillation mark. */
const POINTS = /[֑-ׇ]/g;
export const stripPoints = (s) => s.replace(POINTS, "");

/** Unpointed forms of the vocabulary, deduplicated, each with its letter set. */
export const TYPING_WORDS = (() => {
  const seen = new Map();
  for (const w of WORD_BANK) {
    const bare = stripPoints(w.he).trim();
    if (!bare || seen.has(bare)) continue;
    seen.set(bare, {
      id: `w-${bare}`,
      he: bare,
      gloss: w.glosses[0],
      letters: [...new Set(bare)],
      word: true,
    });
  }
  return [...seen.values()];
})();

export function typableWords(unlocked) {
  const known = new Set(active(unlocked).map((k) => k.he));
  return TYPING_WORDS.filter((w) => w.letters.every((l) => known.has(l)));
}

/** The next prompt: an introduction, a word, or a single letter. */
export function pickNext(progress, lastId) {
  if (progress.introOf !== null && progress.introOf !== undefined) {
    return { item: CURRICULUM[progress.introOf], isIntro: true };
  }
  const words = typableWords(progress.unlocked);
  if (words.length >= 3 && progress.unlocked >= WORDS_FROM && Math.random() < WORD_CHANCE) {
    const w = words[Math.floor(Math.random() * words.length)];
    if (w.id !== lastId) return { item: w, isIntro: false };
  }
  return { item: pickLetter(progress, lastId), isIntro: false };
}

/* ---------------------------------------------------------------- grading --

   Graded on the character produced, not the physical key, so it works with
   whatever Hebrew input source the OS provides.

   If no Hebrew input is active the user types Latin, and nothing would ever be
   right. So a Latin character is accepted when it is the key that *would* have
   produced the expected letter — you still practise the position — and the page
   says it has fallen back to that. */

export const expectedKeys = (target) => [...target].map((ch) => hebrewToKey.get(ch) ?? null);

export function gradeChar(typed, expected) {
  if (typed === expected) return "hebrew";
  const key = hebrewToKey.get(expected);
  if (key && typed.toLowerCase() === key) return "position";
  return "wrong";
}

/** Grade a whole attempt. Mixed modes are fine; any Latin match flags position mode. */
export function gradeAttempt(typed, target) {
  const want = [...target];
  const got = [...typed];
  if (got.length !== want.length) return { correct: false, positionMode: false, marks: [] };
  const marks = want.map((ch, i) => gradeChar(got[i], ch));
  return {
    correct: marks.every((m) => m !== "wrong"),
    positionMode: marks.some((m) => m === "position"),
    marks,
  };
}
