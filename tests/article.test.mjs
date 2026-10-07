/* Drives "The Definite Article" in the built bundle.

   The derivation and the grading are covered in test-data.mjs; this is about
   the mode as a page — that the syllabus unlocks in order, that a finished rule
   can be revisited without disturbing the run in progress, that the decision
   table is actually visible when switched on (a Collapse here looked open in
   the DOM while rendering at display:none), and that progress survives a
   reload. */

import { ALL_WORDS, LESSONS, wordsForLesson } from "../src/topics/article/lessons.js";

import { test } from "vitest";
import ArticlePage from "../src/topics/article/ArticlePage.jsx";
import { mount, checker } from "./harness.mjs";

/* This file remounts partway through — the persistence check is a second
   document reading the first one's storage — so the helpers delegate to
   whichever window is current rather than closing over the first. */
let h = await mount();
const w = () => h.w, doc = () => h.doc;
const settle = (...a) => h.settle(...a);
const after = (...a) => h.after(...a);
const goTo = (...a) => h.goTo(...a);
const rendered = () => h.rendered();
const txt = (x) => h.txt(x);
const btn = (x) => h.btn(x);
const link = (x) => h.link(x);
const tocRows = () => h.tocRows();
const click = (el) => h.click(el);
const setVal = (el, v) => h.setVal(el, v);
const enter = (el) => h.enter(el);
const { check, results, report } = checker();
const field = () => doc().querySelector('input[aria-label="Definite form"]');
const panel = () => doc().querySelector(".rule-panel")?.textContent ?? "";
const saved = () => JSON.parse(w().localStorage.getItem("hebrew-practice:definite-article") ?? "null");


/* The prompt is a bare noun; look it up so we know what the article should be. */
const currentWord = () => {
  const he = txt(".glyph-word");
  const gloss = rendered();
  return ALL_WORDS.find((x) => x.he === he && gloss.includes(x.gloss))
      ?? ALL_WORDS.find((x) => x.he === he);
};
const answerCorrectly = async () => {
  const word = currentWord();
  setVal(field(), word.def);
  enter(field());
  await settle();
  const ok = rendered().includes("Correct");
  if (btn("Next")) { click(btn("Next")); await settle(); }
  return ok;
};
/** Answer correctly until the named rule is in progress, or give up. */
const walkTo = async (title, cap = 400) => {
  let hops = 0;
  while (!panel().includes(title) && hops < cap) { await answerCorrectly(); hops++; }
  return panel().includes(title);
};

/* Imported so Vitest can see what this test covers. The DOM tests drive a
   built bundle read from disk, which the module graph cannot follow, so
   without this `--changed` selects nothing when a component changes and
   reports green having run no tests. Asserting the module loads also catches
   a broken export before the slower DOM walk does. */
check("the definite article module loads", typeof ArticlePage, "function");

console.log("── reaching the mode ──");
await goTo("The Definite Article");
check("page heading", txt("h1"), "The Definite Article");
check("typing field present", Boolean(field()), true);
check("starts on rule 1", panel().includes("1. The ordinary article"), true);
check("the contents lists five rules and Mixed Review", tocRows().length, 6);
check("five of them start locked",
  tocRows().filter((r) => r.getAttribute("data-state") === "locked").length, 5);
check("the prompt is a word from rule 1",
  wordsForLesson("plain").some((x) => x.he === txt(".glyph-word")), true);
check("the keyboard is there to type with",
  doc().querySelectorAll(".kbd-scroll button").length > 20, true);
check("but no keys are highlighted — that would give the article away",
  doc().querySelectorAll(".kbd-scroll .kbd-active").length, 0);

console.log("\n── answering ──");
const first = currentWord();
setVal(field(), first.def);
enter(field());
await settle();
check("a right answer is marked correct", rendered().includes("Correct"), true);
check("and starts the run", rendered().includes("1 of 5 in a row"), true);
click(btn("Next"));
await settle();

const wrong = currentWord();
setVal(field(), wrong.he);            // the bare noun, no article at all
enter(field());
await settle();
check("a wrong answer is marked", rendered().includes("Not quite"), true);
check("the wanted form is shown", rendered().includes(wrong.def), true);
check("and the run resets", rendered().includes("0 of 5 in a row"), true);
click(btn("Next"));
await settle();

console.log("\n── the dagesh is graded strictly ──");
/* It is the only thing separating rule 1 from rule 3, so dropping it is wrong
   here even though the guided forms exercise forgives the same slip. */
const dotted = currentWord();
setVal(field(), dotted.def.replace("ּ", ""));
enter(field());
await settle();
check("a missing dagesh is not forgiven", rendered().includes("Not quite"), true);
check("and is explained", /dagesh/.test(rendered()), true);
check("not counted as correct", rendered().includes("Counted as correct"), false);
click(btn("Next"));
await settle();

console.log("\n── showing the answer ──");
const shown = currentWord();
click(btn("Show answer"));
await settle();
check("the form is revealed", rendered().includes(shown.def), true);
check("labelled as the answer, not a verdict", rendered().includes("Answer"), true);
click(btn("Next"));
await settle();

