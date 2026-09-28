/*
  reading.js — Read & Translate logic (no DOM). reading.html is the view.

  PEDAGOGY mandates this implements:
    M14/M15 real Greek from Unit 1, kept comprehensible by glossing
    M23  every word outside the learner's known set is one tap from gloss + lemma + parse
    M24  true known vocabulary (words with an SRS record) is tracked separately from what is glossed;
         each verse reports how much of it the learner owned before revealing anything
    M25  the task is comprehension: form the sense, reveal a reference translation, self-rate
    M19/M1 the self-rating schedules the verse through the same SM-2 as vocab (readingHistory)
    M30  XP scales with the rating and drops with reveals of words the learner is meant to know;
         taps on rare words (never scheduled) cost nothing
*/

import { scheduleReview } from './srs.js';
import { normalizeEnglish, sameWord, contentWords } from './drill.js';

export const SCHEDULE_MIN_COUNT = 10;
export const TRANSLATIONS = [
  { id: 'web', label: 'WEB', name: 'World English Bible' },
  { id: 'kjv', label: 'KJV', name: 'King James Version' },
  { id: 'ylt', label: 'YLT', name: "Young's Literal Translation" },
];

/** Recover the normalized form of a word when the compact 'n' field was omitted. */
export function normalizedForm(word) {
  return word.n || word.t.replace(/[^\wͰ-Ͽἀ-῿]/g, '');
}

/** Punctuation-free, for matching. */
export function isWordToken(word) {
  return /[Ͱ-Ͽἀ-῿]/.test(word.t);
}

/**
 * Annotate a verse's words with the learner's knowledge state.
 *   known:     lemma has a vocab SRS record (it has been studied at least once)
 *   glossOnly: lemma occurs fewer than SCHEDULE_MIN_COUNT times in the NT — never scheduled, always glossed
 */
export function annotate(verse, lexicon, records) {
  return verse.words.map((w) => {
    const item = lexicon.byId.get(w.l) || null;
    const count = item ? item.count : 0;
    return {
      ...w,
      item,
      known: !!records[w.l],
      glossOnly: count < SCHEDULE_MIN_COUNT,
    };
  });
}

/** Coverage of a verse by the learner's known set (running words, punctuation excluded). */
export function coverage(annotated) {
  const toks = annotated.filter(isWordToken);
  const known = toks.filter((w) => w.known).length;
  const schedulable = toks.filter((w) => !w.glossOnly).length;
  return { tokens: toks.length, known, knownShare: toks.length ? known / toks.length : 0, schedulable };
}

/** XP for a rated verse: rating base, minus one per reveal of a word the learner should own (M30). */
export function xpForVerse(rating, reveals) {
  const base = { nailed: 10, close: 6, miss: 2 }[rating] || 0;
  const penalised = reveals.filter((w) => !w.glossOnly).length;
  return Math.max(1, base - penalised);
}

/** Next readingHistory record for a verse after a self-rating. */
export function rateVerse(prevRecord, rating, reveals, now = new Date()) {
  const next = scheduleReview(prevRecord, rating, now);
  return {
    ...next,
    attempts: ((prevRecord && prevRecord.attempts) || 0) + 1,
    lastRating: rating,
    reveals: reveals.length,
  };
}

/** Where to start: the first verse the learner has never rated, else the beginning. */
export function startIndex(verseIds, readingRecords) {
  const i = verseIds.findIndex((id) => !readingRecords[id]);
  return i === -1 ? 0 : i;
}

/** Tapped words worth adding to the learner's vocabulary: scheduled-tier words not yet studied. */
export function suggestWords(revealedWords) {
  const seen = new Map();
  for (const w of revealedWords) {
    if (w.glossOnly || w.known || !w.item) continue;
    if (!seen.has(w.l)) seen.set(w.l, w.item);
  }
  return [...seen.values()];
}

// ---------------------------------------------------------------------------
// Write & translate: automatic, generous grading of the learner's own translation
// ---------------------------------------------------------------------------

