// SWORD zCom commentary reader (RWP, TSK) + TSK cross-reference extractor.
//
// Ported from the user's BibleStudy project (src/parsers/sword-commentary.js),
// whose reverse-engineered SWORD parsers were verified against the live
// modules and the KJV 1769 versification. Per testament three files share a
// base name (RWP: nt.cz*, TSK: ot.bz* / nt.bz*):
//   *v  verse index : one 10-byte record per v11n slot { buffnum u32, start u32, size u16 }
//   *s  block index : 12 bytes/block { offset u32, compressedSize u32, uncompressedSize u32 }
//   *z  zlib-compressed concatenated blocks
// v11n slot order: slot 0 = module heading, slot 1 = testament heading, then per
// book a book-heading slot, per chapter a chapter-heading slot, then the verses.
// size == 0 means the verse has no entry.

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { bookName, bookNumFromName, testamentBooks } from './books.mjs';

export const MODULES = {
  RWP: {
    recSize: 10, sourceType: 'OSIS',
    files: { nt: 'modules/comments/zcom/rwp/nt.cz' },
  },
  TSK: {
    recSize: 10, sourceType: 'ThML',
    files: { ot: 'modules/comments/zcom/tsk/ot.bz', nt: 'modules/comments/zcom/tsk/nt.bz' },
  },
};

function buildSlots(books) {
  const slots = [{ type: 'pre' }, { type: 'testament' }];
  for (const b of books) {
    slots.push({ type: 'book' });
    b.chapters.forEach((nVerses, ci) => {
      slots.push({ type: 'chapter' });
      for (let v = 1; v <= nVerses; v++) {
        slots.push({ type: 'verse', bookNum: b.bookNum, book: b.name, chapter: ci + 1, verse: v });
      }
    });
  }
  return slots;
}

function* iterVerseEntries(fileBase, recSize, books) {
  const v = fs.readFileSync(fileBase + 'v');
  const s = fs.readFileSync(fileBase + 's');
  const z = fs.readFileSync(fileBase + 'z');

  const slots = buildSlots(books);
  const nRecs = Math.floor(v.length / recSize);
  if (slots.length !== nRecs) {
    throw new Error(`v11n slot mismatch for ${fileBase}: built ${slots.length} slots but file has ${nRecs} records`);
  }

  const cache = new Map();
  const getBlock = (n) => {
    if (cache.has(n)) return cache.get(n);
    const o = n * 12;
    const off = s.readUInt32LE(o);
    const csize = s.readUInt32LE(o + 4);
    const d = zlib.inflateSync(z.subarray(off, off + csize));
    cache.set(n, d);
    return d;
  };

  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i];
    if (slot.type !== 'verse') continue;
    const o = i * recSize;
    const buffnum = v.readUInt32LE(o);
    const start = v.readUInt32LE(o + 4);
    const size = recSize === 12 ? v.readUInt32LE(o + 8) : v.readUInt16LE(o + 8);
    if (size === 0) continue;
    const block = getBlock(buffnum);
    const raw = block.subarray(start, start + size).toString('utf8');
    yield { bookNum: slot.bookNum, book: slot.book, chapter: slot.chapter, verse: slot.verse, raw };
  }
}

// ── Markup stripping (OSIS + ThML), paragraph breaks preserved ──────────────
export function decodeEntities(s) {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => safeCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => safeCodePoint(parseInt(d, 10)))
    .replace(/&amp;/g, '&');
}
function safeCodePoint(n) { try { return String.fromCodePoint(n); } catch { return ''; } }

export function stripMarkup(s) {
  let t = s;
  // Drop footnote/cross-ref note bodies for readability.
  t = t.replace(/<note\b[^>]*>[\s\S]*?<\/note>/gi, ' ');
  // Paragraph-level elements -> blank line; line-level -> newline.
  t = t.replace(/<\/(p|div|lg|list|item|tr|row)>/gi, '\n\n');
  t = t.replace(/<(p|div|lg|list|item|tr|row|milestone)\b[^>]*\/>/gi, '\n\n');
  t = t.replace(/<title\b[^>]*>/gi, '\n\n').replace(/<\/title>/gi, '\n\n');
  t = t.replace(/<(lb|br)\b[^>]*\/?>/gi, '\n');
  t = t.replace(/<\/l>/gi, '\n');
  // Remaining tags.
  t = t.replace(/<[^>]+>/g, '');
  t = decodeEntities(t);
  t = t.replace(/\r/g, '');
  t = t.replace(/[ \t ]+/g, ' ');
  t = t.replace(/ *\n */g, '\n');
  t = t.replace(/\n{3,}/g, '\n\n');
  return t.trim();
}

/**
 * Iterate the verse entries of a zCom module.
 * @param {string} moduleDir unzipped module directory (contains mods.d/, modules/)
 * @param {'RWP'|'TSK'} name
 * Yields { bookNum, book, chapter, verse, raw, body } (body = stripped text; skipped when empty)
 */
