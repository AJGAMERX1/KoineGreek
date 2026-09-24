/*
  grammar.js — grammar / verb lesson logic (no DOM): paradigm drills, parsing
  of real attested forms, and the strange-verb principal-parts pool.
  grammar.html is the view.

  PEDAGOGY mandates this implements:
    M20  explicit rule → immediate retrieval → real examples, in that order
    M21  endings and principal parts are SRS objects (storage.formSRS), each with a strength
    M4/M9 a paradigm is shown once, then asked cell by cell (blocked), then mixed
    M10  distractors are the confusable cells of the same paradigm (same number, other person; same case, other gender…)
    M12/M17 strength drives format: recognise the parse → produce the form (typed)
    M28  after the paradigm, parse real GNT forms of the lesson's own words (data/forms.json)
    M19  a miss re-queues and resets the cell
*/

import { describeParse } from './morph.js';

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

export function normalizeGreek(s) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').normalize('NFC')
    .toLowerCase().replace(/ς/g, 'σ').replace(/\(ν\)/g, '').replace(/[^Ͱ-Ͽ]/g, '').trim();
}

/** A typed form matches if it equals the cell accent-insensitively, with or without movable nu. */
export function checkForm(input, form) {
  const want = normalizeGreek(form);
  const got = normalizeGreek(input);
  if (!got) return false;
  return got === want || got === want + 'ν' || got + 'ν' === want;
}

export function shuffle(arr, rng = Math.random) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
const pick = (arr, n, rng) => shuffle(arr, rng).slice(0, n);

export function cellId(paradigmId, parse) { return `${paradigmId}|${parse}`; }
export function partId(lemma, index) { return `irr|${lemma}|${index}`; }

/** Format by strength (repetitions of the cell's SRS record). */
export function formatFor(record) {
  const reps = record ? record.repetitions : 0;
  return reps >= 2 ? 'form-type' : 'parse-mc';
}

/** Slots that differ between two parse codes (for confusability scoring). */
function slotDiff(a, b) {
  let d = 0;
  for (let i = 0; i < 8; i++) if (a[i] !== b[i]) d++;
  return d;
}

/** Cell label shown to the learner: the parse in words, with the verb's mood/tense dropped when the whole paradigm shares it. */
export function cellLabel(paradigm, cell) {
  return describeParse(paradigm.kind === 'nominal' ? 'N-' : 'V-', cell.parse);
}

/**
 * Distractor cells for `cell`: other cells of the same paradigm, closest in
 * parse (one slot different first), with distinct labels and distinct forms.
 */
export function cellDistractors(paradigm, cell, n = 3, rng = Math.random, pool = []) {
  const label = cellLabel(paradigm, cell);
  // own cells first; then cells of sibling paradigms of the same kind (for tiny paradigms such as a lone infinitive)
  const candidates = [...paradigm.cells.map((c) => [c, 0]), ...pool.map((c) => [c, 4])]
    .filter(([c]) => c !== cell && cellLabel(paradigm, c) !== label && normalizeGreek(c.form) !== normalizeGreek(cell.form));
  const scored = candidates.map(([c, penalty]) => ({ c, s: slotDiff(c.parse, cell.parse) + penalty + rng() * 0.5 })).sort((a, b) => a.s - b.s);
  const out = []; const seen = new Set([label]);
  for (const { c } of scored) {
    const l = cellLabel(paradigm, c);
    if (seen.has(l)) continue;
    seen.add(l); out.push(c);
    if (out.length === n) break;
  }
  return out;
}

// ---------------------------------------------------------------------------
// question builders
// ---------------------------------------------------------------------------

/** Ask for one paradigm cell in the given format. */
export function cellQuestion(paradigm, cell, format, rng = Math.random, attempt = 1, pool = []) {
  const id = cellId(paradigm.id, cell.parse);
  const label = cellLabel(paradigm, cell);
  if (format === 'form-type') {
    return { kind: 'question', format, srsId: id, paradigm, cell, attempt,
      prompt: `${paradigm.lemma} · ${label}`, promptGreek: false, hint: 'Type the form',
      typed: { greek: true, placeholder: 'type in Greek' }, answer: `${cell.form} — ${label}`, reason: paradigm.title };
  }
  const opts = shuffle([cell, ...cellDistractors(paradigm, cell, 3, rng, pool)], rng);
  return { kind: 'question', format: 'parse-mc', srsId: id, paradigm, cell, attempt, pool,
    prompt: cell.form, hint: `${paradigm.lemma} — which form is this?`,
    options: opts.map((c) => ({ id: c.parse, text: cellLabel(paradigm, c) })), answerId: cell.parse,
    answer: `${cell.form} — ${label}`, reason: paradigm.title };
}

