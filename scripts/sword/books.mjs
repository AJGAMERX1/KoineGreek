// Canonical 66-book model + KJV (1769) versification, used by the SWORD readers.
//
// Ported from the user's BibleStudy project (src/index/books.js and the
// versification oracle its reverse-engineered SWORD parsers validated
// against). The verses-per-chapter table below IS the SWORD "KJV" v11n that
// RWP and TSK are keyed to; it was derived from the KJV 1769 text
// (OT: 39 books, 929 chapters, 23145 verses; NT: 27 books, 260 chapters,
// 7957 verses).

// [num, canonicalName, osis, [aliases...]]  (aliases lowercased, no spaces)
export const BOOKS = [
  [1, 'Genesis', 'Gen', ['gen', 'ge', 'gn']],
  [2, 'Exodus', 'Exod', ['exo', 'ex', 'exod']],
  [3, 'Leviticus', 'Lev', ['lev', 'le', 'lv']],
  [4, 'Numbers', 'Num', ['num', 'nu', 'nm', 'nb']],
  [5, 'Deuteronomy', 'Deut', ['deut', 'dt', 'de']],
  [6, 'Joshua', 'Josh', ['josh', 'jos', 'jsh']],
  [7, 'Judges', 'Judg', ['judg', 'jdg', 'jg', 'jdgs']],
  [8, 'Ruth', 'Ruth', ['ruth', 'rut', 'rth', 'ru']],
  [9, '1 Samuel', '1Sam', ['1sam', '1sa', '1s', '1samuel', 'isam', '1sm']],
  [10, '2 Samuel', '2Sam', ['2sam', '2sa', '2s', '2samuel', 'iisam', '2sm']],
  [11, '1 Kings', '1Kgs', ['1kgs', '1ki', '1kg', '1kings', 'ikgs', '1k']],
  [12, '2 Kings', '2Kgs', ['2kgs', '2ki', '2kg', '2kings', 'iikgs', '2k']],
  [13, '1 Chronicles', '1Chr', ['1chr', '1ch', '1chron', '1chronicles', 'ichr']],
  [14, '2 Chronicles', '2Chr', ['2chr', '2ch', '2chron', '2chronicles', 'iichr']],
  [15, 'Ezra', 'Ezra', ['ezra', 'ezr', 'ez']],
  [16, 'Nehemiah', 'Neh', ['neh', 'ne']],
  [17, 'Esther', 'Esth', ['esth', 'est', 'es']],
  [18, 'Job', 'Job', ['job', 'jb']],
  [19, 'Psalms', 'Ps', ['ps', 'psa', 'psalm', 'psalms', 'pss', 'psm']],
  [20, 'Proverbs', 'Prov', ['prov', 'pro', 'pr', 'prv']],
  [21, 'Ecclesiastes', 'Eccl', ['eccl', 'ecc', 'ec', 'qoh', 'eccles']],
  [22, 'Song of Solomon', 'Song', ['song', 'sos', 'sng', 'so', 'cant', 'canticles', 'songofsolomon', 'songofsongs', 'solomonssong']],
  [23, 'Isaiah', 'Isa', ['isa', 'is']],
  [24, 'Jeremiah', 'Jer', ['jer', 'je', 'jr']],
  [25, 'Lamentations', 'Lam', ['lam', 'la']],
  [26, 'Ezekiel', 'Ezek', ['ezek', 'eze', 'ezk']],
  [27, 'Daniel', 'Dan', ['dan', 'da', 'dn']],
  [28, 'Hosea', 'Hos', ['hos', 'ho']],
  [29, 'Joel', 'Joel', ['joel', 'joe', 'jl']],
  [30, 'Amos', 'Amos', ['amos', 'am']],
  [31, 'Obadiah', 'Obad', ['obad', 'oba', 'ob']],
  [32, 'Jonah', 'Jonah', ['jonah', 'jon', 'jnh']],
  [33, 'Micah', 'Mic', ['mic', 'mc']],
  [34, 'Nahum', 'Nah', ['nah', 'na']],
  [35, 'Habakkuk', 'Hab', ['hab', 'hb']],
  [36, 'Zephaniah', 'Zeph', ['zeph', 'zep', 'zp']],
  [37, 'Haggai', 'Hag', ['hag', 'hg']],
  [38, 'Zechariah', 'Zech', ['zech', 'zec', 'zc']],
  [39, 'Malachi', 'Mal', ['mal', 'ml']],
  [40, 'Matthew', 'Matt', ['matt', 'mat', 'mt', 'matthew']],
  [41, 'Mark', 'Mark', ['mark', 'mrk', 'mk', 'mr']],
  [42, 'Luke', 'Luke', ['luke', 'luk', 'lk']],
  [43, 'John', 'John', ['john', 'joh', 'jhn', 'jn']],
  [44, 'Acts', 'Acts', ['acts', 'act', 'ac']],
  [45, 'Romans', 'Rom', ['rom', 'ro', 'rm']],
  [46, '1 Corinthians', '1Cor', ['1cor', '1co', '1corinthians', 'icor', '1c']],
  [47, '2 Corinthians', '2Cor', ['2cor', '2co', '2corinthians', 'iicor', '2c']],
  [48, 'Galatians', 'Gal', ['gal', 'ga']],
  [49, 'Ephesians', 'Eph', ['eph', 'ephes']],
  [50, 'Philippians', 'Phil', ['phil', 'php', 'pp', 'philippians']],
  [51, 'Colossians', 'Col', ['col', 'co']],
  [52, '1 Thessalonians', '1Thess', ['1thess', '1th', '1thes', '1thessalonians', 'ithess']],
  [53, '2 Thessalonians', '2Thess', ['2thess', '2th', '2thes', '2thessalonians', 'iithess']],
  [54, '1 Timothy', '1Tim', ['1tim', '1ti', '1timothy', 'itim', '1tm']],
  [55, '2 Timothy', '2Tim', ['2tim', '2ti', '2timothy', 'iitim', '2tm']],
  [56, 'Titus', 'Titus', ['titus', 'tit', 'ti']],
  [57, 'Philemon', 'Phlm', ['phlm', 'phm', 'philem', 'philemon', 'pm']],
  [58, 'Hebrews', 'Heb', ['heb', 'hebrews']],
  [59, 'James', 'Jas', ['jas', 'jm', 'james', 'jam']],
  [60, '1 Peter', '1Pet', ['1pet', '1pe', '1peter', 'ipet', '1pt', '1p']],
  [61, '2 Peter', '2Pet', ['2pet', '2pe', '2peter', 'iipet', '2pt', '2p']],
  [62, '1 John', '1John', ['1john', '1jn', '1jo', '1joh', 'ijohn', '1j']],
  [63, '2 John', '2John', ['2john', '2jn', '2jo', '2joh', 'iijohn', '2j']],
  [64, '3 John', '3John', ['3john', '3jn', '3jo', '3joh', 'iiijohn', '3j']],
  [65, 'Jude', 'Jude', ['jude', 'jud', 'jd']],
  [66, 'Revelation', 'Rev', ['rev', 're', 'rv', 'revelation', 'apoc', 'apocalypse']],
];

