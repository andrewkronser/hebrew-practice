/* =============================================================================
   Forming the plural — the rules, the glossary, and the words that drill them.

   The rule divisions are ours, not the textbook's. Two deliberate departures:
   the guttural variant of propretonic reduction is its own rule, because it is
   a separate thing to get right; and the textbook's parenthetical "ā is not
   reduced" is a full rule, because a negative stated as a contrast is how it
   sticks. One consequence is that מוֹעֵד → מוֹעֲדִים stops being a new rule at
   all — it is rule 5 composed with rule 4, and rules composing is worth seeing.

   Forms were checked against BDB where there was any doubt. Notes record what
   came back, including the one place the textbook and BDB part company.
   ========================================================================== */

/* Terms that get an inline tooltip. Deliberately short: these are read in
   passing, mid-rule, not studied. */
export const GLOSSARY = {
  stress: "The accented syllable. In Hebrew it is usually the last one.",
  ultima: "The last syllable of a word.",
  pretonic: "The syllable immediately before the stress.",
  propretonic: "Two syllables before the stress.",
  "open syllable": "A syllable ending in a vowel — בָ.",
  "closed syllable": "A syllable ending in a consonant — מִשׁ.",
  guttural:
    "א ה ח ע. They will not hold a plain šewa and take a composite one instead. " +
    "ר shares some guttural behaviour — it cannot be doubled — but it takes a plain šewa like any other letter.",
  "mater lectionis":
    "A consonant (ו י ה) written to mark a vowel rather than a sound of its own — " +
    "the ו of חוֹ or the י of בִי. Plural matres lectionis.",
  mater: "See mater lectionis: a consonant written to mark a vowel.",
  qamats: "ָ — long a.",
  tsere: "ֵ — long e.",
  patah: "ַ — short a.",
  segol: "ֶ — short e.",
  holam: "ֹ — long o, written with or without a ו.",
  hiriq: "ִ — i.",
};

/* The shared preamble for rules 3–6. They are not four facts but one decision
   read top to bottom, and stating it once is most of what makes them learnable. */
export const REDUCTION_PREAMBLE = [
  "Adding an ending pushes the {stress} to the right. Exactly one vowel is squeezed out, as far from the stress as it can be.",
  "Look two syllables back. {open syllable} with {qamats} or {tsere}? That one reduces.",
  "Cannot reduce there — a {holam}, or a vowel written with a {mater lectionis}? Look one syllable back. A {tsere} reduces instead.",
  "A {qamats} one syllable back? Nothing reduces.",
];

/* Error signatures. A typed answer matching one of these gets told what the
   mistake was, rather than just being marked wrong. */
export const ERRORS = {
  noReduction: "That is the form with no reduction at all.",
  plainForGuttural: "Right instinct, wrong šewa — a guttural cannot hold the plain one.",
  compositeForPlain: "That is the composite šewa, which only gutturals take.",
  reducedBoth: "Only one vowel reduces, not both.",
  reducedPretonicA: "That reduced a pretonic qamats. Only tsere reduces there.",
  noContraction: "The sequence did not contract.",
  keptHe: "The final ה is dropped before the ending.",
  wrongEnding: "Right stem, wrong ending.",
  keptHeFeminine: "The ה of the singular ending is replaced, not kept.",
  doubleYod:
    "A reasonable guess — but the ending's î is written without its own yod when the root already ends in one.",
};

/* ---------------------------------------------------------------- the rules --

   `streak` is how many correct answers in a row complete the rule. The
   mechanical rules need fewer; the reduction family needs more, because the
   four cases are genuinely confusable with one another.

   `group` nests the rule under a heading in the table of contents. */

