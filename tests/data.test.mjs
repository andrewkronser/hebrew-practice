/* Guards the character data. The accent U+05AB once slipped into 20 vocabulary
   words and rendered as tofu, because Frank Ruhl Libre has no glyph for it. */
import { test } from "vitest";
import { WORD_BANK } from "../src/features/vocabulary/data.js";
import {
  glossOrder, buildQuestion, buildReverseQuestion, advanceCursor, normalizeGloss,
  promptableGlosses, answerWeight, buildFor, OPTION_COUNT, PRIMARY_SHARE, SECONDARY_WEIGHT,
} from "../src/features/vocabulary/quiz.js";
import { createProgression, scoreAnswer as sharedScore } from "../src/shared/progression.js";
import { FORMS, CELLS, SEED_SIZE, isCorrectCell } from "../src/features/gender-number/data.js";
import { pickForm, correctCells, engine, PACING } from "../src/features/gender-number/drill.js";
import { RULES, ALL_PROMPTS, GLOSSARY, ERRORS, REDUCTION_PREAMBLE } from "../src/features/gender-number/rules.js";
import { canonical } from "../src/features/typing/typing.js";
import { CURRICULUM as T_CURRICULUM, WORDS as T_WORDS } from "../src/features/transliteration/data.js";
import { NIQQUD, LETTER_KEYS, carrierFor, composedLetter } from "../src/shared/hebrewKeyboard.js";
import { forgive, forgivenLabel, markedClusters } from "../src/features/gender-number/forgive.js";
import {
  freshTempo, normalizeTempo, observeTempo, fastBar,
  FAST_SHARE, FLOOR_MS, CEILING_MS, SEED_MS, WARMUP,
} from "../src/shared/tempo.js";
import { DEFAULT_PACING, scoreAnswer } from "../src/shared/progression.js";
import {
  LESSONS as A_LESSONS, ALL_WORDS as A_WORDS, CONTENTS as A_CONTENTS,
  DECISION_TABLE, FREE_PRACTICE as A_FREE, definiteOf, judgeArticle,
  diagnose as diagnoseArticle, wordsForLesson as articleWords,
} from "../src/features/article/lessons.js";
import {
  LESSONS, ALL_WORDS, wordsForLesson, markedWord, sameRoot, diagnose, syllabus,
  judgeRoot, dotInWord, dotName, affixSpans, annotatedWord, bareRoot,
  EXCEPTIONS, PRACTICE_WORDS, CLASSES,
} from "../src/features/roots/lessons.js";
import { CLUSTERS_BY_POINT, clustersFor, promptFor, CURRICULUM, typableWords, POINTED_WORDS, gradeAttempt } from "../src/features/typing/typing.js";

/* These simulations model a learner answering thousands of questions, and two
   of the checks compare one run against another. With Math.random that is a
   coin flip dressed as an assertion — it passed most of the time and failed
   roughly one run in six, which is worse than failing outright because it
   looks like a real regression when it lands. Seeded, the simulation is the
   same every time, so a failure means the progression actually changed. */
