/* Shared rig for the tests that drive the built bundle in jsdom.

   Every one of these files used to carry its own copy of the mount, the shims
   and the little DOM helpers — and, more to the point, its own fixed-duration
   sleep. That sleep was 86–94% of the suite's runtime: a flat 130ms after every
   interaction, against a measured settle of 29ms for an answer and 55–140ms for
   a navigation. `settle` replaces it with watching the DOM and returning as
   soon as it stops changing.

   Two kinds of wait, and the difference matters:

     settle()   the default. Returns when React has finished. Use it after
                anything you did — a click, a keystroke, a value change.
     after(ms)  a real wait, for when the app itself has scheduled something
                and no amount of watching will make it happen sooner. The
                typing trainer's auto-advance is the only such case.

   Reaching for `after` where `settle` would do is how the suite got slow, so it
   is worth a second's thought each time. */

import { JSDOM, VirtualConsole } from "jsdom";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PAGE = `<!doctype html><html><body><div id="root"></div></body></html>`;
/* Resolved from this file, not the working directory, so a test can be run
   from anywhere — including by a runner that sets its own cwd. */
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BUNDLE = path.join(ROOT, "dist-test", "bundle.js");

/* How long to let the DOM be quiet before calling it settled.

   React yields between renders, so one quiet turn is not enough. But a turn
   count alone is not enough either, and that is the subtle part: a turn takes
   anywhere from under a millisecond to ~57ms depending on what the event loop
   is doing, so a fixed floor of turns can elapse before React has even begun —
   which looks exactly like "finished". That made the suite pass or fail by
   luck.

   The grace is generous — 600ms — because it is the one case that can be
   wrong in the dangerous direction: returning while React simply has not begun
   looks identical to returning when it has finished, and the test then asserts
   against a stale DOM. Under a parallel run the machine is contended and that
   gap widens, which is how it first showed up. It costs almost nothing, since
   roughly 1% of settles take this path at all.

   So the real condition is that something happened and then stopped, with a
   small wall-clock floor underneath it. The floor is what covers jsdom's own
   asynchrony: a hash navigation dispatches on a macrotask, and when turns are
   sub-millisecond, several can pass before it runs at all. 20ms is about 7s
   across the whole suite and buys determinism; without it the tests passed or
   failed by luck. The grace period is the other escape hatch, for a settle
   with genuinely no work to wait for. */
const QUIET_TURNS = 4, MAX_TURNS = 900, GRACE_MS = 600, FLOOR_MS = 20;

/**
 * Mount the built bundle in a fresh jsdom.
 * @param {((win: Window) => void) | Record<string, unknown>} [seed]
 *        a callback run before the bundle, or a map of localStorage keys to
 *        values (objects are JSON-stringified) for the common case.
 */
