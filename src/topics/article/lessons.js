/* The definite article (Seow, Lesson VI §1).

   Hebrew has no separate word for "the": the article is prefixed, and in its
   ordinary form it doubles the consonant it lands on. Everything else in this
   lesson follows from one fact — gutturals and rêš refuse that doubling — so
   the article has to compensate, and which way it compensates depends on the
   letter and sometimes on where the stress falls.

   The whole lesson is one decision:

     first letter        its vowel                 article
     ------------------------------------------------------------
     anything else       —                         הַ + dagesh
     א · ר               —                         הָ, no dagesh
     ע                   qamats, unstressed        הֶ
     ע                   otherwise                 הָ
     ח                   qamats, either way        הֶ
     ה                   qamats, unstressed        הֶ
     ה · ח               otherwise                 הַ, no dagesh

   Definite forms are derived here rather than transcribed, because the rule is
   the content: a bank of hand-typed pointed forms would be a bank of possible
   typos with the rule nowhere in the code. The derivation reproduces all ten
   forms Seow prints, which the tests assert. Only the seven in §1.c are written
   out, since those change the noun itself and no rule predicts them. */

import { clusters, canonical } from "../typing/typing.js";
import { foldFinals, isLetter } from "../../shared/hebrewLetters.js";
import { createGuided } from "../../shared/guided.js";

const DAGESH = "ּ";
const HE = "ה";
const PATAH = "ַ", QAMATS = "ָ", SEGOL = "ֶ";

/* ---------------------------------------------------------------- lessons -- */

export const LESSONS = [
  {
    id: "plain", n: 1, group: null, seow: "§1.a",
    title: "The ordinary article",
    article: HE + PATAH,
    statement:
      "The article is הַ joined to the front of the word, and the first consonant takes a dagesh — the article's own consonant has been assimilated into it. There is no word for \"a\": מֶלֶךְ is both \"king\" and \"a king\".",
    streak: 5,
  },
  {
    id: "lengthen", n: 2, group: "Gutturals", seow: "§1.b.i",
    title: "Before א, ע and ר",
    article: HE + QAMATS,
    statement:
      "These three will not take the dagesh, so the article's patah stretches to qamats to make up for the doubling that cannot happen: הָ, and the noun itself is untouched. The same compensatory lengthening you met in the plural rules.",
    streak: 5,
  },
  {
    id: "virtual", n: 3, group: "Gutturals", seow: "§1.b.ii",
    title: "Before ה and ח",
    article: HE + PATAH,
    statement:
      "These two refuse the dagesh as well, but here nothing stretches — the doubling is simply understood. The article stays הַ and the noun gains no dagesh, so the only thing separating this from the ordinary case is the dot that is not there.",
    streak: 6,
  },
  {
    id: "segol", n: 4, group: "Gutturals", seow: "§1.b.iii",
    title: "Before a qamats guttural",
    article: HE + SEGOL,
    statement:
      "When ח carries qamats, or an unstressed ה or ע does, the article is הֶ and the doubling is understood. This overrides the two rules above. A one-syllable word is stressed on that syllable, so הָ and עָ there keep הָ — but ח takes הֶ either way.",
    streak: 8,
  },
  {
    id: "reshape", n: 5, group: null, seow: "§1.c",
    title: "The seven that reshape the noun",
    article: null,
    statement:
      "A handful of short nouns stretch their own vowel when the article arrives, and the article then follows the rules above. Learn them as a set. הַר is doubly odd: it takes הָ where rule 3 would have predicted הַ.",
    streak: 7,
  },
];

/* The terminus, where the five mix. Not part of the syllabus proper — it has no
   streak to finish — but it is a row in the contents and a pool to draw from. */
export const MIXED_REVIEW = {
  id: "free", n: 6, group: null, seow: "§1",
  title: "Mixed Review",
  article: null,
  statement:
    "Every rule mixed. Nothing is announced, so the first move is always the same one: look at the letter the article is about to land on, and at the vowel it carries.",
};

export const lessonById = new Map(LESSONS.map((l) => [l.id, l]));
export const syllabus = createGuided(LESSONS);

