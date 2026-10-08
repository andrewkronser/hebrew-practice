/* The adjective syllabus (Seow VII.3–4).

   Two groups, following the textbook: what an adjective is doing in a phrase,
   and what it agrees with when the noun is not straightforward.

   Every question asks for one thing — the adjective — with the noun given in
   its lexical form. You supply the article on the adjective knowing the noun
   would take one too, and the reveal shows the whole phrase, so the noun's
   article arrives as confirmation rather than as a hint. */

import { createGuided } from "../../shared/guided.js";
import {
  ADJECTIVES, USABLE_NOUNS, adjectiveById, agreeingForm, phraseFor,
} from "./data.js";

/* ---------------------------------------------------------------- lessons -- */

export const LESSONS = [
  {
    id: "after", n: 1, group: "Uses", seow: "§3.a",
    title: "After the noun, agreeing",
    statement:
      "An {attributive} adjective modifies its noun, and in Hebrew it follows the noun rather than coming before it as in English. It matches the noun in gender and number: אִישׁ טוֹב \"a good man\", נָשִׁים טוֹבוֹת \"good women\".",
    streak: 5,
  },
  {
    id: "article", n: 2, group: "Uses", seow: "§3.a",
    title: "The article on both",
    statement:
      "An attributive adjective agrees in definiteness too, so when the noun is definite the adjective takes the article as well — both words carry it: הָאִישׁ הַטּוֹב \"the good man\". The article follows the rules you already know, so a guttural still takes הָ and a qamats ח still takes הֶ.",
    streak: 6,
  },
  {
    id: "predicate", n: 3, group: "Uses", seow: "§3.b",
    title: "Never on the predicate",
    statement:
      "A {predicate} adjective says what the noun *is* rather than which one it is, and it never takes the article however definite the noun is: הָאִישׁ טוֹב \"the man is good\". It may stand before or after the noun — the form does not change either way.",
    streak: 6,
  },
  {
    id: "lexical", n: 4, group: "Agreement", seow: "§4.a",
    title: "Gender you cannot see",
    statement:
      "The adjective agrees with the noun's gender as the dictionary gives it, not as the ending suggests. אֶרֶץ looks masculine and is feminine: הָאָרֶץ הַטּוֹבָה. עִיר is feminine and takes a masculine-looking plural, so the adjective still goes feminine: עָרִים גְּדֹלוֹת.",
    streak: 6,
  },
  {
    id: "dual", n: 5, group: "Agreement", seow: "§4.b",
    title: "Two of something",
    statement:
      "There is no dual adjective, so a {dual} noun takes a plural one: יָדַיִם רָפוֹת \"slack hands\". The gender is still the noun's own — יָד is feminine, so the adjective is feminine plural.",
    streak: 4,
  },
  {
    id: "single", n: 6, group: "Agreement", seow: "§4.d",
    title: "Plural in form, one of them",
    statement:
      "A few nouns are plural in form but name a single person, and then the adjective is singular: אֲדֹנִים קָשֶׁה \"a hard master\" (Isa 19:4). The English tells you how many are meant — read it before you choose the form.",
    streak: 4,
  },
];

export const MIXED_REVIEW = {
  id: "mixed", n: 7, group: null, seow: "§3–4",
  title: "Mixed Review",
  statement:
    "Every rule together. Two questions to settle each time: what is the adjective doing — describing which noun, or saying what it is — and what does this particular noun count as.",
};

export const lessonById = new Map(LESSONS.map((l) => [l.id, l]));
export const syllabus = createGuided(LESSONS);
export const CONTENTS = [...LESSONS, MIXED_REVIEW];

/* ----------------------------------------------------------- English side -- */

/* The noun bank glosses every form from its lemma, so אֲנָשִׁים comes through as
   "man". The prompt is an English phrase, so the plural has to be built. Only
   the irregulars are listed; everything else takes an s. */
const PLURAL_GLOSS = {
  man: "men", woman: "women", city: "cities", foot: "feet", ox: "oxen",
  child: "children", person: "people", tooth: "teeth",
};
const pluralGloss = (g) => PLURAL_GLOSS[g] ?? `${g}s`;

const VOWELISH = /^[aeiou]/i;
const indefinite = (g) => `${VOWELISH.test(g) ? "an" : "a"} ${g}`;

