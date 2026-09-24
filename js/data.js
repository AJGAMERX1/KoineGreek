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

export function loadForms() {
  return loadJson('./data/forms.json');
}

export function loadIrregularVerbs() {
  return loadJson('./data/irregular-verbs.json');
}
