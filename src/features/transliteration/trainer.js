/* Transliteration-specific logic: grading Latin answers against Hebrew
   characters, and working out which words are readable yet.

   The confidence-and-unlock engine moved to shared/progression.js when the
   vocabulary trainer needed the same behaviour. Anything here is about Hebrew
   script or about scoring a typed transliteration; nothing here is generic. */

import { CURRICULUM, WORDS } from "./data.js";
import {
  baseProgress, scoreAnswer, dampen, shouldUnlock as shouldUnlockItems,
  gateLabel as gateLabelItems, pickWeak, activeItems, shakyItems,
  isMastered, statOf, shuffled,
} from "../../shared/progression.js";

export const WORD_CHANCE = 0.25;  // how often a word displaces a character, once words exist
export const WORDS_FROM = 10;     // characters unlocked before words start appearing

/* The curriculum is this feature's item list, so bind the generic helpers to it
   once rather than threading CURRICULUM through every call site. */
export const emptyProgress = () => ({ ...baseProgress(1), introOf: 0 });
export const active = (unlocked) => activeItems(CURRICULUM, unlocked);
export const shaky = (unlocked, stats) => shakyItems(CURRICULUM, unlocked, stats);
export const shouldUnlock = (progress) => shouldUnlockItems(progress, CURRICULUM);
export const gateLabel = (progress) => gateLabelItems(progress, CURRICULUM);
export const pickCharacter = (progress, lastId) => pickWeak(CURRICULUM, progress, lastId);

export { scoreAnswer, isMastered, statOf, shuffled };

/* ---------------------------------------------------------------- grading -- */

export function normalize(x) {
  return String(x)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip combining accents: h-dot -> h, s-caron -> s
    .toLowerCase()
    .replace(/ə/g, "e")
    .replace(/[’‘`´ʼʾʿ]/g, "'")
    .replace(/\s+/g, "")
    .trim();
}
/** Forgiving form: marks and Seow's parentheses are notation, not content. */
export const loosen = (x) => normalize(x).replace(/['()]/g, "");

export const acceptedAnswers = (item) =>
  [item.a, item.s, ...(item.alt || [])].filter((x) => x !== undefined && x !== null && x !== "");

export function judge(input, item, { style, strict }) {
  const raw = String(input).trim();
  if (!raw) return false;
  if (style === "seow" && strict === "exact") return raw.toLowerCase() === item.a.toLowerCase();
  const list = acceptedAnswers(item);
  const n = normalize(raw);
  const l = loosen(raw);
  return list.some((x) => normalize(x) === n) || (l !== "" && list.some((x) => loosen(x) === l));
}

/** Missing a word nudges down every unlocked character inside it. */
export function penalizeWord(stats, unlocked, word) {
  const present = new Set(word.he.replace(IGNORED, ""));
  const inside = active(unlocked).filter((it) => it.cov.some((c) => present.has(c)));
  return dampen(stats, inside);
}

/* ------------------------------------------------------ words you can read -- */

/* Cantillation, dagesh, meteg, rafe, maqaf and spaces never gate a word. */
const IGNORED = /[֑-ּֽֿ֯׃ׅ׆־\s]/g;

export function coveredCodepoints(unlocked) {
  const set = new Set();
  for (const it of active(unlocked)) for (const c of it.cov) set.add(c);
  return set;
}

export function readableWords(unlocked) {
  const set = coveredCodepoints(unlocked);
  return WORDS.filter((w) => {
    for (const ch of w.he.replace(IGNORED, "")) {
      const c = ch === "ׇ" ? "ָ" : ch; // qamats qatan counts as qamats
      if (!set.has(c)) return false;
    }
    return true;
  });
}

/* --------------------------------------------------------------- choosing -- */

/** The next card in the guided track: an introduction, a word, or a character. */
export function pickNext(progress, lastId) {
  if (progress.introOf !== null && progress.introOf !== undefined) {
    return { item: CURRICULUM[progress.introOf], isIntro: true };
  }
  const words = readableWords(progress.unlocked);
  if (words.length >= 3 && progress.unlocked >= WORDS_FROM && Math.random() < WORD_CHANCE) {
    const w = words[Math.floor(Math.random() * words.length)];
    if (w.id !== lastId) return { item: w, isIntro: false };
  }
  return { item: pickCharacter(progress, lastId), isIntro: false };
}

export function freePool(mode) {
  if (mode === "letters") return CURRICULUM.filter((x) => !x.v);
  if (mode === "vowels") return CURRICULUM.filter((x) => x.v);
  return WORDS;
}
