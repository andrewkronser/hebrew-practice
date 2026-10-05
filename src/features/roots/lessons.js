/* Finding the BDB root of a noun.

   Seow's Lesson IV describes how a root becomes a word. This drill runs that
   backwards, which is why the order here is not his. Prefixes are the last
   thing applied in formation, so they are the first thing undone in recovery —
   and in any case nearly every I-Wāw noun in the lesson is a prefixed form, so
   that class cannot be taught at all until מ and ת can be stripped. After that
   move the sequence is his own: gutturals (2.a), nûn (2.b), then 2.c walked in
   order — i-ii, v-vi, vii, viii.

   Omitted: 2.c.iii-iv, the *aw > áwe/ô and *ay > áyi/ê contractions. They change
   how a word looks, not which letters are in its root — מָוֶת and מוֹתִי are both
   מות — and they are already drilled forward in "Write the form".

   Every root here is the one Seow prints beside the noun. The handful of words
   brought in from elsewhere in the app to stock the thinner lessons were each
   checked against BDB; they carry a `checked` note. חֵיק is left out: Seow gives
   its root as "חיק / חוק", and a word whose root the rules cannot decide is not
   something to be marked wrong on. */

import { clusters, canonical } from "../typing/typing.js";
import {
  isLetter, isGuttural, RESH, foldFinals, toMedial, consonantsOf, withFinalForm,
} from "../../shared/hebrewLetters.js";
import { createSyllabus } from "../../shared/syllabus.js";

/* ---------------------------------------------------------------- lessons -- */

export const LESSONS = [
  {
    id: "strong", n: 1, group: null, seow: "III.1",
    title: "Strong roots",
    fingerprint: "none",
    statement:
      "Three sturdy consonants, and the root is simply those three. The vowels belong to the pattern, never to the root, so read straight past them. Strip any ending first — ־ִים, ־וֹת, ־ָה — and what is left is your answer.",
    streak: 5,
  },
  {
    id: "prefix", n: 2, group: null, seow: "§3",
    title: "Nouns with prefixes",
    fingerprint: "first",
    statement:
      "Some patterns put a מ, ת or א on the front. It is not a radical, so peel it off — but only if you are still left with three letters. The מ of מֶלֶךְ is a radical; the מ of מִשְׁפָּט is not.",
    streak: 6,
  },
  {
    id: "gutt", n: 3, group: "Gutturals", seow: "§2.a.i–iii",
    title: "Gutturals and Rêš",
    fingerprint: "guttural",
    statement:
      "א ה ח ע — and ר — refuse to be doubled, will not take a plain šewa, and pull nearby vowels toward a. All of that changes the vowels and none of it changes the consonants: every radical is still on the page. Expect the pointing to look wrong, and ignore it.",
    streak: 6,
  },
  {
    id: "nun", n: 4, group: "Nûn", seow: "§2.b",
    title: "I-Nûn",
    fingerprint: "dagesh",
    statement:
      "A נ with no vowel of its own dissolves into the consonant after it and leaves a dagesh behind. A dot with no other reason for being there is the fingerprint: put the נ back on the front.",
    streak: 5,
  },
  {
    id: "iwaw", n: 5, group: "Wāw and Yōd", seow: "§2.c.i–ii",
    title: "I-Wāw, listed as I-Yōd",
    fingerprint: "carrier",
    statement:
      "Hebrew will not begin a word with ו, so roots that once did are written — and listed in the dictionaries — with י instead. In these prefixed nouns the old ו shows up as the ô or ê after the prefix. Strip the prefix and write י, never ו.",
    streak: 4,
  },
  {
    id: "iiwy", n: 6, group: "Wāw and Yōd", seow: "§2.c.v–vi",
    title: "II-Wāw / II-Yōd",
    fingerprint: "carrier",
    statement:
      "A ו or י in the middle of a root often stops being a consonant and becomes the vowel letter writing ô, û, î or ê. Sometimes it vanishes from the spelling altogether and only two consonants show — there is still a third, and for those few you have to know it rather than derive it.",
    streak: 8,
  },
  {
    id: "iiihe", n: 7, group: "Wāw and Yōd", seow: "§2.c.vii",
    title: "III-Hē",
    fingerprint: "tail",
    statement:
      "Roots that once ended in ו or י are written with a final ה and listed that way. Any noun ending in ־ֶה is one. When an ending is added the weak third radical drops out and the ending attaches straight to the first two — so write the ה back on.",
    streak: 8,
  },
  {
    id: "ilost", n: 8, group: "Wāw and Yōd", seow: "§2.c.viii",
    title: "I-Wāw, radical lost",
    fingerprint: "none",
    statement:
      "A few nouns from I-Wāw roots lost that first radical entirely. Two consonants, and no ô, û, î or ê in the middle to account for a missing one — which means the gap is at the front. Restore a י you cannot see.",
    streak: 3,
  },
];