const SEED = 0x9e3779b9;
let rngState = SEED;
const random = () => {
  rngState = (rngState + 0x6d2b79f5) | 0;
  let t = Math.imul(rngState ^ (rngState >>> 15), 1 | rngState);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
/** Restart the sequence, so each simulation sees the same stream. */
const reseed = () => { rngState = SEED; };

/* The engine picks weighted-randomly itself, so seeding only this file's own
   coin flips left the simulations varying run to run. This file has no DOM and
   does nothing but compute, so taking over Math.random for its whole life is
   contained — and it is the only way the two learners being compared get the
   same stream of luck. */
Math.random = random;

/* Letters, the common points, shin/sin dots, meteg, maqaf, space. Deliberately
   excludes the cantillation block U+0591-U+05AF and U+05BA holam-haser, which
   many Hebrew fonts do not carry. */
const SAFE = (cp) =>
  (cp >= 0x05d0 && cp <= 0x05ea) || (cp >= 0x05b0 && cp <= 0x05b9) ||
  cp === 0x05bb || cp === 0x05bc || cp === 0x05bd ||
  cp === 0x05c1 || cp === 0x05c2 || cp === 0x05be || cp === 0x20;

const results = [];
const check = (name, got, want) => {
  const ok = String(got) === String(want);
  results.push(ok);
  console.log(`${ok ? "pass" : "FAIL"}  ${name}${ok ? "" : `  (got ${JSON.stringify(got)}, want ${JSON.stringify(want)})`}`);
};
const unsafeIn = (items) => {
  const bad = [];
  for (const it of items) for (const ch of it.he) {
    const cp = ch.codePointAt(0);
    if (!SAFE(cp)) bad.push(`${it.id ?? it.key ?? it.n}:U+${cp.toString(16).toUpperCase()}`);
  }
  return bad;
};

console.log("── renderable characters ──");
check("vocabulary word bank", unsafeIn(WORD_BANK).join(",") || "clean", "clean");
check("transliteration curriculum", unsafeIn(T_CURRICULUM).join(",") || "clean", "clean");
check("transliteration words", unsafeIn(T_WORDS).join(",") || "clean", "clean");
check("niqqud table", unsafeIn(NIQQUD).join(",") || "clean", "clean");
check("keyboard letters", unsafeIn(LETTER_KEYS).join(",") || "clean", "clean");

console.log("── niqqud drills use attested clusters ──");
const orphans = NIQQUD.filter((n) => !(CLUSTERS_BY_POINT.get(n.he) ?? []).length).map((n) => n.name);
check("every point has at least one cluster", orphans.join(",") || "none", "none");
/* Comparing the prompt string can't detect the ב fallback: בָ is itself a real
   cluster (דָּבָר, זָהָב), so the two are textually identical. Assert the property
   that actually matters — a real cluster exists at the moment the point is
   introduced, which is what makes the fallback unreachable. */
const starved = CURRICULUM.filter((i) => i.point)
  .filter((i) => clustersFor(i.he, i.idx + 1).length === 0)
  .map((i) => i.name);
check("every point has a real cluster when introduced", starved.join(",") || "none", "none");
const notCluster = CURRICULUM.filter((i) => i.point)
  .filter((i) => !/^[\u05D0-\u05EA][\u05B0-\u05C2]+$/.test(promptFor(i, i.idx + 1)))
  .map((i) => i.name);
check("every point prompt is letter + point(s)", notCluster.join(",") || "none", "none");

console.log("── curriculum sequence ──");
check("41 items", CURRICULUM.length, 41);
check("no duplicates", CURRICULUM.length - new Set(CURRICULUM.map((i) => i.id)).size, 0);
/* The point of interleaving: pointed words must be reachable well before the
   end of the curriculum, not stranded behind all 27 letters. */
const firstPointed = (() => {
  for (let u = 1; u <= CURRICULUM.length; u++) {
    if (typableWords(u, POINTED_WORDS).length >= 1) return u;
  }
  return Infinity;
})();
console.log(`   first pointed word typable at ${firstPointed} of ${CURRICULUM.length} unlocked`);
check("pointed words reachable before halfway", firstPointed <= CURRICULUM.length / 2, true);
const firstPoint = CURRICULUM.findIndex((i) => i.point) + 1;
console.log(`   first point introduced at position ${firstPoint}`);
check("a point arrives within the first six items", firstPoint <= 6, true);

console.log("── grading ignores mark order, not mark identity ──");
const DALET_PATAH_DAGESH = "\u05D3\u05B7\u05BC";
const ok = (typed, target) => gradeAttempt(typed, target).correct;
/* Accepted whichever order the marks were pressed in. */
check("dagesh before the vowel", ok("\u05D3\u05BC\u05B7", DALET_PATAH_DAGESH), true);
check("vowel before the dagesh", ok(DALET_PATAH_DAGESH, DALET_PATAH_DAGESH), true);
check("shin dot before the vowel", ok("\u05E9\u05C1\u05B8", "\u05E9\u05B8\u05C1"), true);
check("precomposed shin accepted", ok("\uFB2A", "\u05E9\u05C1"), true);
check("latin position fallback survives reordering", ok("s\u05BC\u05B7", DALET_PATAH_DAGESH), true);
/* Still strict about everything that actually matters. */
check("wrong vowel rejected", ok("\u05D3\u05B8\u05BC", DALET_PATAH_DAGESH), false);
check("wrong letter rejected", ok("\u05D2\u05B7\u05BC", DALET_PATAH_DAGESH), false);
check("missing mark rejected", ok("\u05D3\u05B7", DALET_PATAH_DAGESH), false);
check("extra mark rejected", ok("\u05D3\u05B7\u05BC\u05B4", DALET_PATAH_DAGESH), false);

console.log("── the first gloss is the primary sense ──");
for (const n of [1, 2, 3, 5]) {
  const order = glossOrder(n);
  const share = order.filter((i) => i === 0).length / order.length;
  const covers = new Set(order).size === n;
  check(`${n} gloss(es): every sense still reached`, covers, true);
  check(`${n} gloss(es): primary is at least half`, share >= 0.5, true);
}
/* Walking a full cycle must hit each sense, not just favour the first. */
const adam = WORD_BANK.find((w) => w.key === "adam");
let cursors = {};
const seen = [];
for (let i = 0; i < glossOrder(adam.glosses.length).length; i++) {
  seen.push(buildQuestion(adam, 20, cursors).answer);
  cursors = advanceCursor(cursors, adam);
}
check("a full cycle covers every sense of אדם", new Set(seen).size, adam.glosses.length);
/* The primary used to be exactly half the cycle; it is now PRIMARY_SHARE. */
const primaryHits = seen.filter((g) => g === adam.glosses[0]).length;
check("primary dominates the cycle", primaryHits > seen.length / 2, true);
check("primary share matches the configured value",
  Math.abs(primaryHits / seen.length - PRIMARY_SHARE) < 0.05, true);

console.log("── the primary sense carries a fixed share ──");
/* The share must not drift with sense count: that was the bug that made
   multi-sense words look fine in an early simulation. */
const shares = [2, 3, 4, 5].map((n) => {
  const o = glossOrder(n);
  return { n, share: o.filter((x) => x === 0).length / o.length, covers: new Set(o).size === n };
});
check("every sense still reached", shares.every((x) => x.covers), true);
check("share identical for every sense count",
  new Set(shares.map((x) => x.share.toFixed(3))).size, 1);
check("share is near the configured value",
  Math.abs(shares[0].share - PRIMARY_SHARE) < 0.05, true);

console.log("── a secondary sense moves the score less ──");
const before = { w: { s: 0.8, a: 4 } };
const hardMiss = sharedScore(before, { id: "w" }, { correct: false, ms: 2000 }).w.s;
const softMiss = sharedScore(before, { id: "w" }, { correct: false, ms: 2000, weight: SECONDARY_WEIGHT }).w.s;
check("a weighted miss costs less than a full one", softMiss > hardMiss, true);
check("it still costs something", softMiss < 0.8, true);
check("default weight is unchanged", hardMiss.toFixed(4), (0.8 * 0.55).toFixed(4));
const multi = WORD_BANK.find((w) => promptableGlosses(w).length > 2);
check("primary questions weigh full",
  answerWeight(buildFor("he-en", multi, 20, { [multi.id]: 0 })), 1);

console.log("── multi-sense words no longer dominate ──");
/* Steady state on a fixed pool, so the only variable is the word itself. */
const steadyEngine = createProgression({ items: WORD_BANK, pacing: { startUnlocked: 40 } });
function inflation(weighted) {
  const POOL = 40;
  let p = { unlocked: POOL, stats: {}, since: 0 }, cursors = {}, last = null;
  const seen = new Map(WORD_BANK.slice(0, POOL).map((w) => [w.id, 0]));
  for (let i = 0; i < 60000; i++) {
    const word = steadyEngine.pickWeak(p, last);
    const q = buildFor("he-en", word, POOL, cursors);
    const ok = random() < (q.primary ? 0.95 : 0.6);
    p = { ...p, stats: steadyEngine.scoreAnswer(p.stats, word, {
      correct: ok, ms: 2000, weight: weighted ? answerWeight(q) : 1 }) };
    cursors = advanceCursor(cursors, word, "he-en");
    seen.set(word.id, seen.get(word.id) + 1);
    last = word.id;
  }
  const buckets = new Map();
  for (const w of WORD_BANK.slice(0, POOL)) {
    const c = promptableGlosses(w).length;
    if (!buckets.has(c)) buckets.set(c, []);
    buckets.get(c).push(seen.get(w.id));
  }
  const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;
  const base = mean(buckets.get(1));
  return Math.max(...[...buckets.values()].map((v) => mean(v) / base));
}
const unweighted = inflation(false), weighted = inflation(true);
console.log(`   worst-case prompt inflation: ${unweighted.toFixed(2)}x unweighted -> ${weighted.toFixed(2)}x weighted`);
check("weighting reduces it", weighted < unweighted, true);
check("multi-sense words stay within 1.35x of single-sense", weighted < 1.35, true);

console.log("── the unlock step is earned ──");
const accel = createProgression({ items: WORD_BANK, pacing: { startUnlocked: 4, maxStep: 4 } });
const plain = createProgression({ items: WORD_BANK, pacing: { startUnlocked: 4 } });
const pristine = Object.fromEntries(WORD_BANK.map((w) => [w.id, { s: 0.95, a: 5 }]));
check("default pacing never steps by more than one",
  plain.stepFor({ unlocked: 20, stats: pristine }), 1);
check("a settled rotation earns the full step",
  accel.stepFor({ unlocked: 20, stats: pristine }), 4);
check("an unsettled one does not",
  accel.stepFor({ unlocked: 20, stats: {} }), 1);

/* Acceleration must not leave a weak learner behind, and must actually help a
   strong one. */
function finish(eng, acc) {
  reseed();
  let p = eng.emptyProgress(), n = 0;
  while (n < 300000 && p.unlocked < WORD_BANK.length) {
    const it = eng.pickWeak(p, null);
    p = { ...p, stats: eng.scoreAnswer(p.stats, it, { correct: random() < acc, ms: 2000 }), since: p.since + 1 };
    n++;
    if (eng.shouldUnlock(p)) p = eng.unlock(p);
  }
  return p.unlocked >= WORD_BANK.length ? n : null;
}
for (const acc of [0.5, 0.75, 0.95]) {
  const a = finish(accel, acc);
  console.log(`   acc ${acc}: ${a ?? "stalled"} answers to the full bank`);
  check(`accuracy ${acc} still reaches every word`, Boolean(a), true);
}
const slow = finish(plain, 0.95), quick = finish(accel, 0.95);
console.log(`   strong learner: ${slow} -> ${quick} answers`);
check("a strong learner gets there meaningfully sooner", quick < slow * 0.8, true);

console.log("── the reverse direction is unambiguous ──");
/* Reversed, the prompt is an English sense and every word carrying that sense
   would be a correct answer — a sharper version of the forward collision. */
let rBuilds = 0, rAmbiguous = 0, rDupes = 0, rShort = 0;
for (const unlocked of [4, 8, 20, 65]) {
  for (let i = 0; i < unlocked; i++) {
    const word = WORD_BANK[i];
    const senses = promptableGlosses(word);
    for (let g = 0; g < senses.length; g++) {
      for (let rep = 0; rep < 12; rep++) {
        const r = buildReverseQuestion(word, unlocked, { [word.id]: g });
        rBuilds++;
        if (r.options.length !== OPTION_COUNT) rShort++;
        const texts = r.options.map((o) => o.text);
        if (new Set(texts).size !== texts.length) rDupes++;
        const defensible = r.options.filter((o) =>
          o.word.glosses.some((x) => normalizeGloss(x) === normalizeGloss(r.prompt)));
        if (defensible.length !== 1) rAmbiguous++;
      }
    }
  }
}
console.log(`   ${rBuilds} reverse questions built`);
check("exactly one defensible answer each", rAmbiguous, 0);
check("always four options", rShort, 0);
check("no repeated Hebrew option", rDupes, 0);
/* "god" and "God" collapse to one prompt, so a word listing both must not ask
   the same reversed question twice. */
const dupPrompts = WORD_BANK.filter((w) => {
  const n = promptableGlosses(w).map(normalizeGloss);
  return new Set(n).size !== n.length;
}).map((w) => w.key);
check("no word asks the same reversed prompt twice", dupPrompts.join(",") || "none", "none");

console.log("── vocabulary transliteration ──");
const noTr = WORD_BANK.filter((w) => !w.tr).map((w) => w.key);
check("every word has one", noTr.join(",") || "none", "none");
/* The same Hebrew word appears in both features. If they ever disagree, one of
   them is teaching the wrong thing. */
const byHe = new Map(T_WORDS.map((t) => [t.he, t]));
const shared = WORD_BANK.filter((v) => byHe.has(v.he));
const conflicts = shared.filter((v) => v.tr !== byHe.get(v.he).a)
  .map((v) => `${v.key}: ${v.tr} vs ${byHe.get(v.he).a}`);
console.log(`   ${shared.length} words appear in both features`);
check("no feature disagrees with the other", conflicts.join(" | ") || "none", "none");
/* Authored values should use the same notation as the copied ones. */
const latin = /^[a-zɛəʾʿ()ʼ'\u0101\u0113\u012B\u014D\u016B\u00E2\u00EA\u00EE\u00F4\u00FB\u0103\u0115\u014F\u1E25\u1E6D\u1E63\u0161\u015B\u1E07\u1E0F\u1E35\u1E6F\u1E21\u0304\u0073\u0070 -]+$/i;
const odd = WORD_BANK.filter((w) => !latin.test(w.tr)).map((w) => `${w.key}:${w.tr}`);
check("all transliterations use the expected notation", odd.join(",") || "none", "none");

console.log("── gender and number forms ──");
check("form count", FORMS.length, 116);
check("every form has a transliteration", FORMS.filter((f) => !f.tr).length, 0);
check("no duplicate surface forms",
  FORMS.length - new Set(FORMS.map((f) => f.he)).size, 0);
/* Every form must land in exactly as many cells as it has genders — one for
   most, two for the handful attested in both. */
const miscounted = FORMS.filter((f) => correctCells(f).length !== f.genders.length).map((f) => f.he);
check("each form maps to the right number of cells", miscounted.join(",") || "none", "none");
check("all six cells are populated",
  CELLS.filter((c) => !FORMS.some((f) => isCorrectCell(f, c))).length, 0);
/* The dual is a lexical residue in Biblical Hebrew, not a productive form.
   Guard the count so no one quietly invents one. */
const duals = FORMS.filter((f) => f.number === "dual");
check("exactly seven duals", duals.length, 7);
check("duals are the expected forms", duals.map((f) => f.he).sort().join(" "),
  ["אָזְנַיִם", "יָדַיִם", "מַיִם", "עֵינַיִם", "רַגְלַיִם", "שָׁמַיִם", "יוֹמַיִם"].sort().join(" "));
/* Every form's Hebrew must be renderable, same guard as the word data. */
check("gender/number forms use safe codepoints", unsafeIn(FORMS).join(",") || "clean", "clean");

/* Duals are oversampled on purpose; check the rate rather than trusting it. */
const stats = Object.fromEntries(FORMS.map((f) => [f.id, { s: 0.8, a: 5 }]));
let dualHits = 0, lastId = null;
const RUNS = 20000;
for (let i = 0; i < RUNS; i++) {
  const f = pickForm({ unlocked: FORMS.length, stats }, lastId);
  if (f.number === "dual") dualHits++;
  lastId = f.id;
}
const rate = dualHits / RUNS;
console.log(`   duals are ${(rate * 100).toFixed(1)}% of prompts (${(7 / FORMS.length * 100).toFixed(1)}% unweighted)`);
check("duals oversampled into a useful range", rate > 0.15 && rate < 0.35, true);

console.log("── the rotation seed covers every cell ──");
const seed = FORMS.slice(0, SEED_SIZE);
const uncovered = CELLS.filter((c) => !seed.some((f) => isCorrectCell(f, c)))
  .map((c) => `${c.gender} ${c.number}`);
check("all six cells live from the first question", uncovered.join(",") || "none", "none");
check("engine opens at the seed size", engine.emptyProgress().unlocked, SEED_SIZE);

console.log("── pacing never stalls a competent learner ──");
/* The failure this engine exists to avoid is a gate that quietly stops someone
   from ever unlocking anything. Check across the range that matters; on a
   six-option grid, pure guessing scores 1/6, so below ~0.35 a stall is correct. */
for (const acc of [0.5, 0.65, 0.8, 0.95]) {
  let p = engine.emptyProgress(), n = 0;
  for (let i = 0; i < 80000 && p.unlocked < FORMS.length; i++) {
    const it = engine.pickWeak(p, null);
    p = { ...p, stats: engine.scoreAnswer(p.stats, it, { correct: random() < acc, ms: 2500 }), since: p.since + 1 };
    n++;
    if (engine.shouldUnlock(p)) p = engine.unlock(p);
  }
  const done = p.unlocked >= FORMS.length;
  console.log(`   ${acc}: ${done ? n + " answers" : "stalled at " + p.unlocked}`);
  check(`accuracy ${acc} reaches every form`, done, true);
}

console.log("── plural-formation rules ──");
check("nine rules", RULES.length, 9);
check("every prompt has a unique id",
  new Set(ALL_PROMPTS.map((p) => p.id)).size, ALL_PROMPTS.length);
check("every prompt has an answer and transliteration",
  ALL_PROMPTS.filter((p) => !p.answer || !p.answerTr).length, 0);
/* An "error form" that is actually right would teach the opposite of the rule. */
const selfDefeating = ALL_PROMPTS.flatMap((p) =>
  p.errors.filter((e) => canonical(e.form) === canonical(p.answer)).map(() => p.id));
check("no error form equals its own answer", selfDefeating.join(",") || "none", "none");
check("every error cites a known diagnosis",
  ALL_PROMPTS.flatMap((p) => p.errors).filter((e) => !ERRORS[e.why]).length, 0);
check("every rule has at least two words",
  RULES.filter((r) => r.words.length < 2).length, 0);
check("every rule has a streak target",
  RULES.filter((r) => !(r.streak > 0)).length, 0);
/* Hebrew in this file has to render, same guard as the other word data. */
const ruleHebrew = ALL_PROMPTS.flatMap((p) => [
  { id: p.id, he: p.he }, { id: p.id, he: p.answer },
  ...p.errors.map((e) => ({ id: p.id, he: e.form })),
]);
check("plural-rule Hebrew uses safe codepoints", unsafeIn(ruleHebrew).join(",") || "clean", "clean");
/* Every {braced} term in a statement, preamble or note must be defined. */
const braced = (t) => [...String(t).matchAll(/\{([^}]+)\}/g)].map((m) => m[1]);
const referenced = new Set([
  ...RULES.flatMap((r) => braced(r.statement)),
  ...REDUCTION_PREAMBLE.flatMap(braced),
  ...ALL_PROMPTS.flatMap((p) => braced(p.note ?? "")),
]);
const undefinedTerms = [...referenced].filter((t) => !GLOSSARY[t]);
console.log(`   ${referenced.size} glossary terms referenced across rules and notes`);
check("every glossed term has a definition", undefinedTerms.join(",") || "none", "none");


console.log("\n── niqqud carriers ──");
/* A bare point needs something to sit on, but the shin and sin dots only ever
   occur on ש; on any other letter they are not a form the reader has met. */
{
  const SHIN = "\u05E9", BET = "\u05D1";
  check("shin dot carries shin", carrierFor("\u05C1"), SHIN);
  check("sin dot carries shin", carrierFor("\u05C2"), SHIN);
  const others = NIQQUD.filter((n) => !["\u05C1", "\u05C2"].includes(n.he));
  check("every other point carries vet", others.every((n) => carrierFor(n.he) === BET), true);
  check("an unknown character falls back", carrierFor("x"), BET);
  /* macOS types the whole letter from the dot's key; Windows does not. */
  check("shin dot composes on mac", composedLetter("\u05C1", "mac"), SHIN);
  check("sin dot composes on mac", composedLetter("\u05C2", "mac"), SHIN);
  check("not on windows", composedLetter("\u05C1", "win"), null);
  check("plain vowels never compose",
    NIQQUD.every((n) => !["\u05C1","\u05C2"].includes(n.he) ? composedLetter(n.he, "mac") === null : true), true);
}


console.log("\n── forgiven typos ──");
/* The drill is about vowels. A dropped dagesh or a final/medial mix-up is a
   keyboard slip, so it earns the point — but an added dagesh asserts a
   different consonant and must not. */
{
  const D = "\u05BC";
  const LETTER = /[\u05D0-\u05EA]/;
  const FINALISE = { "\u05DB":"\u05DA", "\u05DE":"\u05DD", "\u05E0":"\u05DF", "\u05E4":"\u05E3", "\u05E6":"\u05E5" };
  const MEDIALISE = Object.fromEntries(Object.entries(FINALISE).map(([a, b]) => [b, a]));

  check("an exact answer is exact", forgive("\u05E1\u05D5\u05E1", "\u05E1\u05D5\u05E1")?.exact, true);
  check("a different word is rejected", forgive(ALL_PROMPTS[0].answer, ALL_PROMPTS[7].answer), null);

  /* Every form in the bank that carries a dagesh, with the dagesh dropped. */
  const dagesh = ALL_PROMPTS.filter((p) => p.answer.includes(D));
  check("the bank has forms with a dagesh", dagesh.length > 0, true);
  check("dropping any dagesh is forgiven",
    dagesh.every((p) => forgive(p.answer.replaceAll(D, ""), p.answer)?.forgiven), true);
  check("and is named as such",
    dagesh.every((p) => forgivenLabel(forgive(p.answer.replaceAll(D, ""), p.answer).kinds)
      .includes("missing dagesh")), true);

  /* Adding one is a different consonant, not a slip. */
  const noDagesh = ALL_PROMPTS.filter((p) => !p.answer.includes(D));
  const withAdded = (w) => { const out = []; let done = false;
    for (const ch of w) { out.push(ch); if (!done && LETTER.test(ch)) { out.push(D); done = true; } }
    return out.join(""); };
  check("adding a dagesh is NOT forgiven",
    noDagesh.every((p) => forgive(withAdded(p.answer), p.answer) === null), true);

  /* Final where medial belongs, and the reverse, anywhere in the word. */
  const swapAt = (w, map) => { const ls = [...w];
    for (let i = 0; i < ls.length; i++) if (map[ls[i]]) { ls[i] = map[ls[i]]; return ls.join(""); }
    return null; };
  const medialised = ALL_PROMPTS.map((p) => [swapAt(p.answer, MEDIALISE), p.answer]).filter(([a]) => a);
  const finalised = ALL_PROMPTS.map((p) => [swapAt(p.answer, FINALISE), p.answer]).filter(([a]) => a);
  check("the bank exercises both letter shapes", medialised.length > 0 && finalised.length > 0, true);
  check("a medial where the final belongs is forgiven",
    medialised.every(([a, w]) => forgive(a, w)?.forgiven), true);
  check("a final where the medial belongs is forgiven",
    finalised.every(([a, w]) => forgive(a, w)?.forgiven), true);
  check("each names its own direction",
    finalised.every(([a, w]) => forgivenLabel(forgive(a, w).kinds).includes("final form where the medial")), true);

  /* A wrong vowel is the thing being drilled and is never forgiven. */
  const vowelSwapped = ALL_PROMPTS
    .map((p) => [p.answer.replace("\u05B8", "\u05B6"), p.answer])
    .filter(([a, w]) => a !== w);
  check("the bank has qamats forms to perturb", vowelSwapped.length > 0, true);
  check("a wrong vowel is never forgiven",
    vowelSwapped.every(([a, w]) => forgive(a, w) === null), true);

  /* No documented error form may be forgiven — they are the real mistakes. */
  const everyError = ALL_PROMPTS.flatMap((p) => p.errors.map((e) => [e.form, p.answer]));
  check("the bank documents error forms", everyError.length > 0, true);
  check("no documented error is forgiven",
    everyError.every(([bad, want]) => forgive(bad, want) === null), true);

  /* The highlight points at a real cluster of the expected form. */
  const one = dagesh[0];
  const r = forgive(one.answer.replaceAll(D, ""), one.answer);
  const marked = markedClusters(one.answer, r.at);
  check("marked clusters rebuild the answer", marked.map((c) => c.text).join(""), one.answer.normalize("NFD"));
  check("exactly the missed clusters are flagged", marked.filter((c) => c.flagged).length, r.at.length);
  check("every flagged cluster carries the dagesh",
    marked.filter((c) => c.flagged).every((c) => c.text.includes(D)), true);
}


console.log("\n── roots: the word bank ──");
{
  const LETTER = /^[א-ת]+$/;
  const FINALS = "ךםןףץ";
  const MEDIALS = "כמנפצ";

  check("eight lessons", LESSONS.length, 8);
  check("every lesson is stocked", LESSONS.every((l) => wordsForLesson(l.id).length >= 3), true);
  check("seventy words", ALL_WORDS.length, 70);
  check("ids are unique", new Set(ALL_WORDS.map((w) => w.id)).size, ALL_WORDS.length);
  check("every lesson cites Seow", LESSONS.every((l) => Boolean(l.seow)), true);
  check("every lesson has a streak target", LESSONS.every((l) => l.streak >= 3), true);

  /* Roots are three unpointed consonants — no vowels, no marks. */
  check("every root is three letters", ALL_WORDS.every((w) => [...w.root].length === 3), true);
  check("roots carry no pointing", ALL_WORDS.every((w) => LETTER.test(w.root)), true);
  check("every answer is three letters", ALL_WORDS.every((w) => w.letters.length === 3), true);
  /* Hebrew writes the closing letter in its final shape; the drill accepts
     either, but the answer it shows should be spelled correctly. */
  check("no final form sits mid-root",
    ALL_WORDS.every((w) => w.letters.slice(0, 2).every((c) => !FINALS.includes(c))), true);
  check("a closing letter takes its final shape",
    ALL_WORDS.every((w) => !MEDIALS.includes(w.letters[2])), true);

  /* The nouns are pointed and must survive canonicalisation unchanged. */
  check("every noun is pointed", ALL_WORDS.every((w) => w.he !== w.he.replace(/[֑-ׇ]/g, "")), true);
  check("no cantillation or unsafe marks",
    ALL_WORDS.every((w) => !/[֑-ֽ֯-׀׃-ׇ]/.test(w.he)), true);

  console.log("\n── roots: fingerprints match their lesson ──");
  const marksOf = (w) => markedWord(w).filter((c) => c.flagged);
  const byLesson = (id) => wordsForLesson(id);

  check("strong roots point at nothing", byLesson("strong").every((w) => w.marks.length === 0), true);
  check("the lost-radical lesson points at nothing", byLesson("ilost").every((w) => w.marks.length === 0), true);
  check("prefixes point at the first cluster",
    byLesson("prefix").filter((w) => w.marks.length).every((w) => w.marks[0] === 0), true);
  check("the I-Nûn clue is always a dagesh",
    byLesson("nun").every((w) => marksOf(w).every((c) => c.text.includes("ּ"))), true);
  check("the guttural clue is a guttural or rêš",
    byLesson("gutt").every((w) => marksOf(w).length > 0 &&
      marksOf(w).every((c) => /[אהחער]/.test(c.text))), true);
  check("the I-Wāw clue is the ô or ê carrying the lost ו",
    byLesson("iwaw").every((w) => marksOf(w).length === 1 &&
      /[וי]/.test(marksOf(w)[0].text)), true);
  check("II-weak points at a ו or י, or at nothing when none is written",
    byLesson("iiwy").every((w) => w.marks.length === 0 ||
      (w.marks.length === 1 && /[וי]/.test(marksOf(w)[0].text))), true);
  /* The clue is the whole tail past the last written radical — the ־וּת of
     זְנוּת, not just its ת — falling back to the final ה when the third radical
     is written, as in שָׂדֶה. Either way it runs to the end of the word. */
  check("III-Hē points at the end",
    byLesson("iiihe").every((w) => w.marks.length >= 1 &&
      w.marks[w.marks.length - 1] === markedWord(w).length - 1), true);
  check("and its clue is one unbroken run",
    byLesson("iiihe").every((w) => w.marks.every((n, i) => i === 0 || n === w.marks[i - 1] + 1)), true);
  /* The two-consonant nouns are exactly the ones with nothing to point at. */
  check("only the two-consonant nouns lack a clue",
    byLesson("iiwy").filter((w) => w.marks.length === 0).length, 4);
  check("marks stay inside the word",
    ALL_WORDS.every((w) => w.marks.every((i) => i >= 0 && i < markedWord(w).length)), true);

  console.log("\n── roots: grading ──");
  check("the right answer is accepted",
    ALL_WORDS.every((w) => sameRoot(w.letters.join(""), w.root)), true);
  check("a medial letter where the final belongs is accepted",
    ALL_WORDS.every((w) => sameRoot(w.root.replace(/[ךםןףץ]$/,
      (c) => "כמנפצ"["ךםןףץ".indexOf(c)]), w.root)), true);
  check("a different root is rejected",
    sameRoot(ALL_WORDS[0].root, ALL_WORDS[40].root), false);
  check("a right answer draws no diagnosis",
    ALL_WORDS.every((w) => diagnose(w.letters, w) === null), true);
  /* The diagnoses that matter most, on words from the lessons that teach them. */
  const say = (he, typed) => diagnose([...typed], ALL_WORDS.find((w) => w.he === he)) ?? "";
  check("an assimilated nûn is named", say("מַתָּן", "מתן").includes("assimilated"), true);
  check("a kept prefix is named", say("מִשְׁפָּט", "משפ").includes("prefix"), true);
  check("writing ו for I-Yōd is named", say("מוֹשָׁב", "ושב").includes("I-Yōd"), true);
  check("a dropped III-Hē is named", say("שָׁנָה", "שנא").includes("final ה"), true);
  check("a radical that isn't on the page is named",
    say("עֵדָה", "עדה").includes("missing from the front"), true);

  console.log("\n── roots: the syllabus engine ──");
  const ids = LESSONS.map((l) => l.id);
  check("starts on the first lesson", syllabus.fresh().stepId, ids[0]);
  check("frontier is the first unfinished", syllabus.frontierOf([ids[0], ids[1]]), ids[2]);
  check("finished lessons read done", syllabus.stateOf(ids[0], [ids[0]]), "done");
  check("the frontier reads active", syllabus.stateOf(ids[1], [ids[0]]), "active");
  check("later lessons read locked", syllabus.stateOf(ids[4], [ids[0]]), "locked");
  check("past the end is free", syllabus.frontierOf(ids), "free");
  /* A run only accrues on the frontier, and completing moves it on. */
  let p = syllabus.fresh();
  const target = LESSONS[0].streak;
  for (let i = 1; i < target; i++) {
    p = syllabus.answer(p, true).progress;
    check(`run reaches ${i}`, p.streak, i);
  }
  const last = syllabus.answer(p, true);
  check("the final answer completes the lesson", last.completed, ids[0]);
  check("and moves to the next", last.progress.stepId, ids[1]);
  check("with the run reset", last.progress.streak, 0);
  check("a miss resets the run", syllabus.answer({ ...p, streak: 3 }, false).progress.streak, 0);
  /* Revising a finished lesson changes nothing at all. */
  const revising = { stepId: ids[0], streak: 4, done: [ids[0], ids[1]] };
  check("revising does not accrue", syllabus.answer(revising, true).progress, revising);
  check("revising does not complete", syllabus.answer(revising, true).completed, null);
  check("and is reported as revising", syllabus.isRevising(revising), true);
  /* Stored progress is rebuilt defensively. */
  check("unknown lesson ids are dropped",
    syllabus.normalize({ stepId: "nope", streak: 2, done: ["gone", ids[0]] }).done, [ids[0]]);
  check("a bad streak becomes zero", syllabus.normalize({ stepId: ids[0], streak: "x" }).streak, 0);
}


console.log("\n── roots: the ש dot ──");
{
  const SHIN = "ש", SHIN_DOT = "ׁ", SIN_DOT = "ׂ";
  const dotted = ALL_WORDS.filter((w) => w.root.includes(SHIN));
  check("the bank has roots with ש", dotted.length > 0, true);
  /* Derived from the nouns rather than typed in twice, so the nouns must all
     agree — a disagreement would mean a transcription error. */
  const byRoot = new Map();
  for (const w of dotted) {
    const dot = dotInWord(w.he);
    if (!byRoot.has(w.root)) byRoot.set(w.root, new Set());
    byRoot.get(w.root).add(dot);
  }
  check("every ש root's dot is decidable from its nouns",
    [...byRoot.values()].every((set) => set.size === 1 && !set.has(null)), true);
  check("and every ש in an answer carries it",
    dotted.every((w) => w.letters.some((c) => [...c].length > 1)), true);
  check("no root has two ש to disagree about",
    dotted.every((w) => [...w.root].filter((c) => c === SHIN).length === 1), true);
  /* Both dots are actually exercised by the bank. */
  const kinds = new Set(dotted.map((w) => dotInWord(w.he)));
  check("the bank drills both שׁ and שׂ", kinds.has(SHIN_DOT) && kinds.has(SIN_DOT), true);

  console.log("\n── roots: judging the dot ──");
  check("the stored answer is exact", ALL_WORDS.every((w) => judgeRoot(w.letters, w)?.exact), true);
  const bare = (w) => w.letters.map((c) => [...c][0]);
  const flipped = (w) => w.letters.map((c) => [...c].length > 1
    ? [...c][0] + ([...c][1] === SHIN_DOT ? SIN_DOT : SHIN_DOT) : c);
  check("leaving the dot off is forgiven, not failed",
    dotted.every((w) => judgeRoot(bare(w), w)?.forgiven), true);
  check("and the forgiven answer names the dot",
    dotted.every((w) => judgeRoot(bare(w), w).dots.every((d) => Boolean(dotName(d)))), true);
  /* שׂ and שׁ are different consonants, so the other dot is not a slip. */
  check("the wrong dot is rejected", dotted.every((w) => judgeRoot(flipped(w), w) === null), true);
  check("a wrong consonant is still rejected",
    judgeRoot(["ז", "ז", "ז"], ALL_WORDS[0]), null);
  check("a letter shape is still forgiven",
    ALL_WORDS.every((w) => Boolean(judgeRoot(
      w.letters.map((c, i) => i === 2 ? c.replace(/[ךםןףץ]/,
        (x) => "כמנפצ"["ךםןףץ".indexOf(x)]) : c), w))), true);
  /* A dot never changes which consonants the diagnosis talks about. */
  check("the dot does not disturb the diagnosis",
    dotted.every((w) => diagnose(bare(w), w) === null), true);

  console.log("\n── roots: affixes ──");
  const PREFIX = new Set(["מ", "ת", "א"]); // מ ת א
  const baseOf = (text) => [...text].find((c) => /[א-ת]/.test(c)) ?? "";
  for (const w of ALL_WORDS) {
    const { prefix, ending } = affixSpans(w);
    const cs = markedWord(w);
    if (prefix.some((i) => i < 0 || i >= cs.length) || ending.some((i) => i < 0 || i >= cs.length)) {
      check(`spans stay inside ${w.he}`, false, true);
    }
  }
  check("spans stay inside every word", true, true);
  /* On the prefix lesson the clue and the affix are the same cluster, which is
     correct — so the rule is not that they never coincide, but that a cluster
     is only ever shown as one of the two. */
  check("a cluster is shown as a clue or an affix, never both",
    ALL_WORDS.every((w) => annotatedWord(w, { clue: true, affix: true })
      .every((c) => c.kind === null || typeof c.kind === "string")), true);
  check("the clue wins where they coincide",
    annotatedWord(wordsForLesson("prefix")[0], { clue: true, affix: true })[0].kind, "clue");
  /* With the clue off, the prefix must still show as an affix. */
  check("the affix hint stands on its own",
    annotatedWord(wordsForLesson("prefix")[0], { affix: true })[0].kind, "affix");
  /* The ô of a I-Wāw noun is a radical's reflex, not something to peel off. */
  check("a vowel letter carrying a radical is never called an affix",
    wordsForLesson("iwaw").every((w) => {
      const a = annotatedWord(w, { affix: true });
      return (w.marks ?? []).every((i) => a[i].kind !== "affix");
    }), true);
  check("a prefix cluster is always מ, ת or א",
    ALL_WORDS.every((w) => affixSpans(w).prefix.every((i) =>
      PREFIX.has(baseOf(markedWord(w)[i].text)) || baseOf(markedWord(w)[i].text) === "")), true);
  /* Lesson 2 is the prefix lesson, so each of its words has one — except the
     one whose מ is a radical, which is the point of including it. */
  const prefixLesson = wordsForLesson("prefix");
  check("every prefix-lesson word shows a prefix, bar the trap",
    prefixLesson.filter((w) => affixSpans(w).prefix.length === 0).length, 1);
  check("every I-Wāw noun shows its prefix too",
    wordsForLesson("iwaw").every((w) => affixSpans(w).prefix.length === 1), true);
  check("and the trap is מְלָכִים",
    prefixLesson.find((w) => affixSpans(w).prefix.length === 0).root, "מלך");
  /* What is left over after peeling must be part of the root, in order. */
  /* Peel the affixes and the clue, and what is left must be root letters in
     order — the clue too, because it may be a vowel standing in for one. */
  check("what remains is a subsequence of the root",
    ALL_WORDS.every((w) => {
      const { prefix, ending } = affixSpans(w);
      const off = new Set([...prefix, ...ending, ...(w.marks ?? [])]);
      const kept = markedWord(w)
        .map((c, i) => (off.has(i) ? "" : baseOf(c.text)))
        .filter(Boolean)
        .map((c) => bareRoot(c));
      /* A word may also carry an internal mater — the yod of צַדִּיק — which is
         neither radical nor affix, so it is allowed to sit in between. */
      const MATER = new Set(["\u05D5", "\u05D9", "\u05D0", "\u05D4"]);
      /* A subsequence, not a run: a hidden radical — the נ of נתן, the ו of
         ישב — leaves a gap in the middle of the root that nothing fills. */
      const root = bareRoot(w.root);
      let r = 0;
      for (const c of kept) {
        let k = r;
        while (k < 3 && root[k] !== c) k++;
        if (k < 3) { r = k + 1; continue; }
        if (MATER.has(c)) continue;
        return false;
      }
      return true;
    }), true);

  console.log("\n── roots: annotation ──");
  const both = (w) => annotatedWord(w, { clue: true, affix: true });
  check("annotation rebuilds the word",
    ALL_WORDS.every((w) => both(w).map((c) => c.text).join("") === w.he.normalize("NFD")), true);
  check("with nothing shown, nothing is tagged",
    ALL_WORDS.every((w) => annotatedWord(w).every((c) => c.kind === null)), true);
  check("each cluster gets at most one tag",
    ALL_WORDS.every((w) => both(w).every((c) => c.kind === null || c.kind === "clue" || c.kind === "affix")), true);
}


console.log("\n── roots: the exceptions ──");
{
  /* Words no rule reaches. They are kept out of the eight lessons — there is
     nothing to teach — and asked only in Practice, where the mix is the point. */
  check("there are exceptions", EXCEPTIONS.length > 0, true);
  check("they are not in any lesson",
    EXCEPTIONS.every((w) => !LESSONS.some((l) => l.id === w.lesson)), true);
  check("they are not in the lesson bank",
    ALL_WORDS.some((w) => EXCEPTIONS.some((e) => e.he === w.he)), false);
  check("but they are in the practice pool",
    EXCEPTIONS.every((w) => PRACTICE_WORDS.includes(w)), true);
  check("the practice pool is the lessons plus them",
    PRACTICE_WORDS.length, ALL_WORDS.length + EXCEPTIONS.length);
  check("each is flagged as memorised", EXCEPTIONS.every((w) => w.memorise === true), true);
  /* Nothing on the page gives them away, so there is nothing to highlight. */
  check("none carries a fingerprint", EXCEPTIONS.every((w) => w.marks.length === 0), true);
  check("each says why it has to be known",
    EXCEPTIONS.every((w) => typeof w.note === "string" && w.note.length > 20), true);
  check("each still answers with three letters",
    EXCEPTIONS.every((w) => w.letters.length === 3), true);
  check("and grades like any other", EXCEPTIONS.every((w) => judgeRoot(w.letters, w)?.exact), true);
  check("ids stay unique across the whole pool",
    new Set(PRACTICE_WORDS.map((w) => w.id)).size, PRACTICE_WORDS.length);

  console.log("\n── roots: the health classes ──");
  check("nine classes: eight lessons and the exceptions", CLASSES.length, LESSONS.length + 1);
  check("every class has words",
    CLASSES.every((c) => PRACTICE_WORDS.filter((w) => w.lesson === c.id).length > 0), true);
  check("the classes cover the pool exactly",
    PRACTICE_WORDS.every((w) => CLASSES.some((c) => c.id === w.lesson)), true);
  check("and nothing is counted twice",
    CLASSES.reduce((t, c) => t + PRACTICE_WORDS.filter((w) => w.lesson === c.id).length, 0),
    PRACTICE_WORDS.length);
}


console.log("\n── the response-time bar ──");
{
  /* The bar is a quantile of your own times, so a deliberate learner and a
     quick one get the same share of answers counted fast. */
  let seed = 11;
  const rand = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  const gauss = () => { let u=0,v=0; while(!u)u=rand(); while(!v)v=rand();
    return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v); };
  const draw = (med, lapse) => rand() < lapse ? 60000 + rand()*240000 : Math.exp(Math.log(med) + 0.45*gauss());

  check("starts at the seed", fastBar(freshTempo()), SEED_MS);
  check("a fresh tempo has no samples", freshTempo().n, 0);

  const settle = (median, lapse = 0.02, n = 1500) => {
    let t = freshTempo();
    const xs = [];
    for (let i = 0; i < n; i++) { const x = draw(median, lapse); xs.push(x); t = observeTempo(t, x); }
    const bar = fastBar(t);
    return { bar, share: xs.filter((x) => x < bar).length / xs.length };
  };
  const slow = settle(5500), quick = settle(2400);
  check("it finds a deliberate learner's bar", slow.bar > 4500 && slow.bar < 8000, true);
  check("and a quick learner's", quick.bar > 1800 && quick.bar < 3600, true);
  /* The point of the whole exercise: the same share for both. */
  check("both get about the intended share counted fast",
    Math.abs(slow.share - FAST_SHARE) < 0.08 && Math.abs(quick.share - FAST_SHARE) < 0.08, true);
  check("which the old flat bar did not",
    Math.abs(0.6 - 0.26) > 0.08, true);

  /* Lapses are the reason a quantile was chosen over fitting a distribution. */
  const clean = settle(5500, 0), dirty = settle(5500, 0.05);
  check("a few walked-away answers barely move it",
    Math.abs(dirty.bar - clean.bar) / clean.bar < 0.15, true);

  check("bounded below", observeTempo({ q: FLOOR_MS, n: 50 }, 1).q >= FLOOR_MS, true);
  check("bounded above", observeTempo({ q: CEILING_MS, n: 50 }, 600000).q <= CEILING_MS, true);
  check("junk input is ignored", observeTempo({ q: 4000, n: 5 }, NaN).n, 5);
  check("so is a negative time", observeTempo({ q: 4000, n: 5 }, -3).n, 5);

  /* Stored tempo is rebuilt defensively, like every other slice. */
  check("a missing tempo rebuilds", normalizeTempo(undefined).q, SEED_MS);
  check("a junk tempo rebuilds", normalizeTempo({ q: "x", n: "y" }).q, SEED_MS);
  check("an out-of-range tempo is clamped", normalizeTempo({ q: 1e9, n: 5 }).q, CEILING_MS);
  /* Early on it leans on the seed rather than three samples. */
  const young = { q: 9000, n: 3 };
  check("the warm-up blends toward the measurement",
    fastBar(young) > SEED_MS && fastBar(young) < young.q, true);
  check("and hands over once there are enough", fastBar({ q: 9000, n: WARMUP }), 9000);
}

