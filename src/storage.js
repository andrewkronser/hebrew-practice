/* localStorage, defensively. Private-mode Safari and disabled cookies both
   throw here, and the trainer has to keep working when they do. */

const KEY = "hebrew-trainer-v4";

export function loadSaved() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function save(payload) {
  try {
    localStorage.setItem(KEY, JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
}

export function clearSaved() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* nothing to do */
  }
}
