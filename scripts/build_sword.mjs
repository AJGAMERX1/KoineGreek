#!/usr/bin/env node
// Derive three open-licensed datasets from CrossWire SWORD modules:
//   data/strongs-greek.json   Strong's Greek dictionary (module StrongsGreek, public domain)
//   data/rwp/<slug>.json      Robertson's Word Pictures in the NT (module RWP)
//   data/xrefs/<slug>.json    Treasury of Scripture Knowledge cross-references (module TSK)
//
// Run: node scripts/build_sword.mjs
// Idempotent: modules are downloaded into scripts/cache/sword/ only when missing,
// outputs are rewritten every run. Licenses: data/LICENSES.md.
//
// The SWORD readers in scripts/sword/ were ported from the user's BibleStudy
// project's reverse-engineered parsers.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { iterateLexicon, strongsGreekBase } from './sword/lexicon.mjs';
import { iterateCommentary, iterateTSKCrossRefs } from './sword/commentary.mjs';
import { bookSlug, isNT } from './sword/books.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(ROOT, 'data');
const CACHE = path.join(ROOT, 'scripts', 'cache', 'sword');
const MIRROR = 'https://www.crosswire.org/ftpmirror/pub/sword/packages/rawzip/';
// Used only if the CrossWire download fails and this local copy exists.
const FALLBACK_DIR = '/Volumes/Lexar/BibleStudy - Copy/data/sword';

const MODULES = {
  StrongsGreek: { conf: 'mods.d/strongsgreek.conf' },
  RWP: { conf: 'mods.d/rwp.conf' },
  TSK: { conf: 'mods.d/tsk.conf' },
};

const SOURCES = {
  strongs: "Strong's Greek Dictionary (1890), CrossWire SWORD module StrongsGreek, public domain",
  rwp: "Robertson's Word Pictures in the New Testament (A. T. Robertson, 1930–33), CrossWire SWORD module RWP",
  tsk: 'Treasury of Scripture Knowledge (c. 1880), CrossWire SWORD module TSK, public domain',
};

// ── Helpers ─────────────────────────────────────────────────────────────────
const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
function writeJson(p, obj) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(obj));
  return fs.statSync(p).size;
}
const kb = (n) => (n / 1024).toFixed(1) + ' KB';

async function download(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 1000) throw new Error(`suspiciously small download for ${url}`);
  fs.writeFileSync(dest, buf);
  return buf.length;
}

async function ensureModule(name) {
  const dir = path.join(CACHE, name);
  const conf = path.join(dir, MODULES[name].conf);
  if (fs.existsSync(conf)) return dir;
  fs.mkdirSync(CACHE, { recursive: true });
  const zip = path.join(CACHE, name + '.zip');
  if (!fs.existsSync(zip)) {
    const url = MIRROR + name + '.zip';
    try {
      const n = await download(url, zip);
      console.log(`downloaded ${name}.zip (${kb(n)})`);
    } catch (err) {
      const fallback = path.join(FALLBACK_DIR, name);
      if (fs.existsSync(path.join(fallback, MODULES[name].conf))) {
        console.warn(`download failed (${err.message}); using local copy ${fallback}`);
        fs.cpSync(fallback, dir, { recursive: true });
        return dir;
      }
      throw err;
    }
  }
  fs.mkdirSync(dir, { recursive: true });
  execFileSync('unzip', ['-qo', zip, '-d', dir]);
  if (!fs.existsSync(conf)) throw new Error(`unzip of ${zip} did not produce ${conf}`);
  return dir;
}

// ── App-side reference data ─────────────────────────────────────────────────
const stats = readJson(path.join(DATA, 'stats.json'));
const NT_BOOKS = [...stats.books].sort((a, b) => a.number - b.number); // { book: slug, name, number }
const slugByName = new Map(NT_BOOKS.map((b) => [b.name, b.book]));
const gnt = new Map(); // slug -> { chapters }
for (const b of NT_BOOKS) gnt.set(b.book, readJson(path.join(DATA, 'gnt', b.book + '.json')));
const hasVerse = (slug, ch, v) => Boolean(gnt.get(slug)?.chapters?.[ch]?.[v]);

