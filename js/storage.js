/*
  storage.js — the ONLY module allowed to touch localStorage directly.
  Everything the app persists lives under one key, in the shape described
  in README.md § Data model. Every other module reads/writes state through
  the functions exported here.

  Design note: vocabSRS and readingHistory are both "keyed record" maps —
  same shape idea (id -> {interval, easeFactor, dueDate, repetitions,
  lastReviewed, ...}), same accessor pattern. Any new trackable content
  (e.g. future parsing-drill records) should follow this same pattern:
  add a new top-level key to defaultStore(), and a matching
  get<Thing>/set<Thing> or get<Thing>Item/update<Thing>Item pair below,
  rather than inventing a new storage convention.
*/

const STORAGE_KEY = 'koine.v1';

function defaultStore() {
  return {
    settings: {
      theme: 'classic',        // 'classic' | 'lexis' | 'nous'
      mode: 'light',           // 'light' | 'dark'
      pronunciation: 'erasmian', // 'erasmian' | 'koine'
    },
    progress: {
      streak: 0,
      xp: 0,
      unitsCompleted: [],
      lastActiveDate: null,
    },
    vocabSRS: {
      // '<itemId>': { interval, easeFactor, dueDate, repetitions, lastReviewed }
    },
    readingHistory: {
      // '<verseId>': { attempts, lastRating, interval, easeFactor, dueDate, repetitions, lastReviewed }
    },
  };
}

/** Read the whole store, filling in any keys missing from an older version. */
export function readStore() {
  let raw;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch (e) {
    // localStorage unavailable (private browsing, storage disabled, etc.)
    return defaultStore();
  }
  if (!raw) return defaultStore();
  try {
    const parsed = JSON.parse(raw);
    const base = defaultStore();
    return {
      settings: { ...base.settings, ...(parsed.settings || {}) },
      progress: { ...base.progress, ...(parsed.progress || {}) },
      vocabSRS: { ...(parsed.vocabSRS || {}) },
      readingHistory: { ...(parsed.readingHistory || {}) },
    };
  } catch (e) {
    console.warn('koine storage: corrupt data, resetting', e);
    return defaultStore();
  }
}

/** Overwrite the whole store. Prefer the narrower helpers below when possible. */
export function writeStore(store) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (e) {
    console.warn('koine storage: could not persist (storage full or unavailable)', e);
  }
}

// ---------- Settings ----------

export function getSettings() {
  return readStore().settings;
}

export function setSettings(partial) {
  const store = readStore();
  store.settings = { ...store.settings, ...partial };
  writeStore(store);
  return store.settings;
}

// ---------- Progress ----------

export function getProgress() {
  return readStore().progress;
}

export function setProgress(partial) {
  const store = readStore();
  store.progress = { ...store.progress, ...partial };
  writeStore(store);
  return store.progress;
}

export function markUnitCompleted(unitId) {
  const store = readStore();
  if (!store.progress.unitsCompleted.includes(unitId)) {
    store.progress.unitsCompleted.push(unitId);
  }
  writeStore(store);
  return store.progress;
}

// ---------- Vocab SRS ----------

export function getVocabItem(itemId) {
  return readStore().vocabSRS[itemId] || null;
}

export function updateVocabItem(itemId, record) {
  const store = readStore();
  store.vocabSRS[itemId] = { ...(store.vocabSRS[itemId] || {}), ...record };
  writeStore(store);
  return store.vocabSRS[itemId];
}

export function getDueVocabItems(allItemIds, now = new Date()) {
  const store = readStore();
  return allItemIds.filter((id) => {
    const rec = store.vocabSRS[id];
    if (!rec) return true; // never studied = due
    return new Date(rec.dueDate) <= now;
  });
}

// ---------- Reading history ----------

export function getReadingRecord(verseId) {
  return readStore().readingHistory[verseId] || null;
}

export function setReadingRecord(verseId, record) {
  const store = readStore();
  store.readingHistory[verseId] = { ...(store.readingHistory[verseId] || {}), ...record };
  writeStore(store);
  return store.readingHistory[verseId];
}
