/* Per-topic slices of localStorage.

   Each topic owns a namespace and can't collide with another's keys, so
   Vocabulary and Roots can save whatever shape they like without coordinating
   with the transliteration trainer.

   Every access is wrapped: private-mode Safari and blocked site data both throw
   on localStorage, and the app has to keep working when they do. */

const PREFIX = "hebrew-practice";
const keyFor = (namespace) => `${PREFIX}:${namespace}`;

export function loadSlice(namespace) {
  try {
    const raw = localStorage.getItem(keyFor(namespace));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveSlice(namespace, payload) {
  try {
    localStorage.setItem(keyFor(namespace), JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
}

export function clearSlice(namespace) {
  try {
    localStorage.removeItem(keyFor(namespace));
  } catch {
    /* nothing to do */
  }
}

/* ------------------------------------------------------------ migrations -- */

/* Saved progress outlives the names we give things, so every rename that
   reaches storage has to carry the old data forward. These run once, before the
   first render, and are additive: the old key is left in place so rolling the
   code back doesn't strand anyone mid-course. They can be deleted once nobody
   is coming from the old version.

   Three renames land here, all from the same reorganisation: topics naming the
   shape of the exercise they hold, the guided progression calling its position
   `stepId` rather than `ruleId`, and the terminal step becoming Mixed Review. */

const SLICE_MOVES = [
  ["plural-rules", "gender-number-guided"],
  ["gender-number", "gender-number-adaptive"],
  ["root-rules", "roots-guided"],
  ["root-practice", "roots-adaptive"],
];

/** Every guided slice, including the one whose key did not change. */
const GUIDED_SLICES = ["gender-number-guided", "roots-guided", "definite-article"];

/* Which exercise of a two-shape topic you last had open. The values used to
   describe the exercise ("form", "learn"); they now name the shape, so the two
   topics say the same thing. */
const MODE_SLICES = {
  "gender-number-mode": { form: "guided", identify: "adaptive" },
  "roots-mode": { learn: "guided", practice: "adaptive" },
};

const OLD_MIXED_ID = "free";

/* Transliteration's track used to be spelled with the same two words the
   exercise shapes now use, which made "guided" mean two different things. It
   chooses whether the unlock gate applies, so it says that instead. */
const TRACK_VALUES = { guided: "curriculum", free: "everything" };

/** `ruleId` becomes `stepId`, and the terminal step's id becomes "mixed". */
function migrateGuidedProgress(slice) {
  if (!slice || typeof slice !== "object") return slice;
  const p = slice.progress;
  if (!p || typeof p !== "object") return slice;

  const stepId = p.stepId ?? p.ruleId;
  const next = { ...p, stepId: stepId === OLD_MIXED_ID ? "mixed" : stepId };
  delete next.ruleId;
  if (Array.isArray(next.done)) {
    next.done = next.done.map((id) => (id === OLD_MIXED_ID ? "mixed" : id));
  }
  return { ...slice, progress: next };
}

export function migrateStorage() {
  try {
    for (const [from, to] of SLICE_MOVES) {
      const old = localStorage.getItem(keyFor(from));
      if (old && !localStorage.getItem(keyFor(to))) {
        localStorage.setItem(keyFor(to), old);
      }
    }

    for (const name of GUIDED_SLICES) {
      const raw = localStorage.getItem(keyFor(name));
      if (!raw) continue;
      const migrated = migrateGuidedProgress(JSON.parse(raw));
      localStorage.setItem(keyFor(name), JSON.stringify(migrated));
    }

    const raw = localStorage.getItem(keyFor("transliteration"));
    if (raw) {
      const slice = JSON.parse(raw);
      const track = slice?.settings?.track;
      if (track && TRACK_VALUES[track]) {
        localStorage.setItem(keyFor("transliteration"), JSON.stringify({
          ...slice, settings: { ...slice.settings, track: TRACK_VALUES[track] },
        }));
      }
    }

    for (const [name, values] of Object.entries(MODE_SLICES)) {
      const raw = localStorage.getItem(keyFor(name));
      if (!raw) continue;
      const slice = JSON.parse(raw);
      if (slice && values[slice.mode]) {
        localStorage.setItem(keyFor(name), JSON.stringify({ ...slice, mode: values[slice.mode] }));
      }
    }
    return true;
  } catch {
    /* Storage unavailable, or something in it isn't JSON. Either way the app
       starts fresh rather than failing to start. */
    return false;
  }
}

/* The trainer used to save everything under one flat key. Move it into the
   transliteration slice once, so existing progress survives the reorganisation.
   Safe to delete after a release or two. */
const LEGACY_KEY = "hebrew-trainer-v4";

export function migrateLegacyStorage() {
  try {
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (!legacy) return false;
    if (!localStorage.getItem(keyFor("transliteration"))) {
      localStorage.setItem(keyFor("transliteration"), legacy);
    }
    localStorage.removeItem(LEGACY_KEY);
    return true;
  } catch {
    return false;
  }
}
