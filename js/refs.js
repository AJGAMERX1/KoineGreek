/*
  refs.js — Bible reference parsing for the reader's jump box and cross-refs.
  Book model + alias list ported from the user's BibleStudy project
  (src/index/books.js). The app holds the New Testament only; Old Testament
  names are still recognised so the UI can say so instead of failing.
*/

// [slug, name, number(1..66), aliases...]  (aliases lowercased, no spaces/dots)
export const BOOKS = [
  ['genesis', 'Genesis', 1, 'gen', 'ge', 'gn'], ['exodus', 'Exodus', 2, 'exo', 'ex', 'exod'], ['leviticus', 'Leviticus', 3, 'lev', 'le', 'lv'],
  ['numbers', 'Numbers', 4, 'num', 'nu', 'nm', 'nb'], ['deuteronomy', 'Deuteronomy', 5, 'deut', 'dt', 'de'], ['joshua', 'Joshua', 6, 'josh', 'jos', 'jsh'],
  ['judges', 'Judges', 7, 'judg', 'jdg', 'jg', 'jdgs'], ['ruth', 'Ruth', 8, 'rut', 'rth', 'ru'], ['1-samuel', '1 Samuel', 9, '1sam', '1sa', '1s', 'isam', '1sm'],
  ['2-samuel', '2 Samuel', 10, '2sam', '2sa', '2s', 'iisam', '2sm'], ['1-kings', '1 Kings', 11, '1kgs', '1ki', '1kg', 'ikgs', '1k'], ['2-kings', '2 Kings', 12, '2kgs', '2ki', '2kg', 'iikgs', '2k'],
  ['1-chronicles', '1 Chronicles', 13, '1chr', '1ch', '1chron', 'ichr'], ['2-chronicles', '2 Chronicles', 14, '2chr', '2ch', '2chron', 'iichr'], ['ezra', 'Ezra', 15, 'ezr', 'ez'],
  ['nehemiah', 'Nehemiah', 16, 'neh', 'ne'], ['esther', 'Esther', 17, 'esth', 'est', 'es'], ['job', 'Job', 18, 'jb'], ['psalms', 'Psalms', 19, 'ps', 'psa', 'psalm', 'pss', 'psm'],
  ['proverbs', 'Proverbs', 20, 'prov', 'pro', 'pr', 'prv'], ['ecclesiastes', 'Ecclesiastes', 21, 'eccl', 'ecc', 'ec', 'qoh', 'eccles'],
  ['song-of-solomon', 'Song of Solomon', 22, 'song', 'sos', 'sng', 'so', 'cant', 'canticles', 'songofsongs', 'solomonssong'], ['isaiah', 'Isaiah', 23, 'isa', 'is'],
  ['jeremiah', 'Jeremiah', 24, 'jer', 'je', 'jr'], ['lamentations', 'Lamentations', 25, 'lam', 'la'], ['ezekiel', 'Ezekiel', 26, 'ezek', 'eze', 'ezk'], ['daniel', 'Daniel', 27, 'dan', 'da', 'dn'],
  ['hosea', 'Hosea', 28, 'hos', 'ho'], ['joel', 'Joel', 29, 'joe', 'jl'], ['amos', 'Amos', 30, 'am'], ['obadiah', 'Obadiah', 31, 'obad', 'ob'], ['jonah', 'Jonah', 32, 'jon', 'jnh'],
  ['micah', 'Micah', 33, 'mic', 'mc'], ['nahum', 'Nahum', 34, 'nah', 'na'], ['habakkuk', 'Habakkuk', 35, 'hab', 'hb'], ['zephaniah', 'Zephaniah', 36, 'zeph', 'zep', 'zp'],
  ['haggai', 'Haggai', 37, 'hag', 'hg'], ['zechariah', 'Zechariah', 38, 'zech', 'zec', 'zc'], ['malachi', 'Malachi', 39, 'mal', 'ml'],
  ['matthew', 'Matthew', 40, 'matt', 'mat', 'mt'], ['mark', 'Mark', 41, 'mrk', 'mk', 'mr'], ['luke', 'Luke', 42, 'luk', 'lk'], ['john', 'John', 43, 'joh', 'jhn', 'jn'],
  ['acts', 'Acts', 44, 'act', 'ac'], ['romans', 'Romans', 45, 'rom', 'ro', 'rm'], ['1-corinthians', '1 Corinthians', 46, '1cor', '1co', 'icor', '1c'],
  ['2-corinthians', '2 Corinthians', 47, '2cor', '2co', 'iicor', '2c'], ['galatians', 'Galatians', 48, 'gal', 'ga'], ['ephesians', 'Ephesians', 49, 'eph', 'ephes'],
  ['philippians', 'Philippians', 50, 'phil', 'php', 'pp'], ['colossians', 'Colossians', 51, 'col', 'co'], ['1-thessalonians', '1 Thessalonians', 52, '1thess', '1th', '1thes', 'ithess'],
  ['2-thessalonians', '2 Thessalonians', 53, '2thess', '2th', '2thes', 'iithess'], ['1-timothy', '1 Timothy', 54, '1tim', '1ti', 'itim', '1tm'], ['2-timothy', '2 Timothy', 55, '2tim', '2ti', 'iitim', '2tm'],
  ['titus', 'Titus', 56, 'tit', 'ti'], ['philemon', 'Philemon', 57, 'phlm', 'phm', 'philem', 'pm'], ['hebrews', 'Hebrews', 58, 'heb'], ['james', 'James', 59, 'jas', 'jm', 'jam'],
  ['1-peter', '1 Peter', 60, '1pet', '1pe', 'ipet', '1pt', '1p'], ['2-peter', '2 Peter', 61, '2pet', '2pe', 'iipet', '2pt', '2p'], ['1-john', '1 John', 62, '1jn', '1jo', '1joh', 'ijohn', '1j'],
  ['2-john', '2 John', 63, '2jn', '2jo', '2joh', 'iijohn', '2j'], ['3-john', '3 John', 64, '3jn', '3jo', '3joh', 'iiijohn', '3j'], ['jude', 'Jude', 65, 'jud', 'jd'],
  ['revelation', 'Revelation', 66, 'rev', 're', 'rv', 'apoc', 'apocalypse'],
];