// Verses per chapter, KJV (1769) versification, indexed by book number - 1.
export const KJV_VERSES = [
  [31,25,24,26,32,22,24,22,29,32,32,20,18,24,21,16,27,33,38,18,34,24,20,67,34,35,46,22,35,43,55,32,20,31,29,43,36,30,23,23,57,38,34,34,28,34,31,22,33,26],
  [22,25,22,31,23,30,25,32,35,29,10,51,22,31,27,36,16,27,25,26,36,31,33,18,40,37,21,43,46,38,18,35,23,35,35,38,29,31,43,38],
  [17,16,17,35,19,30,38,36,24,20,47,8,59,57,33,34,16,30,37,27,24,33,44,23,55,46,34],
  [54,34,51,49,31,27,89,26,23,36,35,16,33,45,41,50,13,32,22,29,35,41,30,25,18,65,23,31,40,16,54,42,56,29,34,13],
  [46,37,29,49,33,25,26,20,29,22,32,32,18,29,23,22,20,22,21,20,23,30,25,22,19,19,26,68,29,20,30,52,29,12],
  [18,24,17,24,15,27,26,35,27,43,23,24,33,15,63,10,18,28,51,9,45,34,16,33],
  [36,23,31,24,31,40,25,35,57,18,40,15,25,20,20,31,13,31,30,48,25],
  [22,23,18,22],
  [28,36,21,22,12,21,17,22,27,27,15,25,23,52,35,23,58,30,24,42,15,23,29,22,44,25,12,25,11,31,13],
  [27,32,39,12,25,23,29,18,13,19,27,31,39,33,37,23,29,33,43,26,22,51,39,25],
  [53,46,28,34,18,38,51,66,28,29,43,33,34,31,34,34,24,46,21,43,29,53],
  [18,25,27,44,27,33,20,29,37,36,21,21,25,29,38,20,41,37,37,21,26,20,37,20,30],
  [54,55,24,43,26,81,40,40,44,14,47,40,14,17,29,43,27,17,19,8,30,19,32,31,31,32,34,21,30],
  [17,18,17,22,14,42,22,18,31,19,23,16,22,15,19,14,19,34,11,37,20,12,21,27,28,23,9,27,36,27,21,33,25,33,27,23],
  [11,70,13,24,17,22,28,36,15,44],
  [11,20,32,23,19,19,73,18,38,39,36,47,31],
  [22,23,15,17,14,14,10,17,32,3],
  [22,13,26,21,27,30,21,22,35,22,20,25,28,22,35,22,16,21,29,29,34,30,17,25,6,14,23,28,25,31,40,22,33,37,16,33,24,41,30,24,34,17],
  [6,12,8,8,12,10,17,9,20,18,7,8,6,7,5,11,15,50,14,9,13,31,6,10,22,12,14,9,11,12,24,11,22,22,28,12,40,22,13,17,13,11,5,26,17,11,9,14,20,23,19,9,6,7,23,13,11,11,17,12,8,12,11,10,13,20,7,35,36,5,24,20,28,23,10,12,20,72,13,19,16,8,18,12,13,17,7,18,52,17,16,15,5,23,11,13,12,9,9,5,8,28,22,35,45,48,43,13,31,7,10,10,9,8,18,19,2,29,176,7,8,9,4,8,5,6,5,6,8,8,3,18,3,3,21,26,9,8,24,13,10,7,12,15,21,10,20,14,9,6],
  [33,22,35,27,23,35,27,36,18,32,31,28,25,35,33,33,28,24,29,30,31,29,35,34,28,28,27,28,27,33,31],
  [18,26,22,16,20,12,29,17,18,20,10,14],
  [17,17,11,16,16,13,13,14],
  [31,22,26,6,30,13,25,22,21,34,16,6,22,32,9,14,14,7,25,6,17,25,18,23,12,21,13,29,24,33,9,20,24,17,10,22,38,22,8,31,29,25,28,28,25,13,15,22,26,11,23,15,12,17,13,12,21,14,21,22,11,12,19,12,25,24],
  [19,37,25,31,31,30,34,22,26,25,23,17,27,22,21,21,27,23,15,18,14,30,40,10,38,24,22,17,32,24,40,44,26,22,19,32,21,28,18,16,18,22,13,30,5,28,7,47,39,46,64,34],
  [22,22,66,22,22],
  [28,10,27,17,17,14,27,18,11,22,25,28,23,23,8,63,24,32,14,49,32,31,49,27,17,21,36,26,21,26,18,32,33,31,15,38,28,23,29,49,26,20,27,31,25,24,23,35],
  [21,49,30,37,31,28,28,27,27,21,45,13],
  [11,23,5,19,15,11,16,14,17,15,12,14,16,9],
  [20,32,21],
  [15,16,15,13,27,14,17,14,15],
  [21],
  [17,10,10,11],
  [16,13,12,13,15,16,20],
  [15,13,19],
  [17,20,19],
  [18,15,20],
  [15,23],
  [21,13,10,14,11,15,14,23,17,12,17,14,9,21],
  [14,17,18,6],
  [25,23,17,25,48,34,29,34,38,42,30,50,58,36,39,28,27,35,30,34,46,46,39,51,46,75,66,20],
  [45,28,35,41,43,56,37,38,50,52,33,44,37,72,47,20],
  [80,52,38,44,39,49,50,56,62,42,54,59,35,35,32,31,37,43,48,47,38,71,56,53],
  [51,25,36,54,47,71,53,59,41,42,57,50,38,31,27,33,26,40,42,31,25],
  [26,47,26,37,42,15,60,40,43,48,30,25,52,28,41,40,34,28,41,38,40,30,35,27,27,32,44,31],
  [32,29,31,25,21,23,25,39,33,21,36,21,14,23,33,27],
  [31,16,23,21,13,20,40,13,27,33,34,31,13,40,58,24],
  [24,17,18,18,21,18,16,24,15,18,33,21,14],
  [24,21,29,31,26,18],
  [23,22,21,32,33,24],
  [30,30,21,23],
  [29,23,25,18],
  [10,20,13,18,28],
  [12,17,18],
  [20,15,16,16,25,21],
  [18,26,17,22],
  [16,15,15],
  [25],
  [14,18,19,16,14,20,28,13,28,39,40,29,25],
  [27,26,18,17,20],
  [25,25,22,19,14],
  [21,22,18],
  [10,29,24,21,21],
  [13],
  [14],
  [25],
  [20,29,22,11,14,17,17,13,21,11,19,17,18,20,8,21,18,24,21,15,27,21],
];

