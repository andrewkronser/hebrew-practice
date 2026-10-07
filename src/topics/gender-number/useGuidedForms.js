/* Rule-by-rule plural formation: the guided exercise of Gender and Number.

   The progression lives in shared/guided.js, the same engine the roots lessons
   and the definite article use. This file used to hand-roll its own copy of it
   — the frontier, the states, the streak accounting — which predated the shared
   one and meant "guided" had two implementations that could drift apart.

   A streak resets on any wrong answer, typos included — typing pointed Hebrew
   accurately is part of what this drills, so a slipped consonant is a miss.

   Free Practice is the last entry and has no completion. It is where the lesson
   ends up, not another thing to finish. */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RULES, ALL_PROMPTS, promptsForRule, ERRORS, syllabus } from "./rules.js";
import { canonical } from "../typing/typing.js";
import { forgive } from "./forgive.js";
import { loadSlice, saveSlice, clearSlice } from "../../shared/storage.js";

const SLICE = "gender-number-guided";
const { MIXED } = syllabus;

/* Named re-exports, because the page asks for the rule's state by name. The
   definitions are the shared engine's. */
export const frontierOf = syllabus.frontierOf;
export const ruleState = syllabus.stateOf;

/** Shuffle, but never repeat the previous prompt when there's an alternative. */
function nextFrom(pool, lastId) {
  if (!pool.length) return null;
  if (pool.length === 1) return pool[0];
  const choices = pool.filter((p) => p.id !== lastId);
  return choices[Math.floor(Math.random() * choices.length)];
}

/** Where the two strings first differ, comparing canonically. */
function firstDifference(typed, expected) {
  const a = [...canonical(typed)];
  const b = [...canonical(expected)];
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if (a[i] !== b[i]) return i;
  }
  return -1;
}

