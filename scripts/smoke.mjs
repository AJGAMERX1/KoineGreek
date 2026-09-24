/*
  smoke.mjs — data cross-reference checks + logic-module smoke test over EVERY lesson.
  Run:  node scripts/smoke.mjs
  Exits non-zero on the first class of failure. No browser needed.
*/
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => JSON.parse(readFileSync(path.join(ROOT, p), 'utf8'));
const fail = [];
const check = (cond, msg) => { if (!cond) fail.push(msg); };

const curriculum = read('data/curriculum.json');
const lexicon = read('data/lexicon.json');
const lexById = new Map(lexicon.items.map((i) => [i.id, i]));
const forms = read('data/forms.json').forms;
const paradigms = read('data/paradigms.json').paradigms;
const paradigmsById = Object.fromEntries(paradigms.map((p) => [p.id, p]));
const irregular = read('data/irregular-verbs.json').verbs;
const alphabet = read('data/alphabet.json');
const books = {};
for (const f of readdirSync(path.join(ROOT, 'data/gnt'))) books[f.replace('.json', '')] = read(`data/gnt/${f}`);

// ---- data cross-references ----
const lessonIds = new Set();
let lessonCount = 0;
for (const u of curriculum.units) {
  const unit = read(`data/units/${u.id}.json`);
  check(unit.lessons.length === u.lessons.length, `${u.id}: index/unit lesson count mismatch`);
  for (const l of unit.lessons) {
    lessonCount++;
    check(!lessonIds.has(l.id), `duplicate lesson id ${l.id}`); lessonIds.add(l.id);
    check(['alphabet', 'vocab', 'grammar', 'verb', 'reading'].includes(l.type), `${l.id}: bad type ${l.type}`);
    for (const v of l.vocab) check(lexById.has(v.id), `${l.id}: vocab ${v.id} not in lexicon`);
    for (const p of l.paradigms) check(paradigmsById[p], `${l.id}: paradigm ${p} missing`);
    for (const ir of l.irregular || []) check(irregular.some((v) => v.lemma === ir), `${l.id}: irregular verb ${ir} missing`);
    if (l.reading) {
      const book = books[l.reading.book];
      check(book, `${l.id}: book ${l.reading.book} missing`);
      const ch = book && book.chapters[String(l.reading.chapter)];
      for (const vid of l.reading.verseIds) check(ch && Object.values(ch).some((v) => v.id === vid), `${l.id}: verse ${vid} missing`);
    }
    const hasContent = l.vocab.length || l.paradigms.length || (l.irregular || []).length || l.reading || l.alphabet;
    check(hasContent, `${l.id}: lesson has no content`);
    if (l.type === 'alphabet') check(l.alphabet && (l.alphabet.letters || l.alphabet.sections), `${l.id}: alphabet lesson without letters/sections`);
  }
}
// every verse has words with lemmas in the lexicon; translations present (2 known versification gaps allowed)
let verses = 0, noTr = 0;
for (const b of Object.values(books)) for (const ch of Object.values(b.chapters)) for (const v of Object.values(ch)) {
  verses++;
  if (!Object.keys(v.translations).length) noTr++;
  for (const w of v.words) check(lexById.has(w.l), `${v.id}: lemma ${w.l} not in lexicon`);
}
check(noTr <= 2, `${noTr} verses without any translation`);
// paradigm cells well-formed
for (const p of paradigms) for (const c of p.cells) check(c.parse.length === 8 && c.form, `${p.id}: bad cell ${JSON.stringify(c)}`);

console.log(`data: ${curriculum.units.length} units, ${lessonCount} lessons, ${verses} verses, ${lexicon.items.length} lemmas, ${paradigms.length} paradigms`);
if (fail.length) { console.error(fail.slice(0, 20).join('\n')); process.exit(1); }

