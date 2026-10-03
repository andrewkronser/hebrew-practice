/* State for the keyboard trainer. Same confidence engine as the other two. */

import { useCallback, useEffect, useRef, useState } from "react";
import { CURRICULUM } from "./layout.js";
import { emptyProgress, pickNext, gradeAttempt, shouldUnlock } from "./typing.js";
import { scoreAnswer } from "../../shared/progression.js";
import { loadSlice, saveSlice, clearSlice } from "../../shared/storage.js";

const SLICE = "typing";
const ADVANCE_MS = 550;   // pause on a correct answer before the next prompt

const emptySession = (best = 0) => ({ right: 0, total: 0, streak: 0, best, tape: [] });

export function useTyping() {
  const saved = useRef(loadSlice(SLICE)).current;

  const [progress, setProgress] = useState(() => saved?.progress ?? emptyProgress());
  const [session, setSession] = useState(() => emptySession(saved?.best ?? 0));
  const [card, setCard] = useState(null);
  const [value, setValue] = useState("");
  const [result, setResult] = useState(null);   // { correct, marks }
  const [positionMode, setPositionMode] = useState(false);

  const progressRef = useRef(progress);
  const lastIdRef = useRef(null);
  const startedAt = useRef(Date.now());
  const inputRef = useRef(null);
  const advanceTimer = useRef(null);

  useEffect(() => { progressRef.current = progress; }, [progress]);

  const deal = useCallback((fromProgress) => {
    const p = fromProgress ?? progressRef.current;
    clearTimeout(advanceTimer.current);
    setResult(null);
    setValue("");

    const next = pickNext(p, lastIdRef.current);
    setCard(next);
    if (next.isIntro) {
      const cleared = { ...p, introOf: null };
      progressRef.current = cleared;
      setProgress(cleared);
    }
    startedAt.current = Date.now();
  }, []);

  useEffect(() => { deal(); }, [deal]);
  useEffect(() => { inputRef.current?.focus(); }, [card]);
  useEffect(() => () => clearTimeout(advanceTimer.current), []);

  useEffect(() => {
    saveSlice(SLICE, { progress, best: session.best });
  }, [progress, session.best]);

  const settle = useCallback((correct, marks) => {
    const item = card.item;
    const ms = Date.now() - startedAt.current;
    setResult({ correct, marks });
    lastIdRef.current = item.id;

    if (!card.isIntro) {
      setSession((s) => {
        const streak = correct ? s.streak + 1 : 0;
        return {
          right: s.right + (correct ? 1 : 0),
          total: s.total + 1,
          streak,
          best: Math.max(s.best, streak),
          tape: [...s.tape, correct].slice(-24),
        };
      });
    }

    setProgress((p) => {
      /* A word scores every letter it contains; a single prompt scores itself. */
      const touched = item.word
        ? CURRICULUM.filter((k) => k.idx < p.unlocked && item.letters.includes(k.he))
        : [item];
      let stats = p.stats;
      for (const k of touched) stats = scoreAnswer(stats, k, { correct, ms, hinted: false });

      let next = { ...p, stats, since: p.since + (card.isIntro ? 0 : 1) };
      if (!card.isIntro && shouldUnlock(next)) {
        next = { ...next, introOf: next.unlocked, unlocked: next.unlocked + 1, since: 0 };
      }
      return next;
    });

    if (correct) advanceTimer.current = setTimeout(() => deal(), ADVANCE_MS);
  }, [card, deal]);

  /* Evaluate as soon as the attempt is as long as the target — typing trainers
     shouldn't need a submit key. */
  const change = useCallback((raw) => {
    if (result || !card) return;
    const target = card.item.he;
    setValue(raw);
    if ([...raw].length < [...target].length) return;
    const graded = gradeAttempt(raw, target);
    if (graded.positionMode) setPositionMode(true);
    settle(graded.correct, graded.marks);
  }, [card, result, settle]);

  const next = useCallback(() => { clearTimeout(advanceTimer.current); deal(); }, [deal]);

  const unlockNext = useCallback(() => {
    const p = progressRef.current;
    if (p.unlocked >= CURRICULUM.length) return;
    const updated = { ...p, introOf: p.unlocked, unlocked: p.unlocked + 1, since: 0 };
    progressRef.current = updated;
    setProgress(updated);
    deal(updated);
  }, [deal]);

  const resetAll = useCallback(() => {
    clearSlice(SLICE);
    const fresh = emptyProgress();
    progressRef.current = fresh;
    setProgress(fresh);
    setSession(emptySession(0));
    lastIdRef.current = null;
    deal(fresh);
  }, [deal]);

  /* After a miss, Enter moves on. */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Enter" && result && !result.correct) { e.preventDefault(); deal(); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [result, deal]);

  return {
    card, value, result, progress, session, positionMode,
    inputRef, change, next, unlockNext, resetAll,
  };
}
