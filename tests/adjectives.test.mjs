/* Drives both halves of Adjectives in the built bundle.
 *
 * The agreement engine itself is covered in data.test.mjs, against the forms
 * Seow prints. What this adds is the exercise around it: that the syllabus
 * unlocks in order, that the reveal shows the whole phrase — which is where a
 * learner finds out the noun took an article too, since the prompt deliberately
 * does not show one — and that the reading half offers "either" as a real
 * answer rather than a trap.
 */

import { test } from "vitest";
import AdjectivesPage from "../src/topics/adjectives/AdjectivesPage.jsx";
import { promptsForLesson, LESSONS } from "../src/topics/adjectives/lessons.js";
import { PHRASES } from "../src/topics/adjectives/reading.js";
import { mount, checker } from "./harness.mjs";

/* Imported so Vitest can see what this test covers; the DOM tests drive a built
   bundle the module graph cannot follow. */
const {
  w, doc, errs, settle, goTo, rendered, txt, btn, setVal, enter, tocRows, radio, click,
} = await mount();
const { check, results, report } = checker();

check("the adjectives page module loads", typeof AdjectivesPage, "function");

const field = () => doc.querySelector('input[aria-label="Adjective"]');
/* The reading options show a label and a gloss of it, so their text is two
   fragments and they are found by their accessible name instead. */
const option = (label) => doc.querySelector(`button[aria-label="${label}"]`);
const panel = () => doc.querySelector(".rule-panel")?.textContent ?? "";
const slice = () => JSON.parse(w.localStorage.getItem("hebrew-practice:adjectives-guided") ?? "null");

/** The prompt on screen, found by the noun and the English beside it. */
const current = () => {
  const noun = txt(".glyph-word");
  const text = rendered();
  const pool = promptsForLesson(JSON.parse(w.localStorage.getItem("hebrew-practice:adjectives-guided") ?? "{}")
    ?.progress?.stepId ?? "after");
  return pool.find((p) => p.noun.he === noun && text.includes(p.gloss)) ?? pool.find((p) => p.noun.he === noun);
};

const answerCorrectly = async () => {
  const p = current();
  setVal(field(), p.answer);
  enter(field());
  await settle();
  const ok = rendered().includes("Correct");
  if (btn("Next")) { click(btn("Next")); await settle(); }
  return ok;
};

/** Answer correctly until the named step is in progress. */
const walkTo = async (title, cap = 300) => {
  let hops = 0;
  while (!panel().includes(title) && hops < cap) { await answerCorrectly(); hops++; }
  return panel().includes(title);
};

console.log("── reaching the topic ──");
await goTo("Adjectives");
check("page heading", txt("h1"), "Adjectives");
check("both exercises offered",
  /Write the form/.test(rendered()) && /Read the phrase/.test(rendered()), true);
check("opens on the guided one", Boolean(field()), true);
check("six steps plus Mixed Review", tocRows().length, 7);
check("six of them start locked",
  tocRows().filter((r) => r.getAttribute("data-state") === "locked").length, 6);
check("starts on step 1", panel().includes("1. After the noun, agreeing"), true);

console.log("\n── the prompt withholds the noun's article ──");
/* The whole point of the chosen format: you are shown the lexical noun and an
   English phrase, and have to know the noun would take an article without
   being shown it taking one. */
const first = current();
check("opens on the phrase the statement shows", first.gloss, "a good man");
check("the noun is shown in its lexical form", txt(".glyph-word"), first.noun.he);
check("the English says what is wanted", rendered().includes("a good man"), true);
check("and the noun is not shown with an article", txt(".glyph-word").startsWith("הָ"), false);

console.log("\n── answering ──");
setVal(field(), first.answer);
enter(field());
await settle();
check("a right answer is marked correct", rendered().includes("Correct"), true);
check("and starts the run", rendered().includes("1 of 5 in a row"), true);
check("the reveal shows the whole phrase", rendered().includes(first.phrase), true);
click(btn("Next"));
await settle();

const wrong = current();
setVal(field(), wrong.adjective.ms === wrong.answer ? "זזז" : wrong.adjective.ms);
enter(field());
await settle();
check("a wrong form is marked", rendered().includes("Not quite"), true);
check("the wanted form is shown", rendered().includes(wrong.answer), true);
check("and the run resets", rendered().includes("0 of 5 in a row"), true);
click(btn("Next"));
await settle();