/** The English for a phrase, which is also what tells you the number meant. */
function glossFor(noun, adjective, use, definite, singleReferent) {
  const many = !singleReferent && (noun.number === "plural" || noun.number === "dual");
  const head = many ? pluralGloss(noun.gloss) : noun.gloss;

  if (use === "predicate") {
    return `the ${head} ${many ? "are" : "is"} ${adjective.gloss}`;
  }
  if (definite) return `the ${adjective.gloss} ${head}`;
  return many ? `${adjective.gloss} ${head}` : indefinite(`${adjective.gloss} ${head}`);
}

/* ---------------------------------------------------------------- prompts -- */

const has = (he) => (f) => f.he === he;
const isPlural = (f) => f.number === "plural";
const isSingular = (f) => f.number === "singular";
const isDual = (f) => f.number === "dual";

/* Step 1 and 2 use nouns whose gender you can read off the ending, so the only
   thing being tested is the agreement itself. The ones that mislead are step 4,
   and arriving at them earlier would make step 1 a guessing game. */
const looksItsGender = (f) => {
  const fem = /[הת]$/.test(f.he) || /וֹת$/.test(f.he);
  return f.genders[0] === "f" ? fem : !fem;
};

/* Step 4's point: the ending says one thing and the dictionary another. Duals
   mislead too, but they are step 5's business and arriving here first would
   teach the wrong reason for the answer. */
const misleads = (f) => !looksItsGender(f) && !isDual(f);

/* Only the duals whose dual sense is live. מַיִם and שָׁמַיִם are dual in form
   and mass nouns in meaning — "the good waters" is not English anyone writes,
   and their agreement is a separate story from "a pair of these". */
const PAIRED = new Set(["יָדַיִם", "עֵינַיִם", "רַגְלַיִם", "אָזְנַיִם"]);

/* Plural in form, one person meant (§4.d). The bank holds these as ordinary
   plurals, which they also are; the singular-referent sense is this topic's.
   The adjectives are chosen rather than paired by index, because "a good God"
   is grammatical and no one's idea of a sentence. */
const SINGLE_REFERENT = {
  "אֲדוֹנִים": { gloss: "master", adjectives: ["qasheh", "chazaq"] },
  "אֱלֹהִים": { gloss: "God", adjectives: ["qadosh", "tsaddiq"] },
  "פָּנִים": { gloss: "face", adjectives: ["yafeh", "qasheh"] },
};

const SETTINGS = {
  after:     { use: "attributive", definite: false, nouns: (f) => looksItsGender(f) && !isDual(f) },
  article:   { use: "attributive", definite: true,  nouns: (f) => looksItsGender(f) && !isDual(f) },
  predicate: { use: "predicate",   definite: true,  nouns: (f) => looksItsGender(f) && !isDual(f) },
  lexical:   { use: "attributive", definite: null,  nouns: misleads },
  dual:      { use: "attributive", definite: null,  nouns: (f) => isDual(f) && PAIRED.has(f.he) },
  single:    { use: "attributive", definite: false, nouns: (f) => f.he in SINGLE_REFERENT, single: true },
};

/* Some adjectives only make sense of people. Pairing by index alone produced
   "the small mother" and "a wise sword", which are grammatical and no help —
   a learner reading a phrase they would never meet is translating rather than
   reading. Nouns that name a person draw from everything; the rest draw from
   the adjectives that describe a thing.

   This takes the edge off rather than solving it — "hard horses" survives, and
   a curated noun-to-adjective table would be the real fix if the phrasing ever
   gets in the way. Grammar drills have always read a little oddly. */
const PEOPLE = new Set([
  "adam", "kohen", "em", "adon", "enosh", "malakh", "av", "ach", "achot",
  "ish", "ishah", "ben", "bat", "sar", "goy", "am", "el", "elohim",
]);
const OF_PEOPLE = new Set(["chakham", "zaqen", "tsaddiq", "rasha", "yashar"]);
const THINGS = ADJECTIVES.filter((a) => !OF_PEOPLE.has(a.id));

const poolFor = (noun) => (PEOPLE.has(noun.lemma) ? ADJECTIVES : THINGS);

/* A deterministic spread rather than every noun against every adjective, which
   would be nine hundred prompts of which you would see six. Pairing by index
   keeps each noun with a stable adjective, so a prompt you got wrong comes back
   the same rather than as a near-miss you cannot recognise. */
