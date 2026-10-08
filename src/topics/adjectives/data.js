/* =============================================================================
   Adjectives: the bank, and how a form is worked out.

   This topic is mostly composition. The nouns come from Gender and Number's
   FORMS — already carrying lexical gender, number and gloss, already checked —
   and the definite forms come from The Definite Article's `definiteOf`, so
   הֶחָכָם gets its segol from that topic's rule 4 without this one knowing the
   rule exists. What is new here is the agreement itself.

   Adjective inflections are stored rather than derived. The article topic
   derived its forms because the derivation *was* the lesson; here the lesson is
   agreement, and the inflected forms are input to it. Deriving them would mean
   re-implementing propretonic reduction for a second time, in a place where a
   bug would look like an agreement bug.

   Seow's five cited phrases were checked against the text rather than copied
   from the page: Deut 1:35, 1 Kgs 4:13, Isa 35:3, Isa 19:4, Gen 30:43. All five
   match what he prints. One spelling note: Isa 19:4 has אֲדֹנִים with a
   defective holam, while the noun bank lists the lexical plural as אֲדוֹנִים.
   Both are attested; the cited phrase keeps the text's spelling.

   Roots not yet taught are avoided: every adjective here belongs to a class the
   roots syllabus already covers, which rules out the geminates (רַב, רָע, דַּל,
   עַז, מַר). That costs us §4.c's only example — see COLLECTIVE_NOTE.
   ========================================================================== */

import { FORMS } from "../gender-number/data.js";
import { definiteOf, ALL_WORDS as ARTICLE_WORDS } from "../article/lessons.js";
import { canonical } from "../typing/typing.js";

/* ------------------------------------------------------------ adjectives -- */

/* `article` is which of the definite-article rules this word takes. The article
   topic can apply a rule but cannot work out which one applies, so it is
   recorded here. Fifteen words is cheap; a classifier would be the alternative,
   and would be worth writing if a third topic ever needed one. */
const A = (id, forms, gloss, article, extra = {}) => ({
  id,
  gloss,
  article,
  ms: forms[0], fs: forms[1], mp: forms[2], fp: forms[3],
  ...extra,
});

export const ADJECTIVES = [
  A("tov",    ["טוֹב", "טוֹבָה", "טוֹבִים", "טוֹבוֹת"], "good", "plain"),
  A("gadol",  ["גָּדוֹל", "גְּדוֹלָה", "גְּדֹלִים", "גְּדֹלוֹת"], "large", "plain"),
  A("qaton",  ["קָטֹן", "קְטַנָּה", "קְטַנִּים", "קְטַנּוֹת"], "small", "plain"),
  A("chakham",["חָכָם", "חֲכָמָה", "חֲכָמִים", "חֲכָמוֹת"], "wise", "segol"),
  A("zaqen",  ["זָקֵן", "זְקֵנָה", "זְקֵנִים", "זְקֵנוֹת"], "old", "plain"),
  A("chadash",["חָדָשׁ", "חֲדָשָׁה", "חֲדָשִׁים", "חֲדָשׁוֹת"], "new", "segol"),
  A("yashar", ["יָשָׁר", "יְשָׁרָה", "יְשָׁרִים", "יְשָׁרוֹת"], "upright", "plain"),
  A("qasheh", ["קָשֶׁה", "קָשָׁה", "קָשִׁים", "קָשׁוֹת"], "hard", "plain"),
  A("yafeh",  ["יָפֶה", "יָפָה", "יָפִים", "יָפוֹת"], "beautiful", "plain"),
  A("tsaddiq",["צַדִּיק", "צַדִּיקָה", "צַדִּיקִים", "צַדִּיקוֹת"], "righteous", "plain"),
  A("chazaq", ["חָזָק", "חֲזָקָה", "חֲזָקִים", "חֲזָקוֹת"], "strong", "segol"),
  A("qadosh", ["קָדוֹשׁ", "קְדוֹשָׁה", "קְדוֹשִׁים", "קְדוֹשׁוֹת"], "holy", "plain"),
  A("rasha",  ["רָשָׁע", "רְשָׁעָה", "רְשָׁעִים", "רְשָׁעוֹת"], "wicked", "lengthen"),
  A("rafeh",  ["רָפֶה", "רָפָה", "רָפִים", "רָפוֹת"], "slack", "lengthen"),
];

export const adjectiveById = new Map(ADJECTIVES.map((a) => [a.id, a]));

/* ----------------------------------------------------------------- nouns -- */

/* Five entries in the noun bank are attested as both genders — דֶּרֶךְ, אוֹר and
   עֲוֹנוֹת among them. An agreement question about one of those has two right
   answers, so they are not asked about. */
export const USABLE_NOUNS = FORMS.filter((f) => f.genders.length === 1);

export const nounByHe = new Map(USABLE_NOUNS.map((f) => [f.he, f]));

/* --------------------------------------------------------------- agreeing -- */

/** Which of the adjective's four forms a noun calls for.
 *
 *  Dual is the one that is not simply gender × number: there is no dual
 *  adjective, so a dual noun takes the plural (Seow IV.4.b). Everything else
 *  reads straight off the noun.
 */