// ---- logic smoke test: build a session for every lesson with a seeded RNG ----
const drill = await import('../js/drill.js');
const alpha = await import('../js/alphabet.js');
const grammar = await import('../js/grammar.js');
const reading = await import('../js/reading.js');
const morph = await import('../js/morph.js');
const lexiconIdx = { items: lexicon.items, byId: lexById };
const rng = drill.mulberry32(42);
let built = 0, questions = 0;
for (const u of curriculum.units) {
  const unit = read(`data/units/${u.id}.json`);
  for (const l of unit.lessons) {
    try {
      if (l.type === 'alphabet') {
        const extra = { plainWords: ['ὁ', 'ἐν', 'ὑμεῖς', 'ἀρχή', 'ἡμέρα', 'εἰς', 'ὥρα', 'ἵνα', 'καὶ', 'τὸν'], subscriptWords: ['ἀρχῇ', 'τῷ', 'λόγῳ'], accentWords: ['λόγος', 'καὶ', 'τοῦ', 'ἄνθρωπος', 'θεόν', 'ἀρχῇ', 'πρὸς', 'ἦν'] };
        const steps = alpha.buildAlphabetSession({ lesson: l, alphabet, lexicon: lexiconIdx, extra, rng });
        for (const s of steps) if (s.kind === 'question') { questions++; check(s.format === 'read-word' || s.typed || (s.options && s.options.length >= 2 && s.answerId !== undefined), `${l.id}: malformed alphabet question ${s.format}`); }
      }
      if (l.vocab.length) {
        const { steps } = drill.buildSession({ lessonVocab: l.vocab.map((v) => lexById.get(v.id)), records: {}, lexicon: lexiconIdx, rng });
        for (const s of steps) if (s.kind === 'question') { questions++; const q = drill.makeQuestion(s, lexiconIdx, rng, l.vocab.map((v) => v.id)); check(!q.options || (q.options.length === 4 && q.options.some((o) => o.id === q.item.id)), `${l.id}: MC without correct option for ${q.item.id}`); }
      }
      if (l.paradigms.length || (l.irregular || []).length) {
        const steps = grammar.buildGrammarSession({ lesson: l, paradigmsById, forms, lexicon: lexiconIdx, irregularVerbs: irregular, records: {}, rng });
        check(steps.some((s) => s.kind === 'question'), `${l.id}: grammar session has no questions`);
        for (const s of steps) if (s.kind === 'question') { questions++; check(s.typed || (s.options.length >= 2 && s.options.some((o) => o.id === s.answerId)), `${l.id}: grammar MC without correct option (${s.format}: ${s.prompt})`); }
      }
      if (l.reading) {
        const book = books[l.reading.book]; const ch = book.chapters[String(l.reading.chapter)];
        for (const vid of l.reading.verseIds) {
          const v = Object.values(ch).find((x) => x.id === vid);
          const ann = reading.annotate(v, lexiconIdx, {});
          reading.coverage(ann);
          for (const w of ann) morph.describeParse(w.p, w.m);
        }
      }
      built++;
    } catch (e) {
      fail.push(`${l.id}: ${e.stack.split('\n').slice(0, 2).join(' ')}`);
    }
  }
}
// lexicon search + achievements + nav-free pages' data
const lexmod = await import('../js/lexicon.js');
const ach = await import('../js/achievements.js');
check(lexmod.searchLexicon(lexicon.items, { query: 'λογ' })[0].lemma === 'λόγος', 'lexicon search: λογ should rank λόγος first');
check(lexmod.searchLexicon(lexicon.items, { query: 'word' }).some((i) => i.lemma === 'λόγος'), 'lexicon search: "word" should find λόγος');
check(lexmod.searchLexicon(lexicon.items, { filter: 'core' }).length === 309, 'lexicon core filter should return 309 words');
const stats = read('data/stats.json');
check(stats.books.length === 27 && stats.books.every((b) => b.number && b.chapters), 'stats.json books need number + chapters');
const evalRes = ach.evaluate({ store: { progress: { streak: 0, xp: 0, lessonsCompleted: [], achievements: {} }, vocabSRS: {}, formSRS: {}, readingHistory: {} }, curriculum, lexicon: { items: lexicon.items, byId: lexById, meta: lexicon._meta } });
check(evalRes.achievements.length > 50 && evalRes.unlockedCount === 0, 'achievements: fresh store should unlock nothing');
// placement test over all grammar Books
const placement = await import('../js/placement.js');
const grammarUnits = curriculum.units.filter((u) => u.track === 'grammar').map((u) => read(`data/units/${u.id}.json`));
const placementBooks = placement.buildPlacement({ units: grammarUnits, lexicon: lexiconIdx, paradigmsById, irregularVerbs: irregular, rng });
check(placementBooks.length === 8 && placementBooks.every((b) => b.questions.length === placement.QUESTIONS_PER_BOOK), `placement: every Book needs ${placement.QUESTIONS_PER_BOOK} questions (${placementBooks.map((b) => b.questions.length).join(',')})`);
for (const b of placementBooks) for (const q of b.questions) check(q.options.length >= 2 && q.options.some((o) => o.id === q.answerId), `placement ${b.unit.id}: MC without correct option (${q.type}: ${q.prompt})`);
check(placement.placementIndex([6, 5, 4]) === 2 && placement.placementIndex([3]) === 0 && placement.placementIndex([6, 6, 6, 6, 6, 6, 6, 6]) === 8, 'placementIndex');
const kn = placement.knownRecords(grammarUnits.slice(0, 2), paradigmsById, irregular);
check(kn.lessons.length === 17 && Object.keys(kn.vocab).length > 100 && Object.keys(kn.forms).length > 50, `knownRecords for Books I–II: ${kn.lessons.length} lessons, ${Object.keys(kn.vocab).length} words, ${Object.keys(kn.forms).length} forms`);
console.log(`logic: built sessions for ${built} lessons, ${questions} questions generated; ${evalRes.achievements.length} achievements defined`);
if (fail.length) { console.error(fail.slice(0, 20).join('\n')); process.exit(1); }
console.log('OK');