export function* iterateCommentary(moduleDir, name, { testaments } = {}) {
  const cfg = MODULES[name];
  if (!cfg) throw new Error(`Unknown commentary module: ${name}`);
  for (const [testament, rel] of Object.entries(cfg.files)) {
    if (testaments && !testaments.includes(testament)) continue;
    const books = testamentBooks(testament);
    for (const e of iterVerseEntries(path.join(moduleDir, rel), cfg.recSize, books)) {
      const body = stripMarkup(e.raw);
      if (!body) continue;
      yield { ...e, body };
    }
  }
}

// ── TSK cross-reference extraction ──────────────────────────────────────────
// books.mjs lacks the abbreviation "Lu" (Luke) and resolves "Jud" to Jude,
// but TSK uses "Jud" for Judges. Patch only those two.
const TSK_BOOK_OVERRIDES = { lu: 42, jud: 7 };

function resolveBook(token) {
  if (!token) return null;
  const n = token.toLowerCase().replace(/[\s.]/g, '');
  if (Object.prototype.hasOwnProperty.call(TSK_BOOK_OVERRIDES, n)) return TSK_BOOK_OVERRIDES[n];
  return bookNumFromName(token);
}

/**
 * Parse a TSK reference expression into concrete references.
 *   groups separated by ';'  e.g. "Lu 2:14; Ro 5:8; 8:32"
 *   each group: [book] spec — book sets current book; spec sets chapter/verses
 *   spec parts separated by ',' e.g. "4:9,10,19" -> 4:9, 4:10, 4:19
 *   a part may be C:V | C:V-V | V | V-V (bare = current book+chapter)
 */
export function* parseRefExpr(expr, srcBookNum, srcChapter) {
  let curBook = srcBookNum;
  let curChapter = srcChapter;

  for (let group of String(expr).split(';')) {
    group = group.trim();
    if (!group) continue;

    let rest = group;
    const bm = group.match(/^((?:[1-3]\s*)?[A-Za-z]{1,5})\.?\s+(.+)$/);
    if (bm) {
      const bnum = resolveBook(bm[1]);
      if (bnum) { curBook = bnum; rest = bm[2].trim(); }
    }

    for (let part of rest.split(',')) {
      part = part.trim();
      if (!part) continue;

      let chap = curChapter, vStart, vEnd;
      let m = part.match(/^(\d+):(\d+)(?:-(\d+))?$/);
      if (m) {
        chap = +m[1]; curChapter = chap;
        vStart = +m[2]; vEnd = m[3] != null ? +m[3] : vStart;
      } else if ((m = part.match(/^(\d+)(?:-(\d+))?$/))) {
        vStart = +m[1]; vEnd = m[2] != null ? +m[2] : vStart;
      } else {
        continue; // unparseable fragment ("ff", "etc.", stray text)
      }

      if (!curBook) continue;
      const name = bookName(curBook);
      if (!name) continue;
      const toRef = `${name} ${chap}:${vStart}` + (vEnd !== vStart ? `-${vEnd}` : '');
      yield { toBook: name, toBookNum: curBook, toChapter: chap, toVerseStart: vStart, toVerseEnd: vEnd, toRef };
    }
  }
}

export function* parseTskRefs(rawBody, srcBookNum, srcChapter) {
  const re = /<scripRef\b([^>]*)>([\s\S]*?)<\/scripRef>/gi;
  let m;
  while ((m = re.exec(rawBody))) {
    const pm = m[1].match(/passage="([^"]*)"/i);
    if (pm) {
      // Chapter-outline links (only on verse 1 of each chapter); tagged so callers can skip them.
      for (const r of parseRefExpr(pm[1], srcBookNum, srcChapter)) yield { ...r, fromPassageAttr: true };
    } else {
      const inner = m[2].replace(/<[^>]+>/g, '').trim();
      if (inner) for (const r of parseRefExpr(inner, srcBookNum, srcChapter)) yield { ...r, fromPassageAttr: false };
    }
  }
}

/** Yields one row per target reference in the TSK module (fromPassageAttr marks chapter-outline links). */
export function* iterateTSKCrossRefs(moduleDir, { testaments } = {}) {
  const cfg = MODULES.TSK;
  for (const [testament, rel] of Object.entries(cfg.files)) {
    if (testaments && !testaments.includes(testament)) continue;
    const books = testamentBooks(testament);
    for (const e of iterVerseEntries(path.join(moduleDir, rel), cfg.recSize, books)) {
      for (const r of parseTskRefs(e.raw, e.bookNum, e.chapter)) {
        yield {
          bookNum: e.bookNum, book: e.book, chapter: e.chapter, verse: e.verse,
          toRef: r.toRef, toBook: r.toBook, toBookNum: r.toBookNum, toChapter: r.toChapter,
          toVerseStart: r.toVerseStart, toVerseEnd: r.toVerseEnd, fromPassageAttr: r.fromPassageAttr,
        };
      }
    }
  }
}
