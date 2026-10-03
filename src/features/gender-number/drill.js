/* Choosing forms, and grading a cell.

   Duals are deliberately oversampled. Only seven of the 116 forms are dual —
   the dual isn't a productive inflection in Biblical Hebrew, so that scarcity is
   accurate — but left to chance you'd meet one roughly 6% of the time and
   rarely practise the option hardest to recognise. The boost lifts it to about
   a quarter of prompts, near its fair share of the six cells. */

import { FORMS, CELLS, isCorrectCell } from "./data.js";
import {
  baseProgress, activeItems, statOf, weightedPick, MASTER_TRIES,
  shouldUnlock as shouldUnlockItems, gateLabel as gateLabelItems,
} from "../../shared/progression.js";

export const DUAL_BOOST = 5;

export const emptyProgress = () => ({ ...baseProgress(1), introOf: 0 });
export const active = (unlocked) => activeItems(FORMS, unlocked);
export const shouldUnlock = (progress) => shouldUnlockItems(progress, FORMS);
export const gateLabel = (progress) => gateLabelItems(progress, FORMS);

/** Weighted toward weak forms, and toward duals whatever their strength. */
export function pickForm({ unlocked, stats }, lastId) {
  const pool = active(unlocked);
  if (pool.length <= 1) return pool[0] ?? null;
  const weights = pool.map((f) => {
    const r = statOf(stats, f.id);
    let w = Math.pow(1 - r.s, 1.5) * 3 + 0.15;
    if (r.a < MASTER_TRIES) w *= 2.2;
    if (f.number === "dual") w *= DUAL_BOOST;
    if (f.id === lastId) w *= 0.05;
    return w;
  });
  return weightedPick(pool, weights);
}

export function pickNext(progress, lastId) {
  if (progress.introOf !== null && progress.introOf !== undefined) {
    return { kind: "intro", form: FORMS[progress.introOf] };
  }
  const form = pickForm(progress, lastId);
  return form ? { kind: "quiz", form } : { kind: "empty" };
}

/** Which of the six cells are right for this form — two when it's two-gendered. */
export const correctCells = (form) => CELLS.filter((c) => isCorrectCell(form, c));

export const gradeCell = (form, cell) => isCorrectCell(form, cell);