export const NT_FIRST_BOOK = 40;

const byNum = new Map();
const aliasToNum = new Map();
const norm = (s) => String(s).toLowerCase().replace(/[\s.'’\-]/g, '');

for (const [num, name, osis, aliases] of BOOKS) {
  byNum.set(num, { num, name, osis });
  aliasToNum.set(norm(name), num);
  aliasToNum.set(norm(osis), num);
  for (const a of aliases) aliasToNum.set(norm(a), num);
}

export function bookName(num) { return byNum.get(num)?.name || null; }
export function bookOsis(num) { return byNum.get(num)?.osis || null; }
export function isNT(num) { return num >= NT_FIRST_BOOK; }

/** Lowercase hyphenated slug of the canonical name: "1 Samuel" -> "1-samuel". */
export function bookSlug(num) {
  const name = bookName(num);
  return name ? name.toLowerCase().replace(/\s+/g, '-') : null;
}

/** Normalize a raw book token ("1cor", "I Cor", "Song of Songs") -> ordinal, or null. */
export function bookNumFromName(raw) {
  if (!raw) return null;
  let s = String(raw).trim().toLowerCase();
  // Roman-numeral prefixes -> arabic, only as a standalone token ("ii cor" -> "2 cor").
  s = s.replace(/^iii\s+/, '3 ').replace(/^ii\s+/, '2 ').replace(/^i\s+/, '1 ');
  const n = s.replace(/[\s.'’\-]/g, '');
  return aliasToNum.has(n) ? aliasToNum.get(n) : null;
}

/** Book list for one testament, in the shape the commentary reader's slot builder wants. */
export function testamentBooks(testament) {
  const range = testament === 'ot' ? [1, NT_FIRST_BOOK - 1] : [NT_FIRST_BOOK, 66];
  const out = [];
  for (let num = range[0]; num <= range[1]; num++) {
    out.push({ bookNum: num, name: bookName(num), chapters: KJV_VERSES[num - 1] });
  }
  return out;
}
