/* Working through the root-finding syllabus.

   The progression lives in shared/syllabus.js; this holds the drill itself —
   which word is up, what is typed into the three cells, and how an answer is
   judged. Roots are unpointed, so grading is a plain comparison of three
   letters, with only the final/medial shape forgiven. */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  LESSONS, syllabus, lessonById, wordsForLesson, judgeRoot, diagnose,
  SHIN, SHIN_DOT, SIN_DOT, baseOfLetter, dotOfLetter,
} from "./lessons.js";
import { isLetter } from "../../shared/hebrewLetters.js";
import { loadSlice, saveSlice, clearSlice } from "../../shared/storage.js";

const SLICE = "root-rules";
const { FREE } = syllabus;

const EMPTY = ["", "", ""];

const isDot = (ch) => ch === SHIN_DOT || ch === SIN_DOT;

/* A cell holds one consonant, plus a ש dot when it has one. Whatever arrives —
   a keystroke, a paste, or macOS's ⌥A, which types the whole שׂ at once — the
   cell keeps the last letter and any dot that came after it. */
function parseCell(value) {
  let base = "", dot = "";
  for (const ch of String(value).normalize("NFD")) {
    if (isLetter(ch)) { base = ch; dot = ""; }
    else if (isDot(ch) && base) dot = ch;
  }
  return { base, dot, text: base ? base + dot : "" };
}

/** Shuffle, but never repeat the previous word when there's an alternative. */
function nextFrom(pool, lastId) {
  if (!pool.length) return null;
  if (pool.length === 1) return pool[0];
  const choices = pool.filter((w) => w.id !== lastId);
  return choices[Math.floor(Math.random() * choices.length)];
}