export const lessonById = new Map(LESSONS.map((l) => [l.id, l]));
export const syllabus = createSyllabus(LESSONS);

/* ------------------------------------------------------------- word bank -- */

/* `he` is the noun as Seow prints it, `root` the root printed beside it.
   `mark` overrides the lesson's fingerprint where the generic rule would point
   at the wrong thing — an empty array means "there is nothing to highlight
   here", which is itself the lesson for a word like מְלָכִים. */

const W = (he, root, gloss, extra = {}) => ({ he, root, gloss, ...extra });

const BANK = {
  strong: [
    W("דָּבָר", "דבר", "word"),
    W("חָכָם", "חכם", "wise man"),
    W("עֵנָב", "ענב", "grape"),
    W("חָגָב", "חגב", "locust"),
    W("שֹׁפֵט", "שפט", "judge"),
    W("כֹּהֵן", "כהן", "priest"),
    W("צַדִּיק", "צדק", "righteous one",
      { note: "The dagesh here doubles the ד; it is not an assimilated נ." }),
    W("אֲדָמָה", "אדם", "ground"),
    W("לֵבָב", "לבב", "heart"),
  ],
  prefix: [
    W("מִשְׁפָּט", "שפט", "judgment"),
    W("מֶרְכָּבָה", "רכב", "chariot"),
    W("מַלְאָךְ", "לאך", "messenger"),
    W("תַּרְדֵּמָה", "רדם", "deep sleep"),
    W("אַרְבַּע", "רבע", "four"),
    W("תִּפְאֶרֶת", "פאר", "glory"),
    W("מִשְׁפָּחָה", "שפח", "family", { checked: true }),
    W("מִלְחָמָה", "לחם", "battle", { checked: true }),
    W("מְלָכִים", "מלך", "kings", {
      checked: true, mark: [],
      note: "No prefix to strip — this מ is the first radical. Peeling it would leave only two letters.",
    }),
  ],
  gutt: [
    W("עֲבָדִים", "עבד", "servants"),
    W("פֹּעֲלִים", "פעל", "workers"),
    W("בְּאֵר", "באר", "well"),
    W("טֹהַר", "טהר", "purity"),
    W("פָּרָשׁ", "פרש", "horseman",
      { note: "ר cannot be doubled, so the vowel before it stretched instead." }),
    W("חֵרֵשׁ", "חרש", "deaf"),
    W("מַרְפֵּא", "רפא", "health",
      { note: "III-ʾĀlep̄. Seow files these apart from III-Guttural; for finding the root they behave the same." }),
    W("נָבִיא", "נבא", "prophet", { checked: true }),
  ],
  nun: [
    W("מַתָּן", "נתן", "gift"),
    W("מַטֶּה", "נטה", "staff"),
    W("מִטָּה", "נטה", "bed"),
    W("מַשָּׂא", "נשא", "burden", { checked: true }),
    W("מַצָּב", "נצב", "garrison", { checked: true }),
  ],
  iwaw: [
    W("מוֹשָׁב", "ישב", "residence"),
    W("מוֹקֵשׁ", "יקש", "trap"),
    W("מֵישָׁרִים", "ישר", "equity"),
    W("תּוֹשָׁב", "ישב", "alien"),
    W("תּוֹלֵדֹת", "ילד", "generations"),
    W("תֵּימָן", "ימן", "south"),
    W("אֵיתָן", "יתן", "everflowing"),
    W("מוֹעֵד", "יעד", "assembly", { checked: true }),
    W("תּוֹרָה", "ירה", "instruction", {
      checked: true,
      note: "The ת is a prefix and the ô is the old ו: *tawrāh > tôrāh.",
    }),
  ],
  iiwy: [
    W("אוֹר", "אור", "light"),
    W("בּוּז", "בוז", "contempt"),
    W("שִׁיר", "שיר", "song"),
    W("קוֹמָה", "קום", "height"),
    W("סוּפָה", "סוף", "storm-wind"),
    W("מָקוֹם", "קום", "place"),
    W("מְהוּמָה", "הום", "confusion"),
    W("מְדִינָה", "דין", "province"),
    W("תְּבוּאָה", "בוא", "yield"),
    W("תְּשׁוּבָה", "שוב", "return"),
    W("תְּבוּנָה", "בין", "aptitude"),
    W("נֵר", "נור", "lamp", {
      note: "Only two consonants show. The ê does not tell you the middle letter is ו — this one has to be known.",
    }),
    W("עָב", "עוב", "cloud", { note: "Two consonants; the middle radical is not written." }),
    W("קָמָה", "קום", "standing grain", { note: "Two consonants; the middle radical is not written." }),
    W("אֵלָה", "אול", "mighty tree", { note: "Two consonants; the middle radical is not written." }),
  ],
  iiihe: [
    W("שָׂדֶה", "שדה", "field"),
    W("חֹזֶה", "חזה", "seer"),
    W("שָׁנָה", "שנה", "year"),
    W("זְנוּת", "זנה", "harlotry"),
    W("שְׁבִית", "שבה", "captivity"),
    W("עָנָו", "ענה", "poor, afflicted",
      { note: "One of the few that keeps the original III-Wāw, yet is still listed under ענה." }),
    W("עֳנִי", "ענה", "affliction"),
    W("פְּרִי", "פרה", "fruit"),
    W("מִשְׁתֶּה", "שתה", "banquet"),
    W("תִּקְוָה", "קוה", "hope"),
    W("רֹעֶה", "רעה", "shepherd", { checked: true }),
    W("מַעֲשֶׂה", "עשה", "deed", { checked: true }),
  ],
  ilost: [
    W("עֵדָה", "יעד", "congregation"),
    W("שֵׁנָה", "ישן", "sleep"),
    W("דַּעַת", "ידע", "knowledge", { checked: true }),
  ],
};

