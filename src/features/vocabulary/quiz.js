/* Assembling a multiple-choice question.

   Two problems this file exists to solve.

   1. A noun has several senses, and showing all of them at once teaches the
      word as a lump. So each question presents exactly ONE gloss, and a cursor
      per word walks through its senses in order — round-robin rather than
      random, so you actually meet "Adam" and not just "human" five times.

   2. Several nouns in the bank share a sense. If אָדָם comes up with "people"
      as its correct answer and עַם is offered as a distractor, both options are
      right and the question is broken. Pairs that share a gloss string are
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

  const banned = new Set(conflictsWith(word.id));
  banned.add(word.id);
  const eligible = (w) => !banned.has(w.id);

  const unlockedPool = shuffled(activeItems(WORD_BANK, unlocked).filter(eligible));
  const lockedPool = shuffled(WORD_BANK.slice(unlocked).filter(eligible));

  const taken = new Set([normalizeGloss(answer)]);
  const distractors = [];
  for (const candidate of [...unlockedPool, ...lockedPool]) {
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

  return { word, answer, glossIndex, options };
}

/* The first gloss is the primary sense, so it comes up far more than the rest.
   Interleaving it with each of the others — 0,1,0,2,0,3 — gives it half of all
   appearances while still guaranteeing every sense is reached, which a simple
   weighted random could not promise. */
export function glossOrder(count) {
  if (count <= 1) return [0];
  const out = [];
  for (let i = 1; i < count; i++) out.push(0, i);
  return out;
}

/** Advance this word's cursor to its next scheduled sense. */
export function advanceCursor(cursors, word) {
  const length = glossOrder(word.glosses.length).length;
  const next = ((cursors[word.id] ?? 0) + 1) % length;
  return { ...cursors, [word.id]: next };
}
