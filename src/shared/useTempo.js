import { useCallback, useRef, useState } from "react";
import { freshTempo, normalizeTempo, observeTempo, fastBar } from "./tempo.js";

/* Per-trainer response-time baseline, for the "was this recall?" bar.
   See tempo.js for why it is a quantile of your own times rather than a
   constant, and why one number is enough.

   Each drill keeps its own: typing a transliterated letter, reading a pointed
   word and picking among four glosses, and working three radicals out of a noun
   have very different floors just to read the prompt, and one bar across all of
   them measures the prompt rather than the learner.

   An answer is scored against the bar as it stood *before* that answer, so a
   question never moves its own threshold. */

export function useTempo(saved) {
  const [tempo, setTempo] = useState(() => normalizeTempo(saved));
  const tempoRef = useRef(tempo);
  const barRef = useRef(fastBar(tempo));

  /** The bar to score the answer in hand against. */
  const bar = useCallback(() => barRef.current, []);

  /** Fold a response time in. Callers leave out hinted and revealed answers:
   *  those measure reading something you were given, not recalling it. */
  const record = useCallback((ms) => {
    const next = observeTempo(tempoRef.current, ms);
    if (next === tempoRef.current) return;
    tempoRef.current = next;
    barRef.current = fastBar(next);
    setTempo(next);
  }, []);

  const reset = useCallback(() => {
    const fresh = freshTempo();
    tempoRef.current = fresh;
    barRef.current = fastBar(fresh);
    setTempo(fresh);
  }, []);

  return { tempo, bar, record, reset };
}