/** The five rules plus Mixed Review, as the contents lists them. */
export const CONTENTS = [...LESSONS, MIXED_REVIEW];

/* The lesson in one table, shown beside the exercise on request. */
export const DECISION_TABLE = [
  { letter: "anything else", vowel: "—", article: "הַ", dagesh: true, rule: "plain" },
  { letter: "א · ר", vowel: "—", article: "הָ", dagesh: false, rule: "lengthen" },
  { letter: "ע", vowel: "qamats, unstressed", article: "הֶ", dagesh: false, rule: "segol" },
  { letter: "ע", vowel: "otherwise", article: "הָ", dagesh: false, rule: "lengthen" },
  { letter: "ח", vowel: "qamats, either way", article: "הֶ", dagesh: false, rule: "segol" },
  { letter: "ה", vowel: "qamats, unstressed", article: "הֶ", dagesh: false, rule: "segol" },
  { letter: "ה · ח", vowel: "otherwise", article: "הַ", dagesh: false, rule: "virtual" },
];

/* ------------------------------------------------------------- derivation -- */

/** Hebrew writes the vowel before the dagesh in canonical order, so the mark is
 *  appended and the cluster renormalised rather than spliced in by hand. */
const withDagesh = (cluster) =>
  cluster.includes(DAGESH) ? cluster : (cluster + DAGESH).normalize("NFD").normalize("NFC");

export function definiteOf(he, rule) {
  const word = canonical(he);
  switch (rule) {
    case "plain": {
      const cs = clusters(word);
      return (HE + PATAH + withDagesh(cs[0]) + cs.slice(1).join("")).normalize("NFC");
    }
    case "lengthen": return (HE + QAMATS + word).normalize("NFC");
    case "virtual":  return (HE + PATAH + word).normalize("NFC");
    case "segol":    return (HE + SEGOL + word).normalize("NFC");
    default:         return null;   // §1.c is written out, not derived
  }
}

/* ------------------------------------------------------------- word bank -- */

const W = (he, gloss, extra = {}) => ({ he, gloss, ...extra });

const BANK = {
  plain: [
    W("מֶלֶךְ", "king"), W("בַּיִת", "house"), W("דָּבָר", "word"),
    W("כֶּסֶף", "silver"), W("נֶפֶשׁ", "soul"), W("סוּס", "horse"),
    W("מַיִם", "water"), W("דֶּרֶךְ", "way"), W("גּוֹי", "nation"),
    W("יָד", "hand"), W("לֵב", "heart"), W("מִשְׁפָּט", "judgment"),
  ],
  lengthen: [
    W("אִישׁ", "man"), W("עִיר", "city"), W("רֹאשׁ", "head"),
    W("אוֹר", "light"), W("אָדָם", "humanity"), W("אֹהֶל", "tent"),
    W("עַיִן", "eye"), W("רוּחַ", "spirit"), W("רֶגֶל", "foot"),
    W("אֵם", "mother"), W("עֵץ", "tree"), W("אִשָּׁה", "woman"),
    W("עָב", "cloud", {
      note: "ע with qamats, yet הָ — one syllable, so that qamats is stressed, and rule 4 only reaches an unstressed ע.",
    }),
  ],
  virtual: [
    W("הֵיכָל", "palace"), W("חֹדֶשׁ", "new moon"), W("חֶרֶב", "sword"),
    W("חֶסֶד", "steadfast love"), W("חֹשֶׁךְ", "darkness"), W("חַיִל", "strength"),
    W("חֵיק", "bosom"), W("חֹזֶה", "seer"), W("חֵרֵשׁ", "deaf"),
  ],
  segol: [
    W("הָמוֹן", "uproar"), W("עָוֹן", "iniquity"), W("חָזוֹן", "vision"),
    W("חָכָם", "wise man"), W("חָגָב", "locust"), W("עָנָו", "afflicted"),
    W("עָפָר", "dust"), W("חָצֵר", "court"),
  ],
  /* §1.c — the noun changes, so these are written rather than derived. */
  reshape: [
    W("אֲרוֹן", "ark", { def: "הָאָרוֹן", was: "hataf patah stretches to qamats" }),
    W("אֶרֶץ", "land", { def: "הָאָרֶץ", was: "segol stretches to qamats" }),
    W("גַּן", "garden", { def: "הַגָּן", was: "patah stretches to qamats" }),
    W("הַר", "mountain", { def: "הָהָר", was: "patah stretches, and the article is הָ where rule 3 would give הַ" }),
    W("חַג", "festival", { def: "הֶחָג", was: "patah stretches to qamats, so rule 4 then applies" }),
    W("עַם", "people", { def: "הָעָם", was: "patah stretches to qamats" }),
    W("פַּר", "bull", { def: "הַפָּר", was: "patah stretches to qamats" }),
  ],
};

