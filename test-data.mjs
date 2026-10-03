/* Guards the character data. The accent U+05AB once slipped into 20 vocabulary
   words and rendered as tofu, because Frank Ruhl Libre has no glyph for it. */
import { WORD_BANK } from "./src/features/vocabulary/data.js";
import { CURRICULUM as T_CURRICULUM, WORDS as T_WORDS } from "./src/features/transliteration/data.js";
import { NIQQUD, LETTER_KEYS } from "./src/features/typing/layout.js";
import { CLUSTERS_BY_POINT, clustersFor, promptFor, CURRICULUM, typableWords, POINTED_WORDS } from "./src/features/typing/typing.js";

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

console.log(`\n${results.filter(Boolean).length}/${results.length} checks passed`);
process.exit(results.every(Boolean) ? 0 : 1);
