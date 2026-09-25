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
      translation: 'web',        // reference translation in Read & Translate: 'web' | 'kjv' | 'ylt'
      sfx: true,                 // answer sound cues (right / wrong / done)
      autoSpeak: true,           // speak new words / verses automatically (speaker buttons always work)
      speechRate: 0.7,           // 0.5 (slow) … 1.1 (natural); Greek is read slower than the voice's default
      showProgress: false,       // Progress (achievements) tab in the bottom nav is opt-in
      lastRead: null,            // { book, chapter } — where the Read tab reopens
    },
    progress: {
      streak: 0,
      xp: 0,
      unitsCompleted: [],      // unit ids (data/curriculum.json)
      lessonsCompleted: [],    // lesson ids (e.g. "u01-alphabet-1"); lesson-path state derives from this
      lastActiveDate: null,
      achievements: {},        // achievement id -> ISO date first seen unlocked (Progress tab)
    },
    vocabSRS: {
      // '<itemId>': { interval, easeFactor, dueDate, repetitions, lastReviewed }
    },
    readingHistory: {
      // '<verseId>': { attempts, lastRating, interval, easeFactor, dueDate, repetitions, lastReviewed }
    },
    formSRS: {
      // endings / principal parts as SRS objects (PEDAGOGY M21). Keys:
      //   '<paradigmId>|<parseCode>'  e.g. 'pres-act|3PAI-S--'
      //   'irr|<lemma>|<partIndex>'   e.g. 'irr|λέγω|2' (aorist active)
      // Same SM-2 record shape as vocabSRS.
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
      progress: { ...base.progress, ...(parsed.progress || {}), achievements: { ...((parsed.progress || {}).achievements || {}) } },
      vocabSRS: { ...(parsed.vocabSRS || {}) },
      readingHistory: { ...(parsed.readingHistory || {}) },
      formSRS: { ...(parsed.formSRS || {}) },
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

// ---------- Backup / restore / reset (Settings screen) ----------

/** The whole store as a JSON string, for the learner to download. */
export function exportStore() {
  return JSON.stringify({ app: 'koine', version: 1, exportedAt: new Date().toISOString(), store: readStore() }, null, 2);
}

/**
 * Replace the store from a previously exported JSON string. Validates the
 * shape loosely (top-level keys present) and normalizes through readStore's
 * merge-with-defaults so partial or older exports still load.
 */
export function importStore(json) {
  const parsed = JSON.parse(json);
  const store = parsed && parsed.app === 'koine' ? parsed.store : parsed;
  if (!store || typeof store !== 'object' || !store.settings || !store.progress) {
    throw new Error('Not a Rhema backup file');
  }
  writeStore({
    settings: { ...defaultStore().settings, ...store.settings },
    progress: { ...defaultStore().progress, ...store.progress },
    vocabSRS: { ...(store.vocabSRS || {}) },
    readingHistory: { ...(store.readingHistory || {}) },
    formSRS: { ...(store.formSRS || {}) },
  });
  return readStore();
}

/** Wipe all progress and reviews but keep settings (theme, pronunciation, translation). */
export function resetProgress() {
  const store = readStore();
  const fresh = defaultStore();
  fresh.settings = store.settings;
  writeStore(fresh);
  return fresh;
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

/**
 * Count today as a study day (PEDAGOGY M31: only called when real due/new work
 * was actually completed). Extends the streak if yesterday was active,
 * restarts it otherwise, and is idempotent within a day.
 */
export function recordActivity(now = new Date()) {
  const store = readStore();
  const today = isoDay(now);
  const last = store.progress.lastActiveDate;
  if (last !== today) {
    const yesterday = isoDay(new Date(now.getTime() - 24 * 60 * 60 * 1000));
    store.progress.streak = last === yesterday ? store.progress.streak + 1 : 1;
    store.progress.lastActiveDate = today;
    writeStore(store);
  }
  return store.progress;
}

function isoDay(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function addXp(amount) {
  const store = readStore();
  store.progress.xp += amount;
  writeStore(store);
  return store.progress;
}

/** Record first-unlock dates for achievements (called by the Progress tab after evaluating). */
export function recordAchievements(ids, now = new Date()) {
  const store = readStore();
  let changed = false;
  for (const id of ids) {
    if (!store.progress.achievements[id]) { store.progress.achievements[id] = now.toISOString().slice(0, 10); changed = true; }
  }
  if (changed) writeStore(store);
  return store.progress.achievements;
}

export function markLessonCompleted(lessonId) {
  const store = readStore();
  if (!store.progress.lessonsCompleted.includes(lessonId)) {
    store.progress.lessonsCompleted.push(lessonId);
  }
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

/** Every vocab record ever scheduled, keyed by item id (== lemma). */
export function getAllVocabRecords() {
  return readStore().vocabSRS;
}

export function getDueVocabItems(allItemIds, now = new Date()) {
  const store = readStore();
  return allItemIds.filter((id) => {
    const rec = store.vocabSRS[id];
    if (!rec) return true; // never studied = due
    return new Date(rec.dueDate) <= now;
  });
}

// ---------- Form SRS (paradigm cells, principal parts) ----------

export function getFormRecord(formId) {
  return readStore().formSRS[formId] || null;
}

export function updateFormRecord(formId, record) {
  const store = readStore();
  store.formSRS[formId] = { ...(store.formSRS[formId] || {}), ...record };
  writeStore(store);
  return store.formSRS[formId];
}

export function getAllFormRecords() {
  return readStore().formSRS;
}

export function getDueFormIds(now = new Date()) {
  return Object.entries(readStore().formSRS)
    .filter(([, r]) => !r.dueDate || new Date(r.dueDate) <= now)
    .map(([id]) => id);
}

// ---------- Reading history ----------

export function getDueVerseIds(now = new Date()) {
  return Object.entries(readStore().readingHistory)
    .filter(([, r]) => r.dueDate && new Date(r.dueDate) <= now)
    .sort((a, b) => new Date(a[1].dueDate) - new Date(b[1].dueDate))
    .map(([id]) => id);
}

export function getReadingRecord(verseId) {
  return readStore().readingHistory[verseId] || null;
}

export function setReadingRecord(verseId, record) {
  const store = readStore();
  store.readingHistory[verseId] = { ...(store.readingHistory[verseId] || {}), ...record };
  writeStore(store);
  return store.readingHistory[verseId];
}
