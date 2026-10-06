/* Drives the "Write the form" mode in the built bundle. */
import { JSDOM, VirtualConsole } from "jsdom";
import fs from "node:fs";
import { RULES, ALL_PROMPTS } from "./src/features/gender-number/rules.js";

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
const tick = (ms = 130) => new Promise((r) => setTimeout(r, ms));
const txt = (sel) => doc.querySelector(sel)?.textContent?.trim() ?? null;
const link = (l) => [...doc.querySelectorAll("a")].find((a) => a.textContent.trim() === l);
const btn = (l) => [...doc.querySelectorAll("button")].find((b) => b.textContent.trim() === l);
const radio = (v) => [...doc.querySelectorAll("input[type=radio]")].find((r) => r.value === v);
const click = (el) => el.dispatchEvent(new w.MouseEvent("click", { bubbles: true, cancelable: true, view: w }));
const field = () => doc.querySelector('input[aria-label="Plural form"]');
const setVal = (el, v) => {
  Object.getOwnPropertyDescriptor(w.HTMLInputElement.prototype, "value").set.call(el, v);
  el.dispatchEvent(new w.Event("input", { bubbles: true }));
};
const enter = (el) => el.dispatchEvent(new w.KeyboardEvent("keydown", { key: "Enter", bubbles: true }));

const results = [];
const check = (name, got, want) => {
  const ok = String(got) === String(want);
  results.push(ok);
  console.log(`${ok ? "pass" : "FAIL"}  ${name}${ok ? "" : `  (got ${JSON.stringify(got)}, want ${JSON.stringify(want)})`}`);
};

/* The prompt is a Hebrew singular; find which entry it is so we can answer. */
const currentPrompt = () => {
  const he = txt(".glyph-word");
  const target = (rendered().match(/Give the (masculine plural|feminine plural|feminine singular)/) ?? [])[1];
  return ALL_PROMPTS.find((p) => p.he === he && p.target === target)
      ?? ALL_PROMPTS.find((p) => p.he === he);
};
const answerCorrectly = async () => {
  const p = currentPrompt();
  setVal(field(), p.answer);
  enter(field());
  await tick();
  const ok = rendered().includes("Correct");
  if (btn("Next")) { click(btn("Next")); await tick(60); }
  return ok;
};

console.log("── reaching the mode ──");
click(link("Gender and Number"));
await tick();
check("page heading", txt("h1"), "Gender and Number");
check("mode toggle present", Boolean(radio("form")), true);
radio("form").click();
await tick();
check("typing field appears", Boolean(field()), true);
check("starts on rule 1", rendered().includes("1. The masculine plural ending"), true);

console.log("\n── a word with a spelling hint ──");
/* גוי is the one word whose correct spelling can't be derived from the rule:
   the ending's yod is not written because the root already ends in one. */
const goy = ALL_PROMPTS.find((p) => p.hint);
/* Cycle with "Show answer" rather than answering correctly: five right answers
   would complete rule 1 and carry us past the word we are looking for. */
let found = false;
for (let i = 0; i < 40 && !found; i++) {
  if (currentPrompt()?.id === goy.id) { found = true; break; }
  click(btn("Show answer"));
  await tick(60);
  click(btn("Next"));
  await tick(60);
}
check("reached the word with a hint", found, true);
check("hint is shown before answering", rendered().includes("don't write a second one"), true);
/* Typing the form you would expect should be diagnosed, not just rejected. */
setVal(field(), goy.errors.find((e) => e.why === "doubleYod").form);
enter(field());
await tick();
check("the expected-but-wrong spelling is caught", rendered().includes("Not quite"), true);
check("and explained", rendered().includes("without its own yod"), true);
click(btn("Next"));
await tick();

console.log("\n── forgiven typos ──");
/* A dropped dagesh and a final/medial mix-up earn the point but are named.
   Cycling with "Show answer" leaves the streak at 0, so the increment below
   is unambiguous. */