/* ---------------------------------------------------------------- affixes --

   Which clusters are pattern rather than root, worked out by lining the root's
   letters up against the word's and taking what falls outside. A plain
   left-to-right walk mis-aligns as soon as a radical is missing — the ן closing
   מַתָּן would claim to be the נ that opens נתן — so this takes the longest
   common subsequence, which tolerates the gap. Anything the fingerprint already
   claims is left alone: the ô of מוֹשָׁב is the old ו, not part of the prefix. */

const PREFIX_LETTERS = new Set(["\u05DE", "\u05EA", "\u05D0"]); // מ ת א

function alignRoot(bases, root) {
  const n = bases.length, m = root.length;
  const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = bases[i] === root[j]
        ? dp[i + 1][j + 1] + 1
        : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const out = [];
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (bases[i] === root[j]) { out.push(i); i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) i++;
    else j++;
  }
  return out;
}

export function affixSpans(word) {
  const cs = clusters(canonical(word.he));
  const bases = cs.map((c) => {
    const b = [...c].find(isLetter);
    return b ? toMedial(b) : "";
  });
  const matched = alignRoot(bases, [...foldFinals(word.root)]);
  if (!matched.length) return { prefix: [], ending: [] };

  const first = matched[0];
  const last = matched[matched.length - 1];
  const prefix = [], ending = [];
  for (let i = 0; i < cs.length; i++) {
    /* Only a מ, ת or א on the front is a prefix. What else sits there is the
       ô or ê of a I-Wāw noun — the reflex of a radical, not something to peel
       off — so it is left untagged rather than called an affix. */
    if (i < first) { if (PREFIX_LETTERS.has(bases[i])) prefix.push(i); }
    else if (i > last) ending.push(i);
  }
  return { prefix, ending };
}

