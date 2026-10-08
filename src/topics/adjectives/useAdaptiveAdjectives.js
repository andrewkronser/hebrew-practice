/* Reading an adjective: the adaptive half of the topic.
 *
 * Everything is unlocked from the start — there is no order to learn here, only
 * four shapes to tell apart — so the engine's job is purely to lean on whichever
 * you keep misreading. That is why the pacing opens the whole corpus and never
 * steps: `startUnlocked` is the corpus and `maxStep` is zero.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { PHRASES, engine, isCorrectClass } from "./reading.js";
import { baseProgress } from "../../shared/adaptive.js";
import { loadSlice, saveSlice, clearSlice } from "../../shared/storage.js";
import { useTempo } from "../../shared/useTempo.js";

const SLICE = "adjectives-adaptive";

const emptySession = (best = 0) => ({ right: 0, total: 0, streak: 0, best, tape: [] });
const freshProgress = () => baseProgress(PHRASES.length);

export function useAdaptiveAdjectives() {
  const saved = useRef(loadSlice(SLICE)).current;

  const [progress, setProgress] = useState(() => ({
    ...freshProgress(),
    ...(saved?.progress ?? {}),
    unlocked: PHRASES.length,
  }));
  const [session, setSession] = useState(() => emptySession(saved?.best ?? 0));
  const [phrase, setPhrase] = useState(null);
  const [result, setResult] = useState(null);
  const tempo = useTempo(saved?.tempo);

  const progressRef = useRef(progress);
  const lastIdRef = useRef(null);
  const startedAt = useRef(Date.now());

  useEffect(() => { progressRef.current = progress; }, [progress]);

  const deal = useCallback((fromProgress) => {
    const p = fromProgress ?? progressRef.current;
    setResult(null);
    setPhrase(engine.pickWeak(p, lastIdRef.current));
    startedAt.current = Date.now();
  }, []);

  useEffect(() => { deal(); }, [deal]);

  useEffect(() => {
    saveSlice(SLICE, { progress, best: session.best, tempo: tempo.tempo });
  }, [progress, session.best, tempo.tempo]);

  const answer = useCallback((classId) => {
    if (!phrase || result) return;
    const correct = isCorrectClass(phrase, classId);
    const ms = Date.now() - startedAt.current;

    setResult({ correct, chosen: classId });
    lastIdRef.current = phrase.id;

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

    setProgress((p) => ({
      ...p,
      stats: engine.scoreAnswer(p.stats, phrase, { correct, ms, hinted: false, fastMs: tempo.bar() }),
      since: p.since + 1,
    }));
  }, [phrase, result, tempo]);

  const next = useCallback(() => { if (result) deal(); }, [result, deal]);

  const resetAll = useCallback(() => {
    clearSlice(SLICE);
    const fresh = freshProgress();
    progressRef.current = fresh;
    setProgress(fresh);
    setSession(emptySession(0));
    lastIdRef.current = null;
    deal(fresh);
  }, [deal]);

  /* Number keys pick, Enter moves on — the same keyboard the vocabulary
     trainer uses, since the card is the same shape. */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Enter") {
        if (result) { e.preventDefault(); deal(); }
        return;
      }
      if (result || !phrase) return;
      const n = Number(e.key);
      if (Number.isInteger(n) && n >= 1 && n <= 4) {
        e.preventDefault();
        answer(["attributive", "predicate", "substantive", "either"][n - 1]);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [phrase, result, answer, deal]);

  return { phrase, result, progress, session, answer, next, resetAll };
}