export async function mount(seed) {
  const applySeed = typeof seed === "function" ? seed : (win) => {
    for (const [k, v] of Object.entries(seed ?? {})) {
      win.localStorage.setItem(k, typeof v === "string" ? v : JSON.stringify(v));
    }
  };
  const errs = [];
  const vc = new VirtualConsole();
  vc.on("jsdomError", (e) => errs.push("jsdomError: " + (e.message || e)));
  vc.on("error", (...a) => errs.push("console.error: " + a.map(String).join(" ")));

  const dom = new JSDOM(PAGE, {
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
      /* The on-screen keyboard puts the caret back with rAF. jsdom's version
         is tied to its frame clock, which settle has no way to pump, so run it
         on a timer instead. */
      win.requestAnimationFrame = (fn) => win.setTimeout(() => fn(Date.now()), 0);
      applySeed(win);
    },
  });

  const w = dom.window, doc = w.document;
  const script = doc.createElement("script");
  script.textContent = fs.readFileSync(BUNDLE, "utf8");
  doc.body.appendChild(script);

  let mutations = 0;
  new w.MutationObserver(() => { mutations += 1; }).observe(doc.body, {
    subtree: true, childList: true, characterData: true, attributes: true,
  });

  /* Alternating a microtask-ish turn with a 0ms timer, so React work scheduled
     either way gets a chance to land before we decide nothing is happening. */
  const turn = (useTimer) => new Promise((r) => (useTimer ? setTimeout(r, 0) : setImmediate(r)));

  const settle = async () => {
    const started = Date.now();
    let seen = mutations, quiet = 0, sawWork = false;
    for (let i = 0; i < MAX_TURNS; i++) {
      await turn(i % 2 === 1);
      if (mutations === seen) quiet += 1;
      else { quiet = 0; seen = mutations; sawWork = true; }
      const waited = Date.now() - started;
      if (quiet >= QUIET_TURNS && waited >= FLOOR_MS && (sawWork || waited >= GRACE_MS)) return;
    }
  };

  const after = (ms) => new Promise((r) => setTimeout(r, ms));

  /** Wait until a condition holds. For anything the app does asynchronously. */
  const waitFor = async (pred, timeout = 4000) => {
    const started = Date.now();
    while (Date.now() - started < timeout) {
      if (pred()) return true;
      await turn(true);
    }
    return false;
  };

  /* Navigation needs a condition, not quiescence. The router changes the hash
     and jsdom dispatches hashchange on a macrotask, so between the click and
     any re-render there is a gap of nothing happening — which is identical, to
     a DOM watcher, to having finished. Waiting for the heading to actually
     change is the only honest signal. */
  const goTo = async (label) => {
    const heading = () => doc.querySelector("h1")?.textContent ?? null;
    const before = heading();
    const el = [...doc.querySelectorAll("a")].find((a) => a.textContent.trim() === label);
    if (!el) throw new Error(`no nav link labelled ${label}`);
    el.dispatchEvent(new w.MouseEvent("click", { bubbles: true, cancelable: true, view: w }));
    await waitFor(() => heading() !== before);
    await settle();
  };

  // The first paint: the bundle has to parse and React has to mount.
  await settle();

  return {
    dom, w, doc, errs, settle, after, waitFor, goTo,

    /* The bundle is injected as a <script> in <body>, so body.textContent
       contains its source. Assertions must read only the rendered tree. */
    rendered: () => doc.getElementById("root").textContent,
    txt: (sel) => doc.querySelector(sel)?.textContent?.trim() ?? null,
    all: (sel) => [...doc.querySelectorAll(sel)],
    btn: (label) => [...doc.querySelectorAll("button")].find((b) => b.textContent.trim() === label),
    link: (label) => [...doc.querySelectorAll("a")].find((a) => a.textContent.trim() === label),
    radio: (value) => [...doc.querySelectorAll("input[type=radio]")].find((r) => r.value === value),
    tocRows: () => [...doc.querySelectorAll(".toc-row")],
    click: (el) => el.dispatchEvent(new w.MouseEvent("click", { bubbles: true, cancelable: true, view: w })),
    setVal: (el, v) => {
      Object.getOwnPropertyDescriptor(w.HTMLInputElement.prototype, "value").set.call(el, v);
      el.dispatchEvent(new w.Event("input", { bubbles: true }));
    },
    enter: (el) => (el ?? doc).dispatchEvent(new w.KeyboardEvent("keydown", { key: "Enter", bubbles: true })),
    slice: (name) => JSON.parse(w.localStorage.getItem(`hebrew-practice:${name}`) ?? "null"),
  };
}

/** Collects results and reports them the same way in every file.
 *
 *  The body of each test file runs at module scope and logs a line per check,
 *  which is what you read when something breaks. `report` then turns the tally
 *  into one Vitest assertion, naming the checks that failed so the runner's own
 *  summary is useful without scrolling back through the log. */
export function checker() {
  const results = [];
  const failures = [];
  const check = (name, got, want) => {
    const ok = String(got) === String(want);
    results.push(ok);
    if (!ok) failures.push(`${name} (got ${JSON.stringify(got)}, want ${JSON.stringify(want)})`);
    console.log(`${ok ? "pass" : "FAIL"}  ${name}${ok ? "" : `  (got ${JSON.stringify(got)}, want ${JSON.stringify(want)})`}`);
  };

  /** Throws with everything that went wrong, or returns the tally. */
  const report = (errs = []) => {
    const passed = results.filter(Boolean).length;
    console.log(`\n${passed}/${results.length} checks passed`);
    console.log("runtime errors:", errs.length ? errs.slice(0, 4) : "none");
    const problems = [
      ...failures.map((f) => `  FAIL  ${f}`),
      ...errs.slice(0, 4).map((e) => `  ERROR ${e}`),
    ];
    if (problems.length) {
      throw new Error(`${failures.length} of ${results.length} checks failed\n${problems.join("\n")}`);
    }
    return { passed, total: results.length };
  };

  return { check, results, failures, report };
}
