/* =============================================================================
   Gender and number drill — every form, with its parsing.

   Built on the vocabulary bank, so the Hebrew, transliteration and glosses stay
   in one place. This file adds the plural and dual forms, and the gender of
   each lemma.

   Nothing here is invented. The dual in Biblical Hebrew is not a productive
   inflection — Gesenius §88 calls it "almost exclusively" for things that occur
   naturally in pairs, and the dual ending never appears on an adjective or a
   verb, so it marks no agreement. "Two houses" is שְׁנֵי בָתִּים, a numeral plus a
   plural, not a dual of בַּיִת. Only five lemmas in this bank take one: the four
   paired body parts and יוֹם. Plurals likewise are only listed where attested —
   אָדָם, דַּעַת, זָהָב and the rest simply have none.
   ========================================================================== */

import { WORD_BANK } from "../vocabulary/data.js";

/** Lemmas that are feminine. Everything else is masculine. */
const FEMININE = new Set([
  "adamah", "berit", "daat", "chokhmah", "ozen", "em", "erets", "cherev",
  "yad", "nefesh", "ayin", "regel", "even", "milchamah", "olah", "achot",
  "ishah", "bat", "ir", "ruach",
]);

/* Marked "ms or fs" by the textbook itself, and two-gendered in BDB. Either
   column counts as right for these. */
const BOTH_GENDERS = new Set(["derekh", "or"]);

/* The base form in the vocabulary bank isn't always a singular. */
const BASE_NUMBER = {
  elohim: "plural",   // plural form, usually singular in meaning
  panim: "plural",    // always plural
  mayim: "dual",      // dual in form; see the note below
  shamayim: "dual",
};

/** key -> [plural, transliteration] */
const PLURALS = {
  adamah: ["אֲדָמוֹת", "ʾăḏāmôṯ"],
  goy: ["גּוֹיִם", "gôyim"],
  davar: ["דְּבָרִים", "dəḇārîm"],
  chodesh: ["חֳדָשִׁים", "ḥŏḏāšîm"],
  kohen: ["כֹּהֲנִים", "kōhănîm"],
  el: ["אֵלִים", "ʾēlîm"],
  em: ["אִמּוֹת", "ʾimmôṯ"],
  erets: ["אֲרָצוֹת", "ʾărāṣôṯ"],
  dam: ["דָּמִים", "dāmîm"],
  derekh: ["דְּרָכִים", "dərāḵîm"],
  cherev: ["חֲרָבוֹת", "ḥărāḇôṯ"],
  lev: ["לִבּוֹת", "libbôṯ"],
  mishpat: ["מִשְׁפָּטִים", "mišpāṭîm"],
  nefesh: ["נְפָשׁוֹת", "nəp̄āšôṯ"],
  even: ["אֲבָנִים", "ʾăḇānîm"],
  adon: ["אֲדוֹנִים", "ʾăḏônîm"],
  or: ["אוֹרִים", "ʾôrîm"],
  ayil: ["אֵילִים", "ʾêlîm"],
  heikhal: ["הֵיכָלוֹת", "hêḵālôṯ"],
  chayil: ["חֲיָלִים", "ḥăyālîm"],
  chesed: ["חֲסָדִים", "ḥăsāḏîm"],
  malakh: ["מַלְאָכִים", "malʾāḵîm"],
  milchamah: ["מִלְחָמוֹת", "milḥāmôṯ"],
  maqom: ["מְקוֹמוֹת", "məqômôṯ"],
  sus: ["סוּסִים", "sûsîm"],
  avon: ["עֲוֹנוֹת", "ʿăwōnôṯ"],
  olah: ["עֹלוֹת", "ʿōlôṯ"],
  ruach: ["רוּחוֹת", "rûḥôṯ"],
  av: ["אָבוֹת", "ʾāḇôṯ"],
  ohel: ["אֹהָלִים", "ʾōhālîm"],
  ach: ["אַחִים", "ʾaḥîm"],
  achot: ["אֲחָיוֹת", "ʾăḥāyôṯ"],
  ish: ["אֲנָשִׁים", "ʾănāšîm"],
  ishah: ["נָשִׁים", "nāšîm"],
  bayit: ["בָּתִּים", "bāttîm"],
  ben: ["בָּנִים", "bānîm"],
  bat: ["בָּנוֹת", "bānôṯ"],
  har: ["הָרִים", "hārîm"],
  yom: ["יָמִים", "yāmîm"],
  yam: ["יַמִּים", "yammîm"],
  keli: ["כֵּלִים", "kēlîm"],
  maaseh: ["מַעֲשִׂים", "maʿăśîm"],
  ir: ["עָרִים", "ʿārîm"],
  am: ["עַמִּים", "ʿammîm"],
  rosh: ["רָאשִׁים", "rāʾšîm"],
  sar: ["שָׂרִים", "śārîm"],
};