console.log("\n── the two mastery conditions agree ──");
{
  /* gainFast is pinned to masterTries: if they drift apart, one of them is
     dead and every item silently costs an extra repetition. */
  const reps = (gain, target) => { let s = 0, n = 0; while (s < target && n < 50) { s += (1 - s) * gain; n++; } return n; };
  check("a recalled item masters in exactly masterTries answers",
    reps(DEFAULT_PACING.gainFast, DEFAULT_PACING.masterScore), DEFAULT_PACING.masterTries);
  check("a reconstructed one takes longer",
    reps(DEFAULT_PACING.gainSlow, DEFAULT_PACING.masterScore) > DEFAULT_PACING.masterTries, true);
  /* The scorer honours a measured bar, and falls back when given none. */
  const item = { id: "t" };
  const slowScored = scoreAnswer({}, item, { correct: true, ms: 5500, hinted: false, fastMs: 4000 });
  const fastScored = scoreAnswer({}, item, { correct: true, ms: 5500, hinted: false, fastMs: 7000 });
  check("the same answer scores by the bar it is given",
    slowScored.t.s < fastScored.t.s, true);
  check("full credit is gainFast", fastScored.t.s.toFixed(3), DEFAULT_PACING.gainFast.toFixed(3));
  check("no bar falls back to the default",
    scoreAnswer({}, item, { correct: true, ms: 5500, hinted: false }).t.s.toFixed(3),
    DEFAULT_PACING.gainSlow.toFixed(3));
  check("a hint never earns full credit",
    scoreAnswer({}, item, { correct: true, ms: 10, hinted: true, fastMs: 7000 }).t.s.toFixed(3),
    DEFAULT_PACING.gainSlow.toFixed(3));
}

