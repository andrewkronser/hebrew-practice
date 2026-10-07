/* Mixed practice: every class at once, nothing announced.

   This is the half of the exercise the eight lessons were building toward.
   There, the class is named and the task is applying its rule; here you have to
   decide which rule applies, which is the skill that matters when you meet a
   word in the text.

   No unlocking — the whole bank is live from the first question. What the
   confidence engine is doing is choosing: weighting the draw toward whatever
   you are shakiest on, and feeding the per-class health readout beside the
   drill so you can see where the weakness actually is. */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  PRACTICE_WORDS, CLASSES, judgeRoot, diagnose,
  SHIN, SHIN_DOT, SIN_DOT, baseOfLetter, dotOfLetter,
} from "./lessons.js";
import {
  statOf, scoreAnswer, pickWeakFrom, isMastered, MASTER_TRIES,
} from "../../shared/adaptive.js";
import { isLetter } from "../../shared/hebrewLetters.js";
import { loadSlice, saveSlice, clearSlice } from "../../shared/storage.js";
import { useTempo } from "../../shared/useTempo.js";

const SLICE = "root-practice";
const EMPTY = ["", "", ""];

const isDot = (ch) => ch === SHIN_DOT || ch === SIN_DOT;

function parseCell(value) {
  let base = "", dot = "";
  for (const ch of String(value).normalize("NFD")) {
    if (isLetter(ch)) { base = ch; dot = ""; }
    else if (isDot(ch) && base) dot = ch;
  }
  return { base, text: base ? base + dot : "" };
}

export function useAdaptiveRoots() {
  const saved = useRef(loadSlice(SLICE)).current;

  const [stats, setStats] = useState(() => saved?.stats ?? {});
  const tempo = useTempo(saved?.tempo);
  const [session, setSession] = useState({ right: 0, asked: 0 });
  const [word, setWord] = useState(null);
  const [cells, setCells] = useState(EMPTY);
  const [result, setResult] = useState(null);

  const statsRef = useRef(stats);
  const resultRef = useRef(null);
  const lastIdRef = useRef(null);
  const dealtAt = useRef(Date.now());
  const cellRefs = useRef([]);
  const focusRef = useRef(0);

  useEffect(() => { statsRef.current = stats; }, [stats]);
  useEffect(() => { saveSlice(SLICE, { stats, tempo: tempo.tempo }); }, [stats, tempo.tempo]);

  const deal = useCallback(() => {
    resultRef.current = null;
    setResult(null);
    setCells(EMPTY);
    focusRef.current = 0;
    dealtAt.current = Date.now();
    setWord(pickWeakFrom(PRACTICE_WORDS, statsRef.current, lastIdRef.current));
  }, []);

  useEffect(() => { deal(); }, [deal]);
  useEffect(() => { if (word) cellRefs.current[0]?.focus(); }, [word]);

  const showResult = useCallback((r) => { resultRef.current = r; setResult(r); }, []);

  const settle = useCallback((correct, extra, hinted) => {
    const ms = Date.now() - dealtAt.current;
    /* Revealing the answer is not a response time, so it does not set the bar. */
    if (!hinted) tempo.record(ms);
    const next = scoreAnswer(statsRef.current, word, { correct, ms, hinted, fastMs: tempo.bar() });
    statsRef.current = next;
    setStats(next);
    setSession((s) => ({ right: s.right + (correct ? 1 : 0), asked: s.asked + 1 }));
    showResult({ correct, ...extra });
  }, [word, showResult]);

  const submit = useCallback(() => {
    if (!word) return;
    if (result) { deal(); return; }
    if (cells.some((c) => !c)) return;

    lastIdRef.current = word.id;
    const verdict = judgeRoot(cells, word);
    const correct = Boolean(verdict);
    settle(correct, {
      typed: [...cells],
      forgiven: verdict?.forgiven ? verdict : null,
      diagnosis: correct ? null : diagnose(cells, word),
    }, false);
  }, [word, result, cells, deal, settle]);

  const reveal = useCallback(() => {
    if (!word || result) return;
    lastIdRef.current = word.id;
    settle(false, { revealed: true, typed: [...cells], diagnosis: null }, true);
  }, [word, result, cells, settle]);

  const next = useCallback(() => { if (result) deal(); }, [result, deal]);

  /* ------------------------------------------------------------- the cells -- */

  const applyDot = useCallback((dot) => {
    setCells((prev) => {
      let i = -1;
      const at = focusRef.current;
      if (baseOfLetter(prev[at]) === SHIN && !dotOfLetter(prev[at])) i = at;
      else {
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
    if (!base) {
      const dot = [...String(value).normalize("NFD")].filter(isDot).pop();
      if (dot) { applyDot(dot); return; }
    }
    setCells((prev) => { const out = [...prev]; out[i] = text; return out; });
    if (text && i < 2) {
      focusRef.current = i + 1;
      cellRefs.current[i + 1]?.focus();
    }
  }, [applyDot]);

  const focusCell = useCallback((i) => {
    focusRef.current = i;
    cellRefs.current[i]?.focus();
  }, []);

  const cellKeyDown = useCallback((i, e) => {
    if (e.key === "Backspace" && !cells[i] && i > 0) {
      e.preventDefault();
      setCells((prev) => { const o = [...prev]; o[i - 1] = ""; return o; });
      focusCell(i - 1);
    } else if (e.key === "ArrowRight" && i > 0) {
      e.preventDefault(); focusCell(i - 1);
    } else if (e.key === "ArrowLeft" && i < 2) {
      e.preventDefault(); focusCell(i + 1);
    } else if (e.key === "Enter") {
      e.preventDefault(); submit();
    }
  }, [cells, focusCell, submit]);

  const insert = useCallback((ch) => {
    if (resultRef.current) return;
    if (isDot(ch)) { applyDot(ch); return; }
    const i = cells.findIndex((c) => !c);
    const target = cells[focusRef.current] ? (i < 0 ? 2 : i) : focusRef.current;
    setCell(target, ch);
  }, [cells, setCell, applyDot]);

  const resetAll = useCallback(() => {
    clearSlice(SLICE);
    tempo.reset();
    statsRef.current = {};
    setStats({});
    setSession({ right: 0, asked: 0 });
    lastIdRef.current = null;
    deal();
  }, [deal]);

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

  /* --------------------------------------------------------------- health -- */

  /* One row per class: how much of it is solid, and how far along the rest is.
     `seen` is kept apart from `mean` so an untouched class reads as untouched
     rather than as failing. */
  const health = useMemo(() => CLASSES.map((cls) => {
    const words = PRACTICE_WORDS.filter((w) => w.lesson === cls.id);
    const seen = words.filter((w) => statOf(stats, w.id).a > 0).length;
    const solid = words.filter((w) => isMastered(stats, w)).length;
    const mean = words.length
      ? words.reduce((t, w) => t + statOf(stats, w.id).s, 0) / words.length
      : 0;
    return { id: cls.id, n: cls.n, title: cls.title, group: cls.group, total: words.length, seen, solid, mean };
  }), [stats]);

  return {
    word, cells, result, session, health,
    cellRefs, setCell, focusCell, cellKeyDown, insert,
    submit, reveal, next, resetAll,
    ready: cells.every(Boolean),
    tries: word ? statOf(stats, word.id).a : 0,
    fresh: word ? statOf(stats, word.id).a < MASTER_TRIES : true,
  };
}