/** key -> [dual, transliteration]. Four paired body parts and one time word. */
const DUALS = {
  ozen: ["אָזְנַיִם", "ʾoznayim"],
  yad: ["יָדַיִם", "yāḏayim"],
  ayin: ["עֵינַיִם", "ʿênayim"],
  regel: ["רַגְלַיִם", "raḡlayim"],
  yom: ["יוֹמַיִם", "yômayim"],
};

/* The textbook marks עֲוֹנוֹת as both masculine and feminine plural. */
const PLURAL_BOTH_GENDERS = new Set(["avon"]);

const NOTES = {
  mayim: "Your textbook marks this a dual. Gesenius §88 and BDB both read it as only apparently dual and really a masculine plural — it takes plural agreement.",
  shamayim: "Dual in form, but it takes plural agreement; Gesenius §88 treats it as a plural, not a true dual.",
  elohim: "Plural in form, usually singular in meaning.",
  panim: "Always plural; there is no singular.",
  ruach: "Feminine, but occasionally masculine in the Bible.",
  derekh: "Masculine or feminine — both are attested, so either answer counts.",
  or: "Masculine or feminine — both are attested, so either answer counts.",
  avon: "Attested as both a masculine and a feminine plural, so either answer counts.",
  ishah: "Feminine, though the plural נָשִׁים carries the masculine ־ִים ending.",
  ir: "Feminine, though the plural עָרִים carries the masculine ־ִים ending.",
  even: "Feminine, though the plural אֲבָנִים carries the masculine ־ִים ending.",
  av: "Masculine, though the plural אָבוֹת carries the feminine ־וֹת ending.",
  lev: "Masculine, though the plural לִבּוֹת carries the feminine ־וֹת ending.",
  maqom: "Masculine, though the plural מְקוֹמוֹת carries the feminine ־וֹת ending.",
  heikhal: "Masculine, though the plural הֵיכָלוֹת carries the feminine ־וֹת ending.",
};

const gendersFor = (key) =>
  BOTH_GENDERS.has(key) ? ["m", "f"] : FEMININE.has(key) ? ["f"] : ["m"];

/** Every form, in vocabulary order: base, then plural, then dual. */
export const FORMS = (() => {
  const out = [];
  for (const w of WORD_BANK) {
    const genders = gendersFor(w.key);
    const gloss = w.glosses[0];
    const note = NOTES[w.key];

    out.push({
      id: `${w.key}-base`,
      lemma: w.key,
      he: w.he,
      tr: w.tr,
      gloss,
      genders,
      number: BASE_NUMBER[w.key] ?? "singular",
      note,
    });

    const plural = PLURALS[w.key];
    if (plural) {
      out.push({
        id: `${w.key}-pl`,
        lemma: w.key,
        he: plural[0],
        tr: plural[1],
        gloss,
        genders: PLURAL_BOTH_GENDERS.has(w.key) ? ["m", "f"] : genders,
        number: "plural",
        note,
      });
    }

    const dual = DUALS[w.key];
    if (dual) {
      out.push({
        id: `${w.key}-du`,
        lemma: w.key,
        he: dual[0],
        tr: dual[1],
        gloss,
        genders,
        number: "dual",
        note,
      });
    }
  }
  /* The rotation opens with one form in each of the six cells, so every option
     on the grid is live from the first question. A plain prefix of the list
     could never do that — duals sit a dozen entries deep — so the seed is
     pulled to the front here rather than the engine being taught about cells.

     These six are the regular patterns: ־ָה and ־וֹת feminine, ־ִים masculine,
     ־ַיִם dual. The irregulars (נָשִׁים, אֲנָשִׁים, אָבוֹת) come later, once the
     defaults they violate are familiar. */
  const SEED = [
    "sus-base", "milchamah-base",   // m / f singular
    "yom-du", "yad-du",             // m / f dual
    "sus-pl", "milchamah-pl",       // m / f plural
  ];
  const seeded = SEED.map((id) => out.find((f) => f.id === id));
  if (seeded.some((f) => !f)) throw new Error("SEED names a form that does not exist");
  const rest = out.filter((f) => !SEED.includes(f.id));
  return [...seeded, ...rest].map((f, i) => ({ ...f, idx: i }));
})();

/** How many forms the rotation opens with — the seed above. */
export const SEED_SIZE = 6;

/* The six cells, in the order they're laid out and hotkeyed: two gender
   columns across, three number rows down. */
export const GENDERS = [
  { id: "m", label: "Masculine" },
  { id: "f", label: "Feminine" },
];
export const NUMBERS = [
  { id: "singular", label: "Singular" },
  { id: "dual", label: "Dual" },
  { id: "plural", label: "Plural" },
];

/** Row-major, so the hotkeys 1–6 read left-to-right then down. */
export const CELLS = NUMBERS.flatMap((n) =>
  GENDERS.map((g) => ({ id: `${g.id}-${n.id}`, gender: g.id, number: n.id }))
);

export const isCorrectCell = (form, cell) =>
  form.number === cell.number && form.genders.includes(cell.gender);
