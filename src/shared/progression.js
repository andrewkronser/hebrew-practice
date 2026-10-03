/* The confidence-and-unlock engine, shared by every trainer.

   Every item carries a confidence score between 0 and 1. A correct answer moves
   it toward 1 (further if you answered quickly, since fast recall is a different
   thing from working it out), a wrong one knocks it back. When the newest item
   is solid and the rotation as a whole is steady, the next one unlocks.

   Nothing here knows what an item *is* — it needs only `{ id }`, and every
   function takes the ordered item list as an argument. That's what lets the
   transliteration curriculum and the vocabulary word bank share it.

   The tuning values came out of simulating learners across a range of
   accuracies. An earlier version demanded that nearly every active item be solid
   simultaneously, which walled out anyone below roughly 85% accuracy and stopped
   them unlocking at about a dozen items. If you change MASTER_SCORE or slackFor,
   re-run the simulation and check that a struggling learner still moves forward. */

export const MASTER_SCORE = 0.8;  // confidence at which an item counts as learned
export const MASTER_TRIES = 3;    // ...given at least this many attempts
export const COOLDOWN = 4;        // answers between unlocks, at minimum
export const PATIENCE = 60;       // answers stuck before the engine moves you on regardless
export const FAST_MS = 4000;      // answering inside this counts as recall, not reconstruction

/** How many items may still be shaky when the next one unlocks. This grows with
 *  the rotation on purpose — see the note above. */
export const slackFor = (n) => Math.max(2, Math.ceil(n * 0.25));

/** Shared shape. Callers add their own fields (an intro queue, say). */
export const baseProgress = (unlocked = 1) => ({ unlocked, stats: {}, since: 0 });

export const statOf = (stats, id) => stats[id] || { s: 0, a: 0 };
export const activeItems = (items, unlocked) => items.slice(0, unlocked);

export function isMastered(stats, item) {
  const r = statOf(stats, item.id);
  return r.a >= MASTER_TRIES && r.s >= MASTER_SCORE;
}

export const shakyItems = (items, unlocked, stats) =>
  activeItems(items, unlocked).filter((it) => !isMastered(stats, it));

export function meanScore(items, unlocked, stats) {
  const pool = activeItems(items, unlocked);
  if (!pool.length) return 0;
  return pool.reduce((t, it) => t + statOf(stats, it.id).s, 0) / pool.length;
}

/* ---------------------------------------------------------------- scoring -- */

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

/** Nudge a set of items down, for when a compound answer went wrong. */
export function dampen(stats, items, factor = 0.85) {
  const out = { ...stats };
  for (const it of items) {
    const r = statOf(out, it.id);
    out[it.id] = { a: r.a, s: r.s * factor };
  }
  return out;
}

/* -------------------------------------------------------------- unlocking -- */

/* `isExcluded` marks items the learner has switched off. They stop counting
   toward the gate, otherwise switching off a shaky item would freeze
   progression on an item you have deliberately stopped practising. */
export function shouldUnlock({ unlocked, stats, since }, items, isExcluded = () => false) {
  if (unlocked >= items.length) return false;
  if (since < COOLDOWN) return false;
  const newestItem = items[unlocked - 1];
  if (!isExcluded(newestItem)) {
    const newest = statOf(stats, newestItem.id);
    if (newest.a < MASTER_TRIES || newest.s < MASTER_SCORE) return false;
  }
  const shaky = shakyItems(items, unlocked, stats).filter((it) => !isExcluded(it));
  if (shaky.length <= slackFor(unlocked)) return true;
  return since >= PATIENCE && meanScore(items, unlocked, stats) >= 0.6;
}

/** Plain-language description of what stands between you and the next unlock. */
export function gateLabel({ unlocked, stats }, items, isExcluded = () => false) {
  if (unlocked >= items.length) return null;
  const newestItem = items[unlocked - 1];
  if (!isExcluded(newestItem)) {
    const newest = statOf(stats, newestItem.id);
    if (newest.a < MASTER_TRIES || newest.s < MASTER_SCORE) return "settle the newest one";
  }
  const left = shakyItems(items, unlocked, stats).filter((it) => !isExcluded(it)).length;
  return left > slackFor(unlocked) ? `${left} still shaky` : "next unlocks shortly";
}

/* --------------------------------------------------------------- choosing -- */

export function shuffled(list) {
  const x = list.slice();
  for (let i = x.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [x[i], x[j]] = [x[j], x[i]];
  }
  return x;
}

export function weightedPick(pool, weights) {
  let roll = Math.random() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < pool.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return pool[i];
  }
  return pool[pool.length - 1];
}

