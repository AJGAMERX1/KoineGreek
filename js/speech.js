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

// ---- text preparation ----------------------------------------------------

/**
 * Modern Greek voices expect MONOTONIC text. Polytonic marks (breathings,
 * circumflex, grave, iota subscript) make them stumble or fall silent — ὁ
 * came out as nothing. Convert: drop breathings and subscripts, turn grave
 * and circumflex into the acute (tonos), keep the dieresis, remove "(ν)".
 */
export function toMonotonic(text) {
  return text.normalize('NFD')
    .replace(/[\u0313\u0314\u0345]/g, '')      // smooth, rough breathing, iota subscript
    .replace(/[\u0300\u0342]/g, '\u0301')      // grave, perispomeni → acute
    .replace(/\(ν\)/g, 'ν')
    .normalize('NFC');
}

/** Split a verse into clauses at punctuation; each chunk carries the pause that follows it (ms). */
export function phraseChunks(text) {
  const out = [];
  const re = /([^.,;·!?:]+)([.,;·!?:]*)/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const chunk = m[1].trim();
    if (!chunk) continue;
    const p = m[2];
    const pause = /[.;·!?:]/.test(p) ? 650 : p ? 350 : 0;
    out.push({ text: chunk, pause });
  }
  return out;
}

// ---- speaking ------------------------------------------------------------

let current = null;
let sequenceToken = 0;

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
    u = new SpeechSynthesisUtterance(toMonotonic(text));
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

/**
 * Speak a verse the way a reader would: clause by clause, with a breath at
 * commas and a longer pause at full stops and raised dots, a little slower
 * than single words. Returns the mode used.
 */
export function speakVerse(text, opts = {}) {
  if (!available() || !text) return 'unavailable';
  const s = getSettings();
  const scheme = opts.scheme || s.pronunciation || 'erasmian';
  const rate = (opts.rate || clampRate(s.speechRate)) * 0.92;
  const chunks = phraseChunks(text);
  if (!chunks.length) return 'unavailable';
  const synth = window.speechSynthesis;
  synth.cancel();
  const token = ++sequenceToken;
  const gv = greekVoice();
  const useGreek = scheme === 'koine' && gv;
  const ev = englishVoice();
  let i = 0;
  const next = () => {
    if (token !== sequenceToken || i >= chunks.length) return;
    const c = chunks[i++];
    const u = new SpeechSynthesisUtterance(useGreek ? toMonotonic(c.text) : respellText(c.text, scheme));
    if (useGreek) { u.voice = gv; u.lang = gv.lang; u.rate = rate; }
    else { if (ev) { u.voice = ev; u.lang = ev.lang; } u.rate = rate * 0.9; }
    u.onend = () => { if (token === sequenceToken) setTimeout(next, c.pause); };
    u.onerror = () => { if (token === sequenceToken) setTimeout(next, 150); };
    current = u;
    synth.speak(u);
  };
  next();
  return useGreek ? 'greek-voice' : 'respell';
}

export function clampRate(r) {
  const n = Number(r);
  return Number.isFinite(n) ? Math.min(1.1, Math.max(0.5, n)) : 0.7;
}

export function stop() { sequenceToken++; if (available()) window.speechSynthesis.cancel(); }

/** Markup for a speaker button; clicks are handled by initSpeech()'s delegation. */
export function speakerHtml(text, { small = false, verse = false } = {}) {
  const esc = String(text).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  return `<button class="speak-btn ${small ? 'small' : ''}" type="button" data-speak="${esc}" ${verse ? 'data-speak-mode="verse"' : ''} aria-label="Listen" title="Listen">
    <svg viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path d="M16 8.5a4 4 0 0 1 0 7M18.5 6a7.5 7.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
  </button>`;
}

/** One-time per page: click delegation for [data-speak]. Returns whether speech is available. */
export function initSpeech() {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest && e.target.closest('[data-speak]');
    if (!btn) return;
    e.preventDefault(); e.stopPropagation();
    if (btn.dataset.speakMode === 'verse') speakVerse(btn.dataset.speak); else speak(btn.dataset.speak);
    btn.classList.add('speaking');
    setTimeout(() => btn.classList.remove('speaking'), 1200);
  });
  if (!available()) document.documentElement.classList.add('no-speech');
  return available();
}

/** Speak automatically when the learner has auto-speak on (new words, verses). */
export function autoSpeak(text, { verse = false } = {}) {
  const s = getSettings();
  if (s.autoSpeak === false) return;
  if (verse) speakVerse(text); else speak(text);
}
