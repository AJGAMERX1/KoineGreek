// SWORD zLD lexicon reader (StrongsGreek).
//
// Ported from the user's BibleStudy project (src/parsers/sword-lexicon.js),
// whose reverse-engineered SWORD parsers were verified against the live
// modules. On-disk layout:
//   dict.idx : 8 bytes/entry  -> (dat_offset u32 LE, dat_size u32 LE)
//   dict.dat : "KEY\r\n" + block_num (u32) + record_in_block (u32)   KEY = "03056"
//   dict.zdx : 8 bytes/block  -> (zdt_offset u32, compressed_size u32)
//   dict.zdt : concatenated zlib blocks; each inflated block =
//              count (u32) + count * (start u32, size u32) + text
// Entry text is TEI: <entryFree n="3056"><orth>λόγος</orth> <orth type="trans">logos</orth>
//   <pron>{log'-os}</pron><def>...</def></entryFree>

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

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

function safeCodePoint(n) {
  try { return String.fromCodePoint(n); } catch { return ''; }
}

/** Strip TEI/OSIS tags to plain text, keeping paragraph breaks as "\n\n". */
export function stripMarkup(s) {
  let t = s;
  t = t.replace(/<(lb|br)\s*\/?>/gi, '\n');
  t = t.replace(/<\/p>/gi, '\n\n');
  t = t.replace(/<[^>]+>/g, '');
  t = decodeEntities(t);
  t = t.replace(/\r/g, '');
  t = t.replace(/[ \t]+/g, ' ');
  t = t.replace(/ *\n */g, '\n');
  t = t.replace(/\n{3,}/g, '\n\n');
  return t.trim();
}

/**
 * Iterate every entry of a zLD module.
 * @param {string} base  path to the module files without extension
 *                       (.../modules/lexdict/zld/strongsgreek/dict)
 * @param {string} prefix key prefix, e.g. 'G'
 * Yields { key: 'G3056', num: 3056, lemma, translit, pron, def (raw XML inside <def>), body (plain text), xml }
 */
export function* iterateLexicon(base, prefix = 'G') {
  const idx = fs.readFileSync(base + '.idx');
  const dat = fs.readFileSync(base + '.dat');
  const zdx = fs.readFileSync(base + '.zdx');
  const zdt = fs.readFileSync(base + '.zdt');

  const blockCache = new Map();
  const getBlock = (n) => {
    if (blockCache.has(n)) return blockCache.get(n);
    const off = zdx.readUInt32LE(n * 8);
    const sz = zdx.readUInt32LE(n * 8 + 4);
    const d = zlib.inflateSync(zdt.subarray(off, off + sz));
    blockCache.set(n, d);
    return d;
  };

  const total = Math.floor(idx.length / 8);
  const seen = new Set();
  for (let i = 0; i < total; i++) {
    const datOff = idx.readUInt32LE(i * 8);
    const datSize = idx.readUInt32LE(i * 8 + 4);
    if (datSize === 0) continue;
    const entry = dat.subarray(datOff, datOff + datSize);
    const cr = entry.indexOf(0x0d); // CR after the key
    if (cr < 0) continue;

    const rawKey = entry.subarray(0, cr).toString('ascii').trim(); // "03056"
    const num = parseInt(rawKey, 10);
    if (!num) continue; // skip the n="0" dictionary preface

    const block = entry.readUInt32LE(cr + 2);
    const record = entry.readUInt32LE(cr + 6);
    const d = getBlock(block);
    const pairOff = 4 + record * 8;
    const start = d.readUInt32LE(pairOff);
    const size = d.readUInt32LE(pairOff + 4);
    const xml = d.subarray(start, start + size).toString('utf8');

    const key = prefix + num;
    if (seen.has(key)) continue;
    seen.add(key);

    yield { key, num, xml, ...splitEntry(xml) };
  }
}

function splitEntry(xml) {
  const lemma = (xml.match(/<orth>([^<]*)<\/orth>/i) || [])[1] || '';
  const translit = (xml.match(/<orth\b[^>]*type="trans"[^>]*>([^<]*)<\/orth>/i) || [])[1] || '';
  const pron = (xml.match(/<pron\b[^>]*>([^<]*)<\/pron>/i) || [])[1] || '';
  const defMatch = xml.match(/<def\b[^>]*>([\s\S]*?)<\/def>/i);
  const def = defMatch ? defMatch[1] : '';
  return {
    lemma: decodeEntities(lemma).trim(),
    translit: decodeEntities(translit).trim(),
    pron: decodeEntities(pron).trim().replace(/^\{|\}$/g, ''),
    def,
    body: stripMarkup(def || xml),
  };
}

/** Convenience: module directory as unzipped from CrossWire -> file base. */
export function strongsGreekBase(moduleDir) {
  return path.join(moduleDir, 'modules/lexdict/zld/strongsgreek/dict');
}
