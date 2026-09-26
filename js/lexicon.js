/*
  lexicon.js — Lexicon tab logic (no DOM): search and filter over the
  frequency-ranked lexicon, plus each word's learning status.
*/

export function normalizeGreek(s) {
  return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').normalize('NFC').toLowerCase().replace(/ς/g, 'σ');
}

const isGreek = (s) => /[Ͱ-Ͽἀ-῿]/.test(s);
// quotes, elision marks and punctuation a learner may paste along with a word from a verse
const stripPunct = (s) => s.replace(/[()]/g, '').replace(/[’'ʼ᾽`´,.;·:!?\[\]"“”«»—–-]/g, ' ').replace(/\s+/g, ' ').trim();
// Five lemmas carry an optional final letter, e.g. οὕτω(ς), ἔξεστι(ν): match both spellings.
const lemmaKeyCache = new WeakMap();
const lemmaKeys = (it) => {
  let k = lemmaKeyCache.get(it);
  if (!k) { const a = normalizeGreek(it.lemma.replace(/\([^)]*\)/g, '')), b = normalizeGreek(it.lemma.replace(/[()]/g, '')); k = a === b ? [a] : [a, b]; lemmaKeyCache.set(it, k); }
  return k;
};

// ---------- transliteration ("logos", "agape", "Christos") ----------
const ROMAN = { α: 'a', β: 'b', γ: 'g', δ: 'd', ε: 'e', ζ: 'z', η: 'e', θ: 'th', ι: 'i', κ: 'k', λ: 'l', μ: 'm', ν: 'n', ξ: 'x', ο: 'o', π: 'p', ρ: 'r', σ: 's', τ: 't', υ: 'u', φ: 'ph', χ: 'ch', ψ: 'ps', ω: 'o' };
/** Greek → plain Latin letters (γγ → ng). Breathings and accents are dropped. */
export function romanize(greek) {
  // rough breathing (U+0314) on the opening vowel or ρ → h (ἁμαρτία → hamartia, ῥῆμα → rhema)
  const d = String(greek || '').normalize('NFD');
  const m = d.match(/^([\u0370-\u03ff][\u0300-\u036f]*){1,2}/);
  const rough = m && m[0].includes('\u0314');
  const g = normalizeGreek(greek).replace(/γ(?=[γκξχ])/g, 'ν');
  let out = '';
  for (const ch of g) out += ROMAN[ch] !== undefined ? ROMAN[ch] : /[a-z]/.test(ch) ? ch : '';
  if (rough) out = out[0] === 'r' ? 'rh' + out.slice(1) : 'h' + out;
  return out;
}
/** Loose key so the usual spellings meet: kh/ch, ph/f, th, y/u, v/u, c/k, w/o, j/i, x/ks, gg/ng, no h, no doubled letters. */
export function looseLatin(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z]/g, '')
    .replace(/ch|kh/g, 'C').replace(/ph/g, 'f').replace(/th/g, 'T').replace(/ps/g, 'P').replace(/x/g, 'ks')
    .replace(/h/g, '').replace(/[yv]/g, 'u').replace(/c/g, 'k').replace(/w/g, 'o').replace(/j/g, 'i').replace(/gg/g, 'ng')
    .replace(/(.)\1+/g, '$1');
}
const latinKeys = new WeakMap();
const latinKey = (it) => { let k = latinKeys.get(it); if (k === undefined) { k = looseLatin(romanize(it.lemma)); latinKeys.set(it, k); } return k; };

// ---------- inflected forms (data/search-forms.json) ----------
/**
 * Build a search index from data/search-forms.json's `forms` map (lemma id → space-separated forms).
 * Returns Map(normalized form → [{ id, form }]).
 */
export function buildFormIndex(formsByLemma) {
  const idx = new Map();
  for (const [id, list] of Object.entries(formsByLemma || {})) {
    for (const form of list.split(' ')) {
      const k = normalizeGreek(form);
      if (!k) continue;
      if (!idx.has(k)) idx.set(k, []);
      idx.get(k).push({ id, form });
    }
  }
  return idx;
}