const ALIAS = new Map();
for (const [slug, name, num, ...aliases] of BOOKS) {
  const keys = new Set([name.toLowerCase().replace(/[\s.]/g, ''), slug.replace(/-/g, ''), ...aliases]);
  for (const k of keys) ALIAS.set(k, { slug, name, number: num, nt: num >= 40 });
}

export function bookByName(text) {
  const key = String(text || '').toLowerCase().replace(/[\s.]/g, '').replace(/^i{1,3}(?=[a-z])/, (m) => String(m.length));
  return ALIAS.get(key) || null;
}

export function bookBySlug(slug) {
  const b = BOOKS.find((x) => x[0] === slug);
  return b ? { slug: b[0], name: b[1], number: b[2], nt: b[2] >= 40 } : null;
}

/**
 * "Jn 3:16", "John 3", "1 Cor 13:4-7", "Rom 8.28", "Rev" →
 * { slug, name, number, nt, chapter, verse, verseEnd, kind: 'book'|'chapter'|'verse' } or null.
 */
export function parseReference(input) {
  const s = String(input || '').trim();
  const m = s.match(/^((?:[1-3]|i{1,3})\s*)?([a-zA-Z][a-zA-Z\s.]*?)\s*(\d+)?\s*(?:[:.]\s*(\d+))?\s*(?:[-–]\s*(\d+))?\s*$/i);
  if (!m) return null;
  const book = bookByName((m[1] || '').replace(/\s/g, '') + (m[2] || ''));
  if (!book) return null;
  const chapter = m[3] != null ? parseInt(m[3], 10) : null;
  const verse = m[4] != null ? parseInt(m[4], 10) : null;
  const verseEnd = m[5] != null ? parseInt(m[5], 10) : verse;
  return { ...book, chapter, verse, verseEnd, kind: verse != null ? 'verse' : chapter != null ? 'chapter' : 'book' };
}
