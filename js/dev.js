/*
  dev.js — developer testing mode. Unlocked in Settings with a trivial
  password (DEV_PASSWORD); the site is static and the check is client-side,
  so this is a gate against wandering in, not security.

  When on: every lesson is unlocked, a DEV badge shows on every page, session
  screens get a "Skip to end" button, drills show the raw SRS record in
  feedback, and Settings offers Jump to lesson, Seed a sample learner, Make
  everything due, Advance a day, and Reset.
*/
import { getSettings, setSettings, readStore, writeStore, markLessonCompleted } from './storage.js';

export const DEV_PASSWORD = 'Logos';

export function isDev() { return getSettings().dev === true; }

export function enableDev(password) {
  if (String(password || '').trim().toLowerCase() !== DEV_PASSWORD.toLowerCase()) return false;
  setSettings({ dev: true });
  return true;
}

export function disableDev() { setSettings({ dev: false }); }

/** Page hook: shows the badge when dev mode is on. Returns isDev(). */
export function initDev() {
  if (!isDev()) return false;
  if (!document.getElementById('devBadge')) {
    const b = document.createElement('a');
    b.id = 'devBadge'; b.className = 'dev-badge'; b.href = 'settings.html#dev'; b.textContent = 'DEV'; b.title = 'Dev mode is on — progress here is test data';
    document.body.appendChild(b);
  }
  return true;
}

/** Adds a "Skip to end" button to a session screen's header bar. */
export function devSkipButton(onSkip, label = 'Skip to end') {
  if (!isDev()) return null;
  const bar = document.querySelector('.drill-top');
  if (!bar) return null;
  const btn = document.createElement('button');
  btn.type = 'button'; btn.className = 'pill dev-pill'; btn.textContent = label;
  btn.addEventListener('click', onSkip);
  bar.appendChild(btn);
  return btn;
}

const DAY = 24 * 60 * 60 * 1000;
const iso = (d) => new Date(d).toISOString();

/** Every scheduled item (words, endings, verses) becomes due now. */
export function devMakeAllDue() {
  const store = readStore();
  const past = iso(Date.now() - 60 * 1000);
  let n = 0;
  for (const bucket of [store.vocabSRS, store.formSRS, store.readingHistory]) for (const r of Object.values(bucket)) { r.dueDate = past; n++; }
  writeStore(store);
  return n;
}

/** Pretend a day has passed: every due date and the last-active date move one day earlier. */
export function devAdvanceDay() {
  const store = readStore();
  for (const bucket of [store.vocabSRS, store.formSRS, store.readingHistory]) for (const r of Object.values(bucket)) if (r.dueDate) r.dueDate = iso(new Date(r.dueDate).getTime() - DAY);
  if (store.progress.lastActiveDate) {
    const d = new Date(store.progress.lastActiveDate + 'T12:00:00');
    store.progress.lastActiveDate = new Date(d.getTime() - DAY).toISOString().slice(0, 10);
  }
  writeStore(store);
}

/**
 * A plausible mid-course learner: Books I–II complete with their words and
 * endings scheduled (a third of them due now), John 1 read, a 7-day streak.
 */
export async function devSeedSample() {
  const { loadCurriculum, loadUnit, loadParadigms, loadIrregularVerbs } = await import('./data.js');
  const { knownRecords } = await import('./placement.js');
  const [curriculum, paradigms, irregular] = await Promise.all([loadCurriculum(), loadParadigms(), loadIrregularVerbs()]);
  const units = await Promise.all(curriculum.units.filter((u) => u.track === 'grammar').slice(0, 2).map((u) => loadUnit(u.id)));
  const known = knownRecords(units, Object.fromEntries(paradigms.paradigms.map((p) => [p.id, p])), irregular.verbs);
  const store = readStore();
  const now = Date.now();
  let i = 0;
  for (const [id, rec] of Object.entries(known.vocab)) { store.vocabSRS[id] = { ...rec, repetitions: i % 3 === 0 ? 3 : 1, dueDate: iso(now + (i % 3 === 1 ? -DAY : 5 * DAY)), format: 'dev' }; i++; }
  i = 0;
  for (const [id, rec] of Object.entries(known.forms)) { store.formSRS[id] = { ...rec, repetitions: i % 4 === 0 ? 3 : 1, dueDate: iso(now + (i % 3 === 1 ? -DAY : 5 * DAY)) }; i++; }
  for (let v = 1; v <= 18; v++) store.readingHistory[`john-1-${v}`] = { repetitions: 1, easeFactor: 2.5, interval: 6, dueDate: iso(now + (v % 4 === 0 ? -DAY : 4 * DAY)), lastReviewed: iso(now - DAY), attempts: 1, lastRating: v % 3 === 0 ? 'close' : 'nailed', reveals: v % 2 };
  store.progress.streak = 7;
  store.progress.xp = Math.max(store.progress.xp, 1500);
  store.progress.lastActiveDate = new Date().toISOString().slice(0, 10);
  writeStore(store);
  for (const id of known.lessons) markLessonCompleted(id);
  return { lessons: known.lessons.length, words: Object.keys(known.vocab).length, forms: Object.keys(known.forms).length, verses: 18 };
}

/** All lessons as { id, label, href } for the Jump picker. */
export async function devLessonList() {
  const { loadCurriculum } = await import('./data.js');
  const c = await loadCurriculum();
  const out = [];
  for (const u of c.units) for (const l of u.lessons) {
    const hasGrammar = (l.paradigms && l.paradigms.length) || l.irregularCount;
    const href = l.type === 'alphabet' ? `alphabet.html?lesson=${l.id}` : l.type === 'reading' ? `reading.html?lesson=${l.id}` : hasGrammar ? `grammar.html?lesson=${l.id}` : `drill.html?lesson=${l.id}`;
    out.push({ id: l.id, label: `${u.kicker} · ${l.sub}`, href });
  }
  return out;
}