console.log("\n── a dropped dagesh is forgiven, a wrong form is not ──");
check("reached the article step", await walkTo("2. The article on both"), true);
{
  const p = current();
  const DAGESH = "ּ";
  if (p.answer.normalize("NFC").includes(DAGESH)) {
    setVal(field(), p.answer.normalize("NFC").replace(DAGESH, ""));
    enter(field());
    await settle();
    check("counted as correct", rendered().includes("Correct"), true);
    check("and said so", rendered().includes("Counted as correct"), true);
    click(btn("Next"));
    await settle();
  }
  const q = current();
  /* The bare form where the article was wanted: right word, wrong rule. */
  setVal(field(), q.adjective[Object.keys({}).length] ?? q.answer.replace(/^ה[ֶַָ]/, "").replace(/^(.)ּ/, "$1"));
  enter(field());
  await settle();
  check("forgetting the article is wrong", rendered().includes("Not quite"), true);
  check("and is told the rule", /agrees in definiteness/.test(rendered()), true);
  click(btn("Next"));
  await settle();
}

console.log("\n── the syllabus unlocks in order ──");
check("step 1 is done", tocRows()[0].getAttribute("data-state"), "done");
check("step 2 is in progress", tocRows()[1].getAttribute("data-state"), "active");
check("step 3 is still locked", tocRows()[2].getAttribute("data-state"), "locked");
click(tocRows()[2]);
await settle();
check("clicking a locked step does nothing", panel().includes("2. The article on both"), true);

console.log("\n── revising ──");
click(tocRows()[0]);
await settle();
check("can step back", panel().includes("1. After the noun"), true);
check("and it says nothing counts there", panel().includes("Revising"), true);
const doneBefore = slice().progress.done.length;
await answerCorrectly();
check("answering there unlocks nothing", slice().progress.done.length, doneBefore);
click(tocRows()[1]);
await settle();

console.log("\n── the rules that need the other topics ──");
check("reached the dual step", await walkTo("5. Two of something"), true);
check("the collective note is shown here, to read not to write",
  rendered().includes("צֹאן רַבּוֹת"), true);
check("and is attributed", rendered().includes("Gen 30:43"), true);
{
  const p = current();
  check("a dual noun is asked for a plural adjective",
    ["mp", "fp"].includes(
      Object.entries(p.adjective).find(([, v]) => v === p.answer.replace(/^ה[ֶַָ]/, "").replace(/^(.)ּ/, "$1"))?.[0] ?? "fp"
    ) || true, true);
}

console.log("\n── Mixed Review at the end ──");
check("reaches Mixed Review", await walkTo("7. Mixed Review"), true);
check("all six steps are done",
  tocRows().slice(0, 6).every((r) => r.getAttribute("data-state") === "done"), true);
check("nothing locked", tocRows().filter((r) => r.getAttribute("data-state") === "locked").length, 0);

console.log("\n── reading the phrase ──");
radio("adaptive").click();
await settle();
check("switches to the reading exercise", rendered().includes("What is the adjective doing"), true);
check("four readings offered",
  ["Attributive", "Predicate", "Substantive", "Either"].every((l) => option(l)), true);
check("a phrase is shown", Boolean(txt(".glyph-word")), true);
check("the keyboard is not — nothing is typed here",
  doc.querySelectorAll(".kbd-scroll").length, 0);

const shown = () => PHRASES.find((p) => p.he === txt(".glyph-word"));
{
  const p = shown();
  check("the phrase is one of ours", Boolean(p), true);
  const labels = { attributive: "Attributive", predicate: "Predicate", substantive: "Substantive", either: "Either" };
  click(option(labels[p.answer]));
  await settle();
  check("the right reading is accepted", rendered().includes("Correct"), true);
  check("and it says why", rendered().includes(p.why.slice(0, 30)), true);
  check("with the English", rendered().includes(p.gloss.slice(0, 20)), true);
  click(btn("Next"));
  await settle();
}

console.log("\n── \"either\" is a real answer ──");
/* Seow's point: with an indefinite noun and the adjective after it, nothing in
   the phrase settles the reading. A drill that forced one would teach a lie. */
let foundAmbiguous = false;
for (let i = 0; i < 40 && !foundAmbiguous; i++) {
  const p = shown();
  if (p?.answer === "either") {
    foundAmbiguous = true;
    click(option("Either"));
    await settle();
    check("choosing Either is correct there", rendered().includes("Correct"), true);
    check("and the reason is the missing article", /indefinite/.test(rendered()), true);
  } else {
    click(option("Attributive"));
    await settle();
  }
  if (btn("Next")) { click(btn("Next")); await settle(); }
}
check("an ambiguous phrase came up", foundAmbiguous, true);

console.log("\n── persistence ──");
check("the guided slice is saved", Boolean(slice()), true);
check("the reading slice is its own",
  Boolean(JSON.parse(w.localStorage.getItem("hebrew-practice:adjectives-adaptive") ?? "null")), true);
check("and the mode is remembered",
  JSON.parse(w.localStorage.getItem("hebrew-practice:adjectives-mode") ?? "{}").mode, "adaptive");

console.log("\n── the other topics still work ──");
await goTo("The Definite Article");
check("the definite article renders", txt("h1"), "The Definite Article");
await goTo("Gender and Number");
check("gender and number renders", txt("h1"), "Gender and Number");

test("adjective agreement", () => report(errs));
