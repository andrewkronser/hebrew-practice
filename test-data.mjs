/* Guards the character data. The accent U+05AB once slipped into 20 vocabulary
   words and rendered as tofu, because Frank Ruhl Libre has no glyph for it. */
import { WORD_BANK } from "./src/features/vocabulary/data.js";
import { glossOrder, buildQuestion, advanceCursor } from "./src/features/vocabulary/quiz.js";
import { FORMS, CELLS, SEED_SIZE, isCorrectCell } from "./src/features/gender-number/data.js";
import { pickForm, correctCells, engine, PACING } from "./src/features/gender-number/drill.js";
import { CURRICULUM as T_CURRICULUM, WORDS as T_WORDS } from "./src/features/transliteration/data.js";
import { NIQQUD, LETTER_KEYS } from "./src/shared/hebrewKeyboard.js";
import { CLUSTERS_BY_POINT, clustersFor, promptFor, CURRICULUM, typableWords, POINTED_WORDS, gradeAttempt } from "./src/features/typing/typing.js";

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
check("primary appears most in that cycle",
  seen.filter((g) => g === adam.glosses[0]).length, seen.length / 2);

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
    p = { ...p, stats: engine.scoreAnswer(p.stats, it, { correct: Math.random() < acc, ms: 2500 }), since: p.since + 1 };
    n++;
    if (engine.shouldUnlock(p)) p = engine.unlock(p);
  }
  const done = p.unlocked >= FORMS.length;
  console.log(`   ${acc}: ${done ? n + " answers" : "stalled at " + p.unlocked}`);
  check(`accuracy ${acc} reaches every form`, done, true);
}

console.log(`\n${results.filter(Boolean).length}/${results.length} checks passed`);
process.exit(results.every(Boolean) ? 0 : 1);
