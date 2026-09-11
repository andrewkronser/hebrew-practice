/* =============================================================================
   trainer.js — grading and progression, with no React and no DOM in sight.

   Every character carries a confidence score between 0 and 1. A correct answer
   moves it toward 1 (further if you answered quickly, since fast recall is a
   different thing from working it out), a wrong one knocks it back. When the
   newest character is solid and the rotation as a whole is steady, the next
   one unlocks.

   The tuning values below came out of simulating learners across a range of
   accuracies. An earlier version demanded that nearly every active character be
   solid simultaneously, which walled out anyone below roughly 85% accuracy and
   stopped them unlocking at about a dozen characters. If you change MASTER_SCORE
   or slackFor, re-check that a struggling learner still moves forward.
   ========================================================================== */

import { CURRICULUM, WORDS } from "./data.js";

export const MASTER_SCORE = 0.8;  // confidence at which a character counts as learned
export const MASTER_TRIES = 3;    // ...given at least this many attempts
export const COOLDOWN = 4;        // answers between unlocks, at minimum
export const PATIENCE = 60;       // answers stuck before the trainer moves you on regardless
export const FAST_MS = 4000;      // answering inside this counts as recall, not reconstruction
export const WORD_CHANCE = 0.25;  // how often a word displaces a character, once words exist
export const WORDS_FROM = 10;     // characters unlocked before words start appearing

/** How many characters may still be shaky when the next one unlocks. This grows
 *  with the rotation on purpose — see the note at the top of the file. */
export const slackFor = (n) => Math.max(2, Math.ceil(n * 0.25));

export const emptyProgress = () => ({ unlocked: 1, stats: {}, since: 0, introOf: 0 });

export const statOf = (stats, id) => stats[id] || { s: 0, a: 0 };
export const activeItems = (unlocked) => CURRICULUM.slice(0, unlocked);

export function isMastered(stats, item) {
  const r = statOf(stats, item.id);
  return r.a >= MASTER_TRIES && r.s >= MASTER_SCORE;
}
export const shakyItems = (unlocked, stats) =>
  activeItems(unlocked).filter((it) => !isMastered(stats, it));

const meanScore = (unlocked, stats) => {
  const pool = activeItems(unlocked);
  return pool.reduce((t, it) => t + statOf(stats, it.id).s, 0) / pool.length;
};

/* ---------------------------------------------------------------- grading -- */

export function normalize(x) {
  return String(x)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip combining accents: h-dot -> h, s-caron -> s
    .toLowerCase()
    .replace(/\u0259/g, "e")
    .replace(/[\u2019\u2018`\u00B4\u02BC\u02BE\u02BF]/g, "'")
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

/* --------------------------------------------------------------- scoring -- */

/** Returns a new stats object; never mutates the one passed in. */
export function scoreAnswer(stats, item, { correct, ms, hinted }) {
  const r = statOf(stats, item.id);
  const next = { a: r.a + 1, s: r.s };
  if (correct) {
    const fast = ms < FAST_MS && !hinted;
    next.s = r.s + (1 - r.s) * (fast ? 0.34 : 0.18);
  } else {
    next.s = r.s * 0.55;
  }
  return { ...stats, [item.id]: next };
}

/** Missing a word nudges down every unlocked character inside it. */
export function penalizeWord(stats, unlocked, word) {
  const present = new Set(word.he.replace(IGNORED, ""));
  const out = { ...stats };
  for (const it of activeItems(unlocked)) {
    if (it.cov.some((c) => present.has(c))) {
      const r = statOf(out, it.id);
      out[it.id] = { a: r.a, s: r.s * 0.85 };
    }
  }
  return out;
}

/* -------------------------------------------------------------- unlocking -- */

export function shouldUnlock({ unlocked, stats, since }) {
  if (unlocked >= CURRICULUM.length) return false;
  if (since < COOLDOWN) return false;
  const newest = statOf(stats, CURRICULUM[unlocked - 1].id);
  if (newest.a < MASTER_TRIES || newest.s < MASTER_SCORE) return false;
  if (shakyItems(unlocked, stats).length <= slackFor(unlocked)) return true;
  return since >= PATIENCE && meanScore(unlocked, stats) >= 0.6;
}

/** Plain-language description of what is standing between you and the next one. */
export function gateLabel({ unlocked, stats }) {
  if (unlocked >= CURRICULUM.length) return null;
  const newest = statOf(stats, CURRICULUM[unlocked - 1].id);
  if (newest.a < MASTER_TRIES || newest.s < MASTER_SCORE) return "settle the newest one";
  const left = shakyItems(unlocked, stats).length;
  return left > slackFor(unlocked) ? `${left} still shaky` : "next unlocks shortly";
}

/* ------------------------------------------------------ words you can read -- */

/* Cantillation, dagesh, meteg, rafe, maqaf and spaces never gate a word. */
const IGNORED = /[\u0591-\u05AF\u05BC\u05BD\u05BF\u05C3\u05C5\u05C6\u05BE\s]/g;

export function coveredCodepoints(unlocked) {
  const set = new Set();
  for (const it of activeItems(unlocked)) for (const c of it.cov) set.add(c);
  return set;
}

export function readableWords(unlocked) {
  const set = coveredCodepoints(unlocked);
  return WORDS.filter((w) => {
    for (const ch of w.he.replace(IGNORED, "")) {
      const c = ch === "\u05C7" ? "\u05B8" : ch; // qamats qatan counts as qamats
      if (!set.has(c)) return false;
    }
    return true;
  });
}

/* --------------------------------------------------------------- choosing -- */

function weightedPick(pool, weights) {
  let roll = Math.random() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < pool.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return pool[i];
  }
  return pool[pool.length - 1];
}

export function pickCharacter({ unlocked, stats }, lastId) {
  const pool = activeItems(unlocked);
  if (pool.length === 1) return pool[0];
  const weights = pool.map((it) => {
    const r = statOf(stats, it.id);
    let w = Math.pow(1 - r.s, 1.5) * 3 + 0.15;
    if (r.a < MASTER_TRIES) w *= 2.2;
    if (it.id === lastId) w *= 0.05;
    return w;
  });
  return weightedPick(pool, weights);
}

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

export function shuffled(list) {
  const x = list.slice();
  for (let i = x.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [x[i], x[j]] = [x[j], x[i]];
  }
  return x;
}