const DAGESH = "\u05BC";
const meterNow = () => {
  const m = rendered().match(/(\d+) of (\d+) in a row/);
  return m ? Number(m[1]) : null;
};
const cycleTo = async (want) => {
  for (let i = 0; i < 40; i++) {
    const p = currentPrompt();
    if (p && want(p)) return p;
    if (!btn("Show answer")) return null;
    click(btn("Show answer")); await tick(60);
    click(btn("Next")); await tick(60);
  }
  return null;
};

const dageshPrompt = await cycleTo((p) => p.answer.includes(DAGESH));
check("reached a form with a dagesh", Boolean(dageshPrompt), true);
const streakBefore = meterNow();
check("streak is at zero after revealing", streakBefore, 0);

setVal(field(), dageshPrompt.answer.replaceAll(DAGESH, ""));
enter(field());
await tick();
check("a dropped dagesh still reads Correct", rendered().includes("Correct"), true);
check("it is not marked wrong", rendered().includes("Not quite"), false);
check("the slip is named", rendered().includes("but a missing dagesh"), true);
/* The whole cluster is bolded, not the bare mark — a combining character on
   its own has no base to sit on. */
const slips = [...doc.querySelectorAll(".slip-mark")];
check("the missed cluster is marked", slips.length > 0, true);
check("the mark carries the dagesh", slips.every((n) => n.textContent.includes(DAGESH)), true);
check("the point was given", meterNow(), streakBefore + 1);
click(btn("Next"));
await tick();

/* The other forgiven slip: the wrong shape of a letter. */
const FINALISE = { "\u05DB":"\u05DA", "\u05DE":"\u05DD", "\u05E0":"\u05DF", "\u05E4":"\u05E3", "\u05E6":"\u05E5" };
const shapePrompt = await cycleTo((p) => [...p.answer].some((ch) => FINALISE[ch]));
check("reached a form with a medial letter", Boolean(shapePrompt), true);
if (shapePrompt) {
  const ls = [...shapePrompt.answer];
  for (let i = 0; i < ls.length; i++) if (FINALISE[ls[i]]) { ls[i] = FINALISE[ls[i]]; break; }
  setVal(field(), ls.join(""));
  enter(field());
  await tick();
  check("a final form where the medial belongs reads Correct", rendered().includes("Correct"), true);
  check("and names that slip", rendered().includes("final form where the medial belongs"), true);
  click(btn("Next"));
  await tick();
}

/* A wrong vowel is the thing being drilled and is never waved through. */
const vowelPrompt = await cycleTo((p) => p.answer.includes("\u05B8"));
if (vowelPrompt) {
  setVal(field(), vowelPrompt.answer.replace("\u05B8", "\u05B6"));
  enter(field());
  await tick();
  check("a wrong vowel is still wrong", rendered().includes("Not quite"), true);
  check("and is not forgiven", rendered().includes("Counted as correct"), false);
  click(btn("Next"));
  await tick();
}

console.log("\n── the table of contents ──");
const tocRows = () => [...doc.querySelectorAll(".toc-row")];
check("ten entries", tocRows().length, RULES.length + 1);
check("group headings rendered", rendered().includes("Reduction") && rendered().includes("Contraction"), true);
/* "Where you are" and "how far you've got" are now separate marks. */
check("one entry is highlighted as current", doc.querySelectorAll(".toc-viewing").length, 1);
check("one entry is marked in progress",
  tocRows().filter((r) => r.getAttribute("data-state") === "active").length, 1);
check("later rules are locked", doc.querySelectorAll(".toc-locked").length, RULES.length);

console.log("\n── streak meter ──");
check("pips match rule 1's streak", doc.querySelectorAll(".pip").length, RULES[0].streak);
check("none filled yet", doc.querySelectorAll(".pip-on").length, 0);

console.log("\n── a correct answer ──");
check("answers correctly", await answerCorrectly(), true);
check("one pip filled", doc.querySelectorAll(".pip-on").length, 1);

console.log("\n── a wrong answer resets and diagnoses ──");
const p = currentPrompt();
const wrong = p.errors[0];
setVal(field(), wrong.form);
enter(field());
await tick();
check("marked wrong", rendered().includes("Not quite"), true);
check("diagnosis shown, not just a diff", rendered().includes("ending") || rendered().includes("reduc") || rendered().includes("šewa") || rendered().includes("contract") || rendered().includes("ה is"), true);
check("correct form displayed", rendered().includes(p.answer), true);
click(btn("Next"));
await tick();
check("streak reset to zero", doc.querySelectorAll(".pip-on").length, 0);

