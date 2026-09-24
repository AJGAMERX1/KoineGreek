/*
  drill.js — vocab drill logic (no DOM). drill.html is the view.

  PEDAGOGY mandates this module implements:
    M3  session = what is due today across ALL history first, then new items
    M4  every step is a retrieval attempt (an intro card is immediately followed by a question)
    M6  multiple choice with plausible, diagnostic distractors (same part of speech,
        similar frequency, look-alikes preferred)
    M7  a correctly retrieved item leaves the session
    M9  new items get a short blocked run (intro → question, then one mixed pass),
        and are interleaved with everything else from the next session on
    M12/M17 format progresses by stored strength: gloss-mc → greek-mc → gloss-type → greek-type
    M18 feedback = correct answer + one-line reason
    M19 a miss re-queues the item in this session and resets its SRS interval
    M30 XP scales with retrieval difficulty; retries and guesses earn nothing
*/

// ---------------------------------------------------------------------------
// text normalization
// ---------------------------------------------------------------------------

/** Lowercase, strip accents/breathings/subscripts, final sigma -> sigma. Accent-insensitive comparisons only. */
export function normalizeGreek(s) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').normalize('NFC')
    .toLowerCase().replace(/ς/g, 'σ').replace(/[^Ͱ-Ͽ]/g, '').trim();
}

