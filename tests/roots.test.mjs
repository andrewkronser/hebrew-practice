/* Drives "Learn root rules" in the built bundle. */
import {
  LESSONS, CLASSES, wordsForLesson, ALL_WORDS, PRACTICE_WORDS, affixSpans, markedWord, annotatedWord, bareRoot,
  dotInWord, SHIN_DOT, SIN_DOT,
} from "../src/topics/roots/lessons.js";

import { test } from "vitest";
import RootsPage from "../src/topics/roots/RootsPage.jsx";
import { mount, checker } from "./harness.mjs";

/* This file remounts partway through, so the helpers delegate to whichever
   window is current rather than closing over the first one — reassigning `h`
   is then the whole of a reload. */
let h = await mount();
const w = () => h.w, doc = () => h.doc;
const settle = (...a) => h.settle(...a);
const after = (...a) => h.after(...a);
const waitFor = (...a) => h.waitFor(...a);
const goTo = (...a) => h.goTo(...a);
const rendered = () => h.rendered();
const txt = (s) => h.txt(s);
const btn = (s) => h.btn(s);
const link = (s) => h.link(s);
const radio = (s) => h.radio(s);
const tocRows = () => h.tocRows();
const click = (el) => h.click(el);
const setVal = (el, v) => h.setVal(el, v);
const enter = (el) => h.enter(el);
const { check, results, report } = checker();

const cells = () => [...doc().querySelectorAll(".root-cell")];
const tocRow = (text) => tocRows().find((r) => r.textContent.includes(text));
const word = () => txt(".glyph-word");
const meter = () => {
  const m = rendered().match(/(\d+) of (\d+) in a row/);
  return m ? { streak: Number(m[1]), target: Number(m[2]) } : null;
};


/* One cell per consonant — and a ש carries its dot with it, so the root can't
   just be spread by code point or a dotted letter spills into a fourth cell. */
const asCells = (root) => {
  const out = [];
  for (const ch of String(root).normalize("NFD")) {
    if (/[א-ת]/.test(ch)) out.push(ch);
    else if (out.length) out[out.length - 1] += ch;
  }
  return out;
};

/** Type a root into the three cells and submit. */
const answerWith = async (root) => {
  const cs = cells();
  asCells(root).forEach((v, i) => setVal(cs[i], v));
  await settle();
  enter(cells()[2]);
  await settle();
};
const rootFor = (he, lessonId) => wordsForLesson(lessonId).find((x) => x.he === he)?.root;
/* Lesson-agnostic: pinning the lookup to one lesson failed about one run in
   three, because by then the exercise may have moved to the next lesson and the
   word was simply not in the list being searched. */
const rootOf = (he) => ALL_WORDS.find((x) => x.he === he)?.root;

/* Imported so Vitest can see what this test covers. The DOM tests drive a
   built bundle read from disk, which the module graph cannot follow, so
   without this `--changed` selects nothing when a component changes and
   reports green having run no tests. Asserting the module loads also catches
   a broken export before the slower DOM walk does. */
check("the roots page module loads", typeof RootsPage, "function");

console.log("── reaching the exercise ──");
await goTo("Roots");
check("page heading", txt("h1"), "Roots");
check("both modes offered", /Learn root rules/.test(rendered()) && /Practice roots/.test(rendered()), true);
check("three cells", cells().length, 3);

/* Lesson 1's statement opens with Hebrew mid-sentence, and measured in a real
   browser ten of its characters land in the wrong place when the run is not
   isolated. This is the case that actually needs the handling, so it is the one
   worth pinning after folding the two text components into one. */
check("Hebrew inside a lesson statement is isolated",
  [...doc().querySelectorAll(".rule-panel .hebrew, .lesson-panel .hebrew")]
    .some((n) => n.getAttribute("dir") === "rtl")
  || [...doc().querySelectorAll('[style*="isolate"]')].length > 0,
  true);
check("cells are labelled by position",
  cells().map((c) => c.getAttribute("aria-label")).join(","),
  "first radical,second radical,third radical");
check("eight lessons in the syllabus", tocRows().length, LESSONS.length);
check("starts on lesson one", rendered().includes("1. Strong roots"), true);
check("the lesson cites Seow", rendered().includes("Seow III.1"), true);
check("later lessons are locked", doc().querySelectorAll(".toc-locked").length, LESSONS.length - 1);

