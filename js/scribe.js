/*
  scribe.js — a pen canvas for handwriting: tracing a letter, word or part of a
  verse over a faint guide (alphabet lessons, Write tab), writing it from memory
  (Write tab "Recall"), or writing freehand on a lined pad (writing assignments).

    const s = createScribe(container, { guide: 'α', width, height });
    const s = createScribe(container, { guide: text, width, wrap: true, guideSize: 48, autoHeight: true });
    s.score()        → { coverage, precision, enough, pass, memory }
    s.showResult(sc) → marks the check on the canvas: missed parts of the guide, ink off the guide
    s.setGuideMode('trace' | 'faint' | 'memory'), s.reveal(), s.setPen(px)
    s.isEmpty(), s.inkLength(), s.undo(), s.clear(), s.destroy()

  Pen: pointer events (finger, Apple Pencil, mouse); Pencil pressure varies the
  width; once a Pencil touches the canvas, finger/palm touches are ignored (palm
  rejection); strokes are smoothed (coalesced events + quadratic curves) and
  drawn incrementally.

  Scoring: coverage (share of the guide with ink near it) AND precision (share
  of the ink near the guide) must both pass, so filling the box fails. In
  "memory" mode the guide is hidden while writing; the ink is then fitted to the
  guide's bounding box before scoring, so size and position don't matter, only
  shape. Tolerances scale with the guide's font size.
*/
import { getSettings } from './storage.js';

export const PASS = { coverage: 0.55, precision: 0.5 };
export const PASS_MEMORY = { coverage: 0.7, precision: 0.6, shapeError: 0.11 }; // shapeError calibrated on 24 letters: accepts ~all right, rejects ~97% wrong
export const PEN_SIZES = { fine: 2.5, medium: 3.6, bold: 5.2 };

/** The learner's pen width in CSS px (Settings / Write tab pen button). */
export function penWidthSetting() {
  return PEN_SIZES[getSettings().handwritingPen] || PEN_SIZES.fine;
}

