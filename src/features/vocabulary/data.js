/* =============================================================================
   Vocabulary word bank — nouns only for now.

   Grouped by the lesson list they came from, and unlocked in that order, so the
   trainer tracks the course sequence rather than frequency or alphabet.

     key      stable identifier, used by CONFLICTS below
     he       the pointed Hebrew noun
     glosses  every sense, in the textbook's own order. The quiz rotates through
              these one at a time rather than showing them all at once.

   CONFLICTS lists pairs that are *not* caught by comparing gloss strings but
   would still make two options defensible at once — near-synonyms, mostly. Pairs
   that share a gloss outright (אֵל/אֱלֹהִים on "God", נֶפֶשׁ/רוּחַ on "breath") are
   derived automatically in quiz.js and don't need listing here.
   ========================================================================== */

export const LISTS = [
  {
    id: "list-1",
    label: "List 1",
    words: [
      { key: "adam",     he: "אָדָם",    glosses: ["human", "humanity", "people", "person", "Adam (the first human)"] },
      { key: "adamah",   he: "אֲדָמָה",   glosses: ["ground", "land", "soil"] },
      { key: "berit",    he: "בְּרִית",    glosses: ["covenant", "treaty", "alliance"] },
      { key: "goy",      he: "גּוֹי",     glosses: ["nation"] },
      { key: "davar",    he: "דָּבָר",    glosses: ["word", "thing", "affair", "matter"] },
      { key: "daat",     he: "דַּ֫עַת",    glosses: ["knowledge"] },
      { key: "zahav",    he: "זָהָב",    glosses: ["gold"] },
      { key: "chodesh",  he: "חֹ֫דֶשׁ",    glosses: ["new moon", "month"] },
      { key: "chokhmah", he: "חָכְמָה",   glosses: ["wisdom"] },
      { key: "kohen",    he: "כֹּהֵן",    glosses: ["priest"] },
      { key: "kesef",    he: "כֶּ֫סֶף",    glosses: ["silver", "money"] },
    ],
  },
  {
    id: "list-2",
    label: "List 2",
    words: [
      { key: "ozen",     he: "אֹ֫זֶן",     glosses: ["ear"] },
      { key: "el",       he: "אֵל",      glosses: ["god", "God", "El"] },
      { key: "elohim",   he: "אֱלֹהִים",   glosses: ["God", "gods"] },
      { key: "em",       he: "אֵם",      glosses: ["mother"] },
      { key: "erets",    he: "אֶ֫רֶץ",     glosses: ["land", "earth", "country"] },
      { key: "dam",      he: "דָּם",      glosses: ["blood"] },
      { key: "derekh",   he: "דֶּ֫רֶךְ",     glosses: ["way", "road"] },
      { key: "cherev",   he: "חֶ֫רֶב",     glosses: ["sword"] },
      { key: "yad",      he: "יָד",      glosses: ["hand", "power"] },
      { key: "lev",      he: "לֵב",      glosses: ["heart", "mind"] },
      { key: "mayim",    he: "מַ֫יִם",     glosses: ["water"] },
      { key: "mishpat",  he: "מִשְׁפָּט",    glosses: ["judgment", "justice", "right", "custom"] },
      { key: "nefesh",   he: "נֶ֫פֶשׁ",     glosses: ["self", "person", "soul", "breath", "will"] },
      { key: "ayin",     he: "עַ֫יִן",     glosses: ["eye", "spring"] },
      { key: "peh",      he: "פֶּה",      glosses: ["mouth"] },
      { key: "panim",    he: "פָּנִים",    glosses: ["face", "presence"] },
      { key: "regel",    he: "רֶ֫גֶל",     glosses: ["foot"] },
      { key: "shamayim", he: "שָׁמַ֫יִם",   glosses: ["heaven", "sky"] },
    ],
  },
  {
    id: "list-3",
    label: "List 3",
    words: [
      { key: "even",     he: "אֶ֫בֶן",     glosses: ["stone"] },
      { key: "adon",     he: "אָדוֹן",    glosses: ["lord", "master", "sir"] },
      { key: "or",       he: "אוֹר",     glosses: ["light"] },
      { key: "ayil",     he: "אַ֫יִל",     glosses: ["ram"] },
      { key: "enosh",    he: "אֱנוֹשׁ",    glosses: ["humanity", "a human"] },
      { key: "heikhal",  he: "הֵיכָל",    glosses: ["palace", "temple"] },
      { key: "chayil",   he: "חַ֫יִל",     glosses: ["valor", "power", "army", "wealth"] },
      { key: "chesed",   he: "חֶ֫סֶד",     glosses: ["devotion", "loyalty", "faithfulness", "proper act"] },
      { key: "choshekh", he: "חֹ֫שֶׁךְ",    glosses: ["darkness"] },
      { key: "lechem",   he: "לֶ֫חֶם",     glosses: ["bread", "food"] },
      { key: "malakh",   he: "מַלְאָךְ",   glosses: ["messenger", "angel"] },
      { key: "milchamah", he: "מִלְחָמָה", glosses: ["battle", "war"] },
      { key: "maqom",    he: "מָקוֹם",    glosses: ["place"] },
      { key: "sus",      he: "סוּס",     glosses: ["horse", "stallion"] },
      { key: "avon",     he: "עָוֺן",     glosses: ["guilt", "iniquity"] },
      { key: "olah",     he: "עוֹלָה",    glosses: ["burnt offering"] },
      { key: "peri",     he: "פְּרִי",     glosses: ["fruit"] },
      { key: "ruach",    he: "רוּחַ",     glosses: ["spirit", "wind", "breath"] },
    ],
  },
  {
    id: "list-4",
    label: "List 4",
    words: [
      { key: "av",       he: "אָב",      glosses: ["father"] },
      { key: "ohel",     he: "אֹ֫הֶל",     glosses: ["tent"] },
      { key: "ach",      he: "אָח",      glosses: ["brother"] },
      { key: "achot",    he: "אָחוֹת",    glosses: ["sister"] },
      { key: "ish",      he: "אִישׁ",     glosses: ["man", "husband"] },
      { key: "ishah",    he: "אִשָּׁה",     glosses: ["woman", "wife"] },
      { key: "bayit",    he: "בַּ֫יִת",     glosses: ["house"] },
      { key: "ben",      he: "בֵּן",      glosses: ["son", "grandson"] },
      { key: "bat",      he: "בַּת",      glosses: ["daughter"] },
      { key: "har",      he: "הַר",      glosses: ["mountain"] },
      { key: "yom",      he: "יוֹם",     glosses: ["day"] },
      { key: "yam",      he: "יָם",      glosses: ["sea"] },
      { key: "keli",     he: "כְּלִי",     glosses: ["vessel", "instrument", "weapon"] },
      { key: "maaseh",   he: "מַעֲשֶׂה",   glosses: ["deed"] },
      { key: "ir",       he: "עִיר",     glosses: ["city"] },
      { key: "am",       he: "עַם",      glosses: ["people"] },
      { key: "rosh",     he: "רֹאשׁ",     glosses: ["head", "top", "chief"] },
      { key: "sar",      he: "שַׂר",      glosses: ["commander", "ruler", "prince"] },
    ],
  },
];

/* Near-synonyms that share no gloss string but would still let a learner
   defend two options at once. Symmetric; order within a pair doesn't matter. */
export const CONFLICTS = [
  ["adam", "ish"],        // person / man
  ["enosh", "ish"],       // a human / man
  ["enosh", "am"],        // humanity / people
  ["goy", "am"],          // nation / people
  ["goy", "erets"],       // nation / country
  ["chokhmah", "daat"],   // wisdom / knowledge
  ["lev", "nefesh"],      // heart, mind / self, soul
  ["rosh", "sar"],        // chief / ruler
  ["adon", "sar"],        // lord, master / ruler
  ["keli", "cherev"],     // weapon / sword
];

/* Flattened, in unlock order. `id` is what progression.js keys its stats on. */
export const WORD_BANK = LISTS.flatMap((list) =>
  list.words.map((w) => ({ ...w, id: w.key, listId: list.id, listLabel: list.label }))
);

export const wordByKey = new Map(WORD_BANK.map((w) => [w.key, w]));
