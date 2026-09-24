/*
  speech.js — spoken pronunciation (PEDAGOGY M27) with no audio files: the
  browser's Web Speech API.

    koine    → the device's Greek voice (el-GR) reads the Greek text. Modern
               Greek pronunciation is the closest living relative of the
               reconstructed Koine scheme (it differs mainly in η/υ/οι).
    erasmian → no Erasmian voice exists anywhere, so the word is respelled
               phonetically (LOH-gos, an-THROH-pos) and read by an English
               voice. An approximation, clearly labelled as such in Settings.

  If the device has no Greek voice, the Koine scheme also falls back to a
  respelling (with Koine vowel values). `settings.autoSpeak` controls whether
  new words are spoken automatically; speaker buttons always work.
*/
import { getSettings } from './storage.js';
import { syllabify, hasRough, stripMarks } from './alphabet.js';

export function available() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

let voiceList = [];
function refreshVoices() { if (available()) voiceList = window.speechSynthesis.getVoices() || []; }
if (available()) { refreshVoices(); window.speechSynthesis.onvoiceschanged = refreshVoices; }

export function voices() { refreshVoices(); return voiceList; }
export function greekVoice() { return voices().find((v) => /^el/i.test(v.lang)) || null; }
export function englishVoice() { return voices().find((v) => /^en/i.test(v.lang)) || voices()[0] || null; }

// ---- phonetic respelling -------------------------------------------------

const ERASMIAN = {
  di: { αι: 'eye', ει: 'ay', οι: 'oy', υι: 'wee', αυ: 'ow', ευ: 'yoo', ου: 'oo', ηυ: 'ayoo' },
  ch: { α: 'ah', β: 'b', γ: 'g', δ: 'd', ε: 'eh', ζ: 'dz', η: 'ay', θ: 'th', ι: 'ee', κ: 'k', λ: 'l', μ: 'm', ν: 'n', ξ: 'ks', ο: 'o', π: 'p', ρ: 'r', σ: 's', τ: 't', υ: 'oo', φ: 'f', χ: 'kh', ψ: 'ps', ω: 'oh' },
};
const KOINE = {
  di: { αι: 'eh', ει: 'ee', οι: 'ee', υι: 'ee', αυ: 'av', ευ: 'ev', ου: 'oo', ηυ: 'eev' },
  ch: { α: 'ah', β: 'v', γ: 'gh', δ: 'th', ε: 'eh', ζ: 'z', η: 'ee', θ: 'th', ι: 'ee', κ: 'k', λ: 'l', μ: 'm', ν: 'n', ξ: 'ks', ο: 'o', π: 'p', ρ: 'r', σ: 's', τ: 't', υ: 'ee', φ: 'f', χ: 'kh', ψ: 'ps', ω: 'oh' },
};

function respellSyllable(syl, table) {
  const base = stripMarks(syl).toLowerCase().replace(/ς/g, 'σ').replace(/[^α-ω]/g, '');
  let out = '';
  for (let i = 0; i < base.length; i++) {
    const pair = base.slice(i, i + 2);
    if (table.di[pair]) { out += table.di[pair]; i++; continue; }
    if (base[i] === 'γ' && 'γκχξ'.includes(base[i + 1] || '')) { out += 'ng'; continue; }
    out += table.ch[base[i]] || '';
  }
  return out;
}

/** Phonetic respelling of one Greek word for an English voice: "λόγος" → "LOH-gos". */
export function respell(word, scheme = 'erasmian') {
  const table = scheme === 'koine' ? KOINE : ERASMIAN;
  const sylls = syllabify(word);
  const parts = sylls.map((s) => {
    const r = respellSyllable(s.text, table);
    return s.stressed && sylls.length > 1 ? r.toUpperCase() : r;
  }).filter(Boolean);
  // "keye" confuses English voices; "kigh" reads as intended
  const joined = parts.join('-').replace(/([bcdfghklmnprstvz])eye/gi, (m, c) => `${c}igh`).replace(/([BCDFGHKLMNPRSTVZ])EYE/g, (m, c) => `${c}IGH`);
  return (hasRough(word) ? 'h' : '') + joined;
}

/** Respell a phrase word by word (punctuation becomes pauses). */
export function respellText(text, scheme) {
  return text.split(/\s+/).map((w) => {
    const core = w.replace(/[^Ͱ-Ͽἀ-῿]/g, '');
    const punct = /[.,;·]$/.test(w) ? ',' : '';
    return core ? respell(core, scheme) + punct : '';
  }).filter(Boolean).join(' ');
}

// ---- speaking ------------------------------------------------------------

let current = null;

/** Speak Greek text in the learner's pronunciation scheme. Returns the mode used: 'greek-voice' | 'respell' | 'unavailable'. */
export function speak(text, { scheme, rate } = {}) {
  if (!available() || !text) return 'unavailable';
  const s = getSettings();
  scheme = scheme || s.pronunciation || 'erasmian';
  rate = rate || clampRate(s.speechRate);
  const synth = window.speechSynthesis;
  synth.cancel();
  const gv = greekVoice();
  let u;
  let mode;
  if (scheme === 'koine' && gv) {
    u = new SpeechSynthesisUtterance(text);
    u.voice = gv; u.lang = gv.lang; u.rate = rate;
    mode = 'greek-voice';
  } else {
    u = new SpeechSynthesisUtterance(respellText(text, scheme));
    const ev = englishVoice();
    if (ev) { u.voice = ev; u.lang = ev.lang; }
    u.rate = rate * 0.9; // respelled syllables need a touch more time than real Greek
    mode = 'respell';
  }
  current = u;
  synth.speak(u);
  return mode;
}

export function clampRate(r) {
  const n = Number(r);
  return Number.isFinite(n) ? Math.min(1.1, Math.max(0.5, n)) : 0.7;
}

export function stop() { if (available()) window.speechSynthesis.cancel(); }

/** Markup for a speaker button; clicks are handled by initSpeech()'s delegation. */
export function speakerHtml(text, { small = false } = {}) {
  const esc = String(text).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  return `<button class="speak-btn ${small ? 'small' : ''}" type="button" data-speak="${esc}" aria-label="Listen" title="Listen">
    <svg viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path d="M16 8.5a4 4 0 0 1 0 7M18.5 6a7.5 7.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
  </button>`;
}

/** One-time per page: click delegation for [data-speak]. Returns whether speech is available. */
export function initSpeech() {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest && e.target.closest('[data-speak]');
    if (!btn) return;
    e.preventDefault(); e.stopPropagation();
    speak(btn.dataset.speak);
    btn.classList.add('speaking');
    setTimeout(() => btn.classList.remove('speaking'), 1200);
  });
  if (!available()) document.documentElement.classList.add('no-speech');
  return available();
}

/** Speak automatically when the learner has auto-speak on (new words, verses). */
export function autoSpeak(text) {
  const s = getSettings();
  if (s.autoSpeak === false) return;
  speak(text);
}