export const ALL_WORDS = LESSONS.flatMap((lesson) =>
  (BANK[lesson.id] ?? []).map((w, i) => ({
    ...w,
    id: `${lesson.id}-${i}`,
    lesson: lesson.id,
    def: w.def ?? definiteOf(w.he, lesson.id),
  }))
);

export const wordsForLesson = (id) => ALL_WORDS.filter((w) => w.lesson === id);
export const wordById = new Map(ALL_WORDS.map((w) => [w.id, w]));

/* --------------------------------------------------------------- grading -- */

/* The dagesh is the lesson here — it is the whole difference between rule 1 and
   rule 3 — so unlike the guided forms exercise it is graded strictly. Only the shape a
   letter takes at the end of a word is forgiven, which nothing here teaches. */

const strip = (s) => canonical(s);
export const sameForm = (a, b) => strip(a) === strip(b);

export function judgeArticle(typed, word) {
  const got = strip(typed.trim());
  const want = strip(word.def);
  if (got === want) return { exact: true };
  if (foldFinals(got) === foldFinals(want)) {
    return { forgiven: true, why: "letter shape" };
  }
  return null;
}

/* The article actually written, for diagnosing a near miss. */
const articleOf = (form) => {
  const cs = clusters(strip(form));
  if (!cs.length || [...cs[0]].find(isLetter) !== HE) return null;
  return cs[0];
};

const NAMES = {
  [HE + PATAH]: "הַ",
  [HE + QAMATS]: "הָ",
  [HE + SEGOL]: "הֶ",
};

/** Why an answer missed, most specific first; null when nothing better fits. */
export function diagnose(typed, word) {
  const got = strip(typed.trim());
  const want = strip(word.def);
  if (got === want) return null;

  const gotArticle = articleOf(got);
  const wantArticle = articleOf(want);

  /* The article itself is wrong. An unpointed ה is its own case: naming the
     article you "wrote" against the one wanted produced "The article here is
     הַ" when הַ is exactly what was typed, minus its vowel. */
  if (gotArticle && wantArticle && strip(gotArticle) !== strip(wantArticle)) {
    const g = NAMES[strip(gotArticle)], w = NAMES[strip(wantArticle)];
    if (!g) return `The article needs its vowel — it is ${w ?? "not bare ה"} here.`;
    if (w) return `The article here is ${w}, not ${g}.`;
    return "The article here is something else.";
  }

  /* The article is right, so the rest of the word is where it went wrong. */
  const gotRest = clusters(got).slice(1).join("");
  const wantRest = clusters(want).slice(1).join("");
  const hadDagesh = gotRest.includes(DAGESH), wantsDagesh = wantRest.includes(DAGESH);

  if (!hadDagesh && wantsDagesh) {
    return "The first consonant needs the dagesh — that is the article's own letter inside it.";
  }
  if (hadDagesh && !wantsDagesh) {
    return word.lesson === "virtual"
      ? "No dagesh: ה and ח will not take one, and nothing compensates — the doubling is only understood."
      : "No dagesh: this letter will not take one, which is why the article lengthened instead.";
  }
  if (word.lesson === "reshape" && strip(gotRest) === strip(canonical(word.he))) {
    return "The article is right, but this is one of the few nouns whose own vowel stretches.";
  }
  return "The article is right; the noun is not.";
}