/** Pick from an explicit pool, weighted toward whatever you're weakest on. */
export function pickWeakFrom(pool, stats, lastId) {
  if (!pool.length) return null;
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

/** Pick an active item, weighted toward whatever you're weakest on. */
export function pickWeak(items, { unlocked, stats }, lastId) {
  return pickWeakFrom(activeItems(items, unlocked), stats, lastId);
}

/* ===========================================================================
   Parameterised engine.

   Everything above is this engine running on DEFAULT_PACING, which is why the
   other trainers needed no changes when this was added. Use the factory when a
   feature wants different pacing.

   The case for varying it is about how independent the items are, not about how
   hard the questions feel. Transliteration's 49 glyphs really are 49 separate
   facts, so unlocking one at a time is right. Gender and number is roughly eight
   patterns and a tail of irregulars — learn that ־ִים marks a plural and you have
   effectively learned 35 of the 116 forms at once — so item-by-item mastery is
   the wrong model and slow unlocking just wastes time.

   Whatever you change, re-run the pacing simulation. The failure this engine was
   built to avoid is a gate that quietly stops a learner below some accuracy from
   ever unlocking anything.
   =========================================================================== */

export const DEFAULT_PACING = {
  startUnlocked: 1,
  masterScore: MASTER_SCORE,
  masterTries: MASTER_TRIES,
  cooldown: COOLDOWN,
  patience: PATIENCE,
  fastMs: FAST_MS,
  gainFast: 0.34,
  gainSlow: 0.18,
  penalty: 0.55,
  slackFraction: 0.25,
  slackMin: 2,
  unlockStep: 1,
};

/**
 * Bind the engine to one item list and one set of pacing values.
 *
 *   items       ordered; position is the order of introduction
 *   pacing      overrides merged over DEFAULT_PACING
 *   isExcluded  optional predicate for items switched off by the learner
 *   weightFor   optional multiplier hook, for oversampling a class of item
 */
export function createProgression({ items, pacing = {}, isExcluded, weightFor } = {}) {
  const P = { ...DEFAULT_PACING, ...pacing };
  const excluded = isExcluded ?? (() => false);
  const slack = (n) => Math.max(P.slackMin, Math.ceil(n * P.slackFraction));

  const active = (unlocked) => items.slice(0, unlocked);

  const mastered = (stats, item) => {
    const r = statOf(stats, item.id);
    return r.a >= P.masterTries && r.s >= P.masterScore;
  };
  const shaky = (unlocked, stats) =>
    active(unlocked).filter((it) => !mastered(stats, it) && !excluded(it));
  const mean = (unlocked, stats) => {
    const pool = active(unlocked);
    if (!pool.length) return 0;
    return pool.reduce((t, it) => t + statOf(stats, it.id).s, 0) / pool.length;
  };

  const score = (stats, item, { correct, ms, hinted }) => {
    const r = statOf(stats, item.id);
    const next = { a: r.a + 1, s: r.s };
    if (correct) {
      const fast = ms < P.fastMs && !hinted;
      next.s = r.s + (1 - r.s) * (fast ? P.gainFast : P.gainSlow);
    } else {
      next.s = r.s * P.penalty;
    }
    return { ...stats, [item.id]: next };
  };

  const ready = ({ unlocked, stats, since }) => {
    if (unlocked >= items.length) return false;
    if (since < P.cooldown) return false;
    const newestItem = items[unlocked - 1];
    if (newestItem && !excluded(newestItem)) {
      const newest = statOf(stats, newestItem.id);
      if (newest.a < P.masterTries || newest.s < P.masterScore) return false;
    }
    if (shaky(unlocked, stats).length <= slack(unlocked)) return true;
    return since >= P.patience && mean(unlocked, stats) >= 0.6;
  };

  /** Returns the progress with the next step unlocked; `since` restarts. */
  const unlock = (progress) => ({
    ...progress,
    unlocked: Math.min(items.length, progress.unlocked + P.unlockStep),
    since: 0,
  });

  const label = ({ unlocked, stats }) => {
    if (unlocked >= items.length) return null;
    const newestItem = items[unlocked - 1];
    if (newestItem && !excluded(newestItem)) {
      const newest = statOf(stats, newestItem.id);
      if (newest.a < P.masterTries || newest.s < P.masterScore) return "settle the newest one";
    }
    const left = shaky(unlocked, stats).length;
    return left > slack(unlocked) ? `${left} still shaky` : "next unlocks shortly";
  };

  const pick = ({ unlocked, stats }, lastId) => {
    const pool = active(unlocked).filter((it) => !excluded(it));
    if (pool.length <= 1) return pool[0] ?? null;
    const weights = pool.map((it) => {
      const r = statOf(stats, it.id);
      let w = Math.pow(1 - r.s, 1.5) * 3 + 0.15;
      if (r.a < P.masterTries) w *= 2.2;
      if (weightFor) w *= weightFor(it, r);
      if (it.id === lastId) w *= 0.05;
      return w;
    });
    return weightedPick(pool, weights);
  };

  return {
    pacing: P,
    items,
    emptyProgress: () => ({ unlocked: P.startUnlocked, stats: {}, since: 0 }),
    active,
    isMastered: mastered,
    shakyItems: shaky,
    meanScore: mean,
    scoreAnswer: score,
    shouldUnlock: ready,
    unlock,
    gateLabel: label,
    pickWeak: pick,
    slackFor: slack,
  };
}
