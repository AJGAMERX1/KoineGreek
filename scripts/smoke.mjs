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
// study helps (Strong's, Word Pictures, cross-references) + reference parser
const strongs = read('data/strongs-greek.json').entries;
check(strongs['3056'] && /λόγος/.test(strongs['3056'].lemma), "strongs-greek.json: G3056 should be λόγος");
const withStrongs = lexicon.items.filter((i) => i.strongs).length;
const resolved = lexicon.items.filter((i) => [].concat(i.strongs || []).some((n) => strongs[String(n)])).length;
check(resolved > withStrongs * 0.95, `strongs: only ${resolved}/${withStrongs} lexicon items resolve to an entry`);
const verseIds = new Set();
for (const b of Object.values(books)) for (const ch of Object.values(b.chapters)) for (const v of Object.values(ch)) verseIds.add(v.id);
for (const slug of Object.keys(books)) {
  const rwp = read(`data/rwp/${slug}.json`); const xr = read(`data/xrefs/${slug}.json`);
  for (const [ch, vs] of Object.entries(rwp.chapters)) for (const v of Object.keys(vs)) check(verseIds.has(`${slug}-${ch}-${v}`), `rwp ${slug} ${ch}:${v} not in gnt`);
  for (const [ch, vs] of Object.entries(xr.chapters)) for (const [v, refs] of Object.entries(vs)) { check(verseIds.has(`${slug}-${ch}-${v}`), `xrefs ${slug} ${ch}:${v} not in gnt`); for (const r of refs) check(r.ref && r.book && r.chapter && r.from && typeof r.nt === 'boolean', `xrefs ${slug} ${ch}:${v}: malformed ref`); }
}
const occ = read('data/occurrences.json').occurrences;
check(occ['λόγος'] && occ['λόγος'].every((id) => verseIds.has(id)) && Object.keys(occ).length === lexicon.items.length, 'occurrences.json: every lemma, every id a real verse');
const refs = await import('../js/refs.js');
check(refs.parseReference('Jn 3:16').slug === 'john' && refs.parseReference('1 Cor 13:4-7').verseEnd === 7 && refs.parseReference('Gen 1:1').nt === false && refs.parseReference('nope') === null, 'refs.parseReference');
// ---- typed meanings are graded generously: one meaning, any wording; guesses still fail ----
{
  const { checkGloss } = await import('../js/drill.js');
  const g = (lemma) => lexById.get(lemma).gloss;
  const yes = [['εἰς', 'in or among'], ['εἰς', 'Into, for'], ['λόγος', 'the word of God'], ['λόγος', 'divine speech'], ['ἀγαπάω', 'loving'],
    ['ἀγαπάω', 'he loves'], ['λέγω', 'he says'], ['ἐγώ', 'me'], ['γίνομαι', 'to be born'], ['ἄνθρωπος', 'human'], ['Χριστός', 'Messiah'],
    ['ἔχω', 'posess'], ['ἵνα', 'so that'], ['δέ', 'on the other hand'], ['ὁ', 'the']];
  const no = [['εἰς', 'out of'], ['λόγος', 'love'], ['λόγος', 'love word god say'], ['ἀγαπάω', 'hate'], ['ἐγώ', 'you'], ['καί', 'but'],
    ['ἄνθρωπος', 'woman'], ['Χριστός', 'Jesus'], ['δέ', 'hand'], ['μάλιστα', 'all'], ['περιπατέω', 'like'], ['κοινόω', 'I make holy']];
  for (const [l, i] of yes) check(checkGloss(i, g(l)), `typed meaning "${i}" for ${l} should pass`);
  for (const [l, i] of no) check(!checkGloss(i, g(l)), `typed meaning "${i}" for ${l} should fail`);
  // every listed meaning of every drilled word is accepted
  let n = 0;
  for (const it of lexicon.items.filter((x) => x.count >= 10)) for (const piece of it.gloss.split(/[,;/]/)) if (piece.trim()) { n++; check(checkGloss(piece, it.gloss), `own meaning "${piece.trim()}" rejected for ${it.lemma}`); }
  console.log(`meanings: ${yes.length + no.length} spot checks, ${n} listed meanings accepted`);
}

