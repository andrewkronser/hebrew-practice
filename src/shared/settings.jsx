import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { loadSlice, saveSlice } from "./storage.js";

/* Preferences that belong to no single topic.
 *
 * What goes in here is deliberately narrow, because a settings bag is the
 * easiest thing in an app to turn into a dumping ground. The rule: a value
 * belongs here only if more than one topic reads it AND it describes the
 * person or their machine rather than their progress.
 *
 * Keyboard platform qualifies on both counts — five of the six topics draw a
 * keyboard, and which modifier types a point is a fact about the machine, not
 * about how far through anything you are.
 *
 * Things that look like settings and are not: transliteration's `style` and
 * `strict` (one topic, and they change what counts as a right answer), and
 * every topic's `showTranslit` toggle (one topic each, and they are per
 * exercise). Those stay in their own slices. If something only one topic reads,
 * it does not come here however much it smells like a preference.
 *
 * Colour scheme is a settings-shaped thing that lives elsewhere: Mantine owns
 * it, stores it itself, and has a provider already. Duplicating it here would
 * mean two sources of truth for one switch.
 */

const SLICE = "settings";

/* Guessed once, for the key hints only — it never affects grading. Lives here
   rather than in the typing trainer now that every keyboard reads it. */
function detectOs() {
  if (typeof navigator === "undefined") return "win";
  const s = `${navigator.platform ?? ""} ${navigator.userAgent ?? ""}`;
  return /Mac|iPhone|iPad/i.test(s) ? "mac" : "win";
}

const OS_VALUES = ["mac", "win"];

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [os, setOsState] = useState(() => {
    const stored = loadSlice(SLICE)?.os;
    return OS_VALUES.includes(stored) ? stored : detectOs();
  });

  useEffect(() => { saveSlice(SLICE, { os }); }, [os]);

  const setOs = useCallback((next) => {
    if (OS_VALUES.includes(next)) setOsState(next);
  }, []);

  const value = useMemo(() => ({ os, setOs }), [os, setOs]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

/* Context rather than a read from storage at render time, which is what the
   keyboard pages used to do. A plain read cannot re-render anything, so with
   the control sitting in the header — on screen at the same time as the
   keyboard it governs — switching platform would have appeared to do nothing
   until you navigated away and back. */
export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used inside a SettingsProvider");
  return ctx;
}

/** Just the platform, for the many places that want only that. */
export const useOs = () => useSettings().os;