export function normalizeEnglish(s) {
  return s.toLowerCase().replace(/\(.*?\)/g, ' ').replace(/[^a-z' ]/g, ' ').replace(/\s+/g, ' ').trim();
}

const LEAD = /^(i |to |a |an |the |be |am |is |are )+/;

/** "I say, speak" -> ["say", "speak"]; "God, a god" -> ["god"]. */
export function glossAlternatives(gloss) {
  const alts = gloss.split(/[,;/]/).map(normalizeEnglish).map((a) => a.replace(LEAD, '').trim()).filter(Boolean);
  return [...new Set(alts)];
}

function levenshtein(a, b) {
  const m = a.length; const n = b.length;
  if (!m) return n; if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[n];
}

/** Typed English gloss: exact alternative, or within one typo for words of 5+ letters. */
export function checkGloss(input, gloss) {
  const inp = normalizeEnglish(input).replace(LEAD, '').trim();
  if (!inp) return false;
  return glossAlternatives(gloss).some((alt) => alt === inp || (inp.length >= 5 && levenshtein(alt, inp) <= 1));
}

/** Typed Greek: accent-insensitive match against the lemma (or, for multi-form citations like "ὁ, ἡ, τό", any form). */
export function checkGreek(input, item) {
  const inp = normalizeGreek(input);
  if (!inp) return false;
  const targets = [item.lemma, ...item.citation.split(/[,;/]/)].map(normalizeGreek).filter((t) => t.length >= inp.length - 1);
  return targets.some((t) => t === inp || (inp.length >= 6 && levenshtein(t, inp) <= 1));
}

// ---------------------------------------------------------------------------
// formats, strength, distractors
// ---------------------------------------------------------------------------

export const FORMATS = ['gloss-mc', 'greek-mc', 'gloss-type', 'greek-type'];

/** Which format an item has earned. Strength = SM-2 repetitions (consecutive successes). */
export function formatFor(record) {
  const reps = record ? record.repetitions : 0;
  if (reps <= 1) return 'gloss-mc';
  if (reps === 2) return 'greek-mc';
  if (reps === 3) return 'gloss-type';
  return 'greek-type';
}

export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle(arr, rng = Math.random) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Plausible, diagnostic distractors (M6): same part of speech, close in frequency
 * rank, with look-alikes (same first letter / similar length) weighted up, and
 * never a word whose gloss overlaps the target's.
 */
export function pickDistractors(item, lexicon, n = 3, rng = Math.random, prefer = []) {
  const targetAlts = new Set(glossAlternatives(item.gloss));
  const first = normalizeGreek(item.lemma)[0];
  const isName = (c) => /^\p{Lu}/u.test(c.lemma);
  const targetIsName = isName(item);
  // names distract names; common words distract common words
  const usable = (c) => c.id !== item.id && c.pos === item.pos && c.rank <= 1500 && isName(c) === targetIsName
    && !glossAlternatives(c.gloss).some((a) => targetAlts.has(a));
  const pool = lexicon.items.filter(usable);
  const scored = pool.map((c) => {
    const lookalike = normalizeGreek(c.lemma)[0] === first ? 1 : 0;
    const sameLen = Math.abs(c.lemma.length - item.lemma.length) <= 1 ? 1 : 0;
    const preferred = prefer.includes(c.id) ? 1 : 0;
    // lower is better: frequency distance, minus bonuses, plus jitter so sessions vary
    const score = Math.abs(c.rank - item.rank) / 50 - lookalike * 4 - sameLen - preferred * 6 + rng() * 6;
    return { c, score };
  }).sort((a, b) => a.score - b.score);
  const out = []; const seenGloss = new Set(targetAlts);
  const take = (list) => {
    for (const { c } of list) {
      const g = glossAlternatives(c.gloss)[0];
      if (seenGloss.has(g) || out.includes(c)) continue;
      seenGloss.add(g); out.push(c);
      if (out.length === n) return;
    }
  };
  take(scored);
  if (out.length < n) {
    // Not enough same-part-of-speech candidates (e.g. the article ὁ is the only article):
    // fall back to any common word so the question always has four options.
    const fallback = lexicon.items.filter((c) => c.id !== item.id && c.rank <= 400 && !/[\s,()/]/.test(c.lemma))
      .map((c) => ({ c, score: Math.abs(c.rank - item.rank) / 50 + rng() * 6 })).sort((a, b) => a.score - b.score);
    take(fallback);
  }
  return out;
}

// ---------------------------------------------------------------------------
// session
// ---------------------------------------------------------------------------

/**
 * Build the step queue for a session.
 *   lessonVocab: lexicon items introduced by this lesson (may be empty in "due" mode)
 *   records:     all vocab SRS records ({id: record})
 *   lexicon:     loaded lexicon (for due items' details)
 * Returns { steps, newIds, dueIds }.
 */
export function buildSession({ lessonVocab = [], records, lexicon, now = new Date(), maxDue = 25, rng = Math.random }) {
  const lessonIds = new Set(lessonVocab.map((i) => i.id));
  const dueIds = Object.entries(records)
    .filter(([id, r]) => !lessonIds.has(id) && lexicon.byId.has(id) && (!r.dueDate || new Date(r.dueDate) <= now))
    .sort((a, b) => new Date(a[1].dueDate || 0) - new Date(b[1].dueDate || 0))
    .map(([id]) => id)
    .slice(0, maxDue);

  const steps = [];
  // 1. warm-up: due reviews from all past lessons, interleaved (M3, M8)
  for (const id of shuffle(dueIds, rng)) {
    steps.push({ kind: 'question', item: lexicon.byId.get(id), format: formatFor(records[id]), isNew: false, attempt: 1 });
  }
  // 2. new material, blocked: intro card immediately followed by a question (M4, M9)
  const newItems = lessonVocab.filter((i) => !records[i.id]);
  const seenBefore = lessonVocab.filter((i) => records[i.id]); // lesson words already scheduled (repeat visit)
  for (const item of newItems) {
    steps.push({ kind: 'intro', item });
    steps.push({ kind: 'question', item, format: 'gloss-mc', isNew: true, attempt: 1 });
  }
  for (const item of seenBefore) {
    steps.push({ kind: 'question', item, format: formatFor(records[item.id]), isNew: false, attempt: 1 });
  }
  // 3. one mixed pass over the new items in a slightly harder format (still blocked to this lesson)
  if (newItems.length > 1) {
    for (const item of shuffle(newItems, rng)) {
      steps.push({ kind: 'question', item, format: 'greek-mc', isNew: true, attempt: 1, secondPass: true });
    }
  }
  return { steps, newIds: newItems.map((i) => i.id), dueIds };
}

/** Turn a question step into something the view can render. */
export function makeQuestion(step, lexicon, rng = Math.random, prefer = []) {
  const { item, format } = step;
  const q = { step, item, format, prompt: '', hint: '', options: null, answerText: '' };
  if (format === 'gloss-mc') {
    q.prompt = item.lemma; q.hint = item.pos; q.answerText = item.gloss;
    const options = shuffle([item, ...pickDistractors(item, lexicon, 3, rng, prefer)], rng);
    q.options = options.map((o) => ({ id: o.id, text: o.gloss, item: o }));
  } else if (format === 'greek-mc') {
    q.prompt = item.gloss; q.hint = item.pos; q.answerText = item.lemma;
    const options = shuffle([item, ...pickDistractors(item, lexicon, 3, rng, prefer)], rng);
    q.options = options.map((o) => ({ id: o.id, text: o.lemma, item: o }));
  } else if (format === 'gloss-type') {
    q.prompt = item.lemma; q.hint = `${item.pos} · type the meaning`; q.answerText = item.gloss;
  } else {
    q.prompt = item.gloss; q.hint = `${item.pos} · type the Greek`; q.answerText = item.lemma;
  }
  return q;
}

/** Grade an answer: for MC `input` is the chosen option id; for typed formats it is the text. */
export function grade(question, input) {
  const { item, format } = question;
  if (question.options) {
    const chosen = question.options.find((o) => o.id === input);
    return { correct: !!chosen && chosen.id === item.id, chosen: chosen ? chosen.item : null };
  }
  if (format === 'gloss-type') return { correct: checkGloss(input, item.gloss), chosen: null };
  return { correct: checkGreek(input, item), chosen: null };
}

/**
 * SRS rating for an objective answer (M12/M19/M30). Retries never touch the
 * schedule. The same-session second pass over new words establishes them (M9)
 * but is not a spaced review, so a correct answer there does not advance the
 * schedule either; a miss anywhere is signal and resets the item (M19).
 */
export function ratingFor(question, result) {
  if (question.step.attempt > 1) return null;
  if (!result.correct) return 'miss';
  if (question.step.secondPass) return null;
  return question.options ? 'good' : 'nailed';
}

/** XP for the answer: production > typing > recognition; nothing for retries or misses (M30). */
export function xpFor(question, result) {
  if (!result.correct || question.step.attempt > 1) return 0;
  const base = { 'gloss-mc': 2, 'greek-mc': 3, 'gloss-type': 5, 'greek-type': 8 }[question.format];
  return question.step.secondPass ? 1 : base;
}

/** Feedback text: the answer plus a one-line reason (M18). */
export function feedback(question, result, unitTitleById = {}) {
  const { item } = question;
  const where = item.unitTitle ? ` · ${item.unitTitle}` : '';
  const reason = `${item.citation} · ${item.pos} · ${item.count}× in the NT${where}`;
  if (result.correct) {
    return { ok: true, headline: 'Correct', answer: `${item.lemma} — ${item.gloss}`, reason };
  }
  let why = reason;
  if (result.chosen) {
    why = `${result.chosen.lemma} means “${result.chosen.gloss}”. ${reason}`;
  }
  return { ok: false, headline: 'Not quite', answer: `${item.lemma} — ${item.gloss}`, reason: why };
}

/** Where a missed item goes back into the queue: a few steps later, in the easiest format (M19). */
export function requeue(steps, index, step) {
  const retry = { ...step, format: 'gloss-mc', attempt: step.attempt + 1, secondPass: false };
  const at = Math.min(steps.length, index + 4);
  steps.splice(at, 0, retry);
  return steps;
}
