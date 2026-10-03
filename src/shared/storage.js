/* Per-feature slices of localStorage.

   Each feature owns a namespace and can't collide with another's keys, so
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