/** Whether an attested form's parse belongs to this paradigm's pattern (same tense/voice/mood for verbs; any case/number for nominals). */
function fitsParadigm(paradigm, parse) {
  const sample = paradigm.cells[0].parse;
  if (paradigm.kind === 'nominal') return parse.slice(0, 4) === '----' && parse[4] !== '-';
  if (paradigm.kind === 'infinitive') return parse[3] === 'N';
  if (paradigm.kind === 'participle') return parse[3] === 'P' && parse[1] === sample[1] && voiceGroup(parse[2]) === voiceGroup(sample[2]);
  return parse[1] === sample[1] && voiceGroup(parse[2]) === voiceGroup(sample[2]) && parse[3] === sample[3];
}
const voiceGroup = (v) => (v === 'A' ? 'A' : 'MP');

/**
 * Parse a real GNT form of one of the lesson's own words (M28). Options are the
 * paradigm's cell labels, so the distractors are exactly the confusable endings.
 */
export function attestedQuestion(paradigm, lemma, formRow, lexiconItem, rng = Math.random) {
  const [form, , parse, count] = formRow;
  const pseudoCell = { parse, form };
  const label = describeParse(paradigm.kind === 'nominal' ? 'N-' : 'V-', parse);
  const distract = cellDistractors(paradigm, pseudoCell, 3, rng);
  const opts = shuffle([pseudoCell, ...distract], rng);
  return { kind: 'question', format: 'attested-mc', srsId: null, paradigm, attempt: 1,
    prompt: form, hint: `A real New Testament form — parse it`,
    options: opts.map((c) => ({ id: c.parse, text: describeParse(paradigm.kind === 'nominal' ? 'N-' : 'V-', c.parse) })), answerId: parse,
    answer: `${form} — ${label}`,
    reason: `from ${lexiconItem ? lexiconItem.citation : lemma} (${lexiconItem ? lexiconItem.gloss : ''}) · this form occurs ${count}× in the NT` };
}

export const PART_NAMES = ['present', 'future', 'aorist active', 'perfect active', 'perfect middle/passive', 'aorist passive'];

/** Principal-parts questions for the strange-verb pool. */
export function partQuestions(verb, pool, records, rng = Math.random) {
  const out = [];
  verb.parts.forEach((part, i) => {
    if (i === 0 || !part) return;
    const id = partId(verb.lemma, i);
    const rec = records[id];
    const strong = rec && rec.repetitions >= 2;
    if (strong) {
      out.push({ kind: 'question', format: 'part-type', srsId: id, verb, partIndex: i, attempt: 1,
        prompt: `${PART_NAMES[i]} of ${verb.lemma}`, promptGreek: false, hint: verb.gloss,
        typed: { greek: true, placeholder: 'type in Greek' }, answer: `${part} — ${PART_NAMES[i]} of ${verb.lemma}`, reason: verb.note || '' });
    } else if (rng() < 0.5) {
      // which form is the <part> of <lemma>? — distractors: the same part of other verbs
      const others = pool.filter((v) => v !== verb && v.parts[i]).map((v) => v.parts[i]);
      const opts = shuffle([part, ...pick(others, 3, rng)], rng);
      out.push({ kind: 'question', format: 'part-mc', srsId: id, verb, partIndex: i, attempt: 1,
        prompt: `${PART_NAMES[i]} of ${verb.lemma}`, promptGreek: false, hint: verb.gloss,
        options: opts.map((o) => ({ id: o, text: o, greek: true })), answerId: part,
        answer: `${part} — ${PART_NAMES[i]} of ${verb.lemma}`, reason: verb.note || '' });
    } else {
      // <form> is which part of which verb? — distractors: other verbs in the pool
      const others = pool.filter((v) => v !== verb).map((v) => v.lemma);
      const opts = shuffle([verb.lemma, ...pick(others, 3, rng)], rng);
      out.push({ kind: 'question', format: 'part-lemma-mc', srsId: id, verb, partIndex: i, attempt: 1,
        prompt: part, hint: `${PART_NAMES[i]} — of which verb?`,
        options: opts.map((o) => ({ id: o, text: o, greek: true })), answerId: verb.lemma,
        answer: `${part} — ${PART_NAMES[i]} of ${verb.lemma} (${verb.gloss})`, reason: verb.note || '' });
    }
  });
  return out;
}

// ---------------------------------------------------------------------------
// session
// ---------------------------------------------------------------------------

const CELLS_PER_PARADIGM = 8;   // blocked run after the table (M9); the rest come via due reviews
const ATTESTED_PER_PARADIGM = 5;

/**
 * Build a grammar lesson session.
 *   lesson:      unit lesson object (rule, paradigms[], irregular[], vocab[])
 *   paradigmsById, forms (data/forms.json .forms), lexicon, irregularVerbs (list), records (formSRS)
 */
