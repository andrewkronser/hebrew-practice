/* Drives the Gender and Number drill in the built bundle. */
import { JSDOM, VirtualConsole } from "jsdom";
import fs from "node:fs";

const errs = [];
const vc = new VirtualConsole();
vc.on("jsdomError", (e) => errs.push("jsdomError: " + (e.message || e)));
vc.on("error", (...a) => errs.push("console.error: " + a.map(String).join(" ")));

const dom = new JSDOM(`<!doctype html><html><body><div id="root"></div></body></html>`, {
  runScripts: "dangerously", pretendToBeVisual: true, virtualConsole: vc,
  url: "http://localhost/hebrew-practice/",
  beforeParse(win) {
    win.matchMedia = (q) => ({
      matches: false, media: q, onchange: null,
      addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent() { return false; },
    });
    win.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
    win.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} takeRecords() { return []; } };
  },
});
const w = dom.window, doc = w.document;
const s = doc.createElement("script");
s.textContent = fs.readFileSync("dist-test/bundle.js", "utf8");
doc.body.appendChild(s);
await new Promise((r) => setTimeout(r, 600));

const rendered = () => doc.getElementById("root").textContent;
const tick = (ms = 140) => new Promise((r) => setTimeout(r, ms));
const txt = (sel) => doc.querySelector(sel)?.textContent?.trim() ?? null;
const link = (label) => [...doc.querySelectorAll("a")].find((a) => a.textContent.trim() === label);
const btn = (label) => [...doc.querySelectorAll("button")].find((b) => b.textContent.trim() === label);
const click = (el) => el.dispatchEvent(new w.MouseEvent("click", { bubbles: true, cancelable: true, view: w }));
const cellButtons = () =>
  [...doc.querySelectorAll("button[aria-label]")].filter((b) =>
    /^(Masculine|Feminine) (Singular|Dual|Plural)$/.test(b.getAttribute("aria-label")));

const results = [];
const check = (name, got, want) => {
  const ok = String(got) === String(want);
  results.push(ok);
  console.log(`${ok ? "pass" : "FAIL"}  ${name}${ok ? "" : `  (got ${JSON.stringify(got)}, want ${JSON.stringify(want)})`}`);
};

console.log("── reaching the page ──");
click(link("Gender and Number"));
await tick();
check("heading", txt("h1"), "Gender and Number");
check("starts on an introduction", rendered().includes("New form"), true);
check("intro shows the parse", /masculine|feminine/.test(rendered()), true);
click(btn("Got it"));
await tick();

console.log("\n── the six-cell grid ──");
check("six cells", cellButtons().length, 6);
const labels = cellButtons().map((b) => b.getAttribute("aria-label"));
check("row-major order, gender across", labels.join(" | "),
  "Masculine Singular | Feminine Singular | Masculine Dual | Feminine Dual | Masculine Plural | Feminine Plural");
check("column headers present", /MASCULINE|Masculine/.test(rendered()) && /FEMININE|Feminine/.test(rendered()), true);
check("cells are numbered 1–6", cellButtons().map((b) => b.textContent.trim()[0]).join(""), "123456");

console.log("\n── answering by hotkey ──");
doc.dispatchEvent(new w.KeyboardEvent("keydown", { key: "1", bubbles: true }));
await tick();
check("hotkey 1 answers", /Correct|Not quite/.test(rendered()), true);
check("Next appears", Boolean(btn("Next")), true);
check("the parse is revealed", /masculine|feminine/.test(rendered()), true);
click(btn("Next"));
await tick();
check("Next deals a new question", cellButtons().length, 6);

console.log("\n── answering by click ──");
click(cellButtons()[4]);
await tick();
check("clicking a cell answers", /Correct|Not quite/.test(rendered()), true);
/* Exactly one cell is marked right, unless the form is attested in both genders. */
const marked = cellButtons().filter((b) => !b.disabled);
check("at least one cell stays enabled as the answer", marked.length >= 1, true);
click(btn("Next"));
await tick();

console.log("\n── transliteration hint ──");
const sw = doc.querySelector("input[type=checkbox]");
check("hint switch present", Boolean(sw), true);
check("off by default", sw.checked, false);
sw.click();
await tick();
check("switch turns on", sw.checked, true);
sw.click();
await tick();

console.log("\n── a long run ──");
let answered = 0;
for (let i = 0; i < 90 && answered < 60; i++) {
  /* An unlock drops an introduction in front of the grid; clear it and carry on
     rather than treating the missing grid as a failure. */
  if (btn("Got it")) { click(btn("Got it")); await tick(60); continue; }
  const cells = cellButtons();
  if (!cells.length) break;
  click(cells[Math.floor(Math.random() * cells.length)]);
  await tick(60);
  answered++;
  if (btn("Next")) { click(btn("Next")); await tick(60); }
}
if (btn("Got it")) { click(btn("Got it")); await tick(60); }
check("ran without error", answered >= 60, true);
check("still rendering a question", cellButtons().length, 6);

console.log("\n── persistence and isolation ──");
const slice = JSON.parse(w.localStorage.getItem("hebrew-practice:gender-number") || "null");
check("slice saved", Boolean(slice), true);
check("unlocked persisted", slice?.progress?.unlocked >= 1, true);
check("vocabulary slice untouched by this page", w.localStorage.getItem("hebrew-practice:vocabulary"), null);

console.log("\n── other pages still work ──");
click(link("Vocabulary"));
await tick();
check("vocabulary renders", txt("h1"), "Vocabulary");
click(link("Transliteration"));
await tick();
check("transliteration renders", txt("h1"), "Transliteration");

console.log(`\n${results.filter(Boolean).length}/${results.length} checks passed`);
console.log("runtime errors:", errs.length ? errs.slice(0, 4) : "none");
process.exit(results.every(Boolean) && errs.length === 0 ? 0 : 1);