function pairsFor(lessonId) {
  const cfg = SETTINGS[lessonId];
  if (!cfg) return [];
  const nouns = USABLE_NOUNS.filter(cfg.nouns);

  return nouns.flatMap((noun, i) =>
    [0, 1].map((offset) => {
      const chosen = SINGLE_REFERENT[noun.he]?.adjectives;
      const pool = poolFor(noun);
      const adjective = chosen
        ? adjectiveById.get(chosen[offset])
        : pool[(i * 2 + offset) % pool.length];
      /* Where the lesson does not fix definiteness, alternate it, so the step
         exercises both and the learner cannot settle into one answer shape. */
      const definite = cfg.definite ?? (offset === 0);
      const single = Boolean(cfg.single);
      const gloss = single
        ? glossFor({ ...noun, gloss: SINGLE_REFERENT[noun.he].gloss }, adjective, cfg.use, definite, true)
        : glossFor(noun, adjective, cfg.use, definite, false);

      return {
        id: `${lessonId}-${noun.id}-${adjective.id}-${definite ? "d" : "i"}`,
        lesson: lessonId,
        noun,
        adjective,
        use: cfg.use,
        definite,
        single,
        gloss,
        answer: single
          ? agreeingForm({ ...noun, number: "singular" }, adjective, cfg.use, definite)
          : agreeingForm(noun, adjective, cfg.use, definite),
        phrase: single
          ? phraseFor({ ...noun, number: "singular" }, adjective, cfg.use, definite)
          : phraseFor(noun, adjective, cfg.use, definite),
      };
    })
  );
}

/* The phrases each lesson statement names, so the first thing you are asked is
   the thing you were just shown. Index pairing alone never produced אִישׁ טוֹב,
   which meant the canonical example of the canonical rule appeared nowhere in
   the exercise teaching it. */
const ANCHORS = {
  after:     [["אִישׁ", "tov"], ["אִשָּׁה", "tov"], ["אֲנָשִׁים", "tov"], ["נָשִׁים", "tov"]],
  article:   [["אִישׁ", "tov"], ["אִשָּׁה", "tov"], ["אֲנָשִׁים", "tov"], ["נָשִׁים", "tov"]],
  predicate: [["אִישׁ", "tov"], ["אִשָּׁה", "tov"]],
  lexical:   [["אֶרֶץ", "tov", true], ["עָרִים", "gadol", false]],
  dual:      [["יָדַיִם", "rafeh", false]],
  single:    [["אֲדוֹנִים", "qasheh"]],
};

function anchorsFor(lessonId) {
  const cfg = SETTINGS[lessonId];
  const pairs = ANCHORS[lessonId] ?? [];
  return pairs.flatMap(([he, adjId, wantDefinite]) => {
    const noun = USABLE_NOUNS.find((f) => f.he === he);
    const adjective = adjectiveById.get(adjId);
    if (!noun || !adjective) return [];
    const single = Boolean(cfg.single);
    /* The anchor states its own definiteness where the lesson alternates, so a
       cited phrase appears the way the text has it — עָרִים גְּדֹלוֹת and
       יָדַיִם רָפוֹת are both indefinite where the land is not. */
    const definite = cfg.definite ?? wantDefinite ?? true;
    const shaped = single ? { ...noun, number: "singular" } : noun;
    return [{
      id: `${lessonId}-anchor-${noun.id}-${adjective.id}`,
      lesson: lessonId,
      noun, adjective, use: cfg.use, definite, single,
      gloss: single
        ? glossFor({ ...noun, gloss: SINGLE_REFERENT[noun.he].gloss }, adjective, cfg.use, definite, true)
        : glossFor(noun, adjective, cfg.use, definite, false),
      answer: agreeingForm(shaped, adjective, cfg.use, definite),
      phrase: phraseFor(shaped, adjective, cfg.use, definite),
    }];
  });
}

/* Anchors first, then the spread, with any duplicate the spread also produced
   dropped so a word cannot come up twice under two ids. */
function promptsFor(lessonId) {
  const anchored = anchorsFor(lessonId);
  const seen = new Set(anchored.map((p) => `${p.noun.id}|${p.adjective.id}|${p.definite}`));
  const rest = pairsFor(lessonId)
    .filter((p) => !seen.has(`${p.noun.id}|${p.adjective.id}|${p.definite}`));
  return [...anchored, ...rest];
}

export const ALL_PROMPTS = LESSONS.flatMap((l) => promptsFor(l.id));
export const promptsForLesson = (id) =>
  id === syllabus.MIXED ? ALL_PROMPTS : ALL_PROMPTS.filter((p) => p.lesson === id);
export const promptById = new Map(ALL_PROMPTS.map((p) => [p.id, p]));

export { adjectiveById, has, isPlural, isSingular, isDual };