console.log("\n── the keyboard carries letters and the two ש dots ──");
/* Roots are unpointed apart from the ש dot, which BDB files on, so those two
   points stay and every other one goes. */
check("keyboard rendered", doc().querySelectorAll(".kbd-key").length > 0, true);
check("exactly two niqqud chips", doc().querySelectorAll(".kbd-niqqud").length, 2);
check("and they are the shin and sin dots",
  [...doc().querySelectorAll(".kbd-niqqud")].map((n) => n.textContent.trim()).sort().join(""),
  ["\u05E9" + SIN_DOT, "\u05E9" + SHIN_DOT].sort().join(""));
check("no key is highlighted", doc().querySelectorAll(".kbd-active").length, 0);
const letterKey = [...doc().querySelectorAll(".kbd-face.kbd-hit")][0];
check("letter keys are clickable", Boolean(letterKey), true);
click(letterKey);
await settle();
check("clicking a key fills a cell", cells().some((c) => c.value !== ""), true);
cells().forEach((c) => setVal(c, ""));
await settle();

console.log("\n── answering ──");
check("Check is disabled until all three are filled", btn("Check")?.disabled, true);
let w1 = word();
await answerWith(rootFor(w1, "strong"));
check("a right answer reads Correct", rendered().includes("Correct"), true);
check("the run advanced", meter()?.streak, 1);
check("and the verdict survives the keystroke that made it", Boolean(btn("Next")), true);
click(btn("Next"));
await settle();

/* A medial letter where the final belongs is a shape slip, not a wrong root.
   Cycle until any root closing with a final form comes up, rather than waiting
   on one particular word — that version passed only about four times in five. */
const MEDIAL = { "ך": "כ", "ם": "מ", "ן": "נ", "ף": "פ", "ץ": "צ" };
const closesFinal = (he) => {
  const entry = wordsForLesson("strong").find((x) => x.he === he);
  return entry && MEDIAL[entry.letters[2]] ? entry : null;
};
let shapeWord = null;
for (let i = 0; i < 30 && !(shapeWord = closesFinal(word())); i++) {
  click(btn("Show answer")); await settle(); click(btn("Next")); await settle();
}
check("reached a root that closes with a final form", Boolean(shapeWord), true);
{
  const ls = [...shapeWord.letters];
  ls[2] = MEDIAL[ls[2]];
  await answerWith(ls.join(""));
  check("a medial letter in final position is accepted", rendered().includes("Correct"), true);
  click(btn("Next")); await settle();
}

console.log("\n── a wrong answer explains itself ──");
const wrongWord = word();
const right = rootOf(wrongWord);
check("the word is one we know the root of", Boolean(right), true);
await answerWith("זזז");
check("a wrong answer reads Not quite", rendered().includes("Not quite"), true);
/* The reveal prints the root as it is written, dot and all, so compare the way
   the grader does rather than by raw substring — a root containing ש failed
   otherwise, which is why this passed about four runs in five. */
check("the root is shown",
  [...rendered().matchAll(/[\u05D0-\u05EA\u05C1\u05C2]{3,4}/g)]
    .some((m) => bareRoot(m[0]) === bareRoot(right)), true);
check("the run resets", meter()?.streak, 0);
click(btn("Next"));
await settle();

console.log("\n── finishing a lesson ──");
let done = false;
for (let i = 0; i < 12 && !done; i++) {
  const r = rootFor(word(), "strong");
  if (!r) break;
  await answerWith(r);
  if (/Strong roots — done/.test(rendered())) done = true;
  if (btn("Next")) { click(btn("Next")); await settle(); }
}
check("completing the lesson is announced", done, true);
check("the next lesson is now in progress",
  tocRows().find((r) => r.getAttribute("data-state") === "active")?.textContent.includes("Nouns with prefixes"), true);
check("one fewer lesson is locked", doc().querySelectorAll(".toc-locked").length, LESSONS.length - 2);
check("the run restarts", meter()?.streak, 0);

console.log("\n── the fingerprint toggle ──");
/* מְלָכִים is the one lesson-2 word with nothing to point at — its מ really is
   a radical — so step past it before asserting that a clue appears. */
const hasClue = () => Boolean(wordsForLesson("prefix").find((x) => x.he === word())?.marks.length);
for (let i = 0; i < 20 && !hasClue(); i++) {
  click(btn("Show answer")); await settle(); click(btn("Next")); await settle();
}
check("on a word that has a clue", hasClue(), true);
check("no highlight by default", doc().querySelectorAll(".glyph-word .slip-mark").length, 0);
const toggle = [...doc().querySelectorAll("input[type=checkbox]")]
  .find((i) => i.closest("label")?.textContent.includes("fingerprint"))
  ?? doc().querySelector("input[type=checkbox]");