console.log("\n── mark order doesn't matter ──");
const p2 = currentPrompt();
const scrambled = [...p2.answer.normalize("NFD")].reverse().reverse().join(""); // same, canonical
setVal(field(), scrambled);
enter(field());
await tick();
check("canonical form accepted", rendered().includes("Correct"), true);
click(btn("Next"));
await tick();

console.log("\n── completing rule 1 unlocks rule 2 ──");
let guard = 0;
while (!rendered().includes("2. The feminine plural ending") && guard < 40) {
  await answerCorrectly();
  guard++;
}
check("advanced to rule 2", rendered().includes("2. The feminine plural ending"), true);
check("rule 1 now ticked", doc.querySelectorAll(".toc-row").length > 0 && rendered().includes("✓"), true);
check("fewer locked rows", doc.querySelectorAll(".toc-locked").length, RULES.length - 1);
check("pips match rule 2", doc.querySelectorAll(".pip").length, RULES[1].streak);

console.log("\n── three states, and getting back to the frontier ──");
const stateOf = (i) => tocRows()[i].getAttribute("data-state");
check("rule 1 reads as done", stateOf(0), "done");
check("rule 2 is the one in progress", stateOf(1), "active");
check("rule 3 is still locked", stateOf(2), "locked");
check("exactly one row is in progress",
  tocRows().filter((r) => r.getAttribute("data-state") === "active").length, 1);

/* Stepping back to a finished rule must not strand the one in progress. */
click(tocRows()[0]);
await tick();
check("returned to rule 1", rendered().includes("1. The masculine plural ending"), true);
check("rule 1 is where we are looking", tocRows()[0].classList.contains("toc-viewing"), true);
check("rule 2 is still marked in progress", stateOf(1), "active");
check("rule 2 is still clickable", tocRows()[1].classList.contains("toc-locked"), false);

/* Revising a finished rule is practice, not progress. */
const doneBefore = JSON.parse(w.localStorage.getItem("hebrew-practice:plural-rules")).progress.done.length;
await answerCorrectly();
await answerCorrectly();
const doneAfter = JSON.parse(w.localStorage.getItem("hebrew-practice:plural-rules")).progress.done.length;
check("answering a finished rule changes nothing", doneAfter, doneBefore);

click(tocRows()[1]);
await tick();
check("can return to the rule in progress", rendered().includes("2. The feminine plural ending"), true);

console.log("\n── reduction rules show the shared procedure ──");
/* Walk to rule 3 the quick way, then confirm the preamble and tooltips. */
let hops = 0;
while (!rendered().includes("3. Two syllables back") && hops < 200) {
  await answerCorrectly();
  hops++;
}
check("reached rule 3", rendered().includes("3. Two syllables back"), true);
/* The preamble is hidden by default so it can't shift the keyboard.
   This used to assert only that the control existed, on the reasoning that a
   Mantine Collapse keeps its content in the DOM either way — which meant the
   test passed for a year while the panel stayed at display:none and never
   actually opened. The text itself is what to assert, both ways. */
const PREAMBLE_LINE = "Exactly one vowel is squeezed out";
const preambleToggle = () => btn("How reduction works") ?? btn("Hide");
check("preamble is behind a disclosure", Boolean(btn("How reduction works")), true);
check("preamble text is absent while closed", rendered().includes(PREAMBLE_LINE), false);
click(preambleToggle());
await tick();
check("expanding swaps the label", Boolean(btn("Hide")), true);
check("preamble text appears once open", rendered().includes(PREAMBLE_LINE), true);
click(preambleToggle());
await tick();
check("collapses again", Boolean(btn("How reduction works")), true);
check("preamble text goes away again", rendered().includes(PREAMBLE_LINE), false);
check("jargon is glossed", doc.querySelectorAll(".glossed").length > 0, true);

console.log("\n── reserved heights keep the keyboard still ──");
/* Only the card footer is reserved. The rule panel is not: it changes only on
   a deliberate pick from the syllabus, and reserving for the tallest rule cost
   enough page height to push the keyboard off a laptop screen. */