/** 'strong' | 'learning' | 'due' | 'new' | 'gloss-only' */
export function statusOf(item, records, now = new Date(), scheduleMin = 10) {
  const r = records[item.id];
  if (!r) return item.count < scheduleMin ? 'gloss-only' : 'new';
  if (r.dueDate && new Date(r.dueDate) <= now) return 'due';
  return r.repetitions >= 3 ? 'strong' : 'learning';
}

/**
 * Filter + rank. Returns [{ item, score, via }] where `via` is the inflected
 * form or transliteration that matched (null for a direct lemma / gloss match).
 *
 * Greek query (accent-, breathing-, case- and final-sigma-insensitive):
 *   lemma exact 6 · form exact 5 · lemma prefix 3 · form prefix 2 · lemma substring 1
 * Latin query:
 *   gloss exact 4 · transliteration exact 4 · gloss prefix 2 · transliteration prefix 1.5 · gloss substring 1
 * filter: all | studied | due | new | core. `formIndex` from buildFormIndex (optional).
 */
export function searchLexiconDetailed(items, { query = '', filter = 'all', records = {}, now = new Date(), coreMin = 50, formIndex = null } = {}) {
  const q = stripPunct(String(query || ''));
  const greek = q && isGreek(q);
  const nq = greek ? normalizeGreek(q) : q.toLowerCase();
  const lq = !greek && q ? looseLatin(q) : '';
  // Greek: which lemmas does the query hit through an inflected form?
  const viaForm = new Map(); // id -> { score, form }
  if (greek && formIndex) {
    const exact = formIndex.get(nq);
    if (exact) for (const h of exact) viaForm.set(h.id, { score: 5, form: h.form });
    if (nq.length >= 3) {
      for (const [k, hits] of formIndex) {
        if (k === nq || !k.startsWith(nq)) continue;
        for (const h of hits) if (!viaForm.has(h.id)) viaForm.set(h.id, { score: 2, form: h.form });
      }
    }
  }
  const out = [];
  for (const it of items) {
    if (filter === 'core' && it.count < coreMin) continue;
    if (filter !== 'all' && filter !== 'core') {
      const st = statusOf(it, records, now);
      if (filter === 'studied' && !(st === 'strong' || st === 'learning' || st === 'due')) continue;
      if (filter === 'due' && st !== 'due') continue;
      if (filter === 'new' && st !== 'new') continue;
    }
    let score = 0, via = null;
    if (q) {
      if (greek) {
        const keys = lemmaKeys(it);
        if (keys.includes(nq)) score = 6;
        else if (keys.some((k) => k.startsWith(nq))) score = 3;
        else if (nq.length >= 2 && keys.some((k) => k.includes(nq))) score = 1;
        const f = viaForm.get(it.id);
        if (f && f.score > score) { score = f.score; via = f.form; }
        if (!score) continue;
      } else {
        const g = String(it.gloss || '').toLowerCase();
        const alts = g.split(/[,;/]/).map((a) => a.replace(/^\s*(i|to|a|an|the)\s+/, '').trim());
        if (alts.some((a) => a === nq)) score = 4; else if (alts.some((a) => a.startsWith(nq))) score = 2; else if (g.includes(nq)) score = 1;
        if (lq.length >= 2) {
          const k = latinKey(it);
          if (k === lq && score < 4) { score = 4; via = romanize(it.lemma); }
          else if (lq.length >= 3 && k.startsWith(lq) && score < 1.5) { score = 1.5; via = romanize(it.lemma); }
        }
        if (!score) continue;
      }
    }
    out.push({ item: it, score, via });
  }
  out.sort((a, b) => b.score - a.score || a.item.rank - b.item.rank);
  return out;
}

/** Same as searchLexiconDetailed, items only. */
export function searchLexicon(items, opts = {}) {
  return searchLexiconDetailed(items, opts).map((o) => o.item);
}