// Greek words English usually carries by word order or leaves out: never required, never held against you.
const OPTIONAL_LEMMAS = new Set(['ὁ', 'δέ', 'μέν', 'τε', 'ἄν', 'γάρ', 'οὖν', 'καί', 'ὅτι', 'ἰδού', 'γε']);
// English that a gloss list can't predict: pronoun cases, "to be", common synonyms.
const EXTRA = {
  'εἰμί': 'is am are was were be been being exist there',
  'γίνομαι': 'become happen came come was were be made done arose',
  'αὐτός': 'he him his himself she her hers herself it its itself they them their theirs themselves same',
  'οὗτος': 'this these that those he him his she her it they them',
  'ἐκεῖνος': 'that those he him his she her it they them',
  'ὅς': 'who whom whose which what that',
  'ὅστις': 'who whoever whom which whatever that',
  'τίς': 'who whom whose which what why',
  'τις': 'someone something anyone anything certain some any one a man',
  'σύ': 'you your yours yourself yourselves',
  'ἐγώ': 'i me my mine myself we us our ours ourselves',
  'ἑαυτοῦ': 'himself herself itself themselves yourselves ourselves own',
  'οὐ': 'not no never nothing none cannot dont nor neither',
  'μή': 'not no never nothing none lest dont nor neither',
  'οὐδείς': 'no one nobody nothing none not',
  'πᾶς': 'all every whole everyone everything each any',
  'πολύς': 'many much great large',
  'μέγας': 'great large big loud',
  'θεός': 'divine godly',
  'λόγος': 'message speech saying account statement words',
  'ἀρχή': 'start origin first',
  'κόσμος': 'world',
  'λέγω': 'tell told answer answered ask asked',
  'ὁράω': 'look behold perceive',
  'εἶδον': 'see saw look',
  'ἔρχομαι': 'come came go went arrive',
  'ποιέω': 'do make perform',
  'δίδωμι': 'give grant',
  'λαμβάνω': 'take receive get',
  'γινώσκω': 'know understand learn recognize',
  'οἶδα': 'know understand',
  'ἀκούω': 'hear listen',
  'πιστεύω': 'believe trust faith',
  'ἀγαπάω': 'love',
  'δακρύω': 'cry cried tears',
  'κλαίω': 'cry cried weep wept mourn',
  'ἀπόλλυμι': 'die destroy destroyed lose lost perish ruin',
  'ἀποθνῄσκω': 'die died dead',
  'αἰώνιος': 'eternal everlasting forever',
  'μονογενής': 'only unique one',
  'σώζω': 'save saved rescue heal',
  'ἁμαρτία': 'sin sins',
  'χάρισμα': 'gift',
  'ὀψώνιον': 'wage wages pay pays payment',
  'μακάριος': 'blessed happy',
  'βασιλεία': 'kingdom reign rule',
  'οὐρανός': 'heaven heavens sky',
  'υἱός': 'son child',
  'κύριος': 'lord master',
  'ζωή': 'life live',
  'ἄνθρωπος': 'person people human mankind man men',
  'ἀδελφός': 'brother brothers brethren sister',
  'ἐν': 'in on among within by with at into',
  'εἰς': 'into to in for toward towards unto',
  'ἐκ': 'from out of by',
  'πρός': 'to toward towards with at against',
  'ἐπί': 'on upon over at to against',
  'διά': 'through because by for',
  'ἀπό': 'from away of',
  'ὑπό': 'by under',
  'μετά': 'with after among',
  'περί': 'about concerning around for',
  'ὡς': 'as like when how about',
  'ἵνα': 'so that in order to',
  'εἰ': 'if whether',
  'ἐάν': 'if whenever',
  'ἀλλά': 'but rather yet',
  'ἤ': 'or than',
};
const MINI_STOP = new Set(['a', 'an', 'the', 'of', 'to', 'i']);
// parentheses are kept as text here (the KJV puts whole clauses in them); normalizeEnglish would drop them
const unparen = (s) => String(s || '').replace(/[()[\]]/g, ' ');
const wordsOf = (s) => normalizeEnglish(unparen(s)).replace(/'/g, '').split(' ').filter(Boolean);
const keyWords = (s) => contentWords(unparen(s));

/** English words that would show a Greek word was translated: its gloss words plus EXTRA. */
function acceptableWords(lemma, item) {
  const fromGloss = item ? wordsOf(item.gloss.replace(/[()]/g, ' ')).filter((w) => !MINI_STOP.has(w)) : [];
  return [...new Set([...fromGloss, ...wordsOf(EXTRA[lemma] || '')])];
}

/**
 * Grade a free translation of a verse — generously, on meaning, not on matching one wording.
 *   coverage:   share of the verse's meaningful Greek words (article, δέ, καί, γάρ… optional) whose meaning
 *               shows up in the learner's English, via the lexicon gloss, EXTRA synonyms, stems and irregular forms;
 *               or, if higher, the share of a reference translation's key words the learner used.
 *   offTopic:   share of the learner's key words that neither a Greek word nor any reference explains.
 * Rating: nailed ≥ 70% (and ≤ 40% off-topic), close ≥ 30% (and ≤ 60% off-topic), otherwise miss.
 * Returns { rating, coverage, offTopic, tokens: [{ t, l, gloss, status: 'ok'|'missed'|'optional' }], missed: [...] }.
 */
export function gradeTranslation(verse, lexicon, text, references = []) {
  const typed = wordsOf(text);
  const typedKey = keyWords(text);
  // each English word can account for one Greek word (so "the Word" once doesn't cover all three λόγος);
  // optional words never use one up
  const used = new Array(typed.length).fill(false);
  const tokens = verse.words.filter(isWordToken).map((w) => {
    const item = lexicon.byId.get(w.l) || null;
    const optional = OPTIONAL_LEMMAS.has(w.l) || w.p === 'RA' || w.p === 'X-';
    const accept = acceptableWords(w.l, item);
    let hit = false;
    if (optional) hit = typed.some((u) => accept.some((a) => sameWord(u, a)));
    else {
      const i = typed.findIndex((u, k) => !used[k] && accept.some((a) => sameWord(u, a)));
      if (i >= 0) { used[i] = true; hit = true; }
    }
    return { t: w.t.replace(/[^\u0370-\u03ff\u1f00-\u1fff]/g, ''), l: w.l, gloss: item ? item.gloss : '', accept, optional, status: hit ? 'ok' : optional ? 'optional' : 'missed' };
  });
  const required = tokens.filter((x) => !x.optional);
  const byGreek = required.length ? required.filter((x) => x.status === 'ok').length / required.length : 1;
  // the reference route: some learners paraphrase an English Bible they know — that's fine too
  const refs = references.filter(Boolean);
  let byRef = 0;
  for (const r of refs) {
    const key = keyWords(r);
    if (!key.length) continue;
    const free = new Array(typed.length).fill(true);
    let got = 0;
    for (const k of key) { const i = typed.findIndex((u, j) => free[j] && sameWord(u, k)); if (i >= 0) { free[i] = false; got++; } }
    byRef = Math.max(byRef, got / key.length);
  }
  const coverage = typed.length ? Math.max(byGreek, byRef) : 0;
  const supported = (u) => tokens.some((x) => x.accept.some((a) => sameWord(u, a))) || refs.some((r) => wordsOf(r).some((k) => sameWord(u, k)));
  const offTopic = typedKey.length ? typedKey.filter((u) => !supported(u)).length / typedKey.length : 0;
  let rating = 'miss';
  if (coverage >= 0.7 && offTopic <= 0.4) rating = 'nailed';
  else if (coverage >= 0.3 && offTopic <= 0.6) rating = 'close';
  const missed = [];
  const seen = new Set();
  for (const x of tokens) if (x.status === 'missed' && !seen.has(x.l)) { seen.add(x.l); missed.push(x); }
  return { rating, coverage, byGreek, byRef, offTopic, tokens: tokens.map(({ accept, ...rest }) => rest), missed };
}