console.log("\n── the decision table is a real disclosure ──");
/* Mantine's Collapse rendered this at display:none even when open, so the
   content sat in the DOM unseen and any presence check passed. Assert the
   text, not the control. */
const TABLE_HEAD = "First letter";
const tableSwitch = () => [...doc().querySelectorAll("input[type=checkbox]")]
  .find((c) => c.closest("label, .mantine-Switch-root")?.textContent?.includes("Show the table"));
check("the table is off by default", rendered().includes(TABLE_HEAD), false);
check("there is a switch for it", Boolean(tableSwitch()), true);
tableSwitch().click();
await settle();
check("switching it on shows the table", rendered().includes(TABLE_HEAD), true);
check("with a row per case", doc().querySelectorAll("tbody tr").length, 7);
check("the choice is remembered", saved().showTable, true);
tableSwitch().click();
await settle();
check("switching it off hides it again", rendered().includes(TABLE_HEAD), false);

console.log("\n── unlocking in order ──");
check("reaching rule 2 takes finishing rule 1", await walkTo("2. Before א, ע and ר"), true);
check("rule 1 is now done",
  tocRows()[0].getAttribute("data-state"), "done");
check("rule 2 is in progress",
  tocRows()[1].getAttribute("data-state"), "active");
check("rule 3 is still locked",
  tocRows()[2].getAttribute("data-state"), "locked");
check("the pool moved with it",
  wordsForLesson("lengthen").some((x) => x.he === txt(".glyph-word")), true);
check("clicking a locked rule does nothing",
  (click(tocRows()[2]), await settle(), panel().includes("2. Before א, ע and ר")), true);

console.log("\n── revising a finished rule ──");
const runBefore = saved().progress.streak;
await answerCorrectly();                       // put a run on the board
click(tocRows()[0]);
await settle();
check("can go back to rule 1", panel().includes("1. The ordinary article"), true);
check("and it says nothing counts there", panel().includes("Revising"), true);
const doneBefore = saved().progress.done.length;
await answerCorrectly();
check("answering there does not unlock anything", saved().progress.done.length, doneBefore);
check("nor touches the run in progress", saved().progress.streak > runBefore, true);
click(tocRows()[1]);
await settle();
check("and the run is still there on rule 2", panel().includes("in a row"), true);

console.log("\n── the exceptions, and Mixed Review ──");
check("rule 4 explains the stress condition",
  (await walkTo("4. Before a qamats guttural")) && /stressed/.test(panel()), true);
check("rule 5 is the seven that reshape the noun",
  await walkTo("5. The seven that reshape the noun"), true);
/* §1.c changes the noun itself, so each says what moved. */
const reshaped = currentWord();
setVal(field(), reshaped.he);
enter(field());
await settle();
check("a reshaped noun says what stretched", rendered().includes(reshaped.was), true);
click(btn("Next"));
await settle();
check("Mixed Review opens at the end", await walkTo("6. Mixed Review"), true);
/* Deal thirty words and see which rules they came from. Four of the five is
   the bar rather than all five: §1.c is seven words out of forty-nine, so
   insisting on it would make this fail now and then for no reason. */
const seen = new Set();
for (let i = 0; i < 30; i++) {
  seen.add(currentWord()?.lesson);
  await answerCorrectly();
}
check("and draws on at least four of the five rules", seen.size >= 4, true);
check("all five rules are done",
  tocRows().slice(0, 5).every((r) => r.getAttribute("data-state") === "done"), true);

console.log("\n── persistence ──");
const stored = w().localStorage.getItem("hebrew-practice:definite-article");
check("progress is saved", saved().progress.done.length, LESSONS.length);
check("so is the table setting", "showTable" in saved(), true);

/* Reload with that storage in place: the point is that the syllabus comes back
   where it was, not that an empty profile starts at the beginning. */
h = await mount({ "hebrew-practice:definite-article": stored });
await goTo("The Definite Article");
check("a reload resumes where it left off", panel().includes("6. Mixed Review"), true);
check("with the finished rules still finished",
  tocRows().slice(0, 5).every((r) => r.getAttribute("data-state") === "done"), true);
check("and nothing locked any more",
  tocRows().filter((r) => r.getAttribute("data-state") === "locked").length, 0);

console.log("\n── starting over ──");
/* We are on Free Practice, which shows no streak meter — the thing to lose
   here is the five finished rules. */
await answerCorrectly();
check("there is progress to lose", saved().progress.done.length, LESSONS.length);
click(btn("Start over"));
await settle();
check("back to rule 1", panel().includes("1. The ordinary article"), true);
check("with nothing done", saved().progress.done.length, 0);
check("and no run", saved().progress.streak, 0);

console.log("\n── the other modes still work ──");
await goTo("Gender and Number");
check("gender and number renders", txt("h1"), "Gender and Number");
await goTo("Roots");
check("roots renders", txt("h1"), "Roots");

/* One assertion for the run: the per-check detail is in the log above. */
test("the definite article", () => report(h.errs));
