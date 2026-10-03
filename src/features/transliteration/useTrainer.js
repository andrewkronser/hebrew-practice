/* All of the trainer's state, effects and keyboard wiring.

   This used to live inline in App.jsx. It moved out when the app gained a
   second page: App.jsx is now routing and chrome, and anything that knows about
   cards, scoring or settings belongs to the feature instead. The page component
   that consumes this hook is close to pure markup.

   The pure functions it builds on are in trainer.js, which has no React in it
   at all and can be exercised from a plain Node script. */

import { useCallback, useEffect, useRef, useState } from "react";
import { CURRICULUM } from "./data.js";
import {
  emptyProgress, judge, scoreAnswer, penalizeWord, shouldUnlock,
  pickNext, freePool, shuffled,
} from "./trainer.js";
import { loadSlice, saveSlice, clearSlice } from "../../shared/storage.js";

const SLICE = "transliteration";

const DEFAULT_SETTINGS = {
  track: "guided",
  style: "everyday",
  strict: "forgiving",
  freeMode: "letters",
};
const emptySession = (best = 0) => ({ right: 0, total: 0, streak: 0, best, tape: [] });

export function useTrainer() {
  const saved = useRef(loadSlice(SLICE)).current;

  const [progress, setProgress] = useState(() => saved?.progress ?? emptyProgress());
  const [settings, setSettings] = useState(() => ({ ...DEFAULT_SETTINGS, ...(saved?.settings ?? {}) }));
  const [session, setSession] = useState(() => emptySession(saved?.best ?? 0));

  const [card, setCard] = useState(null);     // { item, isIntro }
  const [result, setResult] = useState(null); // { correct, revealed }
  const [value, setValue] = useState("");
  const [hinted, setHinted] = useState(false);
  const [hintText, setHintText] = useState("");
  const [recent, setRecent] = useState([]);

  const progressRef = useRef(progress);
  const queueRef = useRef([]);
  const lastIdRef = useRef(null);
  const startedAt = useRef(Date.now());
  const inputRef = useRef(null);

  useEffect(() => { progressRef.current = progress; }, [progress]);

  /* ------------------------------------------------------------ dealing -- */

  const deal = useCallback((fromProgress) => {
    const p = fromProgress ?? progressRef.current;
    setResult(null);
    setValue("");
    setHinted(false);
    setHintText("");

    if (settings.track === "free") {
      if (!queueRef.current.length) queueRef.current = shuffled(freePool(settings.freeMode));
      setCard({ item: queueRef.current.shift(), isIntro: false });
    } else {
      const next = pickNext(p, lastIdRef.current);
      setCard(next);
      if (next.isIntro) {
        const cleared = { ...p, introOf: null };
        progressRef.current = cleared;
        setProgress(cleared);
      }
    }
    startedAt.current = Date.now();
  }, [settings.track, settings.freeMode]);

  useEffect(() => { deal(); /* first card, and again whenever the track changes */ }, [deal]);
  useEffect(() => { inputRef.current?.focus(); }, [card]);

  useEffect(() => {
    saveSlice(SLICE, { progress, settings, best: session.best });
  }, [progress, settings, session.best]);

  /* ----------------------------------------------------------- answering -- */

  const finish = useCallback((item, correct, { counted, revealed = false, ms = 0 }) => {
    setResult({ correct, revealed });
    setRecent((r) => (item.word ? r : [item, ...r.filter((x) => x.id !== item.id)].slice(0, 4)));
    lastIdRef.current = item.id;

    if (!counted) return;

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

    if (settings.track !== "guided") return;

    setProgress((p) => {
      const stats = item.word
        ? correct ? p.stats : penalizeWord(p.stats, p.unlocked, item)
        : scoreAnswer(p.stats, item, { correct, ms, hinted });
      let next = { ...p, stats, since: p.since + 1 };
      if (shouldUnlock(next)) {
        next = { ...next, introOf: next.unlocked, unlocked: next.unlocked + 1, since: 0 };
      }
      return next;
    });
  }, [settings.track, hinted]);

  const submit = useCallback(() => {
    if (!card) return;
    if (result) { deal(); return; }
    if (!value.trim()) return;
    const correct = judge(value, card.item, settings);
    finish(card.item, correct, { counted: !card.isIntro, ms: Date.now() - startedAt.current });
  }, [card, result, value, settings, finish, deal]);

  const reveal = useCallback(() => {
    if (!card || result) return;
    finish(card.item, false, { counted: !card.isIntro, revealed: true, ms: 1e6 });
  }, [card, result, finish]);

  const showHint = useCallback(() => {
    if (!card || result || card.isIntro) return;
    setHinted(true);
    const it = card.item;
    const target = settings.style === "seow" ? it.a : it.s;
    setHintText(it.word ? `“${it.g}” — ${target.length} letters, starts with ${target[0]}` : it.n);
  }, [card, result, settings.style]);

  /* Enter submits; Enter again moves on, even if focus has wandered. Scoped to
     this hook, so it unbinds when you navigate to another page — otherwise
     Enter on the Vocabulary page would still be dealing cards. */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "Enter" || !result) return;
      if (e.target === inputRef.current) return; // the input handles its own
      e.preventDefault();
      deal();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [result, deal]);

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

  const unlockNext = useCallback(() => {
    const p = progressRef.current;
    if (p.unlocked >= CURRICULUM.length) return;
    const next = { ...p, introOf: p.unlocked, unlocked: p.unlocked + 1, since: 0 };
    progressRef.current = next;
    setProgress(next);
    deal(next);
  }, [deal]);

  const resetAll = useCallback(() => {
    clearSlice(SLICE);
    const fresh = emptyProgress();
    progressRef.current = fresh;
    setProgress(fresh);
    setSession(emptySession(0));
    setRecent([]);
    lastIdRef.current = null;
    deal(fresh);
  }, [deal]);

  const changeTrack = useCallback((track) => {
    queueRef.current = [];
    setSettings((s) => ({ ...s, track }));
  }, []);
  const changeFreeMode = useCallback((freeMode) => {
    queueRef.current = [];
    setSettings((s) => ({ ...s, freeMode }));
  }, []);
  const changeStyle = useCallback((style) => setSettings((s) => ({ ...s, style })), []);
  const changeStrict = useCallback((strict) => setSettings((s) => ({ ...s, strict })), []);

  return {
    card, result, value, setValue, hintText, recent, progress, session, settings,
    inputRef,
    submit, reveal, showHint, insert, unlockNext, resetAll,
    changeTrack, changeFreeMode, changeStyle, changeStrict,
    guided: settings.track === "guided",
    seow: settings.style === "seow",
  };
}
