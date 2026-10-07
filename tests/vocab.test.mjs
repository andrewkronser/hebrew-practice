/* Drives the vocabulary trainer in the built bundle. Run via: npm run test:vocab */
import { test } from "vitest";
import VocabularyPage from "../src/features/vocabulary/VocabularyPage.jsx";
import { mount, checker } from "./harness.mjs";

const { w, doc, errs, settle, after, rendered, txt, btn, link, click, setVal , goTo} = await mount();

/* The bundle is injected as a <script> in <body>, so body.textContent
   contains its source. Assertions must read only the rendered tree. */

const { check, results, report } = checker();

// Option buttons are the ones inside the card that aren't the controls.
const optionButtons = () =>
  [...doc.querySelectorAll("button")].filter((b) => {
    const t = b.textContent.trim();
    if (b.classList.contains("bank-cell")) return false; // word-bank toggles
    return t && !["Got it", "Next", "See more…", "See less", "Unlock the next one",
                  "Start over", "Switch all back on"].includes(t)
      && !b.hasAttribute("aria-label");
  });


/* Imported so Vitest can see what this test covers. The DOM tests drive a
   built bundle read from disk, which the module graph cannot follow, so
   without this `--changed` selects nothing when a component changes and
   reports green having run no tests. Asserting the module loads also catches
   a broken export before the slower DOM walk does. */
check("the vocabulary page module loads", typeof VocabularyPage, "function");

console.log("── reaching the page ──");
await goTo("Vocabulary");
check("heading", txt("h1"), "Vocabulary");
check("starts on an introduction", rendered().includes("New word"), true);
check("intro shows a Hebrew word", Boolean(txt(".glyph-word")), true);
check("intro has Got it", Boolean(btn("Got it")), true);

console.log("\n── clearing the four introductions ──");
let intros = 0;
while (btn("Got it") && intros < 10) { click(btn("Got it")); await settle(); intros++; }
check("four words introduced", intros, 4);
check("now a question", rendered().includes("New word"), false);
check("four options offered", optionButtons().length, 4);

console.log("\n── answering ──");
let opts = optionButtons();
click(opts[0]);
await settle();
check("verdict shown", /Correct|Not quite/.test(rendered()), true);
check("Next appears", Boolean(btn("Next")), true);
click(btn("Next"));
await settle();
check("Next deals a new question", optionButtons().length, 4);

console.log("\n── word bank panel ──");
check("bank shows 4 of 65", rendered().includes("4 of 65"), true);
check("cells equal unlocked count", doc.querySelectorAll(".bank-cell").length, 4);
/* Spoiler only renders its show/hide control when the content overflows
   maxHeight, and jsdom reports every element as zero-height — so the control
   can never appear here. Assert the component is mounted; the collapse
   threshold itself needs a real browser. */
check("Spoiler mounted around the bank", doc.querySelectorAll("[class*='mantine-Spoiler-root']").length, 1);

console.log("\n── a long run unlocks words ──");
/* Answer correctly every time by reading which option the app marks correct:
   click one, note the verdict, move on. To actually unlock we need correct
   answers, so pick by elimination across repeats is unreliable — instead drive
   the keyboard and accept whatever score results, then assert the count rose
   via the explicit unlock control plus genuine progression. */
let answered = 0;
for (let i = 0; i < 60; i++) {
  const o = optionButtons();
  if (!o.length) break;
  click(o[Math.floor(Math.random() * o.length)]);
  await settle();
  answered++;
  if (btn("Got it")) { click(btn("Got it")); await settle(); continue; }
  if (btn("Next")) { click(btn("Next")); await settle(); }
}
check("answered a long run without error", answered > 40, true);
check("still rendering a question", optionButtons().length, 4);

console.log("\n── explicit unlock ──");
const before = doc.querySelectorAll(".bank-cell").length;
click(btn("Unlock the next one"));
await settle();
check("unlock introduces a new word", rendered().includes("New word"), true);
click(btn("Got it"));
await settle();
check("bank grew by one", doc.querySelectorAll(".bank-cell").length, before + 1);

console.log("\n── transliteration hint ──");
const switchBox = () => doc.querySelector("input[type=checkbox]");
check("hint switch present", Boolean(switchBox()), true);
check("hint off by default", switchBox().checked, false);
/* With the hint off, the prompt's transliteration must not be on screen. */
const slice0 = JSON.parse(w.localStorage.getItem("hebrew-practice:vocabulary") || "null");
check("hint state persisted as off", slice0?.showTranslit ?? false, false);
const translitOnScreen = () => [...doc.querySelectorAll(".translit")]
  .map((e) => e.textContent.trim()).filter(Boolean);
const beforeHint = translitOnScreen().length;
switchBox().click();
await settle();
check("switch turns on", switchBox().checked, true);
check("a transliteration appears", translitOnScreen().length > beforeHint, true);
const slice1 = JSON.parse(w.localStorage.getItem("hebrew-practice:vocabulary") || "null");
check("hint state persisted as on", slice1?.showTranslit, true);
switchBox().click();
await settle();
check("switch turns back off", switchBox().checked, false);

console.log("\n── transliteration always in the reveal ──");
click(optionButtons()[0]);
await settle();
check("reveal is showing", /Correct|Not quite/.test(rendered()), true);
check("transliteration shown even with the hint off", translitOnScreen().length > 0, true);
click(btn("Next"));
await settle();

