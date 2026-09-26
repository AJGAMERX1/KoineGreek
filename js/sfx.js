/*
  sfx.js — answer sound cues (right / wrong / rate), synthesized with the Web
  Audio API so no audio files are shipped. Off via settings.sfx.
  Must be triggered from a user gesture (answering is a click/keypress).
*/
import { getSettings } from './storage.js';

let ctx = null;
let silentEl = null;
let lastNudge = 0;

function audio() {
  if (typeof window === 'undefined' || !(window.AudioContext || window.webkitAudioContext)) return null;
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

/**
 * iOS quirk: Web Audio output is silenced by the ringer/mute switch UNLESS an
 * HTML media element has played in the session, which moves the page's audio
 * session to the "playback" category. Playing a tiny silent clip on user
 * gestures is what Duolingo/Quizlet-style web apps do so cues sound with the
 * switch on silent. Harmless elsewhere.
 */
function silentWavUrl() {
  const sampleRate = 8000, seconds = 0.08, n = Math.floor(sampleRate * seconds);
  const buf = new ArrayBuffer(44 + n * 2); const v = new DataView(buf);
  const str = (o, t) => { for (let i = 0; i < t.length; i++) v.setUint8(o + i, t.charCodeAt(i)); };
  str(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); str(8, 'WAVE'); str(12, 'fmt ');
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, sampleRate, true);
  v.setUint32(28, sampleRate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); str(36, 'data'); v.setUint32(40, n * 2, true);
  return URL.createObjectURL(new Blob([buf], { type: 'audio/wav' }));
}

function nudgePlaybackSession() {
  if (typeof document === 'undefined') return;
  const now = Date.now();
  if (now - lastNudge < 1500) return; // once per gesture burst is plenty
  lastNudge = now;
  try {
    if (!silentEl) {
      silentEl = document.createElement('audio');
      silentEl.setAttribute('playsinline', '');
      silentEl.setAttribute('x-webkit-airplay', 'deny');
      silentEl.preload = 'auto';
      silentEl.src = silentWavUrl();
      silentEl.hidden = true;
      silentEl.setAttribute('aria-hidden', 'true');
      document.body.appendChild(silentEl);
    }
    silentEl.currentTime = 0;
    const p = silentEl.play();
    if (p && p.catch) p.catch(() => {});
  } catch (e) { /* no media element support: nothing to do */ }
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

/**
 * Warm the context up on the first gesture so the first cue is not swallowed on
 * iOS, and keep nudging the playback session on later gestures so cues play with
 * the mute switch on. Also re-resume after the app returns from the background.
 */
export function initSfx() {
  const onGesture = () => { if (enabled()) { audio(); nudgePlaybackSession(); } };
  document.addEventListener('pointerdown', onGesture, { passive: true });
  document.addEventListener('keydown', onGesture, { passive: true });
  document.addEventListener('visibilitychange', () => { if (!document.hidden && ctx && ctx.state === 'suspended') ctx.resume().catch(() => {}); });
}
