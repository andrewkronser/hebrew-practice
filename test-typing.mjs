/* Drives the Learn to Type page in the built bundle. */
import { JSDOM, VirtualConsole } from "jsdom";
import fs from "node:fs";
import { NIQQUD } from "./src/shared/hebrewKeyboard.js";

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

/* The bundle lives in a <script> in <body>, so read only the rendered tree. */
const rendered = () => doc.getElementById("root").textContent;
const tick = (ms = 140) => new Promise((r) => setTimeout(r, ms));
const txt = (sel) => doc.querySelector(sel)?.textContent?.trim() ?? null;
const link = (label) => [...doc.querySelectorAll("a")].find((a) => a.textContent.trim() === label);
const click = (el) => el.dispatchEvent(new w.MouseEvent("click", { bubbles: true, cancelable: true, view: w }));
const field = () => doc.querySelector('input[aria-label="Type here"]');
const type = (v) => {
  const el = field();
  Object.getOwnPropertyDescriptor(w.HTMLInputElement.prototype, "value").set.call(el, v);
  el.dispatchEvent(new w.Event("input", { bubbles: true }));
};

const results = [];
const check = (name, got, want) => {
  const ok = String(got) === String(want);
  results.push(ok);
  console.log(`${ok ? "pass" : "FAIL"}  ${name}${ok ? "" : `  (got ${JSON.stringify(got)}, want ${JSON.stringify(want)})`}`);
};

console.log("── reaching the page ──");
click(link("Learn to Type"));
await tick();
check("heading", txt("h1"), "Learn to Type");
check("starts with a new-key intro", rendered().includes("New key"), true);
check("prompt glyph present", Boolean(txt(".glyph")), true);
check("typing field present", Boolean(field()), true);

console.log("── keyboard reference ──");
check("full keyboard rendered", doc.querySelectorAll(".kbd-key").length, 47);
check("one key highlighted", doc.querySelectorAll(".kbd-active").length, 1);
check("most keys still locked", doc.querySelectorAll(".kbd-locked").length, 26);
check("no points drawn before any unlock", doc.querySelectorAll(".kbd-niqqud").length, 0);
check("layout named", rendered().includes("SI-1452"), true);

console.log("── first key is kaf on F ──");
check("prompt is כ", txt(".glyph"), "כ");
check("intro names the F key", rendered().includes("F"), true);
check("highlighted key is F", doc.querySelector(".kbd-active")?.textContent.trim(), "כf");

console.log("── typing the Hebrew character ──");
type("כ");
await tick();
check("accepted as correct", rendered().includes("Correct"), true);
check("no position-mode warning", rendered().includes("Typing key positions"), false);
await tick(700);
check("auto-advances", rendered().includes("Correct"), false);

