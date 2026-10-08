/* Conveniences that exist only while developing.
 *
 * A guided topic is a locked syllabus, which is right for someone learning it
 * and wrong for someone changing step six: reaching it means twenty correct
 * answers first, every reload. In a dev server every step is reachable.
 *
 * Deliberately *reachable* rather than *done*. The contents still draw a locked
 * step as locked, so what you see in dev is what a learner sees — the only
 * difference is that the row will let you click it. Marking everything done
 * instead would hide the real progression and leave every step reading as
 * revision.
 *
 * `import.meta.env.DEV` is Vite's, true under `npm run dev` and false in every
 * build — including the test bundle, which is built for production, so the DOM
 * tests still see real locking.
 *
 * Worth knowing: Vitest imports *source* through Vite, so inside a test file
 * this flag is true, exactly as in a dev server. A test that wants the
 * production behaviour has to drive the built bundle, not import the module.
 *
 * To check the locking itself without leaving the dev server, set
 *   localStorage["hebrew-practice:locks"] = "on"
 * and reload.
 */

const LOCKS_KEY = "hebrew-practice:locks";

export const DEV = Boolean(import.meta.env?.DEV);

/** Is every step of a guided syllabus reachable, whatever its state? */
export function allStepsReachable() {
  if (!DEV) return false;
  try {
    return localStorage.getItem(LOCKS_KEY) !== "on";
  } catch {
    /* Storage blocked; the dev convenience is not worth failing over. */
    return true;
  }
}