// ---- Write & translate: free translations graded on meaning, generously ----
{
  const { gradeTranslation } = await import('../js/reading.js');
  const lex = { byId: lexById };
  const V = (b, c, v) => books[b].chapters[c][v];
  const G = (v, text) => gradeTranslation(v, lex, text, Object.values(v.translations)).rating;
  const cases = [
    [V('john', '1', '1'), 'In the beginning existed the Word, and the Word existed with the God, and God existed with the word', ['nailed']],
    [V('john', '1', '1'), 'At the start there was the Word. The Word was with God and the Word was divine.', ['nailed']],
    [V('john', '1', '1'), 'In the beginning was the Word', ['close']],
    [V('john', '1', '1'), 'Jesus wept', ['miss']],
    [V('john', '1', '1'), 'the cat sat on the mat and ate fish', ['miss']],
    [V('john', '3', '16'), 'God loved the world so much that he gave his only son, so that everyone who believes in him will not die but will have eternal life', ['nailed']],
    [V('john', '3', '16'), 'God loved the world and gave his son', ['close']],
    [V('romans', '6', '23'), 'Sin pays out death, but God gives the free gift of eternal life in Christ Jesus our Lord', ['nailed']],
    [V('matthew', '5', '3'), 'Blessed are the poor in spirit, because the kingdom of heaven belongs to them', ['nailed']],
  ];
  for (const [v, text, want] of cases) { const r = G(v, text); check(want.includes(r), `translation of ${v.id} "${text.slice(0, 30)}…" graded ${r}, expected ${want.join('/')}`); }
  // each Bible translation, graded against the other two, is never a miss; another verse's text never nails it
  const all = Object.values(books).flatMap((b) => Object.values(b.chapters).flatMap((c) => Object.values(c))).filter((v) => Object.keys(v.translations).length >= 2);
  let refMiss = 0, wrongNailed = 0, n = 0;
  for (let i = 0; i < all.length; i += 37) {
    const v = all[i]; const ids = Object.keys(v.translations); n++;
    for (const id of ids) if (gradeTranslation(v, lex, v.translations[id], ids.filter((x) => x !== id).map((x) => v.translations[x])).rating === 'miss') refMiss++;
    const o = all[(i * 7 + 13) % all.length];
    if (o.id !== v.id && G(v, Object.values(o.translations)[0]) === 'nailed') wrongNailed++;
  }
  check(refMiss <= 1, `${refMiss} Bible translations graded "miss" in the sample`);
  check(wrongNailed === 0, `${wrongNailed} wrong-verse answers graded "nailed"`);
  console.log(`translations: ${cases.length} spot checks, ${n} verses × references (misses ${refMiss}), wrong-verse nailed ${wrongNailed}`);
}

// ---- Lexicon search: lemmas, inflected forms (common and rare), transliteration, English ----
{
  const { searchLexiconDetailed, buildFormIndex } = await import('../js/lexicon.js');
  const formIndex = buildFormIndex(read('data/search-forms.json').forms);
  const top = (q) => { const r = searchLexiconDetailed(lexicon.items, { query: q, formIndex }); return r[0] && r[0].item.id; };
  const cases = [
    ['λόγος', 'λόγος'], ['λογος', 'λόγος'], ['ΛΟΓΟΣ', 'λόγος'], ['λόγου', 'λόγος'], ['θεοῦ', 'θεός'], ['ἦν', 'εἰμί'], ['τοῦ', 'ὁ'],
    ['εἶπεν', 'λέγω'], ['ἠγάπησεν', 'ἀγαπάω'], ['πνεύματι', 'πνεῦμα'], ['Ἰησοῦ', 'Ἰησοῦς'], ['δι’', 'διά'],
    ['logos', 'λόγος'], ['agape', 'ἀγάπη'], ['Christos', 'Χριστός'], ['psyche', 'ψυχή'], ['ecclesia', 'ἐκκλησία'], ['hamartia', 'ἁμαρτία'],
    ['word', 'λόγος'], ['love', 'ἀγαπάω'], ['God', 'θεός'],
  ];
  for (const [q, want] of cases) check(top(q) === want, `search "${q}": expected ${want}, got ${top(q)}`);
  // every rare lemma (1–3 uses) is found by its own lemma and by each of its attested forms
  const sf = read('data/search-forms.json').forms;
  let rareChecked = 0;
  for (const it of lexicon.items.filter((i) => i.count <= 3)) {
    const byLemma = searchLexiconDetailed(lexicon.items, { query: it.lemma, formIndex }).slice(0, 5).map((o) => o.item.id);
    check(byLemma.includes(it.id), `search rare lemma "${it.lemma}" not in top 5`);
    for (const f of (sf[it.id] || '').split(' ').filter(Boolean)) {
      const r = searchLexiconDetailed(lexicon.items, { query: f, formIndex }).slice(0, 5).map((o) => o.item.id);
      check(r.includes(it.id), `search rare form "${f}" (${it.lemma}) not in top 5`);
    }
    rareChecked++;
  }
  console.log(`search: ${cases.length} spot checks, ${rareChecked} rare lemmas + their forms`);
}

console.log(`logic: built sessions for ${built} lessons, ${questions} questions generated; ${evalRes.achievements.length} achievements defined`);
if (fail.length) { console.error(fail.slice(0, 20).join('\n')); process.exit(1); }
console.log('OK');
