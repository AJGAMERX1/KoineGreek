/*
  data.js — loaders for the generated content under data/ (see README
  § Project structure and data/LICENSES.md). Everything is fetched once and
  cached in memory for the life of the page. No module other than this one
  should fetch data files.
*/

const cache = new Map();

async function loadJson(path) {
  if (!cache.has(path)) {
    cache.set(path, fetch(path).then((res) => {
      if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
      return res.json();
    }));
  }
  return cache.get(path);
}

export function loadCurriculum() {
  return loadJson('./data/curriculum.json');
}

export function loadUnit(unitId) {
  return loadJson(`./data/units/${unitId}.json`);
}

/** Resolve a lesson id like "u01-first-words" to { unit, lesson } (full content). */
export async function loadLesson(lessonId) {
  const curriculum = await loadCurriculum();
  const unitIndex = curriculum.units.find((u) => u.lessons.some((l) => l.id === lessonId));
  if (!unitIndex) throw new Error(`unknown lesson ${lessonId}`);
  const unit = await loadUnit(unitIndex.id);
  return { unit, lesson: unit.lessons.find((l) => l.id === lessonId) };
}

let lexiconIndex = null;

/** The full lexicon: { items: [...], byId: Map } — items are frequency-ranked. */
export async function loadLexicon() {
  if (!lexiconIndex) {
    const lex = await loadJson('./data/lexicon.json');
    lexiconIndex = { items: lex.items, byId: new Map(lex.items.map((i) => [i.id, i])), meta: lex._meta };
  }
  return lexiconIndex;
}

export function loadBook(slug) {
  return loadJson(`./data/gnt/${slug}.json`);
}

export function loadParadigms() {
  return loadJson('./data/paradigms.json');
}

export function loadAlphabet() {
  return loadJson('./data/alphabet.json');
}

export function loadStats() {
  return loadJson('./data/stats.json');
}

/** Robertson's Word Pictures for one NT book: { chapters: { "1": { "1": "text…" } } } */
export function loadWordPictures(slug) {
  return loadJson(`./data/rwp/${slug}.json`);
}

/** Treasury of Scripture Knowledge cross-references for one NT book. */
export function loadXrefs(slug) {
  return loadJson(`./data/xrefs/${slug}.json`);
}

let strongsIndex = null;

/** Strong's Greek dictionary entries keyed by number (string), only those our lexicon links to. */
export async function loadStrongs() {
  if (!strongsIndex) {
    const d = await loadJson('./data/strongs-greek.json');
    strongsIndex = d.entries;
  }
  return strongsIndex;
}

/** The Strong's entries for a lexicon item (its `strongs` field may be one number or several). */
export function strongsFor(item, entries) {
  if (!item || !item.strongs || !entries) return [];
  const nums = Array.isArray(item.strongs) ? item.strongs : [item.strongs];
  return nums.map((n) => ({ number: n, ...(entries[String(n)] || {}) })).filter((e) => e.def);
}

let occIndex = null;

/** First verses (canonical order) where a lemma occurs: { lemma: ["john-1-1", ...] } */
export async function loadOccurrences() {
  if (!occIndex) occIndex = (await loadJson('./data/occurrences.json')).occurrences;
  return occIndex;
}

/** "john-1-1" → { slug: "john", chapter: 1, verse: 1 } */
export function parseVerseId(id) {
  const parts = id.split('-');
  return { slug: parts.slice(0, -2).join('-'), chapter: Number(parts[parts.length - 2]), verse: Number(parts[parts.length - 1]) };
}

export function loadForms() {
  return loadJson('./data/forms.json');
}

export function loadIrregularVerbs() {
  return loadJson('./data/irregular-verbs.json');
}
