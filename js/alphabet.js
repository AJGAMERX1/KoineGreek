/*
  alphabet.js — alphabet lesson logic (no DOM). alphabet.html is the view.

  Four lessons (see scripts/curriculum.py, Book I): letters Α–Μ, letters Ν–Ω,
  vowels / diphthongs / breathing / iota subscript, accents / punctuation /
  syllables. Same session rules as the vocab drill: present a small block, ask
  for it immediately (M4, M9), mix everything at the end (M8), requeue misses
  (M19), feedback with a reason (M18), production (type the transliteration)
  as well as recognition (M17).
*/

// ---------------------------------------------------------------------------
// Greek text helpers (NFD combining marks)
// ---------------------------------------------------------------------------
const ACUTE = '́', GRAVE = '̀', CIRCUMFLEX = '͂', ROUGH = '̔', SMOOTH = '̓', SUBSCRIPT = 'ͅ';
const VOWELS = 'αεηιουω';
const DIPHTHONGS = ['αι', 'ει', 'οι', 'υι', 'αυ', 'ευ', 'ου', 'ηυ'];

export function nfd(s) { return s.normalize('NFD'); }
export function stripMarks(s) { return nfd(s).replace(/[̀-ͯ]/g, '').normalize('NFC'); }
export function baseLower(s) { return stripMarks(s).toLowerCase().replace(/ς/g, 'σ'); }

export function hasRough(word) { return nfd(word).includes(ROUGH); }
export function hasSmooth(word) { return nfd(word).includes(SMOOTH); }
export function hasSubscript(word) { return nfd(word).includes(SUBSCRIPT); }
export function accentOf(word) {
  const d = nfd(word);
  if (d.includes(CIRCUMFLEX)) return 'circumflex';
  if (d.includes(ACUTE)) return 'acute';
  if (d.includes(GRAVE)) return 'grave';
  return null;
}

/**
 * Split a word into syllables (one per vowel/diphthong nucleus). A single
 * consonant goes with the following vowel; of a cluster, the first consonant
 * closes the previous syllable. Good enough for counting and for locating the
 * accent, which is all the lessons ask.
 * Returns [{text, stressed}] using the original (accented) characters.
 */
export function syllabify(word) {
  const chars = [...word.normalize('NFC')];
  // group each character with its base letter
  const units = chars.map((c) => ({ c, base: baseLower(c).replace(/[^α-ω]/g, '') }));
  const isV = (u) => u.base && VOWELS.includes(u.base);
  // find nuclei (vowel or diphthong start indexes)
  const nuclei = [];
  for (let i = 0; i < units.length; i++) {
    if (!isV(units[i])) continue;
    const pair = units[i].base + (units[i + 1] ? units[i + 1].base : '');
    // a diphthong only if the second vowel carries no breathing/accent of its own... simplification:
    // treat as diphthong when the pair is in the list and the second vowel has no dieresis (rare in NT).
    if (DIPHTHONGS.includes(pair) && !nfd(units[i + 1].c).includes('̈')) {
      nuclei.push([i, i + 1]); i++;
    } else {
      nuclei.push([i, i]);
    }
  }
  if (!nuclei.length) return [{ text: word, stressed: true }];
  // syllable boundaries: consonants between nucleus k and k+1
  const sylls = [];
  let start = 0;
  for (let k = 0; k < nuclei.length; k++) {
    const [, nEnd] = nuclei[k];
    let end;
    if (k === nuclei.length - 1) end = units.length;
    else {
      const nextStart = nuclei[k + 1][0];
      const consonants = nextStart - nEnd - 1;
      end = consonants <= 1 ? nEnd + 1 : nEnd + 2; // cluster: first consonant stays
    }
    sylls.push(units.slice(start, end).map((u) => u.c).join(''));
    start = end;
  }
  return sylls.map((text) => ({ text, stressed: /[̀́͂]/.test(nfd(text)) }));
}

