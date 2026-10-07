/* State for the gender-and-number exercise. Same confidence engine as the rest. */

import { useCallback, useEffect, useRef, useState } from "react";
import { FORMS, CELLS, SEED_SIZE } from "./data.js";
import { emptyProgress, pickForm, gradeCell, shouldUnlock, unlock, scoreAnswer } from "./adaptive.js";
import { loadSlice, saveSlice, clearSlice } from "../../shared/storage.js";
import { useTempo } from "../../shared/useTempo.js";

const SLICE = "gender-number-adaptive";
const emptySession = (best = 0) => ({ right: 0, total: 0, streak: 0, best, tape: [] });

export function useAdaptiveForms() {
  const saved = useRef(loadSlice(SLICE)).current;

  const [progress, setProgress] = useState(() => {
    const stored = saved?.progress;
    if (!stored) return emptyProgress();
    /* Progress saved before the six-cell seed existed, or before this feature
       dropped its introduction cards, can sit below the opening size. */
    const { introOf, ...rest } = stored;
    return { ...rest, unlocked: Math.max(SEED_SIZE, stored.unlocked ?? SEED_SIZE) };
  });
  const [session, setSession] = useState(() => emptySession(saved?.best ?? 0));
  const [showTranslit, setShowTranslit] = useState(() => saved?.showTranslit ?? false);
  const tempo = useTempo(saved?.tempo);
  const [card, setCard] = useState(null);
  const [result, setResult] = useState(null);   // { correct, chosen }

  const progressRef = useRef(progress);
  const lastIdRef = useRef(null);
  const startedAt = useRef(Date.now());

  useEffect(() => { progressRef.current = progress; }, [progress]);

  const deal = useCallback((fromProgress) => {
    const p = fromProgress ?? progressRef.current;
    setResult(null);
    const form = pickForm(p, lastIdRef.current);
    setCard(form ? { kind: "quiz", form } : { kind: "empty" });
    startedAt.current = Date.now();
  }, []);

  useEffect(() => { deal(); }, [deal]);

  useEffect(() => {
    saveSlice(SLICE, { progress, best: session.best, showTranslit, tempo: tempo.tempo });
  }, [progress, session.best, showTranslit, tempo.tempo]);

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

    tempo.record(ms);

    setProgress((p) => {
      let next = {
        ...p,
        stats: scoreAnswer(p.stats, form, { correct, ms, hinted: false, fastMs: tempo.bar() }),
        since: p.since + 1,
      };
      if (shouldUnlock(next)) next = unlock(next);
      return next;
    });
  }, [card, result]);

  const next = useCallback(() => { if (result) deal(); }, [result, deal]);

  const unlockNext = useCallback(() => {
    const p = progressRef.current;
    if (p.unlocked >= FORMS.length) return;
    const updated = unlock(p);
    progressRef.current = updated;
    setProgress(updated);
    deal(updated);
  }, [deal]);

  const resetAll = useCallback(() => {
    tempo.reset();
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
  }, [card, result, answer, deal]);

  return {
    card, result, progress, session, showTranslit, setShowTranslit,
    answer, next, unlockNext, resetAll,
  };
}
