/*
  scribe.js — a pen canvas for handwriting: tracing a letter over a faint
  guide (alphabet lessons) or copying a verse freehand (writing assignments).
  Pointer events, so finger, Apple Pencil and mouse all work; device-pixel
  scaled; undo / clear; a coverage score when a guide is present.

    const s = createScribe(container, { guide: 'α', guideFont: '...', width, height, lines: true });
    s.coverage()  → 0..1 share of the guide's strokes that have ink near them
    s.isEmpty(), s.undo(), s.clear(), s.destroy()
*/

export function createScribe(container, { width = 320, height = 240, guide = null, guideFont = null, lines = false, penWidth = 5 } = {}) {
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

  const css = getComputedStyle(document.documentElement);
  const ink = css.getPropertyValue('--ink').trim() || '#222';
  const guideColor = css.getPropertyValue('--border').trim() || '#ccc';
  const lineColor = css.getPropertyValue('--border').trim() || '#ddd';
  const font = guideFont || `${Math.round(height * 0.62)}px ${css.getPropertyValue('--font-greek').trim() || css.getPropertyValue('--font-display').trim() || 'serif'}`;

  // guide mask (offscreen, CSS-pixel resolution) for the coverage score
  let guideMask = null;
  function drawGuide() {
    if (lines) {
      ctx.strokeStyle = lineColor; ctx.lineWidth = 1;
      const rows = Math.max(1, Math.floor(height / 56));
      for (let r = 1; r <= rows; r++) { const y = Math.round(r * (height / (rows + 0.2))); ctx.beginPath(); ctx.moveTo(12, y); ctx.lineTo(width - 12, y); ctx.stroke(); }
    }
    if (guide) {
      ctx.save();
      ctx.font = font; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = guideColor;
      ctx.fillText(guide, width / 2, height / 2 + height * 0.04);
      ctx.restore();
      const off = document.createElement('canvas'); off.width = width; off.height = height;
      const o = off.getContext('2d');
      o.font = font; o.textAlign = 'center'; o.textBaseline = 'middle'; o.fillStyle = '#000';
      o.fillText(guide, width / 2, height / 2 + height * 0.04);
      guideMask = o.getImageData(0, 0, width, height).data;
    }
  }

  const strokes = [];
  let current = null;
  function redraw() {
    ctx.clearRect(0, 0, width, height);
    drawGuide();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = ink; ctx.lineWidth = penWidth;
    for (const st of strokes) {
      if (st.length === 1) { ctx.beginPath(); ctx.arc(st[0].x, st[0].y, penWidth / 2, 0, Math.PI * 2); ctx.fillStyle = ink; ctx.fill(); continue; }
      ctx.beginPath(); ctx.moveTo(st[0].x, st[0].y);
      for (let i = 1; i < st.length; i++) ctx.lineTo(st[i].x, st[i].y);
      ctx.stroke();
    }
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

  return {
    canvas,
    isEmpty: () => strokes.length === 0,
    undo() { strokes.pop(); redraw(); },
    clear() { strokes.length = 0; redraw(); },
    /** Share of guide pixels (sampled) with ink within `radius` CSS px. 0 when there is no guide. */
    coverage(radius = 9) {
      if (!guideMask) return 0;
      const inkData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      const inkAt = (x, y) => {
        const px = Math.round(x * dpr), py = Math.round(y * dpr);
        if (px < 0 || py < 0 || px >= canvas.width || py >= canvas.height) return false;
        return inkData[(py * canvas.width + px) * 4 + 3] > 40 && isInkColor(inkData, (py * canvas.width + px) * 4);
      };
      let total = 0, hit = 0;
      for (let y = 0; y < height; y += 3) for (let x = 0; x < width; x += 3) {
        if (guideMask[(y * width + x) * 4 + 3] < 128) continue;
        total++;
        let found = false;
        for (let dy = -radius; dy <= radius && !found; dy += 3) for (let dx = -radius; dx <= radius; dx += 3) { if (inkAt(x + dx, y + dy)) { found = true; break; } }
        if (found) hit++;
      }
      return total ? hit / total : 0;
    },
    /** Rough "ink" length in CSS px, to tell a scribble from a real attempt. */
    inkLength() { let n = 0; for (const st of strokes) for (let i = 1; i < st.length; i++) n += Math.hypot(st[i].x - st[i - 1].x, st[i].y - st[i - 1].y); return n; },
    toDataURL: () => canvas.toDataURL('image/png'),
    destroy() { canvas.remove(); },
  };

  // Ink is drawn in --ink; the guide in --border. Distinguish by comparing to the ink colour's luminance.
  function isInkColor(d, i) {
    const inkRgb = parseColor(ink); const gRgb = parseColor(guideColor);
    const dist = (c) => Math.abs(d[i] - c[0]) + Math.abs(d[i + 1] - c[1]) + Math.abs(d[i + 2] - c[2]);
    return dist(inkRgb) < dist(gRgb);
  }
}

function parseColor(c) {
  const m = c.match(/^#([0-9a-f]{6})$/i);
  if (m) return [parseInt(m[1].slice(0, 2), 16), parseInt(m[1].slice(2, 4), 16), parseInt(m[1].slice(4, 6), 16)];
  const r = c.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  return r ? [Number(r[1]), Number(r[2]), Number(r[3])] : [0, 0, 0];
}
