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
