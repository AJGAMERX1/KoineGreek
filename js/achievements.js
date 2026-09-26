/*
  achievements.js — the single-player Progress board (no DOM). Everything is
  computed from the local store + curriculum + lexicon; there is no server,
  so there is no leaderboard — only the learner against the text.

  PEDAGOGY M29/M32: achievements reward the behaviours that cause learning
  (words studied and made strong, verses read, endings mastered, Books
  finished, showing up on consecutive days) — never time-on-app.
*/

export function evaluate({ store, curriculum, lexicon }) {
  const p = store.progress;
  const vocab = store.vocabSRS || {};
  const forms = store.formSRS || {};
  const reading = store.readingHistory || {};
  const done = new Set(p.lessonsCompleted || []);
  const studied = Object.keys(vocab).filter((id) => lexicon.byId.has(id));
  const strong = studied.filter((id) => vocab[id].repetitions >= 3);
  const total = lexicon.meta.totalTokens;
  const tokensOf = (ids) => ids.reduce((a, id) => a + lexicon.byId.get(id).count, 0);
  const coreCount = lexicon.items.filter((i) => i.count >= 50).length;
  const coreStudied = studied.filter((id) => lexicon.byId.get(id).count >= 50).length;
  const unitDone = (u) => u.lessons.length > 0 && u.lessons.every((l) => done.has(l.id));

  const list = [];
  const add = (group, id, title, desc, value, target) => list.push({ group, id, title, desc, value, target, unlocked: value >= target, fraction: Math.min(1, value / target) });

  add('Habit', 'first-lesson', 'First steps', 'Complete your first lesson.', done.size, 1);
  [3, 7, 30, 100, 365].forEach((n) => add('Habit', `streak-${n}`, `${n}-day streak`, `Study on ${n} consecutive days.`, p.streak, n));

  [10, 50, 100, 310, 500, 882, 1125].forEach((n) => add('Vocabulary', `words-${n}`, `${n} words`, n === 310 ? 'The core: every word that occurs 50+ times — four fifths of the New Testament.' : n === 882 ? 'Nine tenths of the text.' : `Study ${n} words.`, studied.length, n));
  [50, 310, 882].forEach((n) => add('Vocabulary', `strong-${n}`, `${n} words strong`, `Answer ${n} words correctly three times across spaced sessions.`, strong.length, n));
  add('Vocabulary', 'core-complete', 'Core complete', `All ${coreCount} core words studied.`, coreStudied, coreCount);

  const versesRead = Object.keys(reading).length;
  [1, 10, 100, 500, 1000, 3000, 7927].forEach((n) => add('Reading', `verses-${n}`, n === 7927 ? 'The whole New Testament' : `${n} verse${n > 1 ? 's' : ''}`, n === 7927 ? 'Every verse read and rated.' : `Read and rate ${n} verse${n > 1 ? 's' : ''}.`, versesRead, n));
  const nailed = Object.values(reading).filter((r) => r.lastRating === 'nailed').length;
  const written = Object.values(reading).filter((r) => r.written).length;
  [1, 10, 50, 200].forEach((n) => add('Reading', `written-${n}`, n === 1 ? 'First scribe' : `${n} verses written`, `Copy out and translate ${n} verse${n > 1 ? 's' : ''} by hand.`, written, n));
  [10, 100, 1000].forEach((n) => add('Reading', `nailed-${n}`, `${n} nailed`, `Rate ${n} verses "Nailed it".`, nailed, n));

  const hw = store.handwriting || {};
  const hwKeys = Object.keys(hw);
  const traced = (kind) => hwKeys.filter((k) => k.startsWith(kind + ':')).length;
  add('Handwriting', 'letters-24', 'Every letter by hand', 'Trace all 24 letters of the alphabet.', traced('letter'), 24);
  [10, 100, 310].forEach((n) => add('Handwriting', `words-traced-${n}`, `${n} words traced`, `Trace ${n} different words.`, traced('word'), n));
  [1, 10, 50, 200].forEach((n) => add('Handwriting', `verses-traced-${n}`, n === 1 ? 'First verse by hand' : `${n} verses traced`, `Trace ${n} whole verse${n > 1 ? 's' : ''} in the Write tab.`, traced('verse'), n));

  const formsSeen = Object.keys(forms).length;
  const formsStrong = Object.values(forms).filter((r) => r.repetitions >= 3).length;
  [25, 100, 300, 796].forEach((n) => add('Grammar', `forms-${n}`, `${n} endings`, `Review ${n} paradigm cells or principal parts.`, formsSeen, n));
  [25, 100, 300].forEach((n) => add('Grammar', `forms-strong-${n}`, `${n} endings mastered`, `Answer ${n} endings correctly three times across spaced sessions.`, formsStrong, n));

  for (const u of curriculum.units) {
    const doneCount = u.lessons.filter((l) => done.has(l.id)).length;
    add(u.track === 'grammar' ? 'Path' : 'The New Testament', `unit-${u.id}`, u.track === 'grammar' ? `${u.kicker}: ${u.sub}` : u.sub, u.track === 'grammar' ? `Finish every lesson in ${u.kicker}.` : `Read every chapter of ${u.sub.replace(/^Read /, '')}.`, doneCount, u.lessons.length);
  }

  [100, 1000, 10000, 50000].forEach((n) => add('XP', `xp-${n}`, `${n.toLocaleString()} XP`, 'Earned by due reviews, reading and producing forms.', p.xp, n));

  return {
    achievements: list,
    unlockedCount: list.filter((a) => a.unlocked).length,
    coverage: { known: total ? tokensOf(studied) / total : 0, strong: total ? tokensOf(strong) / total : 0 },
    counts: { studied: studied.length, strong: strong.length, versesRead, formsSeen, formsStrong, lessons: done.size },
    unitsDone: curriculum.units.filter(unitDone).length,
  };
}

export const GROUP_ORDER = ['Habit', 'Vocabulary', 'Reading', 'Handwriting', 'Grammar', 'Path', 'The New Testament', 'XP'];
