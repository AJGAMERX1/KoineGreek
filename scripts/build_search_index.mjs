/*
  build_search_index.mjs — writes data/search-forms.json: every inflected form
  attested in the SBLGNT, grouped by lemma, so the Lexicon search finds a word
  from a form copied out of a verse (θεοῦ → θεός, ἠγάπησεν → ἀγαπάω), including
  the rare words that data/forms.json leaves out (it only covers lemmas with 10+
  occurrences). Derived from data/gnt/*.json; re-run after scripts/build_data.py.

    node scripts/build_search_index.mjs
*/
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeGreek } from '../js/lexicon.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const lexicon = JSON.parse(readFileSync(path.join(ROOT, 'data/lexicon.json'), 'utf8'));
const byLemma = new Map(); // lemma -> Map(normalized form -> display form)
// strip punctuation, elision marks and anything that is not a Greek letter or combining mark
const clean = (t) => t.normalize('NFC').replace(/[^Ͱ-Ͽἀ-῿̀-ͯ]/g, '');
// display form: grave (in running text) shown as acute, first letter lower-cased unless the lemma is a name
const display = (t, lemma) => {
  let s = clean(t).normalize('NFD').replace(/̀/g, '́').normalize('NFC');
  if (lemma[0] === lemma[0].toLowerCase()) s = s.toLowerCase();
  return s;
};
let tokens = 0;
for (const f of readdirSync(path.join(ROOT, 'data/gnt'))) {
  const book = JSON.parse(readFileSync(path.join(ROOT, 'data/gnt', f), 'utf8'));
  for (const ch of Object.values(book.chapters)) for (const v of Object.values(ch)) for (const w of v.words) {
    tokens++;
    const src = w.n || w.t;
    const key = normalizeGreek(clean(src));
    if (!key || key === normalizeGreek(w.l)) continue;
    if (!byLemma.has(w.l)) byLemma.set(w.l, new Map());
    const m = byLemma.get(w.l);
    if (!m.has(key)) m.set(key, display(src, w.l));
  }
}
const forms = {};
let n = 0;
for (const it of lexicon.items) {
  const m = byLemma.get(it.id);
  if (!m) continue;
  forms[it.id] = [...m.values()].join(' ');
  n += m.size;
}
const out = { _meta: { source: 'SBLGNT via data/gnt/*.json (MorphGNT). Each value: space-separated inflected forms of that lemma as they occur in the text (not the lemma itself). Built by scripts/build_search_index.mjs.', tokens, lemmas: Object.keys(forms).length, forms: n }, forms };
writeFileSync(path.join(ROOT, 'data/search-forms.json'), JSON.stringify(out));
console.log(`search-forms.json: ${Object.keys(forms).length} lemmas, ${n} forms from ${tokens} tokens`);