check("the toggle is offered", Boolean(toggle), true);
toggle.click();
await settle();
/* Lesson 2's clue is the prefix, so there is always something to point at. */
check("turning it on highlights the clue", doc().querySelectorAll(".glyph-word .slip-mark").length > 0, true);
check("the clue is the first cluster",
  doc().querySelector(".glyph-word").firstElementChild?.classList.contains("slip-mark"), true);
toggle.click();
await settle();
check("turning it off clears the highlight", doc().querySelectorAll(".glyph-word .slip-mark").length, 0);

console.log("\n── the ש dot ──");
/* BDB files שׂ and שׁ apart, so the dot is part of the answer: leaving it off
   earns the point with a note, writing the other one does not. Take whichever
   ש word comes up rather than waiting on a particular one. */
const entryFor = (he) => wordsForLesson("prefix").find((x) => x.he === he);
const hasDot = (he) => Boolean(entryFor(he)?.letters.some((c) => [...c].length > 1));
const cycle = async () => {
  if (btn("Show answer")) { click(btn("Show answer")); await settle(); }
  if (btn("Next")) { click(btn("Next")); await settle(); }
};
for (let i = 0; i < 24 && !hasDot(word()); i++) await cycle();
check("reached a root written with a ש", hasDot(word()), true);

const dotWord = entryFor(word());
await answerWith(dotWord.letters.map((c) => [...c][0]).join(""));
check("a bare ש still earns the point", rendered().includes("Correct"), true);
check("but the dot is named", /Counted as correct — but the ש is/.test(rendered()), true);
check("and the pointed root is shown", rendered().includes(dotWord.letters.join("")), true);
click(btn("Next")); await settle();

for (let i = 0; i < 24 && !hasDot(word()); i++) await cycle();
check("reached another", hasDot(word()), true);
const other = entryFor(word());
await answerWith(other.letters
  .map((c) => ([...c].length > 1 ? [...c][0] + ([...c][1] === SHIN_DOT ? SIN_DOT : SHIN_DOT) : c))
  .join(""));
check("the other dot is a different consonant, so it is wrong",
  rendered().includes("Not quite"), true);
click(btn("Next")); await settle();

/* A dot clicked on the keyboard lands on the ש already typed, not in the cell
   the caret has moved on to. */
setVal(cells()[0], "\u05E9");
await settle();
click([...doc().querySelectorAll(".kbd-niqqud")].find((n) => n.textContent.includes(SIN_DOT)));
await settle();
check("clicking a dot attaches it to the ש behind the caret",
  cells()[0].value.normalize("NFD"), "\u05E9" + SIN_DOT);
cells().forEach((c) => setVal(c, ""));
await settle();

console.log("\n── the affix toggle ──");
const affixToggle = [...doc().querySelectorAll("input[type=checkbox]")]
  .find((i) => i.closest("label")?.textContent.includes("affixes"));
check("a second toggle is offered", Boolean(affixToggle), true);
check("nothing is marked as an affix yet", doc().querySelectorAll(".glyph-word .affix-mark").length, 0);
affixToggle.click();
await settle();
const spansNow = affixSpans(ALL_WORDS.find((x) => x.he === word()) ?? {});
check("affixes are highlighted",
  doc().querySelectorAll(".glyph-word .affix-mark").length,
  (spansNow.prefix?.length ?? 0) + (spansNow.ending?.length ?? 0));
check("in a different colour from the clue",
  doc().querySelector(".glyph-word .affix-mark")?.classList.contains("slip-mark") ?? false, false);
/* Both hints at once: a cluster takes one colour or the other, never both. */
toggle.click();
await settle();
/* Count against annotatedWord, which is what the component renders from and
   which decides the precedence when a cluster is both a clue and an affix.
   Asserting "more than none" failed on any word with nothing to point at, and
   recomputing the two sets separately double-counted the overlap. */
const entryNow = ALL_WORDS.find((x) => x.he === word()) ?? {};
const bothOn = annotatedWord(entryNow, { clue: true, affix: true });
check("both hints can be on together",
  doc().querySelectorAll(".glyph-word .slip-mark").length,
  bothOn.filter((c) => c.kind === "clue").length);