// ---------------------------------------------------------------------------
// transliteration ("read the word")
// ---------------------------------------------------------------------------

/** Canonical transliteration from the alphabet table: letter by letter, γ-nasal, rough breathing → h. */
export function transliterate(word, alphabet) {
  const map = new Map(alphabet.letters.map((l) => [l.lower[0], l.translit.split(' ')[0]]));
  map.set('ς', 's');
  const rough = hasRough(word);
  const chars = [...stripMarks(word).toLowerCase()];
  let out = '';
  for (let i = 0; i < chars.length; i++) {
    const c = chars[i];
    if (c === 'γ' && 'γκχξ'.includes(chars[i + 1] || '')) { out += 'n'; continue; }
    out += map.get(c) || '';
  }
  return (rough ? 'h' : '') + out;
}

export function normalizeTranslit(s) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z]/g, '')
    .replace(/y/g, 'u').replace(/ph/g, 'f').replace(/kh/g, 'ch').replace(/ks/g, 'x').replace(/dz/g, 'z').replace(/ng/g, 'ng');
}

function levenshtein(a, b) {
  const m = a.length; const n = b.length;
  if (!m) return n; if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[n];
}

export function checkTranslit(input, word, alphabet) {
  const want = normalizeTranslit(transliterate(word, alphabet));
  const got = normalizeTranslit(input);
  if (!got) return false;
  // rough breathing 'h' is the commonest slip; tolerate one edit on longer words
  return got === want || (want.length >= 6 && levenshtein(want, got) <= 1);
}

// ---------------------------------------------------------------------------
// example words (from the lexicon) for a set of letters
// ---------------------------------------------------------------------------

/** High-frequency words made only of the given letters (no rough breathing / γ-nasal unless allowed). */
export function wordsFor(lexicon, allowedLetters, { allowRough = false, max = 200 } = {}) {
  const allowed = new Set(allowedLetters.map(baseLower));
  const out = [];
  for (const it of lexicon.items) {
    if (it.rank > 1500 || /^\p{Lu}/u.test(it.lemma) || /[\s,()/]/.test(it.lemma)) continue;
    const base = baseLower(it.lemma);
    if (base.length < 2 || ![...base].every((c) => allowed.has(c))) continue;
    if (!allowRough && hasRough(it.lemma)) continue;
    if (!allowRough && /γ[γκχξ]/.test(base)) continue;
    out.push(it);
    if (out.length >= max) break;
  }
  return out;
}

/** The most frequent word beginning with each letter (for intro cards). */
export function exampleWord(lexicon, letter) {
  const b = baseLower(letter);
  return lexicon.items.find((it) => baseLower(it.lemma).startsWith(b) && !/[\s,()/]/.test(it.lemma)) || null;
}

// ---------------------------------------------------------------------------
// session building
// ---------------------------------------------------------------------------

export function shuffle(arr, rng = Math.random) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
const pick = (arr, n, rng = Math.random) => shuffle(arr, rng).slice(0, n);

// Confusable pairs for name/shape questions (M10: interleave what is confusable).
const CONFUSABLE = { ν: 'υ', υ: 'ν', ρ: 'π', π: 'ρ', χ: 'ξ', ξ: 'χ', η: 'ν', ω: 'ο', ο: 'ω', ε: 'η', ζ: 'ξ', ψ: 'φ', φ: 'ψ', γ: 'ν', δ: 'α', λ: 'α', κ: 'χ', τ: 'γ', σ: 'ο', μ: 'ν', ι: 'ν', θ: 'φ', β: 'δ', α: 'δ' };

function letterOptions(alphabet, target, lessonLetters, rng, n = 3) {
  const others = alphabet.letters.filter((l) => l !== target);
  const conf = others.filter((l) => l.lower[0] === CONFUSABLE[target.lower[0]]);
  const inLesson = others.filter((l) => lessonLetters.includes(l) && !conf.includes(l));
  const rest = others.filter((l) => !conf.includes(l) && !inLesson.includes(l));
  return [...conf, ...pick(inLesson, n, rng), ...pick(rest, n, rng)].slice(0, n);
}