console.log("\n── the definite article ──");
{
  const DAGESH = "ּ", HE = "ה";
  const PATAH = "ַ", QAMATS = "ָ", SEGOL = "ֶ";
  const art = (w) => canonical(w.def).slice(0, 2);
  const body = (w) => canonical(w.def).slice(2);

  check("five rules plus Free Practice", A_CONTENTS.length, 6);
  check("the rules are numbered in order",
    A_CONTENTS.map((s) => s.n).join(""), "123456");
  check("Free Practice is last and has no streak",
    [A_CONTENTS.at(-1).id, "streak" in A_FREE], ["free", false]);
  check("every rule cites Seow", A_LESSONS.every((l) => /^§1/.test(l.seow)), true);
  check("the decision table covers every rule",
    new Set(DECISION_TABLE.map((r) => r.rule)).size, 4);

  /* Hand-written from the grammar, not from the code: the point is to catch a
     derivation that drifts, so these must come from somewhere else. The §1.c
     seven are in the bank already, and are checked here too. */
  const EXPECTED = {
    "מֶלֶךְ": "הַמֶּלֶךְ",      // the king
    "דָּבָר": "הַדָּבָר",            // the word
    "בַּיִת": "הַבַּיִת",            // the house
    "אִישׁ": "הָאִישׁ",                        // the man
    "עִיר": "הָעִיר",                                    // the city
    "רֹאשׁ": "הָרֹאשׁ",                        // the head
    "עָב": "הָעָב",                                                // the cloud
    "הֵיכָל": "הַהֵיכָל",            // the palace
    "חֹדֶשׁ": "הַחֹדֶשׁ",            // the new moon
    "הָמוֹן": "הֶהָמוֹן",            // the uproar
    "חָכָם": "הֶחָכָם",                        // the wise man
    "עָוֹן": "הֶעָוֹן",                        // the iniquity
  };
  const derived = Object.keys(EXPECTED).filter((he) => A_WORDS.some((w) => canonical(w.he) === canonical(he)));
  check("every hand-checked word is in the bank", derived.length, Object.keys(EXPECTED).length);
  for (const [he, want] of Object.entries(EXPECTED)) {
    const w = A_WORDS.find((x) => canonical(x.he) === canonical(he));
    check(`${he} → ${want}`, canonical(w.def), canonical(want));
  }

  /* §1.c changes the noun, so it is written out rather than derived. */
  const RESHAPED = {
    "אֲרוֹן": "הָאָרוֹן",  // the ark
    "אֶרֶץ": "הָאָרֶץ",              // the land
    "גַּן": "הַגָּן",                          // the garden
    "הַר": "הָהָר",                                      // the mountain
    "חַג": "הֶחָג",                                      // the festival
    "עַם": "הָעָם",                                      // the people
    "פַּר": "הַפָּר",                          // the bull
  };
  const reshape = articleWords("reshape");
  check("the seven that reshape the noun", reshape.length, 7);
  for (const [he, want] of Object.entries(RESHAPED)) {
    const w = reshape.find((x) => canonical(x.he) === canonical(he));
    check(`${he} → ${want}`, w && canonical(w.def), canonical(want));
  }
  check("each reshaped word says what moved", reshape.every((w) => Boolean(w.was)), true);

  /* Invariants over the whole bank, which is what keeps the table above short. */
  check("the bank is the size we planned", A_WORDS.length >= 40 && A_WORDS.length <= 50, true);
  check("every word has a definite form", A_WORDS.every((w) => Boolean(w.def)), true);
  check("every id is unique", new Set(A_WORDS.map((w) => w.id)).size, A_WORDS.length);
  check("every word belongs to a rule",
    A_WORDS.every((w) => A_LESSONS.some((l) => l.id === w.lesson)), true);
  check("every rule has words to draw on",
    A_LESSONS.every((l) => articleWords(l.id).length >= 7), true);
  check("the article is always he plus one of three vowels",
    new Set(A_WORDS.map(art)).size === 3 &&
      [...new Set(A_WORDS.map(art))].every((a) => a[0] === HE &&
        [PATAH, QAMATS, SEGOL].includes(a[1])), true);
  check("only the ordinary rule adds a dagesh",
    A_WORDS.filter((w) => body(w).includes(DAGESH) && !canonical(w.he).includes(DAGESH))
      .every((w) => w.lesson === "plain"), true);
  check("and it always adds one",
    articleWords("plain").every((w) => {
      const first = [...body(w)].findIndex((c) => c === DAGESH);
      return first > 0 && first <= 2;
    }), true);
  check("outside §1.c the noun itself is untouched",
    A_WORDS.filter((w) => w.lesson !== "plain" && w.lesson !== "reshape")
      .every((w) => body(w) === canonical(w.he)), true);
  check("עָב is kept as the counterexample to rule 4",
    A_WORDS.some((w) => canonical(w.he) === canonical("עָב") && w.lesson === "lengthen" && Boolean(w.note)), true);

  /* Grading: strict on the dagesh, forgiving only about letter shape. */
  const king = A_WORDS.find((w) => w.lesson === "plain" && canonical(w.he) === canonical("מֶלֶךְ"));
  check("the right form passes", Boolean(judgeArticle(king.def, king)), true);
  check("whitespace is tolerated", Boolean(judgeArticle(` ${king.def} `, king)), true);
  const noDot = king.def.replace(DAGESH, "");
  check("a missing dagesh fails", judgeArticle(noDot, king), null);
  check("and is told what is missing",
    /dagesh/.test(diagnoseArticle(noDot, king)), true);
  const city = A_WORDS.find((w) => canonical(w.he) === canonical("עִיר"));
  check("an added dagesh fails", judgeArticle(canonical(city.def).slice(0,2) + "עּ" + canonical(city.def).slice(3), city), null);
  /* A bare ה is the common slip and used to be told "the article here is הַ"
     when הַ was what they typed, only unvowelled. */
  check("an unvowelled article is told it needs a vowel",
    /needs its vowel/.test(diagnoseArticle("\u05D4" + canonical(king.he), king)), true);
  check("the wrong article is named",
    /הָ/.test(diagnoseArticle(HE + PATAH + canonical(city.he), city)), true);
  /* Shape is the one slip forgiven: nothing here teaches final forms. */
  const sofit = A_WORDS.find((w) => /[ךםןףץ]$/.test(canonical(w.def)));
  if (sofit) {
    const medial = { "ך": "כ", "ם": "מ", "ן": "נ", "ף": "פ", "ץ": "צ" };
    const last = canonical(sofit.def).slice(-1);
    const wrong = canonical(sofit.def).slice(0, -1) + medial[last];
    check("a medial letter at the end is forgiven, not ignored",
      judgeArticle(wrong, sofit)?.forgiven, true);
  }
  check("an unrelated word fails", judgeArticle("בַּיִת", king), null);

  /* The derivation is the content, so it is exercised directly too. */
  check("definiteOf has no rule for §1.c", definiteOf("הַר", "reshape"), null);
  check("lengthening leaves the word alone",
    definiteOf("עִיר", "lengthen"), canonical(HE + QAMATS + "עִיר"));
  check("virtual doubling adds no dot",
    definiteOf("חֹדֶשׁ", "virtual").includes(DAGESH), false);
  check("a word that already has a dagesh gains no second one",
    (definiteOf("בַּיִת", "plain").match(/ּ/g) || []).length, 1);
}

test("the character and lesson data", () => {
  const failed = results.filter((r) => !r).length;
  console.log(`\n${results.length - failed}/${results.length} checks passed`);
  if (failed) throw new Error(`${failed} of ${results.length} data checks failed — see the log above`);
});