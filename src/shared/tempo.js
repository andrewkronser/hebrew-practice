/* How fast "fast" is, for this person on this drill.

   The confidence engine pays a correct answer at one of two rates: full credit
   when it came back quickly enough to count as recall, a smaller one when it
   looks reconstructed. That bar used to be a flat 4000ms for every trainer,
   which measured reading speed rather than knowledge — on the same bank, a
   deliberate learner had 26% of answers counted fast against a quick learner's
   80%, so the deliberate one paid nine repetitions per item where the other
   paid four. Identical knowledge, very different pacing.

   So the bar is a quantile of your own times on that drill. Hold it at p and p
   of your answers are fast whoever you are, which puts the gain rate back under
   your control instead of your typing speed, while keeping the signal that
   actually matters: this answer was quick *for you*, so you knew it rather than
   worked it out.

   Estimated with one number and no history. The update below walks toward the
   p-th quantile — up by a step when an answer lands above it, down by a smaller
   one when below — which is why it needs no distributional assumption. Response
   times are lognormal-ish with a long tail, and fitting that tail is where a
   parametric estimate goes wrong: on simulated data an exponential fit missed
   the true p60 by 47-116% and a lognormal by 11-16%, against 1-7% for this.

   It is also why lapses need no special handling. A four-minute answer moves
   the estimate by exactly one step, the same as a four-second one, and 2% of
   answers in the far tail shift a p60 by well under a percentile. */

/** Share of answers to count as fast. This is the real pacing knob: it maps
 *  onto repetitions-per-item, roughly 6 at p=0.5, 5 at 0.6, 4 at 0.9. */
export const FAST_SHARE = 0.6;

/** Below this, an answer is recall whatever your baseline has drifted to. */
export const FLOOR_MS = 1200;

/** Above this, the bar is almost certainly tracking something other than you. */
export const CEILING_MS = 30000;

/** What the bar was before it was measured; also the cold-start value. */
export const SEED_MS = 4000;

/** Answers before the measured bar is trusted on its own. */
export const WARMUP = 15;

export const freshTempo = () => ({ q: SEED_MS, n: 0 });

/** Rebuild a stored tempo, dropping anything that isn't a usable number. */
export function normalizeTempo(stored) {
  if (!stored) return freshTempo();
  const q = Number(stored.q);
  const n = Number(stored.n);
  return {
    q: Number.isFinite(q) ? Math.min(CEILING_MS, Math.max(FLOOR_MS, q)) : SEED_MS,
    n: Number.isFinite(n) && n > 0 ? Math.floor(n) : 0,
  };
}

/**
 * Fold one answer into the estimate.
 *
 * Hinted and revealed answers are not response times — they measure how long
 * you looked at something you had already been given — so callers leave those
 * out rather than passing them here.
 */
export function observeTempo(tempo, ms) {
  if (!Number.isFinite(ms) || ms <= 0) return tempo;
  const t = tempo ?? freshTempo();
  /* Proportional step, so the estimate converges at the same rate wherever it
     starts, with a floor so it can still move once it is small. */
  const step = Math.max(40, t.q * 0.02);
  const next = t.q + (ms > t.q ? FAST_SHARE : -(1 - FAST_SHARE)) * step;
  return {
    q: Math.min(CEILING_MS, Math.max(FLOOR_MS, next)),
    n: t.n + 1,
  };
}

/**
 * The bar to score against. Early on this leans on the seed and slides across
 * to the measured value, so the first dozen answers of a fresh trainer are not
 * graded against a number built from three samples.
 */
export function fastBar(tempo) {
  const t = normalizeTempo(tempo);
  if (t.n <= 0) return SEED_MS;
  if (t.n >= WARMUP) return t.q;
  const w = t.n / WARMUP;
  return SEED_MS * (1 - w) + t.q * w;
}
