/* Drives the Learn to Type page in the built bundle. */
import { test } from "vitest";
import TypingPage from "../src/topics/typing/TypingPage.jsx";
import { mount, checker } from "./harness.mjs";
import { NIQQUD } from "../src/shared/hebrewKeyboard.js";

const { w, doc, errs, settle, after, rendered, txt, link, radio, click , goTo} = await mount();

/* The bundle lives in a <script> in <body>, so read only the rendered tree. */
const field = () => doc.querySelector('input[aria-label="Type here"]');
const type = (v) => {
  const el = field();
  Object.getOwnPropertyDescriptor(w.HTMLInputElement.prototype, "value").set.call(el, v);
  el.dispatchEvent(new w.Event("input", { bubbles: true }));
};

/* Enter skips the confirmation pause after a correct answer. Waiting the full
   ADVANCE_MS instead — ~200 times across the loops below — was two thirds of
   the entire test suite's runtime. The three places that assert the pause
   itself still wait for real; everything else just moves on. */
const advance = async () => {
  doc.dispatchEvent(new w.KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
  await settle();
};

const { check, results, report } = checker();

/* Imported so Vitest can see what this test covers. The DOM tests drive a
   built bundle read from disk, which the module graph cannot follow, so
   without this `--changed` selects nothing when a component changes and
   reports green having run no tests. Asserting the module loads also catches
   a broken export before the slower DOM walk does. */
check("the typing page module loads", typeof TypingPage, "function");

console.log("── reaching the page ──");
await goTo("Learn to Type");
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
await settle();
check("accepted as correct", rendered().includes("Correct"), true);
check("no position-mode warning", rendered().includes("Typing key positions"), false);
await after(700);
check("auto-advances", rendered().includes("Correct"), false);

/* Enter skips that pause. The handler must cancel the pending auto-advance
   rather than just dealing: deal twice and the prompt it had only just put up
   gets replaced a moment later, so a character silently goes undrilled. */
{
  const g = txt(".glyph") ?? txt(".glyph-word");
  type(g);
  await settle();
  check("Enter: a correct answer shows its verdict", rendered().includes("Correct"), true);
  doc.dispatchEvent(new w.KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
  await settle();
  check("Enter moves on at once", rendered().includes("Correct"), false);
  const dealt = txt(".glyph") ?? txt(".glyph-word");
  await after(700);                       // the cancelled timer's moment passes
  check("and the cancelled auto-advance does not deal again",
    txt(".glyph") ?? txt(".glyph-word"), dealt);
}

console.log("── typing a wrong character ──");
const before = txt(".glyph");
type("ז");
await settle();
check("marked wrong", rendered().includes("Not quite"), true);
check("shows the key to press", rendered().includes("Enter"), true);
check("does not auto-advance", txt(".glyph"), before);
doc.dispatchEvent(new w.KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
await settle();
check("Enter moves on", rendered().includes("Not quite"), false);

console.log("── Latin fallback (no Hebrew input source) ──");
let target = txt(".glyph");
const keyCap = doc.querySelector(".kbd-active")?.textContent.trim().slice(-1);
type(keyCap);
await settle();
check("Latin key accepted at its position", rendered().includes("Correct"), true);
check("position-mode warning appears", rendered().includes("Typing key positions"), true);
const closeBtn = doc.querySelector('[aria-label="Dismiss"]') ?? doc.querySelector(".mantine-Alert-closeButton");
check("warning has a close button", Boolean(closeBtn), true);
click(closeBtn);
await settle();
check("warning dismisses", rendered().includes("Typing key positions"), false);
await after(700);

console.log("── a long run, then unlocking ──");
/* The prompt is a single character early on and a whole word once enough keys
   are unlocked, so this reads either. */
const prompt = () => txt(".glyph") ?? txt(".glyph-word");
let answered = 0;
for (let i = 0; i < 80; i++) {
  if (!field() || doc.querySelector("input[readonly]")) { await settle(); }
  const g = prompt();
  if (!g) break;
  type(g);               // always type the prompt exactly
  await settle();
  answered++;
  await advance();
}
check("ran without error", answered > 60, true);
const unlockedNow = 31 - doc.querySelectorAll(".kbd-locked").length - 4; // 4 punctuation keys
check("unlocked more than one key", unlockedNow > 1, true);
check("still rendering a prompt", Boolean(prompt()), true);

console.log("── reaching the niqqud stage ──");
/* Skip ahead with the unlock control; each unlock shows an intro to clear. */
for (let i = 0; i < 40; i++) {
  if (doc.querySelectorAll(".kbd-niqqud").length) break;
  const unlock = [...doc.querySelectorAll("button")].find((b) => b.textContent.trim() === "Unlock the next one");
  if (!unlock) break;
  click(unlock);
  await settle();
  const g = txt(".glyph") ?? txt(".glyph-word");
  if (g) { type(g); await settle(); await advance(); }
}
check("points appear on their keys", doc.querySelectorAll(".kbd-niqqud").length > 0, true);
check("modifier named", /AltGr|⌥/.test(rendered()), true);
check("unconfirmed points are marked", doc.querySelectorAll(".kbd-niqqud:not(.kbd-seen)").length > 0, true);

/* Keep answering until a point comes up, then confirm the prompt is a real cluster. */
let sawPoint = false, pointPrompt = null;
for (let i = 0; i < 60; i++) {
  const g = txt(".glyph") ?? txt(".glyph-word");
  if (!g) break;
  if (/[\u05B0-\u05C2]/.test(g) && [...g].length === 2) { sawPoint = true; pointPrompt = g; }
  type(g); await settle(); await advance();
  if (sawPoint) break;
}
check("a point was drilled on a cluster", sawPoint, true);
check("cluster is letter + point, never a bare point", pointPrompt && /^[\u05D0-\u05EA][\u05B0-\u05C2]$/.test(pointPrompt), true);

console.log("── the map learns from real keystrokes ──");
/* Keep answering until a point prompt appears, then type it while reporting a physical
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
    await settle();
    const slice = JSON.parse(w.localStorage.getItem("hebrew-practice:typing") || "null");
    const platform = JSON.parse(w.localStorage.getItem("hebrew-practice:settings") || "{}").os;
    const forOs = slice?.learned?.[platform] ?? {};
    learnedOk = forOs[pt]?.cap;
    break;
  }
  type(g); await settle(); await advance();
}
check("a keystroke was recorded for a point", learnedOk, "`");
await after(700);
check("learned key is drawn as confirmed", doc.querySelectorAll(".kbd-niqqud.kbd-seen").length > 0, true);

console.log("── switching platform from the header ──");
/* The control is the shell's now, so whether it exists and persists is tested
   there. What belongs here is that this page answers to it — the modifier a
   point needs is the visible difference, and it only appears once points are
   unlocked, which by here they are.

   Flipped relative to whatever we started on rather than to a fixed value:
   jsdom's navigator reports a non-Mac platform, so detectOs lands on "win" and
   clicking "win" would be a no-op that silently proves nothing. */
const modifier = () => (rendered().includes("AltGr") ? "win" : rendered().includes("⌥") ? "mac" : null);
const started = modifier();
check("a modifier hint is shown at all", Boolean(started), true);
const other = started === "mac" ? "win" : "mac";
radio(other).click();
await settle();
check("the modifier hint follows the platform", modifier(), other);
check("and the exercise carries on", Boolean(txt(".glyph")) || Boolean(txt(".glyph-word")), true);
radio(started).click();
await settle();
check("and switches back", modifier(), started);

console.log("── persistence and isolation ──");
const slice = JSON.parse(w.localStorage.getItem("hebrew-practice:typing") || "null");
check("typing slice saved", Boolean(slice), true);
check("unlocked persisted", slice?.progress?.unlocked > 1, true);
check("the platform is no longer this topic\u2019s to store", "os" in (slice ?? {}), false);
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
    await settle();
  }
  return glyph().includes(dot);
};

const litFaces = () => [...doc.querySelectorAll(".kbd-active")].map((k) => k.textContent.trim());
const os = () => JSON.parse(w.localStorage.getItem("hebrew-practice:settings") || "{}").os;

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
await goTo("Vocabulary");
check("vocabulary renders", txt("h1"), "Vocabulary");
await goTo("Transliteration");
check("transliteration renders", txt("h1"), "Transliteration");

/* One assertion for the run: the per-check detail is in the log above. */
test("the typing trainer", () => report(errs));
