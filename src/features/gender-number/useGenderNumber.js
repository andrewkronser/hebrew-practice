/* State for the gender-and-number drill. Same confidence engine as the rest. */

import { useCallback, useEffect, useRef, useState } from "react";
import { FORMS, CELLS } from "./data.js";
import { emptyProgress, pickNext, gradeCell, shouldUnlock } from "./drill.js";
import { scoreAnswer } from "../../shared/progression.js";
import { loadSlice, saveSlice, clearSlice } from "../../shared/storage.js";

const SLICE = "gender-number";
const emptySession = (best = 0) => ({ right: 0, total: 0, streak: 0, best, tape: [] });

export function useGenderNumber() {
  const saved = useRef(loadSlice(SLICE)).current;

  const [progress, setProgress] = useState(() => saved?.progress ?? emptyProgress());
  const [session, setSession] = useState(() => emptySession(saved?.best ?? 0));
  const [showTranslit, setShowTranslit] = useState(() => saved?.showTranslit ?? false);
  const [card, setCard] = useState(null);
  const [result, setResult] = useState(null);   // { correct, chosen }

  const progressRef = useRef(progress);
  const lastIdRef = useRef(null);
  const startedAt = useRef(Date.now());

  useEffect(() => { progressRef.current = progress; }, [progress]);

  const deal = useCallback((fromProgress) => {
    const p = fromProgress ?? progressRef.current;
    setResult(null);
    const next = pickNext(p, lastIdRef.current);
    setCard(next);
    if (next.kind === "intro") {
      const cleared = { ...p, introOf: null };
      progressRef.current = cleared;
      setProgress(cleared);
    }
    startedAt.current = Date.now();
  }, []);

  useEffect(() => { deal(); }, [deal]);

  useEffect(() => {
    saveSlice(SLICE, { progress, best: session.best, showTranslit });
  }, [progress, session.best, showTranslit]);

  const answer = useCallback((cell) => {
    if (!card || card.kind !== "quiz" || result) return;
    const form = card.form;
    const correct = gradeCell(form, cell);
    const ms = Date.now() - startedAt.current;

    setResult({ correct, chosen: cell });
    lastIdRef.current = form.id;

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

    setProgress((p) => {
      let next = {
        ...p,
        stats: scoreAnswer(p.stats, form, { correct, ms, hinted: false }),
        since: p.since + 1,
      };
      if (shouldUnlock(next)) {
        next = { ...next, introOf: next.unlocked, unlocked: next.unlocked + 1, since: 0 };
      }
      return next;
    });
  }, [card, result]);

  const next = useCallback(() => { if (result) deal(); }, [result, deal]);

  const acknowledge = useCallback(() => {
    const p = progressRef.current;
    deal(p);
  }, [deal]);

  const unlockNext = useCallback(() => {
    const p = progressRef.current;
    if (p.unlocked >= FORMS.length) return;
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

  /* 1–6 pick a cell, reading across then down; Enter moves on. */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Enter") {
        if (result) { e.preventDefault(); deal(); }
        else if (card?.kind === "intro") { e.preventDefault(); acknowledge(); }
        return;
      }
      if (result || card?.kind !== "quiz") return;
      const n = Number(e.key);
      if (Number.isInteger(n) && n >= 1 && n <= CELLS.length) {
        e.preventDefault();
        answer(CELLS[n - 1]);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [card, result, answer, deal, acknowledge]);

  return {
    card, result, progress, session, showTranslit, setShowTranslit,
    answer, next, acknowledge, unlockNext, resetAll,
  };
}
