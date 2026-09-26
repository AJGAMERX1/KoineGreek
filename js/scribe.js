/*
  scribe.js — a pen canvas for handwriting: tracing a letter, word or whole
  verse over a faint guide (alphabet lessons, Lexicon, Handwriting tab) or
  writing freehand on a lined pad (writing assignments). Pointer events, so
  finger, Apple Pencil and mouse all work; device-pixel scaled; undo / clear.

    const s = createScribe(container, { guide: 'α', width, height });
    const s = createScribe(container, { guide: verseText, width, wrap: true, guideSize: 36, autoHeight: true });
    s.score()     → { coverage, precision, pass }  (see below)
    s.coverage()  → 0..1 share of the guide's strokes that have ink near them (recall)
    s.precision() → 0..1 share of the learner's ink that lies near the guide
    s.isEmpty(), s.inkLength(), s.undo(), s.clear(), s.destroy()

  Scoring: coverage alone rewards scribbling over the whole box, so a check
  also needs precision — ink that strays outside the letter counts against
  you. Both tolerances scale with the guide's font size.
*/

export const PASS = { coverage: 0.55, precision: 0.5 };

export function createScribe(container, {
  width = 320, height = 240, guide = null, guideFont = null, guideSize = null,
  wrap = false, autoHeight = false, lines = false, penWidth = 5, minInk = 40,
} = {}) {
  const css = getComputedStyle(document.documentElement);
  const ink = css.getPropertyValue('--ink').trim() || '#222';
  const guideColor = css.getPropertyValue('--border').trim() || '#ccc';
  const lineColor = css.getPropertyValue('--border').trim() || '#ddd';
  const family = css.getPropertyValue('--font-greek').trim() || css.getPropertyValue('--font-display').trim() || 'serif';
  let fontPx = guideSize || (guideFont ? parseInt(guideFont, 10) : Math.round(height * 0.62));
  const fontFamily = guideFont ? guideFont.replace(/^[\d.]+px\s*/, '') : family;
  const fontFor = (px) => `${px}px ${fontFamily}`;
  const PAD = 14;

  // Lay the guide out: one centred line, or (wrap) word-wrapped lines that fit the width,
  // shrinking the font if a single word is wider than the canvas.
  let layout = { lines: [], fontPx, lineHeight: 0 };
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
    while (l.widest > width - PAD * 2 && fontPx > 18) { fontPx = Math.round(fontPx * 0.9); l = fit(fontPx); }
    layout = { lines: l.lines, fontPx, lineHeight: Math.round(fontPx * 1.35) };
    if (autoHeight) height = Math.max(120, layout.lines.length * layout.lineHeight + PAD * 2 + Math.round(fontPx * 0.3));
  }

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

  function paintGuide(c, color) {
    c.save();
    c.font = fontFor(layout.fontPx); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = color;
    const n = layout.lines.length;
    const total = n * layout.lineHeight;
    const top = (height - total) / 2 + layout.lineHeight / 2 + layout.fontPx * 0.04;
    layout.lines.forEach((line, i) => c.fillText(line, width / 2, top + i * layout.lineHeight));
    c.restore();
  }

  // guide mask (offscreen, CSS-pixel resolution) for the scores
  let guideMask = null;
  if (guide) {
    const off = document.createElement('canvas'); off.width = width; off.height = height;
    const o = off.getContext('2d'); paintGuide(o, '#000');
    guideMask = o.getImageData(0, 0, width, height).data;
  }

  const strokes = [];
  let current = null;
  function paintStrokes(c, color) {
    c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = color; c.fillStyle = color; c.lineWidth = penWidth;
    for (const st of strokes) {
      if (st.length === 1) { c.beginPath(); c.arc(st[0].x, st[0].y, penWidth / 2, 0, Math.PI * 2); c.fill(); continue; }
      c.beginPath(); c.moveTo(st[0].x, st[0].y);
      for (let i = 1; i < st.length; i++) c.lineTo(st[i].x, st[i].y);
      c.stroke();
    }
  }
  function redraw() {
    ctx.clearRect(0, 0, width, height);
    if (lines) {
      ctx.strokeStyle = lineColor; ctx.lineWidth = 1;
      const rows = Math.max(1, Math.floor(height / 56));
      for (let r = 1; r <= rows; r++) { const y = Math.round(r * (height / (rows + 0.2))); ctx.beginPath(); ctx.moveTo(12, y); ctx.lineTo(width - 12, y); ctx.stroke(); }
    }
    if (guide) paintGuide(ctx, guideColor);
    paintStrokes(ctx, ink);
  }
  const pos = (e) => { const r = canvas.getBoundingClientRect(); return { x: (e.clientX - r.left) * (width / r.width), y: (e.clientY - r.top) * (height / r.height) }; };
  const down = (e) => { if (e.button && e.button !== 0) return; try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* synthetic or already-released pointer */ } current = [pos(e)]; strokes.push(current); redraw(); e.preventDefault(); };
  const move = (e) => { if (!current) return; current.push(pos(e)); redraw(); e.preventDefault(); };
  const up = (e) => { current = null; e.preventDefault(); };
  canvas.addEventListener('pointerdown', down);
  canvas.addEventListener('pointermove', move);
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', up);
  canvas.addEventListener('pointerleave', up);
  redraw();

  // A clean ink mask from the strokes themselves (independent of theme colours).
  function inkMask() {
    const off = document.createElement('canvas'); off.width = width; off.height = height;
    paintStrokes(off.getContext('2d'), '#000');
    return off.getContext('2d').getImageData(0, 0, width, height).data;
  }
  const on = (mask, x, y) => x >= 0 && y >= 0 && x < width && y < height && mask[(y * width + x) * 4 + 3] > 40;
  const near = (mask, x, y, r, step) => { for (let dy = -r; dy <= r; dy += step) for (let dx = -r; dx <= r; dx += step) if (on(mask, x + dx, y + dy)) return true; return false; };
  // tolerances scale with the guide: a big single letter forgives more than a small verse
  const tol = () => Math.max(4, Math.min(12, Math.round(layout.fontPx * 0.08)));

  function coverage(radius = Math.max(9, tol())) {
    if (!guideMask) return 0;
    const inkM = inkMask();
    let total = 0, hit = 0;
    for (let y = 0; y < height; y += 3) for (let x = 0; x < width; x += 3) {
      if (guideMask[(y * width + x) * 4 + 3] < 128) continue;
      total++;
      if (near(inkM, x, y, radius, 3)) hit++;
    }
    return total ? hit / total : 0;
  }
  function precision(radius = tol()) {
    if (!guideMask) return 0;
    const inkM = inkMask();
    let total = 0, hit = 0;
    for (let y = 0; y < height; y += 2) for (let x = 0; x < width; x += 2) {
      if (!on(inkM, x, y)) continue;
      total++;
      if (near(guideMask, x, y, radius, 2)) hit++;
    }
    return total ? hit / total : 0;
  }
  function inkLength() { let n = 0; for (const st of strokes) for (let i = 1; i < st.length; i++) n += Math.hypot(st[i].x - st[i - 1].x, st[i].y - st[i - 1].y); return n; }

  return {
    canvas,
    height,
    fontPx: () => layout.fontPx,
    isEmpty: () => strokes.length === 0,
    undo() { strokes.pop(); redraw(); },
    clear() { strokes.length = 0; redraw(); },
    coverage,
    precision,
    inkLength,
    /** Full verdict: covered enough of the guide AND kept the ink on it (no filling the box). */
    score() {
      const c = coverage(), p = precision();
      const enough = inkLength() > minInk;
      return { coverage: c, precision: p, enough, pass: enough && c >= PASS.coverage && p >= PASS.precision };
    },
    toDataURL: () => canvas.toDataURL('image/png'),
    destroy() { canvas.remove(); },
  };
}

/** One-line feedback for a score, shared by every tracing screen. */
export function describeScore(s, what = 'the letter') {
  const cov = Math.round(s.coverage * 100), off = Math.round((1 - s.precision) * 100);
  if (!s.enough) return `Write a little more of ${what}, then check again.`;
  if (s.pass) return `${cov}% of ${what} covered, ink on the lines.`;
  if (s.precision < PASS.precision) return `${off}% of your ink is off ${what} — trace the faint shape, don't fill the box.`;
  return `${cov}% covered — follow the faint shape all the way, then check again.`;
}
