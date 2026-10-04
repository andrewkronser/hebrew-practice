/* Assembling a multiple-choice question.

   Two problems this file exists to solve.

   1. A noun has several senses, and showing all of them at once teaches the
      word as a lump. So each question presents exactly ONE gloss, and a cursor
      per word walks through its senses in order — round-robin rather than
      random, so you actually meet "Adam" and not just "human" five times.

   2. Several nouns in the bank share a sense. If אָדָם comes up with "people"
      as its correct answer and עַם is offered as a distractor, both options are
      right and the question is broken. Reversed, the same collision bites
      harder: the prompt "people" is answerable by both אָדָם and עַם, so the
      wrong one has to be kept off the board. Pairs that share a gloss string are
      derived below; pairs that are near-synonyms without sharing a string are
      listed by hand in data.js. Either way the conflicting word is barred from
      the distractor pool for that question. */

import { WORD_BANK, CONFLICTS } from "./data.js";
import { activeItems, shuffled } from "../../shared/progression.js";

/** "a human" and "human" are the same answer; "Adam (the first human)" is not. */
export function normalizeGloss(g) {
  return String(g)
    .replace(/\([^)]*\)/g, " ")   // drop parenthetical asides
    .toLowerCase()
    .replace(/^(a|an|the)\s+/, "")
    .replace(/[^a-z\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const glossSet = (word) => new Set(word.glosses.map(normalizeGloss).filter(Boolean));

/* id -> Set of ids it must never be offered alongside. */
const conflictMap = (() => {
  const map = new Map(WORD_BANK.map((w) => [w.id, new Set()]));
  const link = (a, b) => { map.get(a)?.add(b); map.get(b)?.add(a); };

  // Derived: any two words sharing a normalized gloss.
  const sets = new Map(WORD_BANK.map((w) => [w.id, glossSet(w)]));
  for (let i = 0; i < WORD_BANK.length; i++) {
    for (let j = i + 1; j < WORD_BANK.length; j++) {
      const a = WORD_BANK[i], b = WORD_BANK[j];
      for (const g of sets.get(a.id)) {
        if (sets.get(b.id).has(g)) { link(a.id, b.id); break; }
      }
    }
  }
  // Hand-curated near-synonyms.
  for (const [a, b] of CONFLICTS) link(a, b);
  return map;
})();

export const conflictsWith = (id) => conflictMap.get(id) ?? new Set();

/** Every derived + curated pair, for inspection and tests. */
export function allConflictPairs() {
  const out = [];
  for (const [id, set] of conflictMap) for (const other of set) if (id < other) out.push([id, other]);
  return out.sort();
}

export const OPTION_COUNT = 4;

export const DIRECTIONS = {
  "he-en": { id: "he-en", label: "Hebrew → English" },
  "en-he": { id: "en-he", label: "English → Hebrew" },
};

/* "god" and "God" normalize to one prompt, so a word listing both would ask the
   same reversed question twice. Distinct senses only, first occurrence kept. */
export function promptableGlosses(word) {
  const seen = new Set();
  return word.glosses.filter((g) => {
    const k = normalizeGloss(g);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/** Words that may stand beside this one without also being a defensible answer. */
function eligibleDistractors(word, unlocked) {
  const banned = new Set(conflictsWith(word.id));
  banned.add(word.id);
  const ok = (w) => !banned.has(w.id);
  /* Unlocked words first, topped up from the rest of the bank when the unlocked
     pool is too small or too conflict-heavy — which it always is at the start,
     with only four words in rotation. */
  return [
    ...shuffled(activeItems(WORD_BANK, unlocked).filter(ok)),
    ...shuffled(WORD_BANK.slice(unlocked).filter(ok)),
  ];
}

/**
 * Build one question.
 *   word     the prompt word
 *   unlocked how many words are in rotation
 *   cursors  { [wordId]: next gloss index }
 *
 * Distractors come from unlocked words first, topped up from the rest of the
 * bank when the unlocked pool is too small or too conflict-heavy — which it
 * always is at the start, with only four words in rotation.
 */
export function buildQuestion(word, unlocked, cursors = {}) {
  const schedule = glossOrder(word.glosses.length);
  const glossIndex = schedule[(cursors[word.id] ?? 0) % schedule.length];
  const answer = word.glosses[glossIndex];

  const taken = new Set([normalizeGloss(answer)]);
  const distractors = [];
  for (const candidate of eligibleDistractors(word, unlocked)) {
    if (distractors.length === OPTION_COUNT - 1) break;
    // A word may offer any of its senses; pick one that doesn't duplicate an
    // option already on the board.
    const choice = shuffled(candidate.glosses).find((g) => !taken.has(normalizeGloss(g)));
    if (!choice) continue;
    taken.add(normalizeGloss(choice));
    distractors.push({ text: choice, from: candidate.id });
  }

  const options = shuffled([
    { text: answer, from: word.id, correct: true },
    ...distractors.map((d) => ({ ...d, correct: false })),
  ]);

  return { word, answer, glossIndex, primary: glossIndex === 0, options };
}

/**
 * Build one reversed question: an English sense as the prompt, Hebrew words as
 * the options. Conflict exclusion matters more here — every word carrying the
 * prompt's sense would be a correct answer, so all of them are barred.
 */
export function buildReverseQuestion(word, unlocked, cursors = {}) {
  const senses = promptableGlosses(word);
  const schedule = glossOrder(senses.length);
  const glossIndex = schedule[(cursors[word.id] ?? 0) % schedule.length];
  const prompt = senses[glossIndex];

  const distractors = eligibleDistractors(word, unlocked)
    .slice(0, OPTION_COUNT - 1)
    .map((w) => ({ word: w, text: w.he, from: w.id, correct: false }));

  const options = shuffled([
    { word, text: word.he, from: word.id, correct: true },
    ...distractors,
  ]);

  return { word, prompt, answer: word.he, glossIndex, primary: glossIndex === 0, options, reverse: true };
}

/* The first gloss is the primary sense, so it comes up far more than the rest.
   The schedule repeats sense 0 before each of the others — 0,0,1,0,0,2 — which
   gives the primary a fixed share however many senses the word has, while still
   guaranteeing every sense is reached. A weighted random could not promise that
   second part.

   Why two thirds rather than half: a word with several senses gets missed more
   often, so the weakness weighting surfaces it more. Measured on this bank, any
   word with two or more senses was coming up twice as often as a single-sense
   word. Leaning on the primary sense, together with SECONDARY_WEIGHT below,
   brings that down to about 1.2x. */
export const PRIMARY_SHARE = 0.65;

/* How much a question about a secondary sense moves the word's score, relative
   to one about its main meaning. Scoring is per-word but difficulty is
   per-sense, so without this a miss on a rare gloss drags down a word you know
   perfectly well. */
export const SECONDARY_WEIGHT = 0.25;

export function glossOrder(count, share = PRIMARY_SHARE) {
  if (count <= 1) return [0];
  /* repeats/(repeats+1) === share, independent of how many senses there are. */
  const repeats = Math.max(1, Math.round(share / (1 - share)));
  const out = [];
  for (let i = 1; i < count; i++) {
    for (let k = 0; k < repeats; k++) out.push(0);
    out.push(i);
  }
  return out;
}

/** What one answer about this question is worth, for scoring. */
export const answerWeight = (question) => (question.primary ? 1 : SECONDARY_WEIGHT);

/** Advance this word's cursor to its next scheduled sense. */
export function advanceCursor(cursors, word, direction = "he-en") {
  const count = direction === "en-he"
    ? promptableGlosses(word).length
    : word.glosses.length;
  const next = ((cursors[word.id] ?? 0) + 1) % glossOrder(count).length;
  return { ...cursors, [word.id]: next };
}

/** One entry point, so callers don't branch on direction themselves. */
export const buildFor = (direction, word, unlocked, cursors) =>
  direction === "en-he"
    ? buildReverseQuestion(word, unlocked, cursors)
    : buildQuestion(word, unlocked, cursors);