/**
 * Build the step list for one alphabet lesson.
 *   lesson:   the lesson object from data/units/unit-01-foundations.json
 *   alphabet: data/alphabet.json
 *   lexicon:  loaded lexicon (for example words)
 *   scheme:   'erasmian' | 'koine'
 *   extra:    { subscriptWords, plainWords, accentWords } optional word pools for lessons 3–4
 */
export function buildAlphabetSession({ lesson, alphabet, lexicon, scheme = 'erasmian', extra = {}, rng = Math.random, handwriting = false }) {
  const steps = [];
  const sound = (l) => l[scheme];
  if (lesson.rule) steps.push({ kind: 'rule', rule: lesson.rule });

  if (lesson.alphabet.letters) {
    const letters = lesson.alphabet.letters.map((ch) => alphabet.letters.find((l) => l.lower[0] === ch));
    const allLearned = alphabet.letters.slice(0, alphabet.letters.indexOf(letters[letters.length - 1]) + 1);
    // blocks of 4: intro each, then ask each (M9)
    for (let i = 0; i < letters.length; i += 4) {
      const block = letters.slice(i, i + 4);
      // each letter: meet it, then trace it (handwriting builds the shape into the hand and the eye)
      block.forEach((l) => { steps.push({ kind: 'intro-letter', letter: l, example: exampleWord(lexicon, l.lower[0]) }); if (handwriting) steps.push({ kind: 'trace', letter: l }); });
      shuffle(block, rng).forEach((l) => steps.push(letterQuestion('name-mc', l, letters, alphabet, sound, rng)));
    }
    // mixed pass over all letters, one random format each (M8)
    const formats = ['letter-mc', 'sound-mc', 'translit-type', 'name-mc'];
    shuffle(letters, rng).forEach((l, i) => steps.push(letterQuestion(formats[i % formats.length], l, letters, alphabet, sound, rng)));
    // read whole words made of letters learned so far (production, M17)
    const pool = wordsFor(lexicon, allLearned.map((l) => l.lower[0]));
    pick(pool.slice(0, 40), 4, rng).forEach((w) => steps.push({ kind: 'question', format: 'read-word', word: w.lemma, gloss: w.gloss, attempt: 1 }));
    // handwriting mode: copy two whole words by hand after reading them
    if (handwriting) pick(pool.slice(0, 40), 2, rng).forEach((w) => steps.push({ kind: 'trace-word', word: w.lemma, gloss: w.gloss }));
  }

  const sections = lesson.alphabet.sections || [];
  if (sections.includes('diphthongs')) {
    steps.push({ kind: 'intro-vowels', vowels: alphabet.vowels });
    alphabet.diphthongs.forEach((d) => steps.push({ kind: 'intro-diphthong', d }));
    steps.push({ kind: 'intro-subscript', s: alphabet.iotaSubscript });
    alphabet.breathing.forEach((b) => steps.push({ kind: 'intro-breathing', b }));
    // questions
    shuffle(alphabet.diphthongs, rng).forEach((d) => {
      const others = alphabet.diphthongs.filter((o) => o !== d && o[scheme] !== d[scheme]);
      const opts = shuffle([d, ...pick(others, 3, rng)], rng);
      steps.push({ kind: 'question', format: 'diphthong-sound-mc', prompt: d.text, hint: `diphthong · how does it sound? (${scheme})`,
        options: opts.map((o) => ({ id: o.text, text: o[scheme] })), answerId: d.text,
        answer: `${d.text} = ${d[scheme]}`, reason: `Example: ${d.example}` , attempt: 1 });
    });
    const breathWords = (extra.plainWords || []).filter((w) => hasRough(w) || hasSmooth(w));
    pick(breathWords, 6, rng).forEach((w) => steps.push({ kind: 'question', format: 'breathing-mc', prompt: w, hint: 'Does this word start with an h sound?',
      options: [{ id: 'rough', text: 'Yes — rough breathing ( ῾ )' }, { id: 'smooth', text: 'No — smooth breathing ( ᾿ )' }],
      answerId: hasRough(w) ? 'rough' : 'smooth', answer: `${w} — ${hasRough(w) ? 'rough breathing: h' + transliterate(w, alphabet).slice(1) : 'smooth breathing: no h'}`,
      reason: hasRough(w) ? 'The mark curls like a c ( ῾ ): add an h.' : 'The mark curls like a backwards c ( ᾿ ): no sound.', attempt: 1 }));
    const subs = extra.subscriptWords || [];
    const plain = (extra.plainWords || []).filter((w) => !hasSubscript(w));
    for (let i = 0; i < 3 && subs.length; i++) {
      const target = subs[Math.floor(rng() * subs.length)];
      const opts = shuffle([target, ...pick(plain, 3, rng)], rng);
      steps.push({ kind: 'question', format: 'subscript-mc', prompt: 'Which word has an iota subscript?', promptGreek: false, hint: 'look under the vowels',
        options: opts.map((w) => ({ id: w, text: w, greek: true })), answerId: target, answer: target,
        reason: 'The tiny iota under α, η or ω is silent but usually marks the dative case.', attempt: 1 });
    }
    pick(extra.plainWords || [], 4, rng).forEach((w) => steps.push({ kind: 'question', format: 'read-word', word: w, attempt: 1 }));
    if (handwriting) pick(extra.plainWords || [], 2, rng).forEach((w) => steps.push({ kind: 'trace-word', word: w }));
  }

  if (sections.includes('accents')) {
    steps.push({ kind: 'intro-accents', accents: alphabet.accents, rule: alphabet.accentRule });
    steps.push({ kind: 'intro-punctuation', punctuation: alphabet.punctuation });
    steps.push({ kind: 'intro-syllables', text: alphabet.syllables });
    const words = extra.accentWords || [];
    // which accent?
    pick(words.filter((w) => accentOf(w)), 4, rng).forEach((w) => steps.push({ kind: 'question', format: 'accent-mc', prompt: w, hint: 'Which accent does this word carry?',
      options: [{ id: 'acute', text: 'acute ( ´ )' }, { id: 'grave', text: 'grave ( ` )' }, { id: 'circumflex', text: 'circumflex ( ῀ )' }],
      answerId: accentOf(w), answer: `${w} — ${accentOf(w)}`, reason: accentReason(accentOf(w)), attempt: 1 }));
    // how many syllables?
    pick(words.filter((w) => syllabify(w).length >= 2), 4, rng).forEach((w) => {
      const n = syllabify(w).length;
      steps.push({ kind: 'question', format: 'syllable-count-mc', prompt: w, hint: 'How many syllables?',
        options: [1, 2, 3, 4, 5].map((k) => ({ id: String(k), text: String(k) })), answerId: String(n),
        answer: `${syllabify(w).map((s) => s.text).join('-')} — ${n} syllable${n > 1 ? 's' : ''}`, reason: 'One syllable per vowel or diphthong.', attempt: 1 });
    });
    // which syllable is stressed?
    pick(words.filter((w) => syllabify(w).length >= 2 && syllabify(w).some((s) => s.stressed)), 4, rng).forEach((w) => {
      const sy = syllabify(w);
      const idx = sy.findIndex((s) => s.stressed);
      steps.push({ kind: 'question', format: 'stress-mc', prompt: w, hint: 'Which syllable is stressed?',
        options: sy.map((s, i) => ({ id: String(i), text: s.text, greek: true })), answerId: String(idx),
        answer: sy.map((s, i) => (i === idx ? s.text.toUpperCase() : s.text)).join('-'), reason: 'Stress the syllable that carries the accent mark, whichever mark it is.', attempt: 1 });
    });
    // punctuation
    shuffle(alphabet.punctuation, rng).forEach((p) => {
      const opts = shuffle(alphabet.punctuation, rng);
      steps.push({ kind: 'question', format: 'punctuation-mc', prompt: p.mark, hint: 'What does this mark mean?',
        options: opts.map((o) => ({ id: o.mark, text: o.meaning })), answerId: p.mark, answer: `${p.mark} = ${p.meaning}`,
        reason: p.mark === ';' ? 'The Greek question mark looks exactly like our semicolon.' : p.mark === '·' ? 'A raised dot is a strong pause: semicolon or colon.' : '', attempt: 1 });
    });
    pick(words, 4, rng).forEach((w) => steps.push({ kind: 'question', format: 'read-word', word: w, attempt: 1 }));
  }
  return steps;
}