/** The word's clusters, each tagged with what the reader is being shown. */
export function annotatedWord(word, { clue = false, affix = false } = {}) {
  const cs = clusters(canonical(word.he));
  const clues = new Set(clue ? word.marks ?? [] : []);
  const spans = affix ? affixSpans(word) : { prefix: [], ending: [] };
  const affixes = new Set([...spans.prefix, ...spans.ending]);
  return cs.map((text, i) => ({
    text,
    kind: clues.has(i) ? "clue" : affixes.has(i) ? "affix" : null,
  }));
}

/* ------------------------------------------------------------ exceptions --

   Words no rule reaches. Seow files these as III-Hē or leaves them open, but
   nothing on the page says so — you either know them or you look them up, which
   is why they are kept out of the eight lessons and live only in Practice.

   Each root here was read from BDB rather than inferred. חֵיק is the one Seow
   leaves undecided, giving its root as "חיק / חוק"; BDB settles it at חוק. */

const EXCEPTION_WORDS = [
  W("אָב", "אבה", "father",
    { note: "BDB files it under אבה. Nothing in the word shows the ה." }),
  W("אָח", "אחה", "brother",
    { note: "Same shape as אָב, and filed the same way, under אחה." }),
  W("עֵץ", "עצה", "tree", {
    note: "One of the short nouns Seow groups with III-Hē: BDB files it under II. עצה, though only two letters are written.",
  }),
  W("רֵעַ", "רעה", "friend", { note: "Filed under רעה — the same root as רֹעֶה, shepherd." }),
  W("חֵיק", "חוק", "bosom", {
    note: "Seow gives the root as \"חיק / חוק\" and leaves it there. BDB settles it at חוק, which is why this one can be asked at all.",
  }),
];

/** Shown beside the eight lessons in Practice, where health is by class. */
export const EXCEPTION_CLASS = {
  id: "exception", n: 9, group: null, seow: "§2.c.vi–vii",
  title: "Exceptions",
  fingerprint: "none",
  statement: "Words the rules do not reach. These are looked up, not worked out.",
};

/* -------------------------------------------------------- fingerprinting -- */

/* Which clusters of the word carry the clue, worked out from the lesson rather
   than hand-indexed per word — so the highlight and the rule can't drift apart.
   An empty result means there is nothing visible to point at, which is the
   honest answer for a radical that is simply gone. */

const DAGESH = "ּ";
const VOWEL_LETTERS = new Set(["ו", "י"]); // ו י

function fingerprintIndices(kind, he, root) {
  const cs = clusters(canonical(he));
  const baseOf = (c) => [...c].find(isLetter) ?? "";

  switch (kind) {
    case "first":
      return [0];
    case "tail": {
      /* Everything past the last radical that is actually written — the ־וּת of
         זְנוּת, not just its ת. When the third radical *is* written, as in
         שָׂדֶה, nothing trails and the clue is that final ה itself. */
      const matched = alignRoot(
        cs.map((c) => { const b = baseOf(c); return b ? toMedial(b) : ""; }),
        [...foldFinals(root)]
      );
      const last = matched.length ? matched[matched.length - 1] : cs.length - 1;
      const out = [];
      for (let i = last + 1; i < cs.length; i++) out.push(i);
      return out.length ? out : [cs.length - 1];
    }
    case "dagesh": {
      const i = cs.findIndex((c) => c.includes(DAGESH));
      return i < 0 ? [] : [i];
    }
    case "guttural": {
      const out = [];
      cs.forEach((c, i) => {
        const b = baseOf(c);
        if (isGuttural(b) || b === RESH) out.push(i);
      });
      return out;
    }
    case "carrier": {
      /* The ו or י that is carrying a consonant rather than being one: the
         first after the opening letter, which would be a radical in its own
         right. Only the first — the yod of a ־ִים ending is not the clue. */
      for (let i = 1; i < cs.length; i++) {
        if (VOWEL_LETTERS.has(baseOf(cs[i]))) return [i];
      }
      return [];
    }
    default:
      return [];
  }
}

