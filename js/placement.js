/*
  placement.js — "test out" for learners who already know some Greek (no DOM).

  Six questions per grammar Book (I–VIII), taken from that Book's own words,
  paradigms and strange verbs: 3 vocabulary, 2 forms, 1 principal part (or
  more vocabulary where a Book has none). Books are tested in order; a Book
  is passed with PASS_MARK correct, and the test stops at the first failure.
  The learner places at the first Book they did not pass, and everything
  before it is marked complete with its words and endings entered into the
  spaced-repetition schedules as already-known (due for a light review in
  two weeks, so the SRS can confirm rather than re-teach — PEDAGOGY M3, M13).
*/
import { makeQuestion, shuffle } from './drill.js';
import { cellQuestion, cellId, partQuestions, partId } from './grammar.js';
import { scheduleReview } from './srs.js';

export const QUESTIONS_PER_BOOK = 6;
export const PASS_MARK = 5;

const pick = (arr, n, rng) => shuffle(arr, rng).slice(0, n);

/** Build the question sets for each grammar-track unit (full unit objects, in order). */
export function buildPlacement({ units, lexicon, paradigmsById, irregularVerbs, rng = Math.random }) {
  return units.map((unit) => {
    const vocab = unit.lessons.flatMap((l) => l.vocab.map((v) => lexicon.byId.get(v.id)).filter(Boolean));
    const cells = unit.lessons.flatMap((l) => l.paradigms.map((pid) => paradigmsById[pid]).filter(Boolean).flatMap((p) => p.cells.map((c) => [p, c])));
    const irregular = unit.lessons.flatMap((l) => l.irregular || []).map((lemma) => irregularVerbs.find((v) => v.lemma === lemma)).filter(Boolean);
    const qs = [];
    const vocabQ = (item) => {
      const q = makeQuestion({ kind: 'question', item, format: 'gloss-mc', attempt: 1 }, lexicon, rng, vocab.map((v) => v.id));
      return { type: 'vocab', prompt: q.prompt, hint: 'What does it mean?', options: q.options.map((o) => ({ id: o.id, text: o.text })), answerId: item.id, answer: `${item.lemma} — ${item.gloss}`, reason: `${item.citation} · ${item.pos} · ${item.count}× in the NT` };
    };
    const cellQ = ([p, c]) => {
      const q = cellQuestion(p, c, 'parse-mc', rng, 1, p.cells.length < 4 ? Object.values(paradigmsById).filter((o) => o !== p && o.kind === p.kind).flatMap((o) => o.cells) : []);
      return { type: 'cell', prompt: q.prompt, hint: q.hint, options: q.options, answerId: q.answerId, answer: q.answer, reason: q.reason };
    };
    const partQ = (v) => {
      const q = partQuestions(v, irregularVerbs, {}, () => 0.2)[0]; // force the "which form" variant
      return q && { type: 'part', prompt: q.prompt, promptGreek: false, hint: q.hint, options: q.options, answerId: q.answerId, answer: q.answer, reason: q.reason };
    };
    const nVocab = 3 + (cells.length ? 0 : 2) + (irregular.length ? 0 : 1);
    for (const item of pick(vocab, Math.min(nVocab, vocab.length), rng)) qs.push(vocabQ(item));
    for (const pc of pick(cells, Math.min(2, cells.length), rng)) qs.push(cellQ(pc));
    if (irregular.length) { const q = partQ(pick(irregular, 1, rng)[0]); if (q) qs.push(q); }
    while (qs.length < QUESTIONS_PER_BOOK && vocab.length > qs.filter((q) => q.type === 'vocab').length) {
      const used = new Set(qs.filter((q) => q.type === 'vocab').map((q) => q.answerId));
      const rest = vocab.filter((v) => !used.has(v.id));
      if (!rest.length) break;
      qs.push(vocabQ(pick(rest, 1, rng)[0]));
    }
    return { unit, questions: shuffle(qs, rng).slice(0, QUESTIONS_PER_BOOK) };
  });
}

/** Given per-Book scores in order, the index of the Book to place at (== number of Books passed). */
export function placementIndex(scores) {
  let i = 0;
  while (i < scores.length && scores[i] >= PASS_MARK) i++;
  return i;
}

/**
 * Records that make passed material count as known: complete lessons, and
 * enter words / paradigm cells / principal parts into the SRS at "learning,
 * due in two weeks" strength.
 */
export function knownRecords(passedUnits, paradigmsById, irregularVerbs, now = new Date()) {
  const due = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString();
  const base = { repetitions: 2, easeFactor: 2.5, interval: 14, dueDate: due, lastReviewed: now.toISOString(), lapses: 0, format: 'placement' };
  const lessons = [], vocab = {}, forms = {};
  for (const u of passedUnits) {
    for (const l of u.lessons) {
      lessons.push(l.id);
      for (const v of l.vocab) vocab[v.id] = { ...base };
      for (const pid of l.paradigms) { const p = paradigmsById[pid]; if (p) for (const c of p.cells) forms[cellId(pid, c.parse)] = { ...base }; }
      for (const lemma of l.irregular || []) { const v = irregularVerbs.find((x) => x.lemma === lemma); if (v) v.parts.forEach((part, i) => { if (i > 0 && part) forms[partId(lemma, i)] = { ...base }; }); }
    }
  }
  return { lessons, vocab, forms };
}