check("rule panel present", doc.querySelectorAll(".rule-panel").length, 1);
check("card footer has a reserved block", doc.querySelectorAll(".drill-footer").length, 1);
/* The keyboard must sit outside the column whose contents change. */
const kbd = doc.querySelector(".kbd-key");
const footer = doc.querySelector(".drill-footer");
check("keyboard is not inside the swapping region", footer.contains(kbd), false);

console.log("\n── the syllabus reads as an aside ──");
/* Simulated rather than AppShell.Aside: page content styled as chrome, so it
   stacks on small screens for free and the other mode simply omits it. */
const asideCol = doc.querySelector(".aside-col");
check("syllabus sits in its own region", Boolean(asideCol), true);
check("it holds the table of contents", asideCol.querySelectorAll(".toc-row").length > 0, true);
check("its contents are pinned", Boolean(asideCol.querySelector(".toc-sticky")), true);
check("no real AppShell aside is used", doc.querySelectorAll("[class*=AppShell-aside]").length, 0);
/* The keyboard shares the content column, so the dividing rule runs full height. */
const mainCol = [...doc.querySelectorAll("[class*=Grid-col]")].find((c) => c.querySelector(".kbd-key"));
check("keyboard is in the content column, not below both", Boolean(mainCol), true);
check("keyboard is not inside the aside", asideCol.querySelector(".kbd-key"), null);
check("keyboard can scroll rather than overflow", Boolean(doc.querySelector(".kbd-scroll")), true);

console.log("\n── keyboard: reference, not a giveaway ──");
check("keyboard rendered", doc.querySelectorAll(".kbd-key").length > 0, true);
/* Highlighting the answer's keys here would hand over the vowels. */
check("no key is highlighted", doc.querySelectorAll(".kbd-active").length, 0);
check("every letter is available", doc.querySelectorAll(".kbd-locked").length, 0);
check("points are shown", doc.querySelectorAll(".kbd-niqqud").length > 0, true);

console.log("\n── click to type ──");
const faces = () => [...doc.querySelectorAll(".kbd-face.kbd-hit")];
const chips = () => [...doc.querySelectorAll(".kbd-niqqud.kbd-hit")];
check("letter keys are clickable", faces().length > 0, true);
check("point chips are clickable", chips().length > 0, true);
/* A chip inside a key button would be invalid markup; they must be siblings. */
const anyChip = chips()[0];
check("a chip is not nested inside a key button",
  Boolean(anyChip.closest("button") === anyChip), true);

setVal(field(), "");
await tick(40);
const alef = faces().find((f) => f.textContent.includes("\u05D0"));
click(alef);
await tick(60);
check("clicking a letter types it", field().value, "\u05D0");
click(chips()[0]);
await tick(60);
check("clicking a point appends it", [...field().value].length, 2);
setVal(field(), "");
await tick(40);

console.log("\n── streak durability ──");

/* "N of T in a row", as the meter renders it. */
const meter = () => {
  const m = rendered().match(/(\d+) of (\d+) in a row/);
  return m ? { streak: Number(m[1]), target: Number(m[2]) } : null;
};
const viewing = () => txt(".toc-viewing");
const tocRow = (title) => tocRows().find((r) => r.textContent.includes(title));
const frontierTitle = () =>
  tocRows().find((r) => r.getAttribute("data-state") === "active")?.textContent.trim();
const doneTitle = () =>
  tocRows().find((r) => r.getAttribute("data-state") === "done")?.textContent.trim();

/* Build a partial run on the rule in progress, short of its target. */
const onFrontier = frontierTitle();
check("sitting on the rule in progress", Boolean(onFrontier), true);
let built = 0;
for (let i = 0; i < 3; i++) {
  if (await answerCorrectly()) built++;
  if (frontierTitle() !== onFrontier) break; // completed it; stop short
}
const partial = meter();
check("meter shows a partial run", Boolean(partial) && partial.streak > 0, true);
check("meter counts the answers given", partial?.streak, built);