export function useGuidedForms() {
  const saved = useRef(loadSlice(SLICE)).current;

  const [progress, setProgress] = useState(() => syllabus.normalize(saved?.progress));
  const [showTranslit, setShowTranslit] = useState(() => saved?.showTranslit ?? false);
  const [prompt, setPrompt] = useState(null);
  const [value, setValue] = useState("");
  const [result, setResult] = useState(null); // { correct, diagnosis, diffAt, completed }

  const progressRef = useRef(progress);
  const lastIdRef = useRef(null);
  const inputRef = useRef(null);
  /* Mirrors `result` synchronously. An effect-based mirror would still be a
     commit behind at the moment it is needed below. */
  const resultRef = useRef(null);

  const showResult = useCallback((r) => { resultRef.current = r; setResult(r); }, []);

  useEffect(() => { progressRef.current = progress; }, [progress]);

  const rule = useMemo(
    () => RULES.find((r) => r.id === progress.stepId) ?? null,
    [progress.stepId]
  );

  const pool = useMemo(
    () => (progress.stepId === MIXED ? ALL_PROMPTS : promptsForRule(progress.stepId)),
    [progress.stepId]
  );

  const deal = useCallback((fromPool) => {
    const list = fromPool ?? pool;
    resultRef.current = null;
    setResult(null);
    setValue("");
    setPrompt(nextFrom(list, lastIdRef.current));
  }, [pool]);

  useEffect(() => {
    /* Re-deal when the pool changes — except while a verdict is on screen.
       Finishing a rule advances the frontier and the pool in the same commit
       that produces the "rule done" result, so dealing here would erase that
       announcement before it was ever painted. Next deals from the new pool. */
    if (resultRef.current) return;
    deal();
  }, [deal]);
  useEffect(() => { inputRef.current?.focus(); }, [prompt]);

  useEffect(() => {
    saveSlice(SLICE, { progress, showTranslit });
  }, [progress, showTranslit]);

  const submit = useCallback(() => {
    if (!prompt) return;
    if (result) { deal(); return; }
    const typed = value.trim();
    if (!typed) return;

    /* A missing dagesh or a final/medial mix-up still earns the point — those
       are keyboard slips, not claims about the rule. They are named in the
       reveal rather than passed over in silence. */
    const verdict = forgive(typed, prompt.answer);
    const correct = Boolean(verdict);
    const forgiven = verdict?.forgiven ? verdict : null;
    lastIdRef.current = prompt.id;

    /* A wrong answer that matches a known error form gets told what the
       mistake was; anything else falls back to where the letters diverge. */
    const signature = correct
      ? null
      : prompt.errors.find((e) => canonical(e.form) === canonical(typed));

    /* Work the progress change out here rather than inside a setProgress
       updater. React runs updaters during a later render, so a variable the
       updater assigned would still be null by the time the result below is
       built — which is why the "rule finished" banner never appeared. */
    const p = progressRef.current;
    const { progress: nextProgress, completed } = syllabus.answer(p, correct);
    if (nextProgress !== p) {
      /* Keep the ref in step immediately, so two submits in one frame can't
         both read the old streak and count as one. */
      progressRef.current = nextProgress;
      setProgress(nextProgress);
    }

    showResult({
      correct,
      forgiven,
      typed,
      diagnosis: signature ? ERRORS[signature.why] : null,
      diffAt: correct ? -1 : firstDifference(typed, prompt.answer),
      completed,
    });
  }, [prompt, result, value, deal, showResult]);

  const reveal = useCallback(() => {
    if (!prompt || result) return;
    lastIdRef.current = prompt.id;
    const p = progressRef.current;
    const broken = syllabus.breakStreak(p);
    if (broken !== p) {
      progressRef.current = broken;
      setProgress(broken);
    }
    showResult({ correct: false, revealed: true, typed: "", diagnosis: null, diffAt: -1 });
  }, [prompt, result, showResult]);

  const next = useCallback(() => { if (result) deal(); }, [result, deal]);

  /** Type a character from the on-screen keyboard, at the caret. */
  const insert = useCallback((ch) => {
    const el = inputRef.current;
    if (!el || result) return;
    const a = el.selectionStart ?? value.length;
    const b = el.selectionEnd ?? a;
    setValue(value.slice(0, a) + ch + value.slice(b));
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(a + ch.length, a + ch.length);
    });
  }, [result, value]);

  /** Jump to any finished rule, or to the one in progress.

     The streak is not touched. It belongs to the frontier rule, which is the
     only one that accrues, so stepping back to revise rule 2 and returning
     must leave your run on rule 5 exactly where it was. Clicking the rule you
     are already on used to reset it to zero. */
  const goToRule = useCallback((ruleId) => {
    const p = progressRef.current;
    if (syllabus.stateOf(ruleId, p.done) === "locked") return;
    if (p.stepId === ruleId) return;
    const updated = { ...p, stepId: ruleId };
    progressRef.current = updated;
    setProgress(updated);
    lastIdRef.current = null;
    deal(ruleId === MIXED ? ALL_PROMPTS : promptsForRule(ruleId));
  }, [deal]);

  const resetAll = useCallback(() => {
    clearSlice(SLICE);
    const fresh = syllabus.fresh();
    progressRef.current = fresh;
    setProgress(fresh);
    lastIdRef.current = null;
    deal(promptsForRule(fresh.stepId));
  }, [deal]);

  /* Enter submits, then moves on. */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "Enter" || !result) return;
      if (e.target === inputRef.current) return;
      e.preventDefault();
      deal();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [result, deal]);

  return {
    prompt, rule, value, setValue, result, progress, showTranslit, setShowTranslit,
    inputRef, submit, reveal, next, insert, goToRule, resetAll,
    isMixed: progress.stepId === MIXED,
    target: rule?.streak ?? 0,
    frontier: frontierOf(progress.done),
    /* Revising something already finished: shown, but nothing accrues. */
    revising: syllabus.isRevising(progress),
  };
}