/* ------------------------------------------------------------ the ש dot -- */

/* BDB files שׂ and שׁ as different letters, so the dot is part of the answer
   rather than decoration. It is read off the nouns rather than typed into the
   root column a second time: every noun in the bank is pointed, the dot of a
   consonant survives inflection, and all eighteen ש words agree with each
   other. A disagreement would be a transcription error, and the tests say so. */

export const SHIN = "\u05E9";
export const SHIN_DOT = "\u05C1";
export const SIN_DOT = "\u05C2";

export function dotInWord(he) {
  for (const c of clusters(canonical(he))) {
    if (!c.includes(SHIN)) continue;
    if (c.includes(SHIN_DOT)) return SHIN_DOT;
    if (c.includes(SIN_DOT)) return SIN_DOT;
  }
  return null;
}

const rootLetters = (root, he) => {
  const dot = dotInWord(he);
  return withFinalForm([...root]).map((ch) => (ch === SHIN && dot ? ch + dot : ch));
};

/** The consonant of a cell or root letter, and its dot, separately. */
export const baseOfLetter = (s) => [...String(s)].find(isLetter) ?? "";
export const dotOfLetter = (s) =>
  [...String(s)].find((c) => c === SHIN_DOT || c === SIN_DOT) ?? null;

/* --------------------------------------------------------------- prompts -- */

export const ALL_WORDS = LESSONS.flatMap((lesson) =>
  (BANK[lesson.id] ?? []).map((w, i) => ({
    ...w,
    id: `${lesson.id}-${i}`,
    lesson: lesson.id,
    letters: rootLetters(w.root, w.he),
    marks: w.mark ?? fingerprintIndices(lesson.fingerprint, w.he, w.root),
  }))
);

export const EXCEPTIONS = EXCEPTION_WORDS.map((w, i) => ({
  ...w,
  id: `exception-${i}`,
  lesson: EXCEPTION_CLASS.id,
  memorise: true,
  letters: rootLetters(w.root, w.he),
  marks: [],            // nothing to point at; that is what makes them exceptions
}));

/* Practice mixes everything: the eight lessons plus the words no rule reaches. */
export const PRACTICE_WORDS = [...ALL_WORDS, ...EXCEPTIONS];

/** The eight lessons plus the exceptions, for the health readout. */
export const CLASSES = [...LESSONS, EXCEPTION_CLASS];

export const wordsForLesson = (id) => PRACTICE_WORDS.filter((w) => w.lesson === id);
export const wordById = new Map(PRACTICE_WORDS.map((w) => [w.id, w]));

/** The word split into clusters, flagged where the fingerprint sits. */
export function markedWord(word) {
  const set = new Set(word.marks ?? []);
  return clusters(canonical(word.he)).map((text, i) => ({ text, flagged: set.has(i) }));
}

/* --------------------------------------------------------------- grading -- */

/* Roots are unpointed apart from the ש dot, so there are only two things a
   comparison has to ignore or catch: which shape a letter takes at the end of
   a word, and whether the ש was given its dot. */

const DOTS = new RegExp(`[${SHIN_DOT}${SIN_DOT}]`, "g");

