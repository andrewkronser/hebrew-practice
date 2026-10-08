/* What is this adjective doing?
 *
 * The production exercise can ask for a form but cannot ask this, because the
 * thing being read — word order, and which words carry the article — is gone by
 * the time you are typing one word. So the reading half shows a phrase and asks
 * what the adjective is: describing which noun, saying what the noun is, or
 * standing in for a noun of its own.
 *
 * The fourth answer is the point of the lesson. אֲנָשִׁים טוֹבִים is genuinely
 * both "good men" and "men are good", and Seow says so: with an indefinite noun
 * there is no article to tell them apart and only context decides. A drill that
 * forced one answer there would be teaching something false, so "either" is a
 * real answer and the phrases that are ambiguous are the ones it belongs to.
 *
 * What rules the ambiguity out, in the two directions:
 *   - an article on both words makes it attributive — only an attributive
 *     adjective agrees in definiteness
 *   - the adjective standing first makes it predicate — an attributive one
 *     follows its noun
 */

import { createAdaptive } from "../../shared/adaptive.js";
import { canonical } from "../typing/typing.js";
import {
  ADJECTIVES, USABLE_NOUNS, adjectiveById, agreeingForm, definiteNoun, formKeyFor,
} from "./data.js";

export const CLASSES = [
  {
    id: "attributive",
    label: "Attributive",
    short: "describes which",
    hint: "The adjective says which noun is meant — the article is on both words, or the noun is indefinite and the adjective follows it.",
  },
  {
    id: "predicate",
    label: "Predicate",
    short: "says what it is",
    hint: "The adjective says what the noun is. It never takes the article, and it may stand before the noun.",
  },
  {
    id: "substantive",
    label: "Substantive",
    short: "stands alone",
    hint: "The adjective is being used as a noun in its own right: הֶחָכָם, \"the wise\" — that is, the wise man.",
  },
  {
    id: "either",
    label: "Either",
    short: "context decides",
    hint: "Nothing in the phrase settles it. With an indefinite noun there is no article to separate the two readings, so only context can.",
  },
];

export const classById = new Map(CLASSES.map((c) => [c.id, c]));

/* ---------------------------------------------------------------- corpus -- */

const PLURAL_GLOSS = { man: "men", woman: "women", city: "cities", foot: "feet" };
const pl = (g) => PLURAL_GLOSS[g] ?? `${g}s`;
const an = (phrase) => `${/^[aeiou]/i.test(phrase) ? "an" : "a"} ${phrase}`;

/* A spread of nouns rather than all of them: this exercise is about the shape
   of the phrase, and sixty nouns would only make the same four shapes sixty
   times over. */
/* Adjectives chosen per noun, so the phrases read like Hebrew someone wrote
   rather than like a cross product. "the man is new" is grammatical and no
   one's sentence. */
const HEADS = [
  { he: "אִישׁ", using: ["tov", "chakham", "yashar", "tsaddiq"] },
  { he: "אִשָּׁה", using: ["tov", "chakham", "yafeh", "zaqen"] },
  { he: "אֲנָשִׁים", using: ["tov", "chakham", "yashar", "zaqen"] },
  { he: "נָשִׁים", using: ["tov", "yafeh", "chakham", "tsaddiq"] },
  { he: "מֶלֶךְ", using: ["gadol", "chazaq", "tsaddiq", "zaqen"] },
  { he: "עִיר", using: ["gadol", "qadosh", "chadash", "qaton"] },
  { he: "דָּבָר", using: ["tov", "chadash", "qasheh", "gadol"] },
  { he: "אֶרֶץ", using: ["tov", "gadol", "qadosh", "chadash"] },
];

const nounOf = (he) => USABLE_NOUNS.find((f) => f.he === he);

function many(noun) {
  return noun.number === "plural" || noun.number === "dual";
}

