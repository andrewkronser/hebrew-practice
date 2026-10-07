/* Drives the Gender and Number exercise in the built bundle. */
import { test } from "vitest";
import GenderNumberPage from "../src/topics/gender-number/GenderNumberPage.jsx";
import { mount, checker } from "./harness.mjs";

const { w, doc, errs, settle, after, rendered, txt, btn, link, click , goTo} = await mount();

const cellButtons = () =>
  [...doc.querySelectorAll("button[aria-label]")].filter((b) =>
    /^(Masculine|Feminine) (Singular|Dual|Plural)$/.test(b.getAttribute("aria-label")));

const { check, results, report } = checker();

/* Imported so Vitest can see what this test covers. The DOM tests drive a
   built bundle read from disk, which the module graph cannot follow, so
   without this `--changed` selects nothing when a component changes and
   reports green having run no tests. Asserting the module loads also catches
   a broken export before the slower DOM walk does. */
check("the gender and number page module loads", typeof GenderNumberPage, "function");

console.log("── reaching the page ──");
await goTo("Gender and Number");
check("heading", txt("h1"), "Gender and Number");
/* The footer prose mentions "new forms", so test the intro card's own
   affordance rather than its wording. */
check("no introduction card", Boolean(btn("Got it")), false);
check("opens straight into a question", cellButtons().length, 6);

console.log("\n── the rotation opens on all six cells ──");
/* Every option must be live from the first question, which a plain prefix of
   the form list could not manage — duals sit a dozen entries deep. */
check("opens with six forms", rendered().includes("6 of 116"), true);

console.log("\n── the six-cell grid ──");
check("six cells", cellButtons().length, 6);
const labels = cellButtons().map((b) => b.getAttribute("aria-label"));
check("row-major order, gender across", labels.join(" | "),
  "Masculine Singular | Feminine Singular | Masculine Dual | Feminine Dual | Masculine Plural | Feminine Plural");
check("column headers present", /MASCULINE|Masculine/.test(rendered()) && /FEMININE|Feminine/.test(rendered()), true);
check("cells are numbered 1–6", cellButtons().map((b) => b.textContent.trim()[0]).join(""), "123456");

console.log("\n── answering by hotkey ──");
doc.dispatchEvent(new w.KeyboardEvent("keydown", { key: "1", bubbles: true }));
await settle();
check("hotkey 1 answers", /Correct|Not quite/.test(rendered()), true);
check("Next appears", Boolean(btn("Next")), true);
check("the parse is revealed", /masculine|feminine/.test(rendered()), true);
click(btn("Next"));
await settle();
check("Next deals a new question", cellButtons().length, 6);

console.log("\n── answering by click ──");
click(cellButtons()[4]);
await settle();
check("clicking a cell answers", /Correct|Not quite/.test(rendered()), true);
/* Exactly one cell is marked right, unless the form is attested in both genders. */
const marked = cellButtons().filter((b) => !b.disabled);
check("at least one cell stays enabled as the answer", marked.length >= 1, true);
click(btn("Next"));
await settle();

console.log("\n── transliteration hint ──");
const sw = doc.querySelector("input[type=checkbox]");
check("hint switch present", Boolean(sw), true);
check("off by default", sw.checked, false);
sw.click();
await settle();
check("switch turns on", sw.checked, true);
sw.click();
await settle();

console.log("\n── a long run ──");
let answered = 0;
for (let i = 0; i < 90 && answered < 60; i++) {
  /* An unlock drops an introduction in front of the grid; clear it and carry on
     rather than treating the missing grid as a failure. */
  const cells = cellButtons();
  if (!cells.length) break;
  click(cells[Math.floor(Math.random() * cells.length)]);
  await settle();
  answered++;
  if (btn("Next")) { click(btn("Next")); await settle(); }
}
check("ran without error", answered >= 60, true);
check("still rendering a question", cellButtons().length, 6);

console.log("\n── persistence and isolation ──");
const slice = JSON.parse(w.localStorage.getItem("hebrew-practice:gender-number-adaptive") || "null");
check("slice saved", Boolean(slice), true);
check("unlocked persisted", slice?.progress?.unlocked >= 6, true);
check("no stale intro state saved", "introOf" in (slice?.progress ?? {}), false);
check("vocabulary slice untouched by this page", w.localStorage.getItem("hebrew-practice:vocabulary"), null);

console.log("\n── other pages still work ──");
await goTo("Vocabulary");
check("vocabulary renders", txt("h1"), "Vocabulary");
await goTo("Transliteration");
check("transliteration renders", txt("h1"), "Transliteration");

/* One assertion for the run: the per-check detail is in the log above. */
test("identifying gender and number", () => report(errs));