export function buildGrammarSession({ lesson, paradigmsById, forms, lexicon, irregularVerbs = [], records, rng = Math.random }) {
  const steps = [];
  if (lesson.rule) steps.push({ kind: 'rule', rule: lesson.rule });

  const lessonLemmas = (lesson.vocab || []).map((v) => v.id);
  const siblings = (p) => Object.values(paradigmsById).filter((o) => o !== p && o.kind === p.kind).flatMap((o) => o.cells);
  for (const pid of lesson.paradigms || []) {
    const p = paradigmsById[pid];
    if (!p) continue;
    const pool = p.cells.length < 4 ? siblings(p) : [];
    steps.push({ kind: 'paradigm', paradigm: p });
    // blocked: unseen/due cells first, then the rest, capped
    const cells = p.cells.slice();
    const weight = (c) => { const r = records[cellId(p.id, c.parse)]; return r ? (new Date(r.dueDate) <= new Date() ? 1 : 2) : 0; };
    const chosen = cells.sort((a, b) => weight(a) - weight(b) || rng() - 0.5).slice(0, CELLS_PER_PARADIGM);
    for (const c of shuffle(chosen, rng)) steps.push(cellQuestion(p, c, formatFor(records[cellId(p.id, c.parse)]), rng, 1, pool));
    // real forms of the lesson's own words (or of the paradigm's lemma) that follow this pattern
    const candidates = [];
    const lemmas = lessonLemmas.length ? [...lessonLemmas, p.lemma] : [p.lemma];
    for (const lemma of lemmas) {
      for (const row of forms[lemma] || []) {
        if (fitsParadigm(p, row[2]) && !p.cells.some((c) => normalizeGreek(c.form) === normalizeGreek(row[0]))) candidates.push([lemma, row]);
      }
    }
    for (const [lemma, row] of pick(candidates, ATTESTED_PER_PARADIGM, rng)) {
      steps.push(attestedQuestion(p, lemma, row, lexicon.byId.get(lemma), rng));
    }
  }

  const pool = irregularVerbs.filter((v) => (lesson.irregular || []).includes(v.lemma));
  for (const v of pool) steps.push({ kind: 'parts', verb: v });
  const partQs = pool.flatMap((v) => partQuestions(v, irregularVerbs, records, rng));
  steps.push(...shuffle(partQs, rng));
  return steps;
}

/** Due-review session over every paradigm cell / principal part whose record is due (M3). */
export function buildDueFormsSession({ dueIds, paradigmsById, irregularVerbs, records, rng = Math.random, max = 30 }) {
  const steps = [];
  for (const id of shuffle(dueIds, rng).slice(0, max)) {
    if (id.startsWith('irr|')) {
      const [, lemma, idx] = id.split('|');
      const verb = irregularVerbs.find((v) => v.lemma === lemma);
      if (!verb) continue;
      const q = partQuestions({ ...verb, parts: verb.parts.map((p, i) => (i === Number(idx) ? p : null)) }, irregularVerbs, records, rng)[0];
      if (q) steps.push(q);
    } else {
      const [pid, parse] = id.split('|');
      const p = paradigmsById[pid];
      const cell = p && p.cells.find((c) => c.parse === parse);
      const pool = p && p.cells.length < 4 ? Object.values(paradigmsById).filter((o) => o !== p && o.kind === p.kind).flatMap((o) => o.cells) : [];
      if (cell) steps.push(cellQuestion(p, cell, formatFor(records[id]), rng, 1, pool));
    }
  }
  return steps;
}

export function gradeGrammar(step, input) {
  if (step.typed) {
    const target = step.cell ? step.cell.form : step.verb.parts[step.partIndex];
    // principal parts may list alternatives ("ἔστησα / ἔστην")
    return target.split('/').some((t) => checkForm(input, t.trim()));
  }
  return input === step.answerId;
}

export function xpForGrammar(step, correct) {
  if (!correct || step.attempt > 1) return 0;
  return { 'parse-mc': 2, 'form-type': 5, 'attested-mc': 3, 'part-mc': 3, 'part-lemma-mc': 3, 'part-type': 6 }[step.format] || 2;
}

/** SRS rating: only first attempts on scheduled items count; typed correct = nailed, MC correct = good. */
export function ratingForGrammar(step, correct) {
  if (!step.srsId || step.attempt > 1) return null;
  if (!correct) return 'miss';
  return step.typed ? 'nailed' : 'good';
}

export function requeueGrammar(steps, index, step) {
  let retry = { ...step, attempt: step.attempt + 1 };
  if (retry.typed && retry.cell) { // soften: retry a typed paradigm miss as recognition
    retry = cellQuestion(retry.paradigm, retry.cell, 'parse-mc', Math.random, retry.attempt, step.pool || []);
  }
  steps.splice(Math.min(steps.length, index + 4), 0, retry);
}