// ── 1. Strong's Greek ───────────────────────────────────────────────────────
function buildStrongs(moduleDir) {
  const lexicon = readJson(path.join(DATA, 'lexicon.json'));
  const wanted = new Set();
  let itemsWithStrongs = 0;
  for (const item of lexicon.items) {
    const s = item.strongs;
    const nums = Array.isArray(s) ? s : typeof s === 'number' ? [s] : [];
    if (nums.length) itemsWithStrongs++;
    for (const n of nums) wanted.add(n);
  }

  // Read the whole dictionary once.
  const dict = new Map();
  for (const e of iterateLexicon(strongsGreekBase(moduleDir))) dict.set(e.num, e);

  // Split an entry's plain-text body into the definition and its trailers.
  function shape(e) {
    const lines = e.body.split('\n');
    const see = [];
    const hebrew = new Set();
    const keep = [];
    for (const line of lines) {
      const m = line.match(/^see (GREEK|HEBREW) for 0*(\d+)\s*$/);
      if (!m) { keep.push(line); continue; }
      if (m[1] === 'GREEK') see.push(+m[2]);
      else hebrew.add(+m[2]);
    }
    const def = keep.join('\n').replace(/\n{2,}/g, '\n\n').replace(/\s+$/, '').replace(/^\s+/, '');
    // Every Greek number cited in the definition (one hop): the trailers are
    // authoritative; bare numbers in the text fill in any the trailers missed,
    // minus numbers the entry marks as Hebrew.
    const refs = new Set(see);
    for (const m of def.matchAll(/\b(\d{1,4})\b/g)) {
      const n = +m[1];
      // Numbers above 5624 are variant entries in this module and, in definition
      // text, are almost always Hebrew numbers whose trailer is missing.
      if (n > 0 && n <= 5624 && !hebrew.has(n) && dict.has(n)) refs.add(n);
    }
    return { def, see: [...new Set(see)], refs: [...refs] };
  }

  const entries = {};
  let matched = 0;
  const missing = [];
  const linked = new Set();
  for (const n of [...wanted].sort((a, b) => a - b)) {
    const e = dict.get(n);
    if (!e) { missing.push(n); continue; }
    matched++;
    const { def, see, refs } = shape(e);
    entries[n] = { lemma: e.lemma, translit: e.translit, pron: e.pron, def };
    if (see.length) entries[n].see = see;
    for (const r of refs) if (!wanted.has(r)) linked.add(r);
  }
  let linkedCount = 0;
  for (const n of [...linked].sort((a, b) => a - b)) {
    const e = dict.get(n);
    if (!e) continue;
    const { def, see } = shape(e);
    if (!def || def.startsWith('@@@@')) continue; // placeholder entries in the module
    entries[n] = { lemma: e.lemma, translit: e.translit, pron: e.pron, def, linked: true };
    if (see.length) entries[n].see = see;
    linkedCount++;
  }

  // Count lexicon items that resolved to at least one entry.
  let itemsResolved = 0;
  for (const item of lexicon.items) {
    const s = item.strongs;
    const nums = Array.isArray(s) ? s : typeof s === 'number' ? [s] : [];
    if (nums.some((n) => entries[n])) itemsResolved++;
  }

  const ordered = {};
  for (const k of Object.keys(entries).map(Number).sort((a, b) => a - b)) ordered[k] = entries[k];
  const out = { _meta: { source: SOURCES.strongs, entries: Object.keys(ordered).length }, entries: ordered };
  const size = writeJson(path.join(DATA, 'strongs-greek.json'), out);
  return {
    size, dictEntries: dict.size, wanted: wanted.size, matched, linked: linkedCount,
    total: Object.keys(ordered).length, items: lexicon.items.length, itemsWithStrongs, itemsResolved, missing,
  };
}

// ── 2. Robertson's Word Pictures ────────────────────────────────────────────
function buildRwp(moduleDir) {
  const perBook = new Map(NT_BOOKS.map((b) => [b.book, {}]));
  let verses = 0;
  const dropped = [];
  const unknownBooks = new Set();
  for (const e of iterateCommentary(moduleDir, 'RWP')) {
    const slug = slugByName.get(e.book);
    if (!slug) { unknownBooks.add(e.book); continue; }
    if (!hasVerse(slug, e.chapter, e.verse)) { dropped.push(`${e.book} ${e.chapter}:${e.verse}`); continue; }
    const chapters = perBook.get(slug);
    (chapters[e.chapter] ||= {})[e.verse] = e.body;
    verses++;
  }
  let size = 0;
  const books = [];
  const dir = path.join(DATA, 'rwp');
  fs.mkdirSync(dir, { recursive: true });
  for (const b of NT_BOOKS) {
    const chapters = perBook.get(b.book);
    if (!Object.keys(chapters).length) continue;
    books.push(b.book);
    size += writeJson(path.join(dir, b.book + '.json'), { book: b.book, name: b.name, source: SOURCES.rwp, chapters });
  }
  size += writeJson(path.join(dir, 'index.json'), { books, verses });
  return { size, books: books.length, verses, dropped, unknownBooks: [...unknownBooks] };
}

