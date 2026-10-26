/* Tracing score. Pure functions: they work on a glyph mask and a list of points, so they are tested outside the browser.
   The old check only asked "how much of the letter is covered?", so a closed loop drawn over an open "C" still passed.
   This check asks three questions:
     coverage : how much of the grey letter did the line cover?
     accuracy : how much of the line stayed on (or very near) the letter? Ink across the gap of a "C" counts against you.
     overdraw : was the line drawn roughly once, not scribbled back and forth?
   It also rejects one long stretch away from the letter (run) or one far excursion (dev), which is what closing the gap of a "C" looks like. */
(function (g) {
  'use strict';
  const S = 320;
  const INF = 1e20;
  const P = { TOL: 10, R: 16, ACC_MIN: 0.86, COV_MIN: 0.78, OVER_MAX: 5, RUN_MAX: 24, DEV_MAX: 19, STROKE_W: 32, THICK: 34 };

  /* exact Euclidean distance transform (Felzenszwalb & Huttenlocher). mask: 1 = feature. Returns distance to the nearest feature. */
  function edt(mask, W, H) {
    const f = new Float64Array(W * H), d = new Float64Array(W * H);
    for (let i = 0; i < W * H; i++) f[i] = mask[i] ? 0 : INF;
    const n = Math.max(W, H), v = new Int32Array(n), z = new Float64Array(n + 1), col = new Float64Array(n), out = new Float64Array(n);
    function pass(len) {
      let k = 0; v[0] = 0; z[0] = -INF; z[1] = INF;
      for (let q = 1; q < len; q++) {
        let s = ((col[q] + q * q) - (col[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
        while (s <= z[k]) { k--; s = ((col[q] + q * q) - (col[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]); }
        k++; v[k] = q; z[k] = s; z[k + 1] = INF;
      }
      k = 0;
      for (let q = 0; q < len; q++) { while (z[k + 1] < q) k++; out[q] = (q - v[k]) * (q - v[k]) + col[v[k]]; }
    }
    for (let x = 0; x < W; x++) { for (let y = 0; y < H; y++) col[y] = f[y * W + x]; pass(H); for (let y = 0; y < H; y++) d[y * W + x] = out[y]; }
    for (let y = 0; y < H; y++) { for (let x = 0; x < W; x++) col[x] = d[y * W + x]; pass(W); for (let x = 0; x < W; x++) f[y * W + x] = out[x]; }
    const r = new Float32Array(W * H); for (let i = 0; i < W * H; i++) r[i] = Math.sqrt(f[i]); return r;
  }

  /* glyph: Uint8Array (S*S) with 1 where the letter is. pts: [{x,y}] sampled along the child's line (about 2 px apart). */
  function score(glyph, pts, o) {
    o = Object.assign({}, P, o || {});
    let area = 0; for (let i = 0; i < glyph.length; i++) if (glyph[i]) area++;
    const res = { coverage: 0, accuracy: 0, overdraw: 0, length: 0, run: 0, dev: 0, ok: false, reason: 'empty', missed: null, off: [] };
    if (!pts.length || !area) return res;
    const dGlyph = o.dGlyph || edt(glyph, S, S);           // distance from every pixel to the letter (can be passed in to save time)
    const path = new Uint8Array(S * S);
    let len = 0, prev = null;
    for (const p of pts) {
      const x = Math.max(0, Math.min(S - 1, Math.round(p.x))), y = Math.max(0, Math.min(S - 1, Math.round(p.y)));
      path[y * S + x] = 1; if (prev) { const d = Math.hypot(p.x - prev.x, p.y - prev.y); if (d <= 12) len += d; } prev = p;   // a jump over 12 px is a new stroke (pen lifted), not drawn line
    }
    let onLetter = 0, run = 0, maxRun = 0, dev = 0; const off = []; prev = null;
    for (const p of pts) {
      const x = Math.max(0, Math.min(S - 1, Math.round(p.x))), y = Math.max(0, Math.min(S - 1, Math.round(p.y))), dd = dGlyph[y * S + x];
      const step = prev ? Math.hypot(p.x - prev.x, p.y - prev.y) : 0;
      if (dd > dev) dev = dd;
      if (dd <= o.TOL) { onLetter++; run = 0; }
      else { off.push(p); run = (prev && step <= 12) ? run + step : 0; if (run > maxRun) maxRun = run; }
      prev = p;
    }
    const dPath = edt(path, S, S);                         // distance from every pixel to the child's line
    let covered = 0; const missed = new Uint8Array(S * S);
    for (let i = 0; i < glyph.length; i++) if (glyph[i]) { if (dPath[i] <= o.R) covered++; else missed[i] = 1; }
    res.coverage = covered / area; res.accuracy = onLetter / pts.length; res.length = len; res.overdraw = len / Math.max(1, area / o.THICK);
    res.missed = missed; res.off = off; res.run = maxRun; res.dev = dev;
    if (res.accuracy < o.ACC_MIN || maxRun > o.RUN_MAX || dev > o.DEV_MAX) res.reason = 'off';
    else if (res.coverage < o.COV_MIN) res.reason = 'missed';
    else if (res.overdraw > o.OVER_MAX) res.reason = 'scribble';
    else { res.ok = true; res.reason = 'ok'; }
    res.stars = !res.ok ? 0 : (res.coverage >= 0.9 && res.accuracy >= 0.95) ? 3 : (res.coverage >= 0.84 && res.accuracy >= 0.9) ? 2 : 1;
    return res;
  }

  /* add intermediate points so the line is sampled about every 2 px */
  function densify(a, b, step) {
    step = step || 2; const out = [], d = Math.hypot(b.x - a.x, b.y - a.y), n = Math.max(1, Math.ceil(d / step));
    for (let i = 1; i <= n; i++) out.push({ x: a.x + (b.x - a.x) * i / n, y: a.y + (b.y - a.y) * i / n });
    return out;
  }
  const api = { S, P, edt, score, densify };
  g.KA_TRACE = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