export function formKeyFor(noun) {
  const gender = noun.genders[0];
  const plural = noun.number === "plural" || noun.number === "dual";
  if (gender === "f") return plural ? "fp" : "fs";
  return plural ? "mp" : "ms";
}

/**
 * The adjective as it appears with this noun.
 *
 * @param {object} noun      an entry from USABLE_NOUNS
 * @param {object} adjective an entry from ADJECTIVES
 * @param {"attributive"|"predicate"} use
 * @param {boolean} definite whether the phrase is definite
 *
 * An attributive adjective agrees in definiteness as well, so it takes the
 * article; a predicate adjective never does, however definite the noun is.
 * That one asymmetry is the whole of §3.
 */
export function agreeingForm(noun, adjective, use, definite) {
  const base = adjective[formKeyFor(noun)];
  if (use === "attributive" && definite) {
    return canonical(definiteOf(base, adjective.article));
  }
  return canonical(base);
}

/* ------------------------------------------------- the noun's own article -- */

/* The definite article topic already knows the hard cases, so ask it rather
   than guess. Its bank holds the §1.c seven written out — אֶרֶץ becomes
   הָאָרֶץ, not הָאֶרֶץ — and the rule-4 words whose guttural carries qamats.
   A heuristic on the first letter gets both of those wrong, which it did:
   the first phrase this topic generated was the one Deut 1:35 cites, spelled
   wrongly. */
const ARTICLE_FORMS = new Map(ARTICLE_WORDS.map((w) => [canonical(w.he), canonical(w.def)]));

const QAMATS = "\u05B8";
const QAMATS_QATAN = "\u05C7";
const SHEVA = "\u05B0";
const LENGTHENS = new Set(["א", "ע", "ר"]);
const REFUSES_DAGESH = new Set(["ה", "ח", "א", "ע", "ר"]);
const TAKES_SEGOL = new Set(["ח", "ה", "ע"]);

/* A qamats in a closed unstressed syllable is qamats hatuf — a short o, not a
   qamats — and rule 4 does not reach it. Most texts write both with the same
   character, so the signal is the shewa on the next consonant: חָכְמָה is
   ḥoḵmâ and takes הַ, which Job 28:12 confirms. Without this, every noun of
   that shape came out with a segol article it has never had. */
function startsWithQamats(word) {
  const [, second, , fourth] = [...word];
  if (second === QAMATS_QATAN) return false;
  if (second !== QAMATS) return false;
  return fourth !== SHEVA;
}

/** Which rule a noun the article bank has never seen would take. */
export function nounArticleRule(he) {
  const word = canonical(he);
  const first = [...word][0];
  /* Rule 4: ח with qamats takes הֶ either way, and so do ה and ע when that
     qamats is unstressed. Stress is not recorded here, so this follows the
     common case; a monosyllable like עָב would be the exception. */
  if (TAKES_SEGOL.has(first) && startsWithQamats(word)) return "segol";
  if (LENGTHENS.has(first)) return "lengthen";
  if (REFUSES_DAGESH.has(first)) return "virtual";
  return "plain";
}

/** The noun with its article, from the article bank where possible. */
export function definiteNoun(he) {
  const word = canonical(he);
  return ARTICLE_FORMS.get(word) ?? canonical(definiteOf(word, nounArticleRule(word)));
}

/** The whole phrase, for the reveal — the noun carries the article too. */
export function phraseFor(noun, adjective, use, definite) {
  const adj = agreeingForm(noun, adjective, use, definite);
  const head = definite ? definiteNoun(noun.he) : canonical(noun.he);
  return `${head} ${adj}`;
}

/* ------------------------------------------------------------ the corpus -- */

/** Seow's cited phrases, kept verbatim with their references. */
export const CITED = [
  { he: "הָאָרֶץ הַטּוֹבָה", gloss: "the good land", ref: "Deut 1:35", teaches: "lexical" },
  { he: "עָרִים גְּדֹלוֹת", gloss: "great cities", ref: "1 Kgs 4:13", teaches: "lexical" },
  { he: "יָדַיִם רָפוֹת", gloss: "slack hands", ref: "Isa 35:3", teaches: "dual" },
  { he: "אֲדֹנִים קָשֶׁה", gloss: "a hard master", ref: "Isa 19:4", teaches: "plural-one" },
];

/* §4.c's only example is צֹאן רַבּוֹת, and רַב is a geminate root — the one
   class the roots syllabus has not reached. Rather than teach the rule with a
   word the learner cannot yet analyse, or drop the rule, it is shown here and
   never asked for: you read it, you do not produce it. It becomes a step of its
   own once geminates are taught. */
export const COLLECTIVE_NOTE = {
  he: "צֹאן רַבּוֹת",
  gloss: "large flock",
  ref: "Gen 30:43",
  statement:
    "A {collective} noun — one word for many things — may take a plural adjective even though the noun is singular: צֹאן רַבּוֹת, \"large flock\". רַב comes from a root you have not met yet, so this one is here to be read rather than written.",
};