function accentReason(kind) {
  return {
    acute: 'Acute ( ´ ) can sit on any of the last three syllables.',
    grave: 'Grave ( ` ) only replaces an acute on the last syllable when another word follows.',
    circumflex: 'Circumflex ( ῀ ) needs a long vowel or diphthong, on one of the last two syllables.',
  }[kind] || '';
}

function letterQuestion(format, l, lessonLetters, alphabet, sound, rng) {
  const distract = letterOptions(alphabet, l, lessonLetters, rng);
  const base = { kind: 'question', format, letter: l, attempt: 1 };
  if (format === 'name-mc') {
    const opts = shuffle([l, ...distract], rng);
    return { ...base, prompt: `${l.upper} ${l.lower}`, promptLetter: true, hint: 'What is this letter called?',
      options: opts.map((o) => ({ id: o.name, text: o.name })), answerId: l.name, answer: `${l.lower} = ${l.name}`, reason: `Sounds like: ${sound(l)}` };
  }
  if (format === 'letter-mc') {
    const opts = shuffle([l, ...distract], rng);
    return { ...base, prompt: l.name, promptGreek: false, hint: 'Which letter is this?',
      options: opts.map((o) => ({ id: o.name, text: `${o.upper} ${o.lower}`, greek: true })), answerId: l.name, answer: `${l.name} = ${l.upper} ${l.lower}`, reason: `Sounds like: ${sound(l)}` };
  }
  if (format === 'sound-mc') {
    const others = alphabet.letters.filter((o) => o !== l && sound(o) !== sound(l));
    const opts = shuffle([l, ...pick(others, 3, rng)], rng);
    return { ...base, prompt: `${l.upper} ${l.lower}`, promptLetter: true, hint: 'How does it sound?',
      options: opts.map((o) => ({ id: o.name, text: sound(o) })), answerId: l.name, answer: `${l.lower} (${l.name}) = ${sound(l)}`, reason: `Transliterated ${l.translit}.` };
  }
  // translit-type
  return { ...base, prompt: `${l.upper} ${l.lower}`, promptLetter: true, hint: 'Type this letter in English letters (its transliteration)',
    typed: { placeholder: 'e.g. a, b, g…' }, answerText: l.translit, answer: `${l.lower} = ${l.translit}`, reason: `${l.name}: ${sound(l)}` };
}

/** Grade any alphabet question. `input` is the option id or typed text. */
export function gradeAlphabet(step, input, alphabet) {
  if (step.format === 'read-word') return checkTranslit(input, step.word, alphabet);
  if (step.format === 'translit-type') {
    const accepted = step.letter.translit.split(/[\/ ]+/).map(normalizeTranslit).filter(Boolean);
    return accepted.includes(normalizeTranslit(input));
  }
  return input === step.answerId;
}

export function requeueAlphabet(steps, index, step) {
  steps.splice(Math.min(steps.length, index + 4), 0, { ...step, attempt: step.attempt + 1 });
}
