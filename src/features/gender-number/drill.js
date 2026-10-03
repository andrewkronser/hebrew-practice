/* Choosing forms, and grading a cell.

   This feature runs the shared engine on its own pacing rather than the
   defaults, because its 116 items are not 116 independent facts. Learn that
   ־ִים marks a plural and you have effectively learned 35 of them at once, so
   unlocking one at a time and demanding three solid attempts each is time spent
   proving something you already know. The settings below were chosen by
   simulation: a learner at 80% accuracy reaches all 116 forms in roughly 1,200
   answers, against 13,000 on the defaults — and on the defaults a learner at 50%
   stalled permanently at 85 forms.

   Below about 35% accuracy the rotation does stop growing. On a six-option grid
   pure guessing scores 17%, so that threshold asks for meaningfully better than
   chance before handing out more material.

   Duals are oversampled on top of that. Only seven of the 116 forms are dual —
   the dual is not a productive inflection in Biblical Hebrew, so the scarcity is
   accurate — but left to chance you would meet one 6% of the time and rarely
   practise the option hardest to recognise. */

import { FORMS, CELLS, SEED_SIZE, isCorrectCell } from "./data.js";
import { createProgression } from "../../shared/progression.js";

export const DUAL_BOOST = 5;

export const PACING = {
  startUnlocked: SEED_SIZE,
  masterScore: 0.75,
  masterTries: 2,
  cooldown: 2,
  slackFraction: 0.35,
  gainFast: 0.5,
  gainSlow: 0.3,
  penalty: 0.45,
  unlockStep: 2,
};

export const engine = createProgression({
  items: FORMS,
  pacing: PACING,
  weightFor: (form) => (form.number === "dual" ? DUAL_BOOST : 1),
});

export const emptyProgress = () => engine.emptyProgress();
export const active = (unlocked) => engine.active(unlocked);
export const shouldUnlock = (progress) => engine.shouldUnlock(progress);
export const unlock = (progress) => engine.unlock(progress);
export const gateLabel = (progress) => engine.gateLabel(progress);
export const scoreAnswer = (stats, form, outcome) => engine.scoreAnswer(stats, form, outcome);
export const pickForm = (progress, lastId) => engine.pickWeak(progress, lastId);

/** Which of the six cells are right for this form — two when it's two-gendered. */
export const correctCells = (form) => CELLS.filter((c) => isCorrectCell(form, c));

export const gradeCell = (form, cell) => isCorrectCell(form, cell);
