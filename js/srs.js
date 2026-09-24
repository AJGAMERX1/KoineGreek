/*
  srs.js — simplified SM-2 spaced-repetition scheduler.

  Drives both vocab review (js/storage.js vocabSRS) and reading-verse
  review (readingHistory) — same function, same record shape, so any
  future review surface (e.g. parsing drills) can reuse it too.

  The app's UI only ever asks the learner to self-rate with 3 buttons
  (Missed it / Close / Nailed it), not the 0-5 scale SM-2 was designed
  around, so RATING_TO_QUALITY below is the one place that mapping lives.
  Objective drills (js/drill.js) add one more key: 'good' for a correct
  multiple-choice answer, which is worth less than a correct typed or
  produced answer ('nailed') — PEDAGOGY M12/M30.
*/

export const RATING_TO_QUALITY = {
  miss: 1,
  close: 3,
  good: 4,   // objectively correct on a recognition format (multiple choice) — used by drills, not by self-rating
  nailed: 5,
};

const MIN_EASE_FACTOR = 1.3;
const DEFAULT_EASE_FACTOR = 2.5;

function emptyRecord() {
  return {
    repetitions: 0,
    easeFactor: DEFAULT_EASE_FACTOR,
    interval: 0, // days
    dueDate: null,
    lastReviewed: null,
  };
}

/**
 * Compute the next review record given a prior record (or null/undefined
 * for a never-studied item) and a rating key ('miss' | 'close' | 'nailed').
 * Returns a NEW record object — does not mutate the input or touch storage;
 * callers pass the result to storage.js's update functions.
 */
export function scheduleReview(record, ratingKey, now = new Date()) {
  const quality = RATING_TO_QUALITY[ratingKey];
  if (quality === undefined) {
    throw new Error(`srs.scheduleReview: unknown rating "${ratingKey}"`);
  }

  const prev = record ? { ...emptyRecord(), ...record } : emptyRecord();
  let { repetitions, easeFactor } = prev;
  let interval;

  if (quality < 3) {
    // Missed it — restart the review cycle, but don't punish the ease factor
    // as harshly as a "close" near-miss would.
    repetitions = 0;
    interval = 1;
  } else {
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(prev.interval * easeFactor);
    }
    repetitions += 1;
  }

  easeFactor = Math.max(
    MIN_EASE_FACTOR,
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  );

  const dueDate = new Date(now);
  dueDate.setDate(dueDate.getDate() + interval);

  return {
    repetitions,
    easeFactor: Math.round(easeFactor * 100) / 100,
    interval,
    dueDate: dueDate.toISOString(),
    lastReviewed: now.toISOString(),
  };
}

/** True if a record is due for review (or has never been reviewed). */
export function isDue(record, now = new Date()) {
  if (!record || !record.dueDate) return true;
  return new Date(record.dueDate) <= now;
}
