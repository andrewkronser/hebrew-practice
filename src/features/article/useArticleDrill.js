/* Working through the definite-article syllabus.

   Same shape as the plural rules: a locked sequence with a streak per rule,
   ending in Free Practice where everything mixes. The progression itself lives
   in shared/syllabus.js; this holds the drill. */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  LESSONS, syllabus, lessonById, wordsForLesson, ALL_WORDS, judgeArticle, diagnose,
} from "./lessons.js";
import { canonical } from "../typing/typing.js";
import { loadSlice, saveSlice, clearSlice } from "../../shared/storage.js";

const SLICE = "definite-article";
const { FREE } = syllabus;

/** Shuffle, but never repeat the previous word when there's an alternative. */
function nextFrom(pool, lastId) {
  if (!pool.length) return null;
  if (pool.length === 1) return pool[0];
  const choices = pool.filter((w) => w.id !== lastId);
  return choices[Math.floor(Math.random() * choices.length)];
}

/** Where the two forms first differ, comparing canonically. */
function firstDifference(typed, expected) {
  const a = [...canonical(typed)], b = [...canonical(expected)];
  for (let i = 0; i < Math.max(a.length, b.length); i++) if (a[i] !== b[i]) return i;
  return -1;
}

export function useArticleDrill() {
  const saved = useRef(loadSlice(SLICE)).current;

  const [progress, setProgress] = useState(() => syllabus.normalize(saved?.progress));
  const [showTable, setShowTable] = useState(() => saved?.showTable ?? false);
  const [word, setWord] = useState(null);
  const [value, setValue] = useState("");
  const [result, setResult] = useState(null);

  const progressRef = useRef(progress);
  const resultRef = useRef(null);
  const lastIdRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { progressRef.current = progress; }, [progress]);
  const showResult = useCallback((r) => { resultRef.current = r; setResult(r); }, []);

  const lesson = useMemo(() => lessonById.get(progress.stepId) ?? null, [progress.stepId]);
  const pool = useMemo(
    () => (progress.stepId === FREE ? ALL_WORDS : wordsForLesson(progress.stepId)),
    [progress.stepId]
  );

  const deal = useCallback((fromPool) => {
    resultRef.current = null;
    setResult(null);
    setValue("");
    setWord(nextFrom(fromPool ?? pool, lastIdRef.current));
  }, [pool]);

  useEffect(() => {
    /* Don't wipe a verdict that's on screen — finishing a rule changes the pool
       in the same commit as the result announcing it. */
    if (resultRef.current) return;
    deal();
  }, [deal]);

  useEffect(() => { saveSlice(SLICE, { progress, showTable }); }, [progress, showTable]);
  useEffect(() => { inputRef.current?.focus(); }, [word]);

  const submit = useCallback(() => {
    if (!word) return;
    if (result) { deal(); return; }
    const typed = value.trim();
    if (!typed) return;

    lastIdRef.current = word.id;
    const verdict = judgeArticle(typed, word);
    const correct = Boolean(verdict);

    const p = progressRef.current;
    const { progress: nextProgress, completed } = syllabus.answer(p, correct);
    if (nextProgress !== p) {
      progressRef.current = nextProgress;
      setProgress(nextProgress);
    }
    showResult({
      correct,
      completed,
      typed,
      forgiven: verdict?.forgiven ? verdict : null,
      diagnosis: correct ? null : diagnose(typed, word),
      diffAt: correct ? -1 : firstDifference(typed, word.def),
    });
  }, [word, result, value, deal, showResult]);

  const reveal = useCallback(() => {
    if (!word || result) return;
    lastIdRef.current = word.id;
    const p = progressRef.current;
    const broken = syllabus.breakStreak(p);
    if (broken !== p) {
      progressRef.current = broken;
      setProgress(broken);
    }
    showResult({ correct: false, revealed: true, typed: "", diagnosis: null, diffAt: -1 });
  }, [word, result, showResult]);

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

  const goToLesson = useCallback((stepId) => {
    const p = progressRef.current;
    if (syllabus.stateOf(stepId, p.done) === "locked") return;
    if (p.stepId === stepId) return;
    const updated = { ...p, stepId };     // the streak belongs to the frontier
    progressRef.current = updated;
    setProgress(updated);
    lastIdRef.current = null;
    deal(stepId === FREE ? ALL_WORDS : wordsForLesson(stepId));
  }, [deal]);

  const resetAll = useCallback(() => {
    clearSlice(SLICE);
    const fresh = syllabus.fresh();
    progressRef.current = fresh;
    setProgress(fresh);
    lastIdRef.current = null;
    deal(wordsForLesson(fresh.stepId));
  }, [deal]);

  /* Enter moves on once a verdict is up, for when focus has left the field. */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "Enter" || !resultRef.current) return;
      if (e.target === inputRef.current) return;
      e.preventDefault();
      deal();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [deal]);

  return {
    word, lesson, value, setValue, result, progress, showTable, setShowTable,
    inputRef, submit, reveal, next, insert, goToLesson, resetAll,
    isFree: progress.stepId === FREE,
    target: lesson?.streak ?? 0,
    frontier: syllabus.frontierOf(progress.done),
    revising: syllabus.isRevising(progress),
  };
}