/* Stepping back to revise a finished rule. */
const finished = doneTitle();
click(tocRow(finished));
await tick();
check("revising a finished rule", viewing(), finished);
check("no meter while revising", meter(), null);
check("and it says why", rendered().includes("Revising — nothing counts here"), true);

/* Answering while revising must not move the run either way. */
await answerCorrectly();
click(tocRow(onFrontier));
await tick();
check("back on the rule in progress", viewing(), onFrontier);
check("revising did not accrue", meter()?.streak, partial.streak);
check("and did not reset the run", meter()?.target, partial.target);

/* Clicking the rule you are already looking at used to zero the streak. */
click(tocRow(onFrontier));
await tick();
check("re-clicking the current rule keeps the run", meter()?.streak, partial.streak);

const stored = () => JSON.parse(w.localStorage.getItem("hebrew-practice:plural-rules") || "null");
check("streak written to storage", stored()?.progress?.streak, partial.streak);

/* A real reload: a second document reading the same storage. */
const reloaded = new JSDOM(`<!doctype html><html><body><div id="root"></div></body></html>`, {
  runScripts: "dangerously", pretendToBeVisual: true, virtualConsole: vc,
  url: "http://localhost/hebrew-practice/",
  beforeParse(win) {
    win.matchMedia = (q) => ({
      matches: false, media: q, onchange: null,
      addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent() { return false; },
    });
    win.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
    win.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} takeRecords() { return []; } };
    for (const k of Object.keys(w.localStorage)) {
      win.localStorage.setItem(k, w.localStorage.getItem(k));
    }
  },
});
{
  const w2 = reloaded.window, doc2 = w2.document;
  const s2 = doc2.createElement("script");
  s2.textContent = fs.readFileSync("dist-test/bundle.js", "utf8");
  doc2.body.appendChild(s2);
  await new Promise((r) => setTimeout(r, 600));
  const rendered2 = () => doc2.getElementById("root").textContent;
  const click2 = (el) => el.dispatchEvent(new w2.MouseEvent("click", { bubbles: true, cancelable: true, view: w2 }));
  click2([...doc2.querySelectorAll("a")].find((a) => a.textContent.trim() === "Gender and Number"));
  await tick();
  [...doc2.querySelectorAll("input[type=radio]")].find((r) => r.value === "form")?.click();
  await tick();
  const m2 = rendered2().match(/(\d+) of (\d+) in a row/);
  check("run survives a reload", m2 && Number(m2[1]), partial.streak);
  check("against the same target", m2 && Number(m2[2]), partial.target);
  check("and resumes on the same rule", rendered2().includes(onFrontier.replace(/\s+/g, " ")), true);
  reloaded.window.close();
}

console.log("\n── finishing a rule is announced ──");
/* The banner is built from the same answer that completes the rule, so it only
   appears if completion is known before the result is assembled. */
let banner = false;
const before = frontierTitle();
for (let i = 0; i < 14 && !banner; i++) {
  const p = currentPrompt();
  setVal(field(), p.answer);
  enter(field());
  await tick();
  if (/—\s*done/.test(rendered())) banner = true;
  if (btn("Next")) { click(btn("Next")); await tick(60); }
  if (!banner && frontierTitle() !== before) break;
}
check("completing a rule shows the done badge", banner, true);
check("the rule in progress moved on", frontierTitle() !== before, true);
check("run restarts at zero on the new rule", meter()?.streak, 0);

console.log("\n── persistence ──");
const slice = JSON.parse(w.localStorage.getItem("hebrew-practice:plural-rules") || "null");
check("slice saved", Boolean(slice), true);
check("completed rules recorded", Array.isArray(slice?.progress?.done) && slice.progress.done.length >= 2, true);

console.log("\n── the other mode still works ──");
radio("identify").click();
await tick();
check("identify mode renders", doc.querySelectorAll("button[aria-label]").length > 0, true);
click(link("Vocabulary"));
await tick();
check("vocabulary renders", txt("h1"), "Vocabulary");

console.log(`\n${results.filter(Boolean).length}/${results.length} checks passed`);
console.log("runtime errors:", errs.length ? errs.slice(0, 4) : "none");
process.exit(results.every(Boolean) && errs.length === 0 ? 0 : 1);