console.log("── typing a wrong character ──");
const before = txt(".glyph");
type("ז");
await tick();
check("marked wrong", rendered().includes("Not quite"), true);
check("shows the key to press", rendered().includes("Enter"), true);
check("does not auto-advance", txt(".glyph"), before);
doc.dispatchEvent(new w.KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
await tick();
check("Enter moves on", rendered().includes("Not quite"), false);

console.log("── Latin fallback (no Hebrew input source) ──");
let target = txt(".glyph");
const keyCap = doc.querySelector(".kbd-active")?.textContent.trim().slice(-1);
type(keyCap);
await tick();
check("Latin key accepted at its position", rendered().includes("Correct"), true);
check("position-mode warning appears", rendered().includes("Typing key positions"), true);
const closeBtn = doc.querySelector('[aria-label="Dismiss"]') ?? doc.querySelector(".mantine-Alert-closeButton");
check("warning has a close button", Boolean(closeBtn), true);
click(closeBtn);
await tick();
check("warning dismisses", rendered().includes("Typing key positions"), false);
await tick(700);

console.log("── a long run, then unlocking ──");
let answered = 0;
for (let i = 0; i < 80; i++) {
  if (!field() || doc.querySelector("input[readonly]")) { await tick(); }
  const g = txt(".glyph");
  if (!g) break;
  type(g);               // always type the prompt exactly
  await tick(60);
  answered++;
  await tick(620);       // let the auto-advance fire
}
check("ran without error", answered > 60, true);
const unlockedNow = 31 - doc.querySelectorAll(".kbd-locked").length - 4; // 4 punctuation keys
check("unlocked more than one key", unlockedNow > 1, true);
check("still rendering a prompt", Boolean(txt(".glyph")), true);

console.log("── reaching the niqqud stage ──");
/* Skip ahead with the unlock control; each unlock shows an intro to clear. */
for (let i = 0; i < 40; i++) {
  if (doc.querySelectorAll(".kbd-niqqud").length) break;
  const unlock = [...doc.querySelectorAll("button")].find((b) => b.textContent.trim() === "Unlock the next one");
  if (!unlock) break;
  click(unlock);
  await tick(80);
  const g = txt(".glyph") ?? txt(".glyph-word");
  if (g) { type(g); await tick(60); await tick(620); }
}
check("points appear on their keys", doc.querySelectorAll(".kbd-niqqud").length > 0, true);
check("modifier named", /AltGr|⌥/.test(rendered()), true);
check("unconfirmed points are marked", doc.querySelectorAll(".kbd-niqqud:not(.kbd-seen)").length > 0, true);

/* Drill until a point comes up, then confirm the prompt is a real cluster. */
let sawPoint = false, pointPrompt = null;
for (let i = 0; i < 60; i++) {
  const g = txt(".glyph") ?? txt(".glyph-word");
  if (!g) break;
  if (/[\u05B0-\u05C2]/.test(g) && [...g].length === 2) { sawPoint = true; pointPrompt = g; }
  type(g); await tick(60); await tick(620);
  if (sawPoint) break;
}
check("a point was drilled on a cluster", sawPoint, true);
check("cluster is letter + point, never a bare point", pointPrompt && /^[\u05D0-\u05EA][\u05B0-\u05C2]$/.test(pointPrompt), true);

console.log("── the map learns from real keystrokes ──");
/* Drill until a point prompt appears, then type it while reporting a physical
   key that disagrees with the published chart. The map should adopt ours. */
let learnedOk = null;
for (let i = 0; i < 80; i++) {
  const g = txt(".glyph") ?? txt(".glyph-word");
  if (!g) break;
  const pt = [...g].find((ch) => /[\u05B0-\u05C2]/.test(ch));
  if (pt) {
    const el = field();
    /* keydown carries the physical key; the input event carries the character. */
    el.dispatchEvent(new w.KeyboardEvent("keydown", { code: "Backquote", bubbles: true }));
    type(g);
    await tick(80);
    const slice = JSON.parse(w.localStorage.getItem("hebrew-practice:typing") || "null");
    const forOs = slice?.learned?.[slice?.os] ?? {};
    learnedOk = forOs[pt]?.cap;
    break;
  }
  type(g); await tick(60); await tick(620);
}
check("a keystroke was recorded for a point", learnedOk, "`");
await tick(700);
check("learned key is drawn as confirmed", doc.querySelectorAll(".kbd-niqqud.kbd-seen").length > 0, true);

console.log("── platform toggle ──");
const seg = (label) => [...doc.querySelectorAll("label")].find((l) => l.textContent.trim() === label);
check("macOS option present", Boolean(seg("macOS")), true);
check("Windows option present", Boolean(seg("Windows")), true);
const radio = (v) => [...doc.querySelectorAll("input[type=radio]")].find((r) => r.value === v);
radio("win")?.click();
await tick();
check("switching platform keeps the drill alive", Boolean(txt(".glyph")) || Boolean(txt(".glyph-word")), true);
radio("mac")?.click();
await tick();

console.log("── persistence and isolation ──");
const slice = JSON.parse(w.localStorage.getItem("hebrew-practice:typing") || "null");
check("typing slice saved", Boolean(slice), true);
check("unlocked persisted", slice?.progress?.unlocked > 1, true);
check("platform persisted", ["mac","win"].includes(slice?.os), true);
check("vocabulary slice independent", w.localStorage.getItem("hebrew-practice:vocabulary"), null);

console.log("── the shin and sin dots ──");
/* The awkward pair: the dots only ever sit on ש, and on macOS their key types
   the whole letter. Unlocking an item shows it as an intro card, so stepping
   the unlock control to each dot puts the cluster on screen without drilling
   through everything in between. */
const SHIN_DOT = "\u05C1", SIN_DOT = "\u05C2", SHIN = "\u05E9", BET = "\u05D1";
const chips = () => [...doc.querySelectorAll(".kbd-niqqud")];
const chipFor = (dot) => chips().find((c) => c.textContent.includes(dot));
const glyph = () => txt(".glyph") ?? txt(".glyph-word") ?? "";
const unlockBtn = () => [...doc.querySelectorAll("button")].find((b) => b.textContent.trim() === "Unlock the next one");

const stepTo = async (dot) => {
  for (let i = 0; i < 40; i++) {
    if (glyph().includes(dot)) return true;
    const u = unlockBtn();
    if (!u) return false;
    click(u);
    await tick(60);
  }
  return glyph().includes(dot);
};

const litFaces = () => [...doc.querySelectorAll(".kbd-active")].map((k) => k.textContent.trim());
const os = () => JSON.parse(w.localStorage.getItem("hebrew-practice:typing") || "{}").os;

for (const [name, dot] of [["shin dot", SHIN_DOT], ["sin dot", SIN_DOT]]) {
  const reached = await stepTo(dot);
  check(`${name}: cluster on screen`, reached, true);
  if (!reached) continue;

  const chip = chipFor(dot);
  check(`${name}: chip on the map`, Boolean(chip), true);
  /* The bug: every chip hung its point on a ב, so these read as a vet with a
     dot — a form that does not occur. */
  check(`${name}: sits on shin`, chip?.textContent.includes(SHIN), true);
  check(`${name}: not on vet`, chip?.textContent.includes(BET), false);

  /* Previously the chip's resting fill matched .kbd-active's background, so a
     lit key swallowed it and the dot being drilled was invisible. */
  check(`${name}: its own chip is highlighted`, chip?.classList.contains("kbd-point-active"), true);
  check(`${name}: its key is ringed`, Boolean(chip?.closest(".kbd-point-wanted")), true);
  /* A cluster may carry a vowel as well as the dot (שָׁ needs qamats too), so
     the lit chips should be exactly the points the prompt contains. */
  const wantedPoints = [...new Set([...glyph()].filter((ch) => NIQQUD.some((n) => n.he === ch)))];
  check(`${name}: every point in the prompt is lit`,
        doc.querySelectorAll(".kbd-niqqud.kbd-point-active").length, wantedPoints.length);

  /* On macOS that one key types ש and the dot together, so ש is not a second
     press and must not be advertised as one. */
  const shinLit = litFaces().some((t) => t.includes(SHIN));
  check(`${name}: shin ${os() === "mac" ? "not " : ""}lit as a separate press`,
        shinLit, os() !== "mac");
}

/* Ordinary points keep the neutral carrier. */
check("a plain vowel still uses vet", chipFor("\u05B7")?.textContent.includes(BET), true);

console.log("── other pages still work ──");
click(link("Vocabulary"));
await tick();
check("vocabulary renders", txt("h1"), "Vocabulary");
click(link("Transliteration"));
await tick();
check("transliteration renders", txt("h1"), "Transliteration");

console.log(`\n${results.filter(Boolean).length}/${results.length} checks passed`);
console.log("runtime errors:", errs.length ? errs.slice(0, 4) : "none");
process.exit(results.every(Boolean) && errs.length === 0 ? 0 : 1);