function entry(noun, adjective, shape) {
  const head = canonical(noun.he);
  const theHead = definiteNoun(noun.he);
  const attributive = agreeingForm(noun, adjective, "attributive", true);
  const bareAdj = agreeingForm(noun, adjective, "attributive", false);
  const headGloss = many(noun) ? pl(noun.gloss) : noun.gloss;
  const isAre = many(noun) ? "are" : "is";

  switch (shape) {
    case "definite-attributive":
      return {
        he: `${theHead} ${attributive}`,
        answer: "attributive",
        gloss: `the ${adjective.gloss} ${headGloss}`,
        why: "Both words carry the article, and only an attributive adjective agrees in definiteness.",
      };
    case "definite-predicate":
      return {
        he: `${theHead} ${bareAdj}`,
        answer: "predicate",
        gloss: `the ${headGloss} ${isAre} ${adjective.gloss}`,
        why: "The noun has the article and the adjective does not, which an attributive adjective could never do.",
      };
    case "fronted-predicate":
      return {
        he: `${bareAdj} ${theHead}`,
        answer: "predicate",
        gloss: `the ${headGloss} ${isAre} ${adjective.gloss}`,
        why: "The adjective stands before its noun, so it cannot be attributive — and it has no article either.",
      };
    case "indefinite-ambiguous":
      return {
        he: `${head} ${bareAdj}`,
        answer: "either",
        gloss: many(noun)
          ? `${adjective.gloss} ${headGloss}, or ${headGloss} ${isAre} ${adjective.gloss}`
          : `${an(`${adjective.gloss} ${headGloss}`)}, or ${an(headGloss)} ${isAre} ${adjective.gloss}`,
        why: "The noun is indefinite, so there is no article to separate the readings and the adjective follows the noun either way. Only context decides.",
      };
    case "fronted-indefinite":
      return {
        he: `${bareAdj} ${head}`,
        answer: "predicate",
        gloss: many(noun)
          ? `${headGloss} ${isAre} ${adjective.gloss}`
          : `${an(headGloss)} ${isAre} ${adjective.gloss}`,
        why: "Indefinite, so nothing is settled by the article — but the adjective comes first, and an attributive adjective follows its noun.",
      };
    default:
      return null;
  }
}

/* The substantive use has no noun to read against, which is what identifies it:
   an adjective on its own, standing where a noun would. */
function substantive(adjective, definite) {
  const ms = canonical(adjective.ms);
  return {
    he: definite ? canonical(definiteNoun(ms)) : ms,
    answer: "substantive",
    gloss: definite
      ? `the ${adjective.gloss} — that is, the ${adjective.gloss} man`
      : `${adjective.gloss} — that is, ${an(`${adjective.gloss} man`)}`,
    why: "There is no noun here at all. The adjective is doing a noun's work.",
  };
}

/* Three of the five phrase shapes are unambiguously predicate, which is a fact
   about Hebrew and would be a flaw in a four-option quiz: generated evenly by
   shape, "predicate" was the right answer half the time and guessing it would
   have scored 49%. So the shapes are sampled rather than enumerated — two
   attributive and two ambiguous per noun against one predicate, with the
   predicate shape rotating so all three still appear across the corpus. */
const PREDICATE_SHAPES = ["definite-predicate", "fronted-predicate", "fronted-indefinite"];

export const PHRASES = (() => {
  const out = [];
  HEADS.forEach(({ he, using }, i) => {
    const noun = nounOf(he);
    if (!noun) return;
    const adj = (n) => adjectiveById.get(using[n % using.length]);
    const plan = [
      ["definite-attributive", adj(0)],
      ["definite-attributive", adj(1)],
      ["indefinite-ambiguous", adj(2)],
      ["indefinite-ambiguous", adj(3)],
      [PREDICATE_SHAPES[i % 3], adj(0)],
      [PREDICATE_SHAPES[(i + 1) % 3], adj(2)],
    ];
    for (const [shape, adjective] of plan) {
      const made = entry(noun, adjective, shape);
      if (made) out.push({ id: `${noun.id}-${adjective.id}-${shape}`, shape, noun, adjective, ...made });
    }
  });
  /* A few of the adjective standing alone, both ways. */
  for (const id of ["chakham", "tsaddiq", "zaqen", "qadosh"]) {
    const a = adjectiveById.get(id);
    for (const definite of [true, false]) {
      out.push({
        id: `sub-${id}-${definite ? "d" : "i"}`,
        shape: "substantive", noun: null, adjective: a,
        ...substantive(a, definite),
      });
    }
  }
  return out;
})();

export const phraseById = new Map(PHRASES.map((p) => [p.id, p]));

/* Confidence-weighted, like the other reading exercises: everything stays live
   and the engine leans on whichever shape you keep misreading. */
export const engine = createAdaptive({
  items: PHRASES,
  pacing: { startUnlocked: PHRASES.length, maxStep: 0 },
});

export function isCorrectClass(phrase, chosen) {
  return phrase.answer === chosen;
}

export { formKeyFor, ADJECTIVES };