/** The three consonants, dots and letter shapes set aside: the structure. */
export const bareRoot = (s) => foldFinals(String(s).replace(DOTS, ""));

/** Same three consonants, whatever the shapes and dots. */
export const sameRoot = (a, b) => bareRoot(a) === bareRoot(b);

/**
 * Judge an answer: `{ exact }`, `{ forgiven, dots }` when the only thing
 * missing is a ש dot, or null when the consonants themselves are wrong.
 *
 * BDB files שׂ and שׁ separately, so the dot is part of the answer. Leaving it
 * off is an incomplete answer and earns the point with a note, the way a
 * dropped dagesh does elsewhere. Writing the *other* dot is not a slip — שׂ and
 * שׁ are different consonants — so that is simply wrong.
 */
export function judgeRoot(cells, word) {
  const want = word.letters;
  const missing = [];
  for (let i = 0; i < want.length; i++) {
    const got = String(cells[i] ?? "");
    if (toMedial(baseOfLetter(got)) !== toMedial(baseOfLetter(want[i]))) return null;
    const gd = dotOfLetter(got), wd = dotOfLetter(want[i]);
    if (gd === wd) continue;
    if (!gd && wd) { missing.push(wd); continue; }
    return null;                       // the wrong dot, or one where none belongs
  }
  return missing.length ? { forgiven: true, dots: missing } : { exact: true };
}

/** How to describe the dot that was left off. */
export const dotName = (dot) => (dot === SIN_DOT ? "a sin (שׂ)" : "a shin (שׁ)");

/**
 * Why an answer missed. Checked in order of how much it explains, so the most
 * specific diagnosis wins; returns null when nothing better than "wrong" fits.
 */
export function diagnose(typed, word) {
  const got = bareRoot(typed.join(""));
  const want = bareRoot(word.root);
  if (got === want) return null;

  const visible = consonantsOf(word.he).map((c) => bareRoot(c));
  const rootLetters = [...want];
  const hidden = rootLetters.filter((c) => !visible.includes(c));

  /* Wrote the ו that the dictionaries replace with י. */
  if (rootLetters[0] === "י" && got === "ו" + want.slice(1)) {
    return "Original I-Wāw roots are listed under I-Yōd. The first radical is written י, never ו.";
  }

  /* Missed the נ the dagesh is standing in for. Folding final forms means a
     closing ן counts as a visible נ, so the generic "hidden radical" test below
     cannot see this one — it needs asking for directly. */
  if (
    want[0] === "\u05E0" &&
    got.slice(1) === want.slice(1) &&
    canonical(word.he).includes(DAGESH)
  ) {
    return "That dagesh is standing in for an assimilated נ, and the נ is the first radical.";
  }

  /* Kept a prefix that isn't a radical. */
  const firstVisible = visible[0];
  if (
    got[0] === firstVisible &&
    want[0] !== firstVisible &&
    PREFIX_LETTERS.has(firstVisible) &&
    hidden.length === 0
  ) {
    return `That ${firstVisible} is a prefix, not a radical — strip it and look again.`;
  }

  /* Used only what is on the page when a radical had to be restored. */
  if (hidden.length && [...got].every((c) => visible.includes(c))) {
    const where =
      want.indexOf(hidden[0]) === 0 ? "front"
        : want.indexOf(hidden[0]) === want.length - 1 ? "end"
          : "middle";
    return `Every letter you wrote is visible in the word, but one radical is not — it is missing from the ${where}.`;
  }

  /* Dropped the third radical of a III-Hē root. */
  if (want.endsWith("ה") && got.startsWith(want.slice(0, 2))) {
    return "Roots whose third radical dropped are still listed with a final ה — write it back on.";
  }

  const wrong = rootLetters
    .map((c, i) => (got[i] === c ? null : i + 1))
    .filter(Boolean);
  if (wrong.length === 1) {
    const ord = ["first", "second", "third"][wrong[0] - 1];
    return `The ${ord} radical is not right.`;
  }
  return null;
}
