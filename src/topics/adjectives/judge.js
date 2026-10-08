/* Marking an adjective, and saying what went wrong.

   The lesson here is agreement, not pointing, so the shared forgiveness applies:
   a dropped dagesh and a final form where the medial belongs are slips, and
   they are shown rather than punished. The definite article exercise refuses
   both because there the dot *is* the lesson; here it is scenery.

   The diagnoses are ordered by what the answer reveals. A learner who writes
   the right word with the wrong article has understood agreement and missed
   §3's one asymmetry; a learner who writes the dictionary form has not yet
   inflected at all. Those deserve different sentences. */

import { canonical } from "../typing/typing.js";
import { forgive } from "../../shared/forgive.js";
import { agreeingForm, formKeyFor } from "./data.js";

const strip = (s) => canonical(String(s).trim());

const GENDER_WORD = { m: "masculine", f: "feminine" };
const NUMBER_WORD = { singular: "singular", plural: "plural", dual: "dual" };

/** Did they answer, allowing the two slips? */
export function judgeAdjective(typed, prompt) {
  const got = strip(typed);
  const want = strip(prompt.answer);
  if (!got) return null;
  if (got === want) return { exact: true };

  const forgiven = forgive(got, want);
  return forgiven ? { forgiven } : null;
}

/** The article alone, when the answer carries one. */
const hasArticle = (form) => /^ה[ֶַָ]/.test(strip(form));

/** Strip a leading article, so the bare form can be compared. */
const bare = (form) => strip(form).replace(/^ה[ֶַָ]/, "").replace(/^(.)ּ/, "$1");

/**
 * Why an answer missed, most specific first.
 *
 * Returns null when nothing better than "that is not the form" can be said —
 * a wrong guess that is not a near miss gets the expected form and no lecture.
 */
export function diagnose(typed, prompt) {
  const got = strip(typed);
  const want = strip(prompt.answer);
  if (got === want) return null;

  const { noun, adjective, use, definite } = prompt;
  const wantedArticle = hasArticle(want);
  const gotArticle = hasArticle(got);

  /* The right word, the wrong definiteness. This is §3's whole asymmetry, so
     it gets the rule rather than a correction. */
  if (bare(got) === bare(want) && gotArticle !== wantedArticle) {
    return use === "predicate"
      ? "A predicate adjective never takes the article, however definite the noun is — it says what the noun is, not which one."
      : "An attributive adjective agrees in definiteness too, so when the noun is definite it takes the article as well.";
  }

  /* The wrong gender. This is checked before the uninflected-form case because
     for a masculine singular they are the same string, and "this noun is
     feminine" is the more useful of the two things to say. */
  const otherGender = noun.genders[0] === "f" ? "m" : "f";
  const wrongGender = agreeingForm(
    { ...noun, genders: [otherGender] }, adjective, use, definite);
  if (got === strip(wrongGender)) {
    const looksFeminine = /[\u05B8\u05B6]?[הת]$/.test(strip(noun.he));
    const hides = (noun.genders[0] === "f") !== looksFeminine;
    return hides
      ? `${noun.he} is ${GENDER_WORD[noun.genders[0]]} — its ending does not show it.`
      : `${noun.he} is ${GENDER_WORD[noun.genders[0]]}, so the adjective is too.`;
  }

  /* The dictionary form, uninflected. */
  if (bare(got) === strip(adjective.ms) && formKeyFor(noun) !== "ms") {
    const g = GENDER_WORD[noun.genders[0]];
    const n = noun.number === "dual" ? "dual" : NUMBER_WORD[noun.number];
    return `That is the form the dictionary gives. ${noun.he} is ${g} ${n}, so the adjective has to follow it.`;
  }

  /* Treated a dual as though Hebrew had a dual adjective, or a plural-in-form
     noun as though it meant many. */
  if (noun.number === "dual") {
    const asSingular = agreeingForm({ ...noun, number: "singular" }, adjective, use, definite);
    if (got === strip(asSingular)) {
      return "There is no dual adjective, so a dual noun takes the plural one.";
    }
  }
  if (prompt.single) {
    const asPlural = agreeingForm({ ...noun, number: "plural" }, adjective, use, definite);
    if (got === strip(asPlural)) {
      return "The noun is plural in form but names one of them — the English says so — and the adjective follows the sense.";
    }
  }

  return null;
}