export const RULES = [
  {
    id: "mp",
    n: 1,
    title: "The masculine plural ending",
    statement: "Masculine nouns add ־ִים.",
    streak: 5,
    words: [
      { he: "סוּס", tr: "sûs", gloss: "horse", target: "masculine plural", answer: "סוּסִים", answerTr: "sûsîm",
        errors: [{ form: "סוּסוֹת", why: "wrongEnding" }] },
      { he: "אוֹר", tr: "ʾôr", gloss: "light", target: "masculine plural", answer: "אוֹרִים", answerTr: "ʾôrîm",
        errors: [{ form: "אוֹרוֹת", why: "wrongEnding" }] },
      { he: "גּוֹי", tr: "gôy", gloss: "nation", target: "masculine plural", answer: "גּוֹיִם", answerTr: "gôyim",
        hint: "The root already ends in a yod — don't write a second one for the ending.",
        note: "You would expect גּוֹיִים, with one yod closing the root and another carrying the ending's î. Only one is written. BDB records the fuller spelling as a Ketiv at Psalm 79:10, which is the tell that this is a spelling convention and not a different form.",
        errors: [
          { form: "גּוֹיוֹת", why: "wrongEnding" },
          { form: "גּוֹיִים", why: "doubleYod" },
        ] },
      { he: "שִׁיר", tr: "šîr", gloss: "song", target: "masculine plural", answer: "שִׁירִים", answerTr: "šîrîm",
        errors: [{ form: "שִׁירוֹת", why: "wrongEnding" }] },
      { he: "צַדִּיק", tr: "ṣaddîq", gloss: "righteous one", target: "masculine plural", answer: "צַדִּיקִים", answerTr: "ṣaddîqîm",
        note: "First syllable is closed and the î is written with a {mater lectionis}. Nothing can move.",
        errors: [{ form: "צַדְּיקִים", why: "noReduction" }] },
    ],
  },
  {
    id: "fp",
    n: 2,
    title: "The feminine plural ending",
    statement: "A feminine noun ending in ־ָה swaps that ending for ־וֹת. The ה is not kept.",
    streak: 5,
    words: [
      { he: "תּוֹרָה", tr: "tôrā(h)", gloss: "instruction", target: "feminine plural", answer: "תּוֹרוֹת", answerTr: "tôrôt",
        errors: [{ form: "תּוֹרִים", why: "wrongEnding" }, { form: "תּוֹרָהוֹת", why: "keptHeFeminine" }] },
      { he: "אֲדָמָה", tr: "ʾăḏāmā(h)", gloss: "ground", target: "feminine plural", answer: "אֲדָמוֹת", answerTr: "ʾăḏāmôt",
        note: "BDB lists this plural at Psalm 49:12.",
        errors: [{ form: "אֲדָמִים", why: "wrongEnding" }, { form: "אֲדָמָהוֹת", why: "keptHeFeminine" }] },
      { he: "מִלְחָמָה", tr: "milḥāmā(h)", gloss: "battle", target: "feminine plural", answer: "מִלְחָמוֹת", answerTr: "milḥāmôt",
        errors: [{ form: "מִלְחָמִים", why: "wrongEnding" }] },
      { he: "מִשְׁפָּחָה", tr: "mišpāḥā(h)", gloss: "family", target: "feminine plural", answer: "מִשְׁפָּחוֹת", answerTr: "mišpāḥôt",
        errors: [{ form: "מִשְׁפָּחִים", why: "wrongEnding" }, { form: "מִשְׁפְּחוֹת", why: "reducedPretonicA" }] },
    ],
  },
  {
    id: "pro",
    n: 3,
    group: "Reduction",
    title: "Two syllables back",
    statement: "A {qamats} or {tsere} in an {open syllable} two syllables before the {stress} reduces to a šewa.",
    streak: 8,
    words: [
      { he: "נָבִיא", tr: "nāḇîʾ", gloss: "prophet", target: "masculine plural", answer: "נְבִיאִים", answerTr: "nəḇîʾîm",
        errors: [{ form: "נָבִיאִים", why: "noReduction" }, { form: "נֲבִיאִים", why: "compositeForPlain" }] },
      { he: "נָבִיא", tr: "nāḇîʾ", gloss: "prophet", target: "feminine singular", answer: "נְבִיאָה", answerTr: "nəḇîʾā(h)",
        errors: [{ form: "נָבִיאָה", why: "noReduction" }] },
      { he: "לֵבָב", tr: "lēḇāḇ", gloss: "heart", target: "feminine plural", answer: "לְבָבוֹת", answerTr: "ləḇāḇôt",
        errors: [{ form: "לֵבָבוֹת", why: "noReduction" }, { form: "לֲבָבוֹת", why: "compositeForPlain" }] },
      { he: "דָּבָר", tr: "dāḇār", gloss: "word", target: "masculine plural", answer: "דְּבָרִים", answerTr: "dəḇārîm",
        note: "The second {qamats} is {pretonic} and stays — this word needs rule 6 as well as rule 3.",
        errors: [{ form: "דָּבָרִים", why: "noReduction" }, { form: "דְּבְרִים", why: "reducedBoth" }] },
      { he: "מָקוֹם", tr: "māqôm", gloss: "place", target: "feminine plural", answer: "מְקוֹמוֹת", answerTr: "məqômôt",
        errors: [{ form: "מָקוֹמוֹת", why: "noReduction" }] },
    ],
  },
  {
    id: "pro-gut",
    n: 4,
    group: "Reduction",
    title: "…under a guttural",
    statement: "Rule 3's reduction, where the syllable begins with a {guttural}. A guttural will not hold a plain šewa, so it takes a composite one — usually ֲ.",
    streak: 8,
    words: [
      { he: "חָכָם", tr: "ḥāḵām", gloss: "wise man", target: "masculine plural", answer: "חֲכָמִים", answerTr: "ḥăḵāmîm",
        errors: [{ form: "חָכָמִים", why: "noReduction" }, { form: "חְכָמִים", why: "plainForGuttural" }] },
      { he: "עֵנָב", tr: "ʿēnāḇ", gloss: "grape", target: "masculine plural", answer: "עֲנָבִים", answerTr: "ʿănāḇîm",
        note: "The composite is a-coloured even though the vowel it replaces was a {tsere}.",
        errors: [{ form: "עֵנָבִים", why: "noReduction" }, { form: "עְנָבִים", why: "plainForGuttural" }] },
      { he: "חָגָב", tr: "ḥāḡāḇ", gloss: "locust", target: "masculine plural", answer: "חֲגָבִים", answerTr: "ḥăḡāḇîm",
        errors: [{ form: "חָגָבִים", why: "noReduction" }, { form: "חְגָבִים", why: "plainForGuttural" }] },
      { he: "אָדוֹן", tr: "ʾāḏôn", gloss: "lord", target: "masculine plural", answer: "אֲדוֹנִים", answerTr: "ʾăḏônîm",
        errors: [{ form: "אָדוֹנִים", why: "noReduction" }, { form: "אְדוֹנִים", why: "plainForGuttural" }] },
      { he: "עָוֹן", tr: "ʿāwōn", gloss: "guilt", target: "feminine plural", answer: "עֲוֹנוֹת", answerTr: "ʿăwōnôt",
        errors: [{ form: "עָוֹנוֹת", why: "noReduction" }, { form: "עְוֹנוֹת", why: "plainForGuttural" }] },
    ],
  },
  {
    id: "pre-e",
    n: 5,
    group: "Reduction",
    title: "One syllable back",
    statement: "When the vowel two syllables back cannot reduce — a {holam}, or a vowel written with a {mater lectionis} — a {tsere} one syllable before the {stress} reduces instead. If that syllable is a {guttural}, rule 4 still applies.",
    streak: 8,
    words: [
      { he: "שֹׁפֵט", tr: "šōp̄ēṭ", gloss: "judge", target: "masculine plural", answer: "שֹׁפְטִים", answerTr: "šōp̄əṭîm",
        note: "The {holam} will not reduce, so the {tsere} goes instead. פ is no {guttural}, so the šewa is plain.",
        errors: [{ form: "שֹׁפֵטִים", why: "noReduction" }, { form: "שֹׁפֲטִים", why: "compositeForPlain" }] },
      { he: "אֹיֵב", tr: "ʾōyēḇ", gloss: "enemy", target: "masculine plural", answer: "אֹיְבִים", answerTr: "ʾōyəḇîm",
        errors: [{ form: "אֹיֵבִים", why: "noReduction" }, { form: "אֹיֲבִים", why: "compositeForPlain" }] },
      { he: "מוֹעֵד", tr: "môʿēḏ", gloss: "assembly", target: "masculine plural", answer: "מוֹעֲדִים", answerTr: "môʿăḏîm",
        note: "Rule 5 and rule 4 together: the ô is a {mater lectionis} and holds, and ע takes the composite.",
        errors: [{ form: "מוֹעֵדִים", why: "noReduction" }, { form: "מוֹעְדִים", why: "plainForGuttural" }] },
      { he: "כֹּהֵן", tr: "kōhēn", gloss: "priest", target: "masculine plural", answer: "כֹּהֲנִים", answerTr: "kōhănîm",
        errors: [{ form: "כֹּהֵנִים", why: "noReduction" }, { form: "כֹּהְנִים", why: "plainForGuttural" }] },
    ],
  },
  {
    id: "pre-a",
    n: 6,
    group: "Reduction",
    title: "Where nothing reduces",
    statement: "A {qamats} one syllable before the {stress} never reduces. Only {tsere} does.",
    streak: 8,
    words: [
      { he: "מִשְׁפָּט", tr: "mišpāṭ", gloss: "judgment", target: "masculine plural", answer: "מִשְׁפָּטִים", answerTr: "mišpāṭîm",
        errors: [{ form: "מִשְׁפְּטִים", why: "reducedPretonicA" }] },
      { he: "מַלְאָךְ", tr: "malʾāḵ", gloss: "messenger", target: "masculine plural", answer: "מַלְאָכִים", answerTr: "malʾāḵîm",
        errors: [{ form: "מַלְאְכִים", why: "reducedPretonicA" }] },
      { he: "כּוֹכָב", tr: "kôḵāḇ", gloss: "star", target: "masculine plural", answer: "כּוֹכָבִים", answerTr: "kôḵāḇîm",
        errors: [{ form: "כּוֹכְבִים", why: "reducedPretonicA" }] },
      { he: "הֵיכָל", tr: "hêḵāl", gloss: "palace", target: "feminine plural", answer: "הֵיכָלוֹת", answerTr: "hêḵālôt",
        errors: [{ form: "הֵיכְלוֹת", why: "reducedPretonicA" }] },
      { he: "דָּם", tr: "dām", gloss: "blood", target: "masculine plural", answer: "דָּמִים", answerTr: "dāmîm",
        errors: [{ form: "דְּמִים", why: "reducedPretonicA" }] },
    ],
  },
  {
    id: "ayi",
    n: 7,
    group: "Contraction",
    title: "áyi contracts to ê",
    statement: "The sequence a-y-i collapses into a single ê.",
    streak: 4,
    words: [
      { he: "זַיִת", tr: "zayit", gloss: "olive", target: "masculine plural", answer: "זֵיתִים", answerTr: "zêtîm",
        errors: [{ form: "זַיִתִים", why: "noContraction" }] },
      { he: "אַיִל", tr: "ʾayil", gloss: "ram", target: "masculine plural", answer: "אֵילִים", answerTr: "ʾêlîm",
        errors: [{ form: "אַיִלִים", why: "noContraction" }] },
    ],
  },
  {
    id: "awe",
    n: 8,
    group: "Contraction",
    title: "áwe contracts to ô",
    statement: "The sequence a-w-e collapses into a single ô.",
    streak: 4,
    words: [
      { he: "אָוֶן", tr: "ʾāwen", gloss: "trouble", target: "masculine plural", answer: "אוֹנִים", answerTr: "ʾônîm",
        note: "BDB attests this plural at Hosea 9:4.",
        errors: [{ form: "אָוֶנִים", why: "noContraction" }] },
      { he: "מָוֶת", tr: "māwet", gloss: "death", target: "masculine plural", answer: "מוֹתִים", answerTr: "môtîm",
        note: "Your textbook's form. BDB attests only the construct plural מוֹתֵי, at Ezekiel 28:10 — the contraction is the same either way.",
        errors: [{ form: "מָוֶתִים", why: "noContraction" }] },
    ],
  },
  {
    id: "final-he",
    n: 9,
    title: "Final ־ֶה drops",
    statement: "A noun ending in ־ֶה loses it before any plural or feminine ending.",
    streak: 5,
    words: [
      { he: "חֹזֶה", tr: "ḥōze(h)", gloss: "seer", target: "masculine plural", answer: "חֹזִים", answerTr: "ḥōzîm",
        errors: [{ form: "חֹזֶהִים", why: "keptHe" }] },
      { he: "רֹעֶה", tr: "rōʿe(h)", gloss: "shepherd", target: "masculine plural", answer: "רֹעִים", answerTr: "rōʿîm",
        errors: [{ form: "רֹעֶהִים", why: "keptHe" }] },
      { he: "מַעֲשֶׂה", tr: "maʿăśe(h)", gloss: "deed", target: "masculine plural", answer: "מַעֲשִׂים", answerTr: "maʿăśîm",
        errors: [{ form: "מַעֲשֶׂהִים", why: "keptHe" }] },
    ],
  },
];

/* Free practice closes the lesson: every word, rules mixed, no completion. */
export const MIXED_REVIEW = {
  id: "free",
  n: 10,
  title: "Mixed Review",
  statement: "Every word, rules mixed. There is nothing left to complete — this is where the lesson ends up.",
};

export const ALL_PROMPTS = RULES.flatMap((rule) =>
  rule.words.map((w, i) => ({ ...w, id: `${rule.id}-${i}`, ruleId: rule.id, ruleN: rule.n }))
);

export const ruleById = new Map(RULES.map((r) => [r.id, r]));

/* The rules plus Mixed Review, as the contents lists them — the same shape the
   other guided topics expose, so they can share one contents component. */
export const CONTENTS = [...RULES, MIXED_REVIEW];
export const promptsForRule = (ruleId) => ALL_PROMPTS.filter((p) => p.ruleId === ruleId);