export function useRootDrill() {
  const saved = useRef(loadSlice(SLICE)).current;

  const [progress, setProgress] = useState(() => syllabus.normalize(saved?.progress));
  const [showMarks, setShowMarks] = useState(() => saved?.showMarks ?? false);
  const [showAffixes, setShowAffixes] = useState(() => saved?.showAffixes ?? false);
  const [word, setWord] = useState(null);
  const [cells, setCells] = useState(EMPTY);
  const [result, setResult] = useState(null);

  const progressRef = useRef(progress);
  const resultRef = useRef(null);
  const lastIdRef = useRef(null);
  const cellRefs = useRef([]);
  const focusRef = useRef(0);

  useEffect(() => { progressRef.current = progress; }, [progress]);

  const showResult = useCallback((r) => { resultRef.current = r; setResult(r); }, []);

  const lesson = useMemo(() => lessonById.get(progress.stepId) ?? null, [progress.stepId]);
  /* Once every lesson is finished there is nothing left to deal here: the
     mixed drill that used to live at the end of the syllabus is its own mode
     now, so this one shows a finished panel instead. */
  const pool = useMemo(
    () => (progress.stepId === FREE ? [] : wordsForLesson(progress.stepId)),
    [progress.stepId]
  );

  const deal = useCallback((fromPool) => {
    resultRef.current = null;
    setResult(null);
    setCells(EMPTY);
    focusRef.current = 0;
    setWord(nextFrom(fromPool ?? pool, lastIdRef.current));
  }, [pool]);

  useEffect(() => {
    /* Don't wipe a verdict that's on screen: finishing a lesson changes the
       pool in the same commit as the result announcing it. */
    if (resultRef.current) return;
    deal();
  }, [deal]);

  useEffect(() => {
    saveSlice(SLICE, { progress, showMarks, showAffixes });
  }, [progress, showMarks, showAffixes]);

  /* Focus the first empty cell whenever a new word is dealt. */
  useEffect(() => {
    if (word) cellRefs.current[0]?.focus();
  }, [word]);

  const commit = useCallback((correct, extra) => {
    const p = progressRef.current;
    const { progress: next, completed } = syllabus.answer(p, correct);
    if (next !== p) {
      progressRef.current = next;
      setProgress(next);
    }
    showResult({ correct, completed, ...extra });
  }, [showResult]);

  const submit = useCallback(() => {
    if (!word) return;
    if (result) { deal(); return; }
    if (cells.some((c) => !c)) return;

    lastIdRef.current = word.id;
    /* Leaving the ש dot off still earns the point, but is named. */
    const verdict = judgeRoot(cells, word);
    const correct = Boolean(verdict);
    commit(correct, {
      typed: [...cells],
      forgiven: verdict?.forgiven ? verdict : null,
      diagnosis: correct ? null : diagnose(cells, word),
    });
  }, [word, result, cells, deal, commit]);

  const reveal = useCallback(() => {
    if (!word || result) return;
    lastIdRef.current = word.id;
    const p = progressRef.current;
    const broken = syllabus.breakStreak(p);
    if (broken !== p) {
      progressRef.current = broken;
      setProgress(broken);
    }
    showResult({ correct: false, revealed: true, typed: [...cells], diagnosis: null });
  }, [word, result, cells, showResult]);

  const next = useCallback(() => { if (result) deal(); }, [result, deal]);

  /* ------------------------------------------------------------- the cells -- */

  /* Hang a dot on the ש it belongs to: the focused cell when that holds a bare
     ש, otherwise the nearest bare ש behind it. Typing ש advances to the next
     cell straight away, so a dot pressed second arrives with the caret already
     moved on — without this it would land nowhere. */
  const applyDot = useCallback((dot) => {
    setCells((prev) => {
      let i = -1;
      const at = focusRef.current;
      if (baseOfLetter(prev[at]) === SHIN && !dotOfLetter(prev[at])) {
        i = at;
      } else {
        for (let k = Math.min(2, at); k >= 0; k--) {
          if (baseOfLetter(prev[k]) === SHIN && !dotOfLetter(prev[k])) { i = k; break; }
        }
      }
      if (i < 0) return prev;
      const out = [...prev];
      out[i] = baseOfLetter(out[i]) + dot;
      return out;
    });
  }, []);

  const setCell = useCallback((i, value) => {
    if (resultRef.current) return;
    const { base, text } = parseCell(value);

    /* A dot on its own is meant for the ש behind the caret, not this cell. */
    if (!base) {
      const dot = [...String(value).normalize("NFD")].filter(isDot).pop();
      if (dot) { applyDot(dot); return; }
    }

    setCells((prev) => {
      const out = [...prev];
      out[i] = text;
      return out;
    });
    if (text && i < 2) {
      focusRef.current = i + 1;
      cellRefs.current[i + 1]?.focus();
    }
  }, [applyDot]);

  const focusCell = useCallback((i) => {
    focusRef.current = i;
    cellRefs.current[i]?.focus();
  }, []);

  /** Backspace on an empty cell steps back rather than doing nothing. */
  const cellKeyDown = useCallback((i, e) => {
    if (e.key === "Backspace" && !cells[i] && i > 0) {
      e.preventDefault();
      setCells((prev) => { const o = [...prev]; o[i - 1] = ""; return o; });
      focusCell(i - 1);
    } else if (e.key === "ArrowRight" && i > 0) {
      e.preventDefault(); focusCell(i - 1);     // RTL: right is the previous cell
    } else if (e.key === "ArrowLeft" && i < 2) {
      e.preventDefault(); focusCell(i + 1);
    } else if (e.key === "Enter") {
      e.preventDefault(); submit();
    }
  }, [cells, focusCell, submit]);

  /** A letter clicked on the reference keyboard lands in the focused cell. */
  const insert = useCallback((ch) => {
    if (resultRef.current) return;
    if (isDot(ch)) { applyDot(ch); return; }
    const i = cells.findIndex((c) => !c);
    const target = cells[focusRef.current] ? (i < 0 ? 2 : i) : focusRef.current;
    setCell(target, ch);
  }, [cells, setCell, applyDot]);

  /* ---------------------------------------------------------- navigation -- */

  const goToLesson = useCallback((stepId) => {
    const p = progressRef.current;
    if (syllabus.stateOf(stepId, p.done) === "locked") return;
    if (p.stepId === stepId) return;
    const updated = { ...p, stepId };   // the streak belongs to the frontier
    progressRef.current = updated;
    setProgress(updated);
    lastIdRef.current = null;
    deal(stepId === FREE ? [] : wordsForLesson(stepId));
  }, [deal]);

  const resetAll = useCallback(() => {
    clearSlice(SLICE);
    const fresh = syllabus.fresh();
    progressRef.current = fresh;
    setProgress(fresh);
    lastIdRef.current = null;
    deal(wordsForLesson(fresh.stepId));
  }, [deal]);

  /* Enter moves on once a verdict is up, for when focus has left the cells.
     A cell's own handler already submits and then advances, and the keydown
     bubbles here too — without this guard a single Enter would submit and deal
     in the same tick, wiping the verdict before it was ever seen. */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "Enter" || !resultRef.current) return;
      if (cellRefs.current.includes(e.target)) return;
      e.preventDefault();
      deal();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [deal]);

  return {
    word, lesson, cells, result, progress,
    showMarks, setShowMarks, showAffixes, setShowAffixes,
    cellRefs, setCell, focusCell, cellKeyDown, insert,
    submit, reveal, next, goToLesson, resetAll,
    ready: cells.every(Boolean),
    isFree: progress.stepId === FREE,
    target: lesson?.streak ?? 0,
    frontier: syllabus.frontierOf(progress.done),
    revising: syllabus.isRevising(progress),
    allDone: progress.done.length >= LESSONS.length,
  };
}
