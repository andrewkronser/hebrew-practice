/* State for the vocabulary trainer.

   Same confidence engine as the transliteration trainer (shared/progression.js),
   with two things of its own: an intro queue, because the rotation starts with
   four words rather than one and each new word is shown with its full sense
   range before it's quizzed; and a cursor per word so the quiz walks through
   that word's senses in order. Both persist, so sense coverage survives a
   reload instead of restarting at the first gloss every session. */

import { useCallback, useEffect, useRef, useState } from "react";
import { WORD_BANK } from "./data.js";
import { buildQuestion, advanceCursor } from "./quiz.js";
import { baseProgress, scoreAnswer, shouldUnlock, pickWeakFrom, activeItems } from "../../shared/progression.js";
import { loadSlice, saveSlice, clearSlice } from "../../shared/storage.js";

const SLICE = "vocabulary";

/** Four words, so a four-option question can be built from the start. */
export const START_UNLOCKED = 4;

const freshProgress = () => ({
  ...baseProgress(START_UNLOCKED),
  introQueue: Array.from({ length: START_UNLOCKED }, (_, i) => i),
  cursors: {},
});

const emptySession = (best = 0) => ({ right: 0, total: 0, streak: 0, best, tape: [] });

export function useVocabulary() {
  const saved = useRef(loadSlice(SLICE)).current;

  const [progress, setProgress] = useState(() => saved?.progress ?? freshProgress());
  const [session, setSession] = useState(() => emptySession(saved?.best ?? 0));
  /* Words switched off by hand. They stop being prompted and stop counting
     toward the unlock gate, but stay available as distractors — they are still
     words you know, which is exactly what makes a good wrong answer. */
  const [disabled, setDisabled] = useState(() => saved?.disabled ?? {});

  /* Transliteration under the prompt. Off by default: it's a crutch, and the
     point of the drill is reading the Hebrew. Always shown in the reveal. */
  const [showTranslit, setShowTranslit] = useState(() => saved?.showTranslit ?? false);

  const [card, setCard] = useState(null);     // { kind: "intro" | "quiz" | "empty", ... }
  const [result, setResult] = useState(null); // { correct, chosen }

  const progressRef = useRef(progress);
  const lastIdRef = useRef(null);
  const startedAt = useRef(Date.now());

  const disabledRef = useRef(disabled);
  useEffect(() => { progressRef.current = progress; }, [progress]);
  useEffect(() => { disabledRef.current = disabled; }, [disabled]);

  const deal = useCallback((fromProgress, fromDisabled) => {
    const p = fromProgress ?? progressRef.current;
    const off = fromDisabled ?? disabledRef.current;
    setResult(null);

    if (p.introQueue?.length) {
      setCard({ kind: "intro", word: WORD_BANK[p.introQueue[0]] });
    } else {
      const pool = activeItems(WORD_BANK, p.unlocked).filter((w) => !off[w.id]);
      const word = pickWeakFrom(pool, p.stats, lastIdRef.current);
      setCard(word
        ? { kind: "quiz", question: buildQuestion(word, p.unlocked, p.cursors) }
        : { kind: "empty" });
    }
    startedAt.current = Date.now();
  }, []);

  useEffect(() => { deal(); }, [deal]);

  useEffect(() => {
    saveSlice(SLICE, { progress, best: session.best, disabled, showTranslit });
  }, [progress, session.best, disabled, showTranslit]);

  /** Dismiss an introduction and move the word into rotation. */
  const acknowledge = useCallback(() => {
    const p = progressRef.current;
    const next = { ...p, introQueue: p.introQueue.slice(1) };
    progressRef.current = next;
    setProgress(next);
    deal(next);
  }, [deal]);

  const answer = useCallback((option) => {
    if (!card || card.kind !== "quiz" || result) return;
    const correct = Boolean(option.correct);
    const ms = Date.now() - startedAt.current;
    const word = card.question.word;

    setResult({ correct, chosen: option });
    lastIdRef.current = word.id;

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
        stats: scoreAnswer(p.stats, word, { correct, ms, hinted: false }),
        cursors: advanceCursor(p.cursors, word),
        since: p.since + 1,
      };
      if (shouldUnlock(next, WORD_BANK, (w) => disabledRef.current[w.id])) {
        next = {
          ...next,
          introQueue: [...next.introQueue, next.unlocked],
          unlocked: next.unlocked + 1,
          since: 0,
        };
      }
      return next;
    });
  }, [card, result]);

  const next = useCallback(() => { if (result) deal(); }, [result, deal]);

  /* Switching a word off mid-question is allowed; the current card stands and
     the change takes effect on the next deal, except when it empties the pool. */
  const toggleWord = useCallback((id) => {
    const updated = { ...disabledRef.current };
    if (updated[id]) delete updated[id]; else updated[id] = true;
    disabledRef.current = updated;
    setDisabled(updated);
    const pool = activeItems(WORD_BANK, progressRef.current.unlocked).filter((w) => !updated[w.id]);
    if (!pool.length || cardRef.current?.kind === "empty") deal(undefined, updated);
  }, [deal]);

  const enableAll = useCallback(() => {
    disabledRef.current = {};
    setDisabled({});
    if (cardRef.current?.kind === "empty") deal(undefined, {});
  }, [deal]);

  const unlockNext = useCallback(() => {
    const p = progressRef.current;
    if (p.unlocked >= WORD_BANK.length) return;
    const updated = {
      ...p,
      introQueue: [...p.introQueue, p.unlocked],
      unlocked: p.unlocked + 1,
      since: 0,
    };
    progressRef.current = updated;
    setProgress(updated);
    deal(updated);
  }, [deal]);

  const cardRef = useRef(card);
  useEffect(() => { cardRef.current = card; }, [card]);

  const resetAll = useCallback(() => {
    clearSlice(SLICE);
    disabledRef.current = {};
    setDisabled({});
    const fresh = freshProgress();
    progressRef.current = fresh;
    setProgress(fresh);
    setSession(emptySession(0));
    lastIdRef.current = null;
    deal(fresh);
  }, [deal]);

  /* Number keys pick an option; Enter moves on. */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Enter") {
        if (result) { e.preventDefault(); deal(); }
        else if (card?.kind === "intro") { e.preventDefault(); acknowledge(); }
        return;
      }
      if (result || card?.kind !== "quiz") return;
      const n = Number(e.key);
      if (Number.isInteger(n) && n >= 1 && n <= card.question.options.length) {
        e.preventDefault();
        answer(card.question.options[n - 1]);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [card, result, answer, deal, acknowledge]);

  return {
    card, result, progress, session, disabled, showTranslit, setShowTranslit,
    answer, next, acknowledge, unlockNext, resetAll, toggleWord, enableAll,
  };
}