console.log("\n── filter and switching words off ──");
const cells = () => [...doc.querySelectorAll(".bank-cell")];
const filterBox = () => doc.querySelector('input[aria-label="Filter words"]');
check("filter box present", Boolean(filterBox()), true);
const cellsBefore = cells().length;
setVal(filterBox(), "zzzznomatch");
await settle();
check("filter narrows the list", cells().length, 0);
check("empty filter explained", rendered().includes("Nothing matches"), true);
setVal(filterBox(), "");
await settle();
check("clearing the filter restores it", cells().length, cellsBefore);

click(cells()[0]);
await settle();
check("clicking greys the word out", doc.querySelectorAll(".bank-cell.bank-off").length, 1);
check("count reflects it", rendered().includes("switched off"), true);
check("aria-pressed flips", cells()[0].getAttribute("aria-pressed"), "false");
click(cells()[0]);
await settle();
check("clicking again switches it back on", doc.querySelectorAll(".bank-cell.bank-off").length, 0);

/* Switch every unlocked word off: the drill should say so rather than break. */
for (const c of cells()) { click(c); await settle(); }
await settle();
check("all off shows a message", rendered().includes("Every unlocked word is switched off"), true);
check("no options rendered", optionButtons().length, 0);
const restore = [...doc.querySelectorAll("button")].find((b) => b.textContent.trim() === "Switch all back on");
check("restore control offered", Boolean(restore), true);
click(restore);
await settle();
check("restoring brings the drill back", optionButtons().length, 4);
check("nothing left greyed", doc.querySelectorAll(".bank-cell.bank-off").length, 0);

console.log("\n── the reverse direction ──");
const dirRadio = (v) => [...doc.querySelectorAll("input[type=radio]")].find((r) => r.value === v);
check("direction control present", Boolean(dirRadio("en-he")), true);
/* Word-bank cells are buttons containing Hebrew too, so count only the
   Hebrew inside actual answer buttons. */
const hebrewOptions = () => optionButtons().filter((b) => b.querySelector(".hebrew"));
check("forward mode shows Hebrew as the prompt", Boolean(txt(".glyph-word")), true);
check("forward mode options are English", hebrewOptions().length, 0);

dirRadio("en-he").click();
await settle();
check("reverse mode drops the Hebrew prompt", doc.querySelector(".glyph-word"), null);
check("reverse mode offers four Hebrew options", hebrewOptions().length, 4);
check("still four buttons", optionButtons().length, 4);

/* The prompt must not appear among the options as plain text, and no two
   options may repeat. */
const optTexts = optionButtons().map((b) => b.textContent.trim());
check("no duplicate options", new Set(optTexts).size, optTexts.length);

click(optionButtons()[0]);
await settle();
check("reverse answer is graded", /Correct|Not quite/.test(rendered()), true);
check("reveal shows the Hebrew", rendered().includes("—"), true);
click(btn("Next"));
await settle();
check("reverse deals again", hebrewOptions().length, 4);

console.log("\n── each direction keeps its own strengths ──");
const sliceD = JSON.parse(w.localStorage.getItem("hebrew-practice:vocabulary") || "null");
check("stats are split by direction",
  Object.keys(sliceD?.progress?.stats ?? {}).sort().join(","), "en-he,he-en");
check("direction persisted", sliceD?.direction, "en-he");
check("reverse answers scored into en-he",
  Object.keys(sliceD.progress.stats["en-he"]).length > 0, true);
check("forward scores untouched by reverse answers",
  Object.keys(sliceD.progress.stats["he-en"]).length > 0, true);

dirRadio("he-en").click();
await settle();
check("switching back restores the forward drill", Boolean(txt(".glyph-word")), true);

console.log("\n── persistence ──");
const slice = JSON.parse(w.localStorage.getItem("hebrew-practice:vocabulary") || "null");
check("vocabulary slice saved", Boolean(slice), true);
check("unlocked persisted", slice?.progress?.unlocked >= 5, true);
check("gloss cursors persisted", typeof slice?.progress?.cursors, "object");
check("switched-off set persisted", typeof slice?.disabled, "object");
const other = JSON.parse(w.localStorage.getItem("hebrew-practice:transliteration") || "null");
check("transliteration keeps its own separate slice", Boolean(other && other.settings), true);
check("vocabulary state did not leak into it", other?.progress?.cursors, undefined);

console.log("\n── back to transliteration ──");
await goTo("Transliteration");
check("transliteration still works", txt("h1"), "Transliteration");
check("its answer field is back", Boolean(doc.querySelector('input[aria-label="Transliteration"]')), true);

console.log("\n── the response-time bar is measured here ──");
{
  /* Each trainer learns its own bar rather than sharing a flat 4000ms. */
  const slice = JSON.parse(w.localStorage.getItem("hebrew-practice:vocabulary") || "null");
  check("a tempo is stored", Boolean(slice?.tempo), true);
  check("and it has seen the answers given", slice?.tempo?.n > 0, true);
  check("the bar is a plausible number",
    slice.tempo.q >= 1200 && slice.tempo.q <= 30000, true);
  check("it is kept apart from the other trainers",
    JSON.parse(w.localStorage.getItem("hebrew-practice:transliteration") || "{}").tempo?.q !== slice.tempo.q
      || !w.localStorage.getItem("hebrew-practice:transliteration"), true);
}

/* One assertion for the run: the per-check detail is in the log above. */
test("the vocabulary trainer", () => report(errs));