// ── 3. TSK cross-references ─────────────────────────────────────────────────
// TSK follows KJV numbering; where SBLGNT numbers a chapter end differently,
// move the source verse onto the SBLGNT verse that holds the same text.
// (RWP already places its 2 Cor 13 benediction note at 13:13, so no remap there.)
const TSK_VERSE_REMAP = { '2-corinthians': { 13: { 13: 12, 14: 13 } } };

function buildXrefs(moduleDir) {
  const perBook = new Map(NT_BOOKS.map((b) => [b.book, {}]));
  let refs = 0, dupes = 0, selfRefs = 0, outlineLinks = 0, ntTargetsMissing = 0;
  const dropped = [];
  const seenPerVerse = new Map();
  for (const r of iterateTSKCrossRefs(moduleDir, { testaments: ['nt'] })) {
    if (r.fromPassageAttr) { outlineLinks++; continue; }
    const slug = slugByName.get(r.book);
    if (!slug) continue;
    const verse = TSK_VERSE_REMAP[slug]?.[r.chapter]?.[r.verse] ?? r.verse;
    const srcKey = `${slug}/${r.chapter}/${verse}`;
    if (!hasVerse(slug, r.chapter, verse)) {
      if (!seenPerVerse.has(srcKey)) { seenPerVerse.set(srcKey, null); dropped.push(`${r.book} ${r.chapter}:${r.verse}`); }
      continue;
    }
    if (r.toBookNum === r.bookNum && r.toChapter === r.chapter && r.toVerseStart === verse && r.toVerseEnd === verse) {
      selfRefs++; continue;
    }
    const nt = isNT(r.toBookNum);
    const targetSlug = nt ? slugByName.get(r.toBook) : bookSlug(r.toBookNum);
    if (!targetSlug) continue;
    const tKey = `${targetSlug}/${r.toChapter}/${r.toVerseStart}-${r.toVerseEnd}`;
    let seen = seenPerVerse.get(srcKey);
    if (!seen) { seen = new Set(); seenPerVerse.set(srcKey, seen); }
    if (seen.has(tKey)) { dupes++; continue; }
    seen.add(tKey);
    if (nt && !hasVerse(targetSlug, r.toChapter, r.toVerseStart)) ntTargetsMissing++;
    const chapters = perBook.get(slug);
    ((chapters[r.chapter] ||= {})[verse] ||= []).push({
      ref: r.toRef, book: targetSlug, chapter: r.toChapter, from: r.toVerseStart, to: r.toVerseEnd, nt,
    });
    refs++;
  }
  let size = 0;
  const books = [];
  const dir = path.join(DATA, 'xrefs');
  fs.mkdirSync(dir, { recursive: true });
  for (const b of NT_BOOKS) {
    const chapters = perBook.get(b.book);
    if (!Object.keys(chapters).length) continue;
    books.push(b.book);
    size += writeJson(path.join(dir, b.book + '.json'), { book: b.book, source: SOURCES.tsk, chapters });
  }
  size += writeJson(path.join(dir, 'index.json'), { books, refs });
  return { size, books: books.length, refs, dupes, selfRefs, outlineLinks, ntTargetsMissing, dropped };
}

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
  const dirs = {};
  for (const name of Object.keys(MODULES)) dirs[name] = await ensureModule(name);

  const s = buildStrongs(dirs.StrongsGreek);
  console.log(`\nstrongs-greek.json  ${kb(s.size)}`);
  console.log(`  dictionary entries read: ${s.dictEntries}`);
  console.log(`  lexicon items: ${s.items}, with a Strong's number: ${s.itemsWithStrongs}, resolved to an entry: ${s.itemsResolved}`);
  console.log(`  distinct numbers wanted: ${s.wanted}, found: ${s.matched}, linked (one hop): ${s.linked}, total written: ${s.total}`);
  if (s.missing.length) console.log(`  numbers not in module: ${s.missing.join(', ')}`);

  const r = buildRwp(dirs.RWP);
  console.log(`\nrwp/  ${r.books} books, ${r.verses} verses, ${kb(r.size)} total`);
  console.log(`  dropped (verse not in SBLGNT): ${r.dropped.length}${r.dropped.length ? ' — ' + r.dropped.join(', ') : ''}`);
  if (r.unknownBooks.length) console.log(`  unknown books: ${r.unknownBooks.join(', ')}`);

  const x = buildXrefs(dirs.TSK);
  console.log(`\nxrefs/  ${x.books} books, ${x.refs} refs, ${kb(x.size)} total`);
  console.log(`  dropped source verses (not in SBLGNT): ${x.dropped.length}${x.dropped.length ? ' — ' + x.dropped.join(', ') : ''}`);
  console.log(`  skipped: ${x.dupes} duplicate targets, ${x.selfRefs} self-references, ${x.outlineLinks} chapter-outline links`);
  console.log(`  NT targets whose first verse is not in SBLGNT (kept): ${x.ntTargetsMissing}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
