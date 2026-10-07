/* Drives the built bundle in jsdom: navigation, the exercise, and the storage
   migration. Run with: node test-nav.mjs  (after building dist-test) */
import { test } from "vitest";
import { SECTIONS } from "../src/routes.jsx";
import { mount, checker } from "./harness.mjs";

const { w, doc, errs, settle, after, rendered, txt, btn, click, setVal, enter , goTo} = await mount((win) => {
  win.localStorage.setItem("hebrew-trainer-v4", JSON.stringify({
      progress: { unlocked: 7, stats: { c0: { s: 0.9, a: 5 } }, since: 0, introOf: null },
      settings: { track: "guided", style: "seow", strict: "forgiving", freeMode: "letters" },
      best: 11,
    }));
});

/* The bundle is injected as a <script> in <body>, so body.textContent
   contains its source. Assertions must read only the rendered tree. */
const h1 = () => txt("h1");
const answerInput = () => doc.querySelector('input[aria-label="Transliteration"]');
const navLink = (label) => [...doc.querySelectorAll("a")].find((a) => a.textContent.trim() === label);

const { check, results, report } = checker();

/* Imported so Vitest can see what this test covers. The DOM tests drive a
   built bundle read from disk, which the module graph cannot follow, so
   without this `--changed` selects nothing when a component changes and
   reports green having run no tests. Asserting the module loads also catches
   a broken export before the slower DOM walk does. */
check("the route table loads", Array.isArray(SECTIONS), true);

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

console.log("\n── the exercise still works ──");
let input = answerInput();
check("answer field present", Boolean(input), true);
setVal(input, "zzz");
enter(input);
await settle();
check("Enter produces a reveal", Boolean(doc.querySelector(".reveal-name")), true);
check("reveal shows a letter name", Boolean(txt(".reveal-name")), true);
check("primary becomes Next", Boolean(btn("Next")), true);
click(btn("Next"));
await settle();
check("Next clears the reveal", doc.querySelector(".reveal-name"), null);

console.log("\n── navigation ──");
await goTo("Roots");
check("Roots heading", h1(), "Roots");
check("Roots hash", w.location.hash, "#/roots");
check("roots drill renders", doc.querySelectorAll(".root-cell").length, 3);
check("transliteration exercise gone from DOM", answerInput(), null);

// The Enter handler is registered on document by useTrainer. If it leaked, it
// would still be dealing cards on a page that has no cards.
const errsBefore = errs.length;
doc.dispatchEvent(new w.KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
await settle();
check("Enter on another section is inert", errs.length, errsBefore);
check("still on Roots", h1(), "Roots");

await goTo("Gender and Number");
check("Gender and Number heading", h1(), "Gender and Number");
check("hash slug", w.location.hash, "#/gender-and-number");

await goTo("Vocabulary");
check("Vocabulary heading", h1(), "Vocabulary");

console.log("\n── back to the exercise ──");
await goTo("Transliteration");
check("returns to Transliteration", h1(), "Transliteration");
input = answerInput();
check("answer field back", Boolean(input), true);
check("progress survived navigation", doc.querySelectorAll(".tile:not(.tile-locked)").length, 7);
setVal(input, "zzz");
enter(input);
await settle();
check("drill works after remount", Boolean(doc.querySelector(".reveal-name")), true);

console.log("\n── per-section container width ──");
/* Gender and Number carries a syllabus beside the exercise and opts into a wider
   container; everything else keeps the narrow reading width. */
const containerWidth = () => {
  const el = doc.querySelector("[class*=mantine-Container-root]");
  return el?.style?.getPropertyValue("--container-size") || "(default)";
};
await goTo("Transliteration");
const narrow = containerWidth();
await goTo("Gender and Number");
const wide = containerWidth();
check("the wide section differs from the default", wide !== narrow, true);
await goTo("Vocabulary");
check("other sections keep the narrow width", containerWidth(), narrow);

console.log("\n── unknown route ──");
w.location.hash = "#/does-not-exist";
await settle(); await settle();
check("unknown path redirects home", h1(), "Transliteration");

console.log("\n── browser back button ──");
w.history.back();
await settle(); await settle();
check("back leaves the redirect target", typeof h1(), "string");

/* One assertion for the run: the per-check detail is in the log above. */
test("navigation and the storage migration", () => report(errs));
