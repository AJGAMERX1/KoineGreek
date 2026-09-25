/*
  sfx.js — answer sound cues (right / wrong / rate), synthesized with the Web
  Audio API so no audio files are shipped. Off via settings.sfx.
  Must be triggered from a user gesture (answering is a click/keypress).
*/
import { getSettings } from './storage.js';

let ctx = null;

function audio() {
  if (typeof window === 'undefined' || !(window.AudioContext || window.webkitAudioContext)) return null;
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

export function enabled() {
  return getSettings().sfx !== false;
}

/** One tone: sine at `freq` Hz starting at `at` seconds, `dur` long, quick attack, exponential decay. */
function tone(ac, freq, at, dur, gain = 0.18, type = 'sine') {
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, at);
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(gain, at + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  o.connect(g).connect(ac.destination);
  o.start(at);
  o.stop(at + dur + 0.02);
}

/** Correct: a bright two-note rise (C6 → E6), Duolingo/Quizlet-style. */
export function playCorrect() {
  if (!enabled()) return;
  const ac = audio(); if (!ac) return;
  const t = ac.currentTime + 0.01;
  tone(ac, 1046.5, t, 0.18, 0.16);
  tone(ac, 1318.5, t + 0.11, 0.26, 0.18);
  tone(ac, 2637, t + 0.11, 0.2, 0.04); // a faint octave for sparkle
}

/** Wrong: a soft, short low buzz — informative, not punishing. */
export function playWrong() {
  if (!enabled()) return;
  const ac = audio(); if (!ac) return;
  const t = ac.currentTime + 0.01;
  tone(ac, 196, t, 0.22, 0.14, 'triangle');
  tone(ac, 185, t + 0.09, 0.22, 0.12, 'triangle');
}

/** A quiet tick for neutral actions (rating a verse, moving on). */
export function playTick() {
  if (!enabled()) return;
  const ac = audio(); if (!ac) return;
  tone(ac, 880, ac.currentTime + 0.01, 0.07, 0.08);
}

/** Session finished: a short ascending arpeggio. */
export function playComplete() {
  if (!enabled()) return;
  const ac = audio(); if (!ac) return;
  const t = ac.currentTime + 0.01;
  [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(ac, f, t + i * 0.09, 0.3, 0.14));
}

/** Warm the context up on the first gesture so the first cue is not swallowed on iOS. */
export function initSfx() {
  const warm = () => { audio(); document.removeEventListener('pointerdown', warm); document.removeEventListener('keydown', warm); };
  document.addEventListener('pointerdown', warm, { once: true });
  document.addEventListener('keydown', warm, { once: true });
}
