/*
  lexicon.js — Lexicon tab logic (no DOM): search and filter over the
  frequency-ranked lexicon, plus each word's learning status.
*/

export function normalizeGreek(s) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').normalize('NFC').toLowerCase().replace(/ς/g, 'σ');
}

const isGreek = (s) => /[Ͱ-Ͽἀ-῿]/.test(s);

/** 'strong' | 'learning' | 'due' | 'new' | 'gloss-only' */
export function statusOf(item, records, now = new Date(), scheduleMin = 10) {
  const r = records[item.id];
  if (!r) return item.count < scheduleMin ? 'gloss-only' : 'new';
  if (r.dueDate && new Date(r.dueDate) <= now) return 'due';
  return r.repetitions >= 3 ? 'strong' : 'learning';
}

/**
 * Filter + rank. query: Greek (accent-insensitive prefix, then substring) or
 * English (substring of the gloss). filter: all | studied | due | new | core.
 */
export function searchLexicon(items, { query = '', filter = 'all', records = {}, now = new Date(), coreMin = 50 } = {}) {
  const q = query.trim();
  const greek = q && isGreek(q);
  const nq = greek ? normalizeGreek(q) : q.toLowerCase();
  const out = [];
  for (const it of items) {
    if (filter === 'core' && it.count < coreMin) continue;
    if (filter !== 'all' && filter !== 'core') {
      const st = statusOf(it, records, now);
      if (filter === 'studied' && !(st === 'strong' || st === 'learning' || st === 'due')) continue;
      if (filter === 'due' && st !== 'due') continue;
      if (filter === 'new' && st !== 'new') continue;
    }
    let score = 0;
    if (q) {
      if (greek) {
        const nl = normalizeGreek(it.lemma);
        if (nl.startsWith(nq)) score = 2; else if (nl.includes(nq)) score = 1; else continue;
      } else {
        const g = it.gloss.toLowerCase();
        const alts = g.split(/[,;/]/).map((a) => a.replace(/^\s*(i|to|a|an|the)\s+/, '').trim());
        if (alts.some((a) => a === nq)) score = 3; else if (alts.some((a) => a.startsWith(nq))) score = 2; else if (g.includes(nq)) score = 1; else continue;
      }
    }
    out.push({ item: it, score });
  }
  out.sort((a, b) => b.score - a.score || a.item.rank - b.item.rank);
  return out.map((o) => o.item);
}