export function createScribe(container, {
  width = 320, height = 240, guide = null, guideFont = null, guideSize = null,
  wrap = false, autoHeight = false, lines = false, ruled = true, penWidth = null, minInk = 40,
  guideMode = 'trace', onStroke = null,
} = {}) {
  const css = getComputedStyle(document.documentElement);
  const ink = css.getPropertyValue('--ink').trim() || '#222';
  // guide: a third of the way from the border colour towards muted text, so it reads on every theme without looking like ink
  const mixRgb = (a, b, t) => { const A = parseColor(a), B = parseColor(b); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',')})`; };
  const guideColor = mixRgb(css.getPropertyValue('--border').trim() || '#ccc', css.getPropertyValue('--muted').trim() || '#888', 0.35);
  const lineColor = css.getPropertyValue('--border').trim() || '#ddd';
  const missColor = css.getPropertyValue('--gold').trim() || '#d9a521';
  const strayColor = css.getPropertyValue('--bad').trim() || '#d33';
  const family = css.getPropertyValue('--font-greek').trim() || css.getPropertyValue('--font-display').trim() || 'serif';
  let fontPx = guideSize || (guideFont ? parseInt(guideFont, 10) : Math.round(height * 0.62));
  const fontFamily = guideFont ? guideFont.replace(/^[\d.]+px\s*/, '') : family;
  const fontFor = (px) => `${px}px ${fontFamily}`;
  let pen = penWidth || penWidthSetting();
  const PAD = 14;

  // ---- guide layout: one centred line, or word-wrapped lines; shrink if a word is too wide ----
  let layout = { lines: [], fontPx, lineHeight: 0, asc: 0, desc: 0, xh: 0 };
  if (guide) {
    const m = document.createElement('canvas').getContext('2d');
    const fit = (px) => {
      m.font = fontFor(px);
      const words = wrap ? String(guide).split(/\s+/).filter(Boolean) : [String(guide)];
      const out = []; let cur = '';
      for (const w of words) {
        const test = cur ? `${cur} ${w}` : w;
        if (m.measureText(test).width <= width - PAD * 2 || !cur) cur = test; else { out.push(cur); cur = w; }
      }
      if (cur) out.push(cur);
      return { lines: out, widest: Math.max(...out.map((l) => m.measureText(l).width)) };
    };
    let l = fit(fontPx);
    while (l.widest > width - PAD * 2 && fontPx > 18) { fontPx = Math.round(fontPx * 0.92); l = fit(fontPx); }
    m.font = fontFor(fontPx);
    // a single line is centred on its own shape; wrapped lines share full-height metrics so the rules line up
    const tall = m.measureText(l.lines.length === 1 ? l.lines[0] : 'ΑβζξφψἍ');
    const xo = m.measureText('ο');
    layout = {
      lines: l.lines, fontPx, lineHeight: Math.round(fontPx * 1.7),
      asc: tall.actualBoundingBoxAscent || fontPx * 0.8, desc: tall.actualBoundingBoxDescent || fontPx * 0.25,
      xh: xo.actualBoundingBoxAscent || fontPx * 0.5,
    };
    if (autoHeight) height = Math.max(110, layout.lines.length * layout.lineHeight + PAD);
  }
  // baseline y of each guide line (glyph box centred in its line box, block centred in the canvas)
  const baselines = () => {
    const n = layout.lines.length, lh = layout.lineHeight;
    const top = (height - n * lh) / 2;
    return layout.lines.map((_, i) => top + i * lh + (lh - (layout.asc + layout.desc)) / 2 + layout.asc);
  };

  const dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
  const canvas = document.createElement('canvas');
  canvas.className = 'scribe';
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  container.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  function paintGuide(c, color, alpha = 1) {
    c.save();
    c.globalAlpha = alpha;
    c.font = fontFor(layout.fontPx); c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.fillStyle = color;
    baselines().forEach((y, i) => c.fillText(layout.lines[i], width / 2, y));
    c.restore();
  }
  function paintRules(c) {
    c.save();
    c.strokeStyle = lineColor; c.lineWidth = 1;
    if (lines) {
      const rows = Math.max(1, Math.floor(height / 56));
      for (let r = 1; r <= rows; r++) { const y = Math.round(r * (height / (rows + 0.2))) + 0.5; c.beginPath(); c.moveTo(12, y); c.lineTo(width - 12, y); c.stroke(); }
    }
    if (guide && ruled) {
      // handwriting paper: a solid baseline and a dashed x-height line for every guide line
      for (const y of baselines()) {
        const b = Math.round(y) + 0.5, x = Math.round(y - layout.xh) + 0.5;
        c.globalAlpha = 0.9; c.setLineDash([]); c.beginPath(); c.moveTo(PAD, b); c.lineTo(width - PAD, b); c.stroke();
        c.globalAlpha = 0.6; c.setLineDash([4, 5]); c.beginPath(); c.moveTo(PAD, x); c.lineTo(width - PAD, x); c.stroke();
      }
    }
    c.restore();
  }

  // guide mask (CSS-pixel resolution, 1 byte per pixel) for scoring
  let guideMask = null, guideBox = null, guideStroke = 0;
  if (guide) {
    const off = document.createElement('canvas'); off.width = width; off.height = height;
    const o = off.getContext('2d'); paintGuide(o, '#000');
    const d = o.getImageData(0, 0, width, height).data;
    guideMask = new Uint8Array(width * height);
    let x0 = width, y0 = height, x1 = 0, y1 = 0;
    for (let i = 0; i < guideMask.length; i++) if (d[i * 4 + 3] > 128) {
      guideMask[i] = 1; const x = i % width, y = (i / width) | 0;
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
    guideBox = x1 >= x0 ? { x0, y0, x1, y1 } : null;
    // stroke length of the guide ≈ half its outline (edge pixels): what one clean pass of the pen would draw
    let edge = 0;
    for (let i = 0; i < guideMask.length; i++) {
      if (!guideMask[i]) continue;
      const x = i % width;
      if (x === 0 || x === width - 1 || !guideMask[i - 1] || !guideMask[i + 1] || !guideMask[i - width] || !guideMask[i + width]) edge++;
    }
    guideStroke = Math.max(20, edge / 2);
  }

  // ---- strokes ----
  const strokes = []; // [{ pts: [{x, y, p}], pen: bool }]
  let current = null, activeId = null, penSeen = false, overlay = false, revealed = false;
  const widthAt = (st, pt) => (st.pen ? pen * (0.55 + 0.9 * Math.min(1, pt.p || 0.5)) : pen);
  const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

  // draw points i-1 → i of a stroke (smoothed through midpoints)
  function drawSegment(c, st, i, color, T) {
    const P = (q) => (T ? T(q) : q);
    const s = T ? T.scale : 1;
    const pts = st.pts;
    c.strokeStyle = color; c.fillStyle = color; c.lineCap = 'round'; c.lineJoin = 'round';
    if (i === 0) { const p = P(pts[0]); c.beginPath(); c.arc(p.x, p.y, (widthAt(st, pts[0]) * s) / 2, 0, Math.PI * 2); c.fill(); return; }
    const a = i >= 2 ? P(mid(pts[i - 2], pts[i - 1])) : P(pts[0]);
    const ctrl = P(pts[i - 1]);
    const b = P(mid(pts[i - 1], pts[i]));
    c.lineWidth = widthAt(st, pts[i - 1]) * s;
    c.beginPath(); c.moveTo(a.x, a.y); c.quadraticCurveTo(ctrl.x, ctrl.y, b.x, b.y); c.stroke();
  }
  function drawTail(c, st, color, T) {
    const pts = st.pts; if (pts.length < 2) return;
    const P = (q) => (T ? T(q) : q); const s = T ? T.scale : 1;
    const a = P(mid(pts[pts.length - 2], pts[pts.length - 1])), b = P(pts[pts.length - 1]);
    c.strokeStyle = color; c.lineCap = 'round'; c.lineWidth = widthAt(st, pts[pts.length - 1]) * s;
    c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke();
  }
  function paintStrokes(c, color, T) {
    for (const st of strokes) { for (let i = 0; i < st.pts.length; i++) drawSegment(c, st, i, color, T); drawTail(c, st, color, T); }
  }
  function redraw() {
    ctx.clearRect(0, 0, width, height);
    paintRules(ctx);
    if (guide) {
      if (guideMode === 'trace' || revealed) paintGuide(ctx, guideColor, revealed && guideMode === 'memory' ? 0.8 : 1);
      else if (guideMode === 'faint') paintGuide(ctx, guideColor, 0.38);
    }
    paintStrokes(ctx, ink);
    overlay = false;
  }

  const pos = (e) => { const r = canvas.getBoundingClientRect(); return { x: (e.clientX - r.left) * (width / r.width), y: (e.clientY - r.top) * (height / r.height), p: e.pressure }; };
  const down = (e) => {
    if (e.button && e.button !== 0) return;
    if (e.pointerType === 'pen') penSeen = true;
    else if (penSeen && e.pointerType === 'touch') { e.preventDefault(); return; } // palm rejection
    if (activeId !== null) return; // one pen at a time
    activeId = e.pointerId;
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* synthetic or already-released pointer */ }
    if (overlay || revealed) { revealed = false; redraw(); }
    current = { pts: [pos(e)], pen: e.pointerType === 'pen' };
    strokes.push(current);
    drawSegment(ctx, current, 0, ink);
    e.preventDefault();
  };
  const move = (e) => {
    if (!current || e.pointerId !== activeId) return;
    const evs = typeof e.getCoalescedEvents === 'function' ? e.getCoalescedEvents() : [];
    for (const ev of evs.length ? evs : [e]) {
      const p = pos(ev); const last = current.pts[current.pts.length - 1];
      if (Math.hypot(p.x - last.x, p.y - last.y) < 0.8) continue;
      current.pts.push(p);
      drawSegment(ctx, current, current.pts.length - 1, ink);
    }
    e.preventDefault();
  };
  const up = (e) => {
    if (e.pointerId !== activeId) return;
    if (current) { drawTail(ctx, current, ink); if (onStroke) onStroke(); }
    current = null; activeId = null;
    e.preventDefault();
  };
  canvas.addEventListener('pointerdown', down);
  canvas.addEventListener('pointermove', move);
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', up);
  canvas.addEventListener('lostpointercapture', up);
  redraw();

  // ---- scoring ----
  function inkBox() {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const st of strokes) for (const p of st.pts) { if (p.x < x0) x0 = p.x; if (p.x > x1) x1 = p.x; if (p.y < y0) y0 = p.y; if (p.y > y1) y1 = p.y; }
    return x1 >= x0 ? { x0, y0, x1, y1 } : null;
  }
  // memory mode: map the ink's bounding box onto the guide's (aspect kept within ±40%)
  function fitTransform() {
    const ib = inkBox(); if (!ib || !guideBox) return null;
    const iw = Math.max(8, ib.x1 - ib.x0), ih = Math.max(8, ib.y1 - ib.y0);
    const gw = Math.max(8, guideBox.x1 - guideBox.x0), gh = Math.max(8, guideBox.y1 - guideBox.y0);
    let sx = gw / iw, sy = gh / ih; const g = Math.sqrt(sx * sy);
    sx = Math.min(g * 1.25, Math.max(g / 1.25, sx)); sy = Math.min(g * 1.25, Math.max(g / 1.25, sy));
    const cx = (guideBox.x0 + guideBox.x1) / 2, cy = (guideBox.y0 + guideBox.y1) / 2, icx = (ib.x0 + ib.x1) / 2, icy = (ib.y0 + ib.y1) / 2;
    const T = (q) => ({ x: cx + (q.x - icx) * sx, y: cy + (q.y - icy) * sy, p: q.p });
    T.scale = Math.sqrt(sx * sy);
    // proportions: a tall thin bar is not an alpha, however it is scaled
    T.aspect = (iw / ih) / (gw / gh);
    return T;
  }
  function inkMask(T) {
    const off = document.createElement('canvas'); off.width = width; off.height = height;
    const o = off.getContext('2d'); paintStrokes(o, '#000', T);
    const d = o.getImageData(0, 0, width, height).data;
    const m = new Uint8Array(width * height);
    for (let i = 0; i < m.length; i++) if (d[i * 4 + 3] > 40) m[i] = 1;
    return m;
  }
  // square dilation by r px (separable running counts) → 1 where any source pixel lies within r
  function dilate(src, r) {
    const tmp = new Uint8Array(src.length), out = new Uint8Array(src.length);
    for (let y = 0; y < height; y++) {
      let cnt = 0; const row = y * width;
      for (let x = 0; x < Math.min(r, width); x++) cnt += src[row + x];
      for (let x = 0; x < width; x++) {
        if (x + r < width) cnt += src[row + x + r];
        if (x - r - 1 >= 0) cnt -= src[row + x - r - 1];
        tmp[row + x] = cnt > 0 ? 1 : 0;
      }
    }
    for (let x = 0; x < width; x++) {
      let cnt = 0;
      for (let y = 0; y < Math.min(r, height); y++) cnt += tmp[y * width + x];
      for (let y = 0; y < height; y++) {
        if (y + r < height) cnt += tmp[(y + r) * width + x];
        if (y - r - 1 >= 0) cnt -= tmp[(y - r - 1) * width + x];
        out[y * width + x] = cnt > 0 ? 1 : 0;
      }
    }
    return out;
  }
  // chamfer (3-4) distance transform: px distance from every pixel to the nearest set pixel of `src`
  function distance(src) {
    const INF = 1e9, d = new Float32Array(src.length);
    for (let i = 0; i < src.length; i++) d[i] = src[i] ? 0 : INF;
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
      const i = y * width + x; let v = d[i];
      if (x > 0) v = Math.min(v, d[i - 1] + 3);
      if (y > 0) { v = Math.min(v, d[i - width] + 3); if (x > 0) v = Math.min(v, d[i - width - 1] + 4); if (x < width - 1) v = Math.min(v, d[i - width + 1] + 4); }
      d[i] = v;
    }
    for (let y = height - 1; y >= 0; y--) for (let x = width - 1; x >= 0; x--) {
      const i = y * width + x; let v = d[i];
      if (x < width - 1) v = Math.min(v, d[i + 1] + 3);
      if (y < height - 1) { v = Math.min(v, d[i + width] + 3); if (x < width - 1) v = Math.min(v, d[i + width + 1] + 4); if (x > 0) v = Math.min(v, d[i + width - 1] + 4); }
      d[i] = v;
    }
    for (let i = 0; i < d.length; i++) d[i] /= 3;
    return d;
  }
  let guideDist = null, guideArea = 0;
  const memory = () => guideMode === 'memory';
  // tracing: tolerance follows the font; memory: it follows the guide's real size (an x-height letter is small in a big font)
  const glyphSize = () => (guideBox ? Math.min(guideBox.x1 - guideBox.x0, guideBox.y1 - guideBox.y0) : layout.fontPx);
  const covR = () => (memory() ? Math.min(30, Math.max(6, Math.round(glyphSize() * 0.14))) : Math.min(36, Math.max(9, Math.round(layout.fontPx * 0.1))));
  const preR = () => (memory() ? Math.min(30, Math.max(6, Math.round(glyphSize() * 0.14))) : Math.min(28, Math.max(4, Math.round(layout.fontPx * 0.08))));
  let last = null;
  function analyse() {
    if (!guideMask) return null;
    const T = memory() ? fitTransform() : null;
    const im = inkMask(T);
    const inkNear = dilate(im, Math.round(covR()));
    const guideNear = dilate(guideMask, Math.round(preR()));
    let g = 0, gh = 0, k = 0, kh = 0;
    for (let i = 0; i < im.length; i++) {
      if (guideMask[i]) { g++; if (inkNear[i]) gh++; }
      if (im[i]) { k++; if (guideNear[i]) kh++; }
    }
    last = { im, inkNear, guideNear, T };
    // memory: mean distance both ways (ink → letter, letter outline → ink, less half the letter's stroke width),
    // as a share of the letter's size. Overlap with a tolerance can't tell α from ο once both are fitted to one box.
    let shapeError = null, shapeStats = null;
    if (T) {
      if (!guideDist) { guideDist = distance(guideMask); guideArea = guideMask.reduce((a, v) => a + v, 0); }
      const inkDist = distance(im);
      const half = guideStroke ? guideArea / guideStroke / 2 : 4;
      const ig = [], gi = [];
      for (let i = 0; i < im.length; i++) {
        if (im[i]) ig.push(guideDist[i]);
        if (guideMask[i]) gi.push(Math.max(0, inkDist[i] - half));
      }
      // 90th percentile, not the mean: a missing tail or cross-stroke is a small share of pixels but decides the letter
      const p90 = (arr) => { if (!arr.length) return 99; arr.sort((x, y) => x - y); return arr[Math.floor(arr.length * 0.9)]; };
      const S = Math.max(20, glyphSize());
      shapeStats = { ig: p90(ig) / S, gi: p90(gi) / S };
      shapeError = shapeStats.ig + shapeStats.gi;
    }
    const shapeOk = !T || (T.aspect > 1 / 2 && T.aspect < 2);
    // ink vs the guide's own stroke length: scribbling or filling in lays down several times more
    const inkRatio = guideStroke ? (inkLength() * (T ? T.scale : 1)) / guideStroke : 1;
    return { coverage: g ? gh / g : 0, precision: k ? kh / k : 0, shapeOk, inkRatio, shapeError, shapeStats };
  }
  function inkLength() { let n = 0; for (const st of strokes) for (let i = 1; i < st.pts.length; i++) n += Math.hypot(st.pts[i].x - st.pts[i - 1].x, st.pts[i].y - st.pts[i - 1].y); return n; }

  return {
    canvas,
    height,
    fontPx: () => layout.fontPx,
    lineCount: () => layout.lines.length,
    isEmpty: () => strokes.length === 0,
    undo() { strokes.pop(); redraw(); },
    clear() { strokes.length = 0; revealed = false; redraw(); },
    coverage: () => (analyse() || { coverage: 0 }).coverage,
    precision: () => (analyse() || { precision: 0 }).precision,
    inkLength,
    /** Full verdict: covered enough of the guide AND kept the ink on it (no filling the box). */
    score() {
      const a = analyse() || { coverage: 0, precision: 0 };
      const enough = inkLength() > minInk;
      const th = memory() ? PASS_MEMORY : PASS;
      const shapeOk = a.shapeOk !== false;
      const tooMuch = (a.inkRatio || 0) > (memory() ? 2.2 : 3);
      const shapeClose = !memory() || (a.shapeError != null && a.shapeError <= PASS_MEMORY.shapeError);
      return { ...a, enough, shapeOk, tooMuch, shapeClose, memory: memory(), pass: enough && shapeOk && !tooMuch && shapeClose && a.coverage >= th.coverage && a.precision >= th.precision };
    },
    /** Mark the last check on the canvas: gold = parts of the guide you missed, red = ink off the guide. Cleared by the next stroke. */
    showResult() {
      if (!last || !guideMask) return;
      if (memory()) { revealed = true; redraw(); }
      const off = document.createElement('canvas'); off.width = width; off.height = height;
      const o = off.getContext('2d'); const img = o.createImageData(width, height); const d = img.data;
      const miss = parseColor(missColor), stray = parseColor(strayColor);
      for (let i = 0; i < guideMask.length; i++) {
        let c = null;
        if (guideMask[i] && !last.inkNear[i]) c = miss;
        else if (!memory() && last.im[i] && !last.guideNear[i]) c = stray;
        if (c) { d[i * 4] = c[0]; d[i * 4 + 1] = c[1]; d[i * 4 + 2] = c[2]; d[i * 4 + 3] = 200; }
      }
      o.putImageData(img, 0, 0);
      ctx.drawImage(off, 0, 0, width, height);
      overlay = true;
    },
    setGuideMode(mode) { guideMode = mode; revealed = false; redraw(); },
    reveal() { revealed = true; redraw(); },
    setPen(px) { pen = px; redraw(); },
    toDataURL: () => canvas.toDataURL('image/png'),
    destroy() { canvas.remove(); },
  };
}

/** One-line feedback for a score, shared by every tracing screen. */
export function describeScore(s, what = 'the letter') {
  const cov = Math.round(s.coverage * 100), off = Math.round((1 - s.precision) * 100);
  if (!s.enough) return `Write a little more of ${what}, then check again.`;
  if (s.tooMuch) return `That's a lot of ink for ${what} — write each stroke once instead of scribbling or filling it in.`;
  if (s.memory) {
    if (s.pass) return 'That matches the shape.';
    if (s.shapeOk === false) return 'The proportions are off — compare with the shape now shown, then try again.';
    return 'Not quite the shape — gold shows what was missing. Try again, or switch to Trace.';
  }
  if (s.pass) return `${cov}% of ${what} covered, ink on the lines.`;
  if (s.precision < PASS.precision) return `${off}% of your ink is off ${what} (red) — trace the faint shape, don't fill the box.`;
  return `${cov}% covered — the gold parts still need ink.`;
}

function parseColor(c) {
  const m = c.match(/^#([0-9a-f]{6})$/i);
  if (m) return [parseInt(m[1].slice(0, 2), 16), parseInt(m[1].slice(2, 4), 16), parseInt(m[1].slice(4, 6), 16)];
  const s = c.match(/^#([0-9a-f]{3})$/i);
  if (s) return [...s[1]].map((h) => parseInt(h + h, 16));
  const r = c.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  return r ? [Number(r[1]), Number(r[2]), Number(r[3])] : [0, 0, 0];
}