check("and the affixes are still marked",
  doc().querySelectorAll(".glyph-word .affix-mark").length,
  bothOn.filter((c) => c.kind === "affix").length);
check("no cluster carries both marks",
  [...doc().querySelectorAll(".glyph-word .slip-mark")]
    .every((n) => !n.classList.contains("affix-mark")), true);
toggle.click(); affixToggle.click();
await settle();
check("both clear again",
  doc().querySelectorAll(".glyph-word .slip-mark,.glyph-word .affix-mark").length, 0);

console.log("\n── revising a finished lesson ──");
const before = meter()?.streak ?? 0;
click(tocRow("Strong roots"));
await settle();
check("can step back to a finished lesson", rendered().includes("1. Strong roots"), true);
check("no meter while revising", meter(), null);
check("and it says why", rendered().includes("Revising — nothing counts here"), true);
await answerWith(rootFor(word(), "strong") ?? "זזז");
click(btn("Next")); await settle();
click(tocRow("Nouns with prefixes"));
await settle();
check("the run on the frontier is untouched", meter()?.streak, before);
check("locked lessons cannot be opened", tocRow("III-Hē")?.disabled, true);

console.log("\n── persistence ──");
const slice = JSON.parse(w().localStorage.getItem("hebrew-practice:roots-guided") || "null");
check("slice saved", Boolean(slice), true);
check("the finished lesson is recorded", slice?.progress?.done?.includes("strong"), true);

/* A real reload: a second document reading the same storage. Reassigning `h`
   is the whole of it, since every helper above delegates to the current one. */
{
  const seeded = {};
  for (const k of Object.keys(w().localStorage)) seeded[k] = w().localStorage.getItem(k);
  const first = h;
  h = await mount(seeded);
  await goTo("Roots");
  check("progress survives a reload", rendered().includes("2. Nouns with prefixes"), true);
  check("the finished lesson is still done",
    tocRows().filter((r) => r.getAttribute("data-state") === "done").length, 1);
  first.dom.window.close();
}

console.log("\n── practice: every class mixed ──");
const practice = [...doc().querySelectorAll("label")].find((l) => l.textContent.includes("Practice roots"));
click(practice);
await after(200);
check("the adaptive exercise renders", cells().length, 3);
check("nothing is announced", rendered().includes("nothing announced"), true);
/* The lessons announce the class and offer hints; here spotting it is the task. */
check("no syllabus", tocRows().length, 0);
check("no hint toggles", doc().querySelectorAll("input[type=checkbox]").length, 0);
/* One row per class, the eight lessons plus the exceptions. */
check("a health row per class", doc().querySelectorAll(".health-row").length, CLASSES.length);
check("every class is named",
  CLASSES.every((c) => rendered().includes(c.title)), true);
check("an untouched class reads as untouched",
  doc().querySelectorAll(".health-fill.health-none").length, CLASSES.length);

console.log("\n── practice: answering ──");
const pWord = () => txt(".glyph-word");
const pEntry = () => PRACTICE_WORDS.find((x) => x.he === pWord());
check("the word comes from the practice pool", Boolean(pEntry()), true);
await answerWith(pEntry().letters.join(""));
check("a right answer reads Correct", rendered().includes("Correct"), true);
/* The reveal names the class, which is what had to be worked out. */
const cls = pEntry().memorise ? "Exception" : LESSONS.find((l) => l.id === pEntry().lesson).title;
check("and names the class", rendered().includes(cls), true);
check("the session count moves", rendered().includes("1 of 1"), true);
click(btn("Next"));
await settle();
check("that class is no longer untouched",
  doc().querySelectorAll(".health-fill.health-none").length < CLASSES.length, true);

const pSlice = () => JSON.parse(w().localStorage.getItem("hebrew-practice:roots-adaptive") || "null");
check("practice keeps its own slice", Boolean(pSlice()?.stats), true);
check("and does not disturb the lessons",
  JSON.parse(w().localStorage.getItem("hebrew-practice:roots-guided")).progress.done.includes("strong"), true);

console.log("\n── the rest of the app ──");
await goTo("Gender and Number");
check("gender and number still renders", txt("h1"), "Gender and Number");
await goTo("Transliteration");
check("transliteration still renders", txt("h1"), "Transliteration");

/* One assertion for the run: the per-check detail is in the log above. */
test("learning root rules", () => report(h.errs));
