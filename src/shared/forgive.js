/* Typos a pointed-Hebrew exercise forgives.

   Shared, because the reasoning is not specific to one exercise: wherever the
   lesson is something other than the dot itself, two slips are not about that,
   and failing an otherwise right answer for them teaches nothing except that
   the keyboard is fiddly:

     1. A missing dagesh. The dot is one pixel of intent and easy to drop,
        especially when it shares a key with everything else.
     2. A final form where the medial belongs, or the reverse. Which shape a
        letter takes is a function of position, not of the rule being drilled.

   Both still get pointed out — the answer is shown with the offending cluster
   bolded — but the point is given.

   An *added* dagesh is not forgiven. Dropping the dot is a slip; adding one
   asserts a different consonant (bet for vet, kaf for khaf), which is a claim
   about the word rather than a typo.

   The definite article exercise deliberately does not use this: there the
   dagesh *is* the lesson, and forgiving it would forgive the whole point. */

import { canonical, clusters } from "../topics/typing/typing.js";

const DAGESH = "ּ";
const LETTER = /[א-ת]/;

/* Final forms and the medial letters they belong to. */
export const FINAL_PAIRS = [
  ["ך", "כ"], // ך כ
  ["ם", "מ"], // ם מ
  ["ן", "נ"], // ן נ
  ["ף", "פ"], // ף פ
  ["ץ", "צ"], // ץ צ
];
const MEDIAL_OF = new Map(FINAL_PAIRS);
const isFinal = (ch) => MEDIAL_OF.has(ch);
/** Both shapes of a letter collapse to one, so position stops mattering. */
const fold = (ch) => MEDIAL_OF.get(ch) ?? ch;

const baseOf = (cluster) => [...cluster].find((ch) => LETTER.test(ch)) ?? null;
const marksOf = (cluster) => [...cluster].filter((ch) => !LETTER.test(ch));

/* What went wrong in one cluster, or null if it is not a forgivable slip. */
function classify(got, want) {
  const kinds = [];

  const gb = baseOf(got), wb = baseOf(want);
  if (gb !== wb) {
    if (!gb || !wb || fold(gb) !== fold(wb)) return null;
    kinds.push(isFinal(gb) ? "final-for-medial" : "medial-for-final");
  }

  const gm = marksOf(got).join(""), wm = marksOf(want).join("");
  if (gm !== wm) {
    const gBare = gm.replaceAll(DAGESH, ""), wBare = wm.replaceAll(DAGESH, "");
    if (gBare !== wBare) return null;           // some other point differs
    if (gm.includes(DAGESH)) return null;       // a dagesh they added, not dropped
    kinds.push("dagesh");
  }

  return kinds.length ? kinds : null;
}

/**
 * Compare an answer against the expected form.
 *
 * Returns `{ exact: true }`, or `{ forgiven: true, kinds, at }` where `at`
 * lists the indices of the expected form's clusters to highlight, or `null`
 * when the answer is simply wrong.
 */
export function forgive(typed, expected) {
  const t = canonical(typed), e = canonical(expected);
  if (t === e) return { exact: true };

  const tc = clusters(t), ec = clusters(e);
  if (tc.length !== ec.length) return null;

  const kinds = new Set();
  const at = [];
  for (let i = 0; i < ec.length; i++) {
    if (tc[i] === ec[i]) continue;
    const found = classify(tc[i], ec[i]);
    if (!found) return null;
    found.forEach((k) => kinds.add(k));
    at.push(i);
  }
  if (!at.length) return null;

  return { forgiven: true, kinds: [...kinds], at };
}

const PHRASES = {
  "dagesh": "a missing dagesh",
  "final-for-medial": "a final form where the medial belongs",
  "medial-for-final": "a medial form where the final belongs",
};

/** One line naming the slip, for the reveal. */
export function forgivenLabel(kinds = []) {
  const parts = kinds.map((k) => PHRASES[k]).filter(Boolean);
  if (!parts.length) return "a typo";
  if (parts.length === 1) return parts[0];
  return `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
}

/** The expected form split into clusters, flagged where it was missed. */
export function markedClusters(expected, at = []) {
  const set = new Set(at);
  return clusters(canonical(expected)).map((text, i) => ({ text, flagged: set.has(i) }));
}
