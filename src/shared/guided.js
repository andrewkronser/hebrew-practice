/* A guided exercise: an ordered syllabus with a streak per step.

   One of the app's two progression shapes. The other, in adaptive.js, keeps a
   pool of items in rotation weighted by how shaky each one is, which suits
   material where everything stays live. Guided is for material that has to be
   learned in order: you stay on one step until you can do it, and the next
   opens. So the whole model is which step you are on, which are finished, and
   how long the current run is.

   A topic with both shapes names them — GuidedRoots and AdaptiveRoots. A topic
   with only one does not, because there is nothing to tell apart.

   The streak belongs to the frontier — the first unfinished step. Stepping back
   to revise a finished one is practice and accrues nothing, which is why the
   step you are *looking at* and the step that is *in progress* are tracked
   separately. */

/* The terminal step, where everything mixes. The value is still "free" because
   it is written into saved progress as `stepId`; renaming it means migrating
   what people already have, which rides along with the storage migration. The
   name here is the one we actually use. */
export const MIXED = "free";

export function createGuided(steps) {
  const ids = steps.map((s) => s.id);
  const known = new Set([...ids, MIXED]);
  const targetOf = (id) => steps.find((s) => s.id === id)?.streak ?? 5;

  /* Derived from `done` rather than stored, so it cannot drift out of step with
     it — and so revising never loses your place. */
  const frontierOf = (done = []) => {
    const set = new Set(done);
    return steps.find((s) => !set.has(s.id))?.id ?? MIXED;
  };

  /** done · in progress · locked. Which step you are looking at is separate. */
  const stateOf = (id, done = []) => {
    if (done.includes(id)) return "done";
    if (id === frontierOf(done)) return "active";
    return "locked";
  };

  const fresh = () => ({ stepId: ids[0], streak: 0, done: [] });

  /** Rebuild stored progress, dropping anything that no longer exists. */
  const normalize = (stored) => {
    if (!stored) return fresh();
    return {
      stepId: known.has(stored.stepId) ? stored.stepId : ids[0],
      streak: Number(stored.streak) || 0,
      done: Array.isArray(stored.done) ? stored.done.filter((id) => known.has(id)) : [],
    };
  };

  /**
   * Record an answer. Returns the next progress and, when this answer finished
   * a step, which step it was — worked out here rather than inside a React
   * updater, so the caller can show it on the same turn.
   */
  const answer = (p, correct) => {
    if (p.stepId === MIXED || p.stepId !== frontierOf(p.done)) {
      return { progress: p, completed: null }; // revising, or past the end
    }
    const streak = correct ? p.streak + 1 : 0;
    if (streak < targetOf(p.stepId)) return { progress: { ...p, streak }, completed: null };

    const done = p.done.includes(p.stepId) ? p.done : [...p.done, p.stepId];
    return { progress: { stepId: frontierOf(done), streak: 0, done }, completed: p.stepId };
  };

  /** Giving up on a question breaks the run, but only on the frontier. */
  const breakStreak = (p) =>
    p.stepId === MIXED || p.stepId !== frontierOf(p.done) || p.streak === 0
      ? p
      : { ...p, streak: 0 };

  const isRevising = (p) => p.stepId !== frontierOf(p.done);

  return {
    steps, ids, MIXED,
    fresh, normalize, frontierOf, stateOf, targetOf, answer, breakStreak, isRevising,
  };
}
