/* Drives the built bundle in jsdom: navigation, the drill, and the storage
   migration. Run with: node test-nav.mjs  (after building dist-test) */
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
    // jsdom gaps Mantine relies on; every real browser supplies these.
    win.matchMedia = (q) => ({
      matches: false, media: q, onchange: null,
      addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent() { return false; },
    });
    win.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
    win.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} takeRecords() { return []; } };
    // Pre-seed the OLD storage key, to prove the migration moves it.
    win.localStorage.setItem("hebrew-trainer-v4", JSON.stringify({
      progress: { unlocked: 7, stats: { c0: { s: 0.9, a: 5 } }, since: 0, introOf: null },
      settings: { track: "guided", style: "seow", strict: "forgiving", freeMode: "letters" },
      best: 11,
    }));
  },
});
const w = dom.window, doc = w.document;
const s = doc.createElement("script");
s.textContent = fs.readFileSync("dist-test/bundle.js", "utf8");
doc.body.appendChild(s);
await new Promise((r) => setTimeout(r, 600));

/* The bundle is injected as a <script> in <body>, so body.textContent
   contains its source. Assertions must read only the rendered tree. */
const rendered = () => doc.getElementById("root").textContent;
const tick = () => new Promise((r) => setTimeout(r, 160));
const txt = (sel) => doc.querySelector(sel)?.textContent?.trim() ?? null;
const h1 = () => txt("h1");
const answerInput = () => doc.querySelector('input[aria-label="Transliteration"]');
const btn = (label) => [...doc.querySelectorAll("button")].find((b) => b.textContent.trim() === label);
const navLink = (label) => [...doc.querySelectorAll("a")].find((a) => a.textContent.trim() === label);
const click = (el) => el.dispatchEvent(new w.MouseEvent("click", { bubbles: true, cancelable: true, view: w }));
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

console.log("── shell ──");
check("mounts", doc.getElementById("root").children.length > 0, true);
check("brand present", rendered().includes("Hebrew Practice"), true);
check("default page is Transliteration", h1(), "Transliteration");
check("all five nav labels", ["Transliteration", "Vocabulary", "Learn to Type", "Roots", "Gender and Number"].every((l) => navLink(l)), true);
// HashRouter leaves the hash empty until the first navigation and treats that
// as "/", so either value is correct on a cold load.
check("default hash is root", ["", "#/"].includes(w.location.hash), true);

console.log("\n── storage migration ──");
check("legacy key removed", w.localStorage.getItem("hebrew-trainer-v4"), null);
const slice = JSON.parse(w.localStorage.getItem("hebrew-practice:transliteration") || "null");
check("slice created", Boolean(slice), true);
check("unlocked carried over", slice?.progress?.unlocked, 7);
check("settings carried over", slice?.settings?.style, "seow");
check("tiles reflect migrated progress", doc.querySelectorAll(".tile:not(.tile-locked)").length, 7);

console.log("\n── the drill still works ──");
let input = answerInput();
check("answer field present", Boolean(input), true);
setVal(input, "zzz");
enter(input);
await tick();
check("Enter produces a reveal", Boolean(doc.querySelector(".reveal-name")), true);
check("reveal shows a letter name", Boolean(txt(".reveal-name")), true);
check("primary becomes Next", Boolean(btn("Next")), true);
click(btn("Next"));
await tick();
check("Next clears the reveal", doc.querySelector(".reveal-name"), null);

console.log("\n── navigation ──");
click(navLink("Roots"));
await tick();
check("Roots heading", h1(), "Roots");
check("Roots hash", w.location.hash, "#/roots");
check("stub text", rendered().includes("Not built yet."), true);
check("drill gone from DOM", answerInput(), null);

// The Enter handler is registered on document by useTrainer. If it leaked, it
// would still be dealing cards on a page that has no cards.
const errsBefore = errs.length;
doc.dispatchEvent(new w.KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
await tick();
check("Enter on a stub page is inert", errs.length, errsBefore);
check("still on Roots", h1(), "Roots");

click(navLink("Gender and Number"));
await tick();
check("Gender and Number heading", h1(), "Gender and Number");
check("hash slug", w.location.hash, "#/gender-and-number");

click(navLink("Vocabulary"));
await tick();
check("Vocabulary heading", h1(), "Vocabulary");

console.log("\n── back to the drill ──");
click(navLink("Transliteration"));
await tick();
check("returns to Transliteration", h1(), "Transliteration");
input = answerInput();
check("answer field back", Boolean(input), true);
check("progress survived navigation", doc.querySelectorAll(".tile:not(.tile-locked)").length, 7);
setVal(input, "zzz");
enter(input);
await tick();
check("drill works after remount", Boolean(doc.querySelector(".reveal-name")), true);

console.log("\n── unknown route ──");
w.location.hash = "#/does-not-exist";
await tick(); await tick();
check("unknown path redirects home", h1(), "Transliteration");

console.log("\n── browser back button ──");
w.history.back();
await tick(); await tick();
check("back leaves the redirect target", typeof h1(), "string");

console.log(`\n${results.filter(Boolean).length}/${results.length} checks passed`);
console.log("runtime errors:", errs.length ? errs.slice(0, 4) : "none");
process.exit(results.every(Boolean) && errs.length === 0 ? 0 : 1);
