/* Saved progress surviving the rename.

   The reorganisation moved four storage keys, renamed the field that holds your
   place in a guided exercise, renamed the terminal step, and changed what the
   mode selector stores. Someone mid-course has all of that written down. This
   is the only test that can tell us they keep it, so it seeds storage exactly
   as the old version left it and checks what the new one makes of it.

   It asserts the old keys are left alone as well: the migration is additive, so
   rolling the code back strands nobody. */

import { test } from "vitest";
import { migrateStorage } from "../src/shared/storage.js";
import { mount, checker } from "./harness.mjs";

const key = (name) => `hebrew-practice:${name}`;

/* A learner part-way through: two rules of the plural syllabus finished and a
   run of three going on the third, the roots lessons started, the identify
   rotation underway, and both topics last left on their guided exercise. */
const OLD = {
  [key("plural-rules")]: {
    progress: { ruleId: "pro", streak: 3, done: ["mp", "fp"] },
    showTranslit: true,
  },
  [key("root-rules")]: {
    progress: { ruleId: "prefix", streak: 2, done: ["strong"] },
  },
  [key("root-practice")]: { stats: { "strong-0": { s: 0.8, a: 4 } }, best: 9 },
  [key("gender-number")]: { progress: { unlocked: 11, stats: {}, since: 2 }, best: 14 },
  [key("definite-article")]: {
    progress: { ruleId: "free", streak: 0, done: ["plain", "lengthen", "virtual", "segol", "reshape"] },
    showTable: true,
  },
  [key("transliteration")]: {
    progress: { unlocked: 9, stats: {}, since: 1, introOf: null },
    settings: { track: "guided", style: "seow", strict: "forgiving", freeMode: "letters" },
    best: 12,
  },
  [key("gender-number-mode")]: { mode: "form" },
  [key("roots-mode")]: { mode: "learn" },
};

const { w, doc, errs, settle, goTo, rendered, txt, radio } = await mount(OLD);
const { check, results, report } = checker();

const slice = (name) => JSON.parse(w.localStorage.getItem(key(name)) ?? "null");

console.log("── keys move, old ones stay ──");
check("storage module loads", typeof migrateStorage, "function");
check("plural rules moved", Boolean(slice("gender-number-guided")), true);
check("roots lessons moved", Boolean(slice("roots-guided")), true);
check("roots practice moved", Boolean(slice("roots-adaptive")), true);
check("identify drill moved", Boolean(slice("gender-number-adaptive")), true);
check("the old keys are left in place for a rollback",
  [slice("plural-rules"), slice("root-rules")].every(Boolean), true);

console.log("\n── a run in progress survives ──");
const forms = slice("gender-number-guided");
check("the step is kept", forms.progress.stepId, "pro");
check("under the new field name", "ruleId" in forms.progress, false);
check("the streak is kept", forms.progress.streak, 3);
check("the finished rules are kept", forms.progress.done.join(","), "mp,fp");
check("and so is everything else in the slice", forms.showTranslit, true);

const roots = slice("roots-guided");
check("roots keeps its step too", roots.progress.stepId, "prefix");
check("and its run", roots.progress.streak, 2);

console.log("\n── the terminal step is renamed ──");
const article = slice("definite-article");
check("someone sitting on Free Practice lands on Mixed Review", article.progress.stepId, "mixed");
check("their finished rules are untouched", article.progress.done.length, 5);
check("and the rest of the slice survives", article.showTable, true);

console.log("\n── transliteration's track says what it does ──");
const trans = slice("transliteration");
check("the old 'guided' track becomes the curriculum one", trans.settings.track, "curriculum");
check("its other settings are untouched", trans.settings.style, "seow");
check("and so is the rotation", trans.progress.unlocked, 9);

console.log("\n── the mode selector names the shape ──");
check("gender and number was on the written exercise", slice("gender-number-mode").mode, "guided");
check("roots was on the guided one", slice("roots-mode").mode, "guided");

console.log("\n── and the app actually resumes there ──");
await goTo("Gender and Number");
check("opens on the exercise they were using", Boolean(radio("guided")?.checked), true);
check("on the rule they had reached", rendered().includes("3. Two syllables back"), true);
check("with the run they had going", rendered().includes("3 of 8 in a row"), true);

await goTo("The Definite Article");
check("the article opens on Mixed Review", rendered().includes("6. Mixed Review"), true);
check("with nothing locked", doc.querySelectorAll('.toc-row[data-state="locked"]').length, 0);

console.log("\n── running twice changes nothing ──");
/* It runs on every boot, so a second pass over already-migrated data has to be
   a no-op rather than, say, finding no `ruleId` and wiping the step. */
const before = w.localStorage.getItem(key("gender-number-guided"));
const second = await mount(Object.fromEntries(
  Object.keys(w.localStorage).map((k) => [k, w.localStorage.getItem(k)])
));
check("a second run leaves the migrated slice alone",
  second.w.localStorage.getItem(key("gender-number-guided")), before);
check("and does not strand the step", JSON.parse(second.w.localStorage.getItem(key("gender-number-guided"))).progress.stepId, "pro");
second.dom.window.close();

test("saved progress survives the rename", () => report(errs));
