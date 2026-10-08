/* Working through the adjective syllabus.

   The same shape as the definite article's: a locked sequence with a streak per
   step, the progression itself in shared/guided.js, and only the exercise here.

   One thing is particular to this topic. You are shown the noun in its lexical
   form and asked for the adjective alone, so you have to know the noun would
   take the article without being shown it taking one. The reveal prints the
   whole phrase, which is where that lands. */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { syllabus, lessonById, promptsForLesson, ALL_PROMPTS } from "./lessons.js";
import { judgeAdjective, diagnose } from "./judge.js";
import { canonical } from "../typing/typing.js";
import { loadSlice, saveSlice, clearSlice } from "../../shared/storage.js";

const SLICE = "adjectives-guided";
const { MIXED } = syllabus;

/** Shuffle, but never repeat the previous prompt when there is an alternative.
 *
 *  The first question of a step is the pool's head rather than a random one,
 *  because the head is the phrase the step's own statement just showed you.
 *  Opening a lesson on "the good man" and then being asked about מָקוֹם makes
 *  the statement look like decoration. */
function nextFrom(pool, lastId) {
  if (!pool.length) return null;
  if (lastId === null) return pool[0];
  if (pool.length === 1) return pool[0];
  const choices = pool.filter((p) => p.id !== lastId);
  return choices[Math.floor(Math.random() * choices.length)];
}

export function useGuidedAdjectives() {
  const saved = useRef(loadSlice(SLICE)).current;

  const [progress, setProgress] = useState(() => syllabus.normalize(saved?.progress));
  const [prompt, setPrompt] = useState(null);
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
    () => (progress.stepId === MIXED ? ALL_PROMPTS : promptsForLesson(progress.stepId)),
    [progress.stepId]
  );

  const deal = useCallback((fromPool) => {
    resultRef.current = null;
    setResult(null);
    setValue("");
    setPrompt(nextFrom(fromPool ?? pool, lastIdRef.current));
  }, [pool]);

  useEffect(() => {
    /* Don't wipe a verdict that is on screen — finishing a step changes the
       pool in the same commit as the result announcing it. */
    if (resultRef.current) return;
    deal();
  }, [deal]);

  useEffect(() => { saveSlice(SLICE, { progress }); }, [progress]);
  useEffect(() => { inputRef.current?.focus(); }, [prompt]);

  const submit = useCallback(() => {
    if (!prompt) return;
    if (result) { deal(); return; }
    const typed = value.trim();
    if (!typed) return;

    lastIdRef.current = prompt.id;
    const verdict = judgeAdjective(typed, prompt);
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
      forgiven: verdict?.forgiven ?? null,
      diagnosis: correct ? null : diagnose(typed, prompt),
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
    showResult({ correct: false, revealed: true, typed: "", diagnosis: null });
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

  const goToLesson = useCallback((stepId) => {
    const p = progressRef.current;
    if (!syllabus.canOpen(stepId, p.done)) return;
    if (p.stepId === stepId) return;
    const updated = { ...p, stepId };     // the streak belongs to the frontier
    progressRef.current = updated;
    setProgress(updated);
    lastIdRef.current = null;
    deal(stepId === MIXED ? ALL_PROMPTS : promptsForLesson(stepId));
  }, [deal]);

  const resetAll = useCallback(() => {
    clearSlice(SLICE);
    const fresh = syllabus.fresh();
    progressRef.current = fresh;
    setProgress(fresh);
    lastIdRef.current = null;
    deal(promptsForLesson(fresh.stepId));
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
    prompt, lesson, value, setValue, result, progress,
    inputRef, submit, reveal, next, insert, goToLesson, resetAll,
    isMixed: progress.stepId === MIXED,
    target: lesson?.streak ?? 0,
    frontier: syllabus.frontierOf(progress.done),
    revising: syllabus.isRevising(progress),
    canonical,
  };
}
