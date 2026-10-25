/* Maths question generators (pure functions, tested in tests/validate.mjs). */
(function (g) {
  'use strict';
  const LEVELS = [
    { id: 'm1', icon: '🍎', title: { en: 'Count to 10', de: 'Zählen bis 10' } },
    { id: 'm2', icon: '➕', title: { en: 'Add up to 10', de: 'Plus bis 10' } },
    { id: 'm3', icon: '➖', title: { en: 'Take away up to 10', de: 'Minus bis 10' } },
    { id: 'm4', icon: '🔟', title: { en: 'Make 10', de: 'Die 10 zerlegen' } },
    { id: 'm5', icon: '2️⃣0️⃣', title: { en: 'Add up to 20', de: 'Plus bis 20' } },
    { id: 'm6', icon: '🎈', title: { en: 'Take away up to 20', de: 'Minus bis 20' } },
    { id: 'm7', icon: '⚖️', title: { en: 'Bigger or smaller', de: 'Größer oder kleiner' } },
    { id: 'm8', icon: '💯', title: { en: 'Add up to 100', de: 'Plus bis 100' } },
    { id: 'm9', icon: '📉', title: { en: 'Take away up to 100', de: 'Minus bis 100' } },
    { id: 'm10', icon: '✖️', title: { en: 'Times 2, 5, 10', de: 'Einmaleins 2, 5, 10' } },
    { id: 'm11', icon: '🧮', title: { en: 'Times tables', de: 'Einmaleins' } },
    { id: 'm12', icon: '➗', title: { en: 'Sharing (division)', de: 'Teilen (Division)' } },
    { id: 'm13', icon: '❓', title: { en: 'Missing number', de: 'Fehlende Zahl' } }
  ];
  const int = (r, a, b) => a + Math.floor(r() * (b - a + 1));
  function choices(a, r, min, max, n) {
    n = n || 4;
    const set = [a];
    const near = [a - 1, a + 1, a - 2, a + 2, a + 10, a - 10, a * 2];
    for (let i = near.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [near[i], near[j]] = [near[j], near[i]]; }
    for (const c of near) { if (set.length >= n) break; if (c >= min && c <= max && !set.includes(c)) set.push(c); }
    let guard = 0;
    while (set.length < n && guard++ < 200) { const c = int(r, min, max); if (!set.includes(c)) set.push(c); }
    return set;
  }
  const EM = ['🍎', '⭐', '🐟', '🚗', '🌸', '🍪', '🐞', '🎈'];
  function make(id, r) {
    r = r || Math.random;
    let a, b, c, q, ans, e;
    switch (id) {
      case 'm1': a = int(r, 1, 10); e = EM[int(r, 0, EM.length - 1)];
        return { type: 'choice', qk: 'howmany', visual: e.repeat(a), options: choices(a, r, 1, 10, 4), a, kind: id };
      case 'm2': a = int(r, 1, 9); b = int(r, 1, 10 - a); ans = a + b;
        return { type: 'choice', q: a + ' + ' + b + ' = ?', visual: '🔴'.repeat(a) + ' ➕ ' + '🔵'.repeat(b), options: choices(ans, r, 0, 12, 4), a: ans, kind: id };
      case 'm3': a = int(r, 2, 10); b = int(r, 1, a - 1); ans = a - b;
        return { type: 'choice', q: a + ' − ' + b + ' = ?', visual: '🍪'.repeat(a - b) + '❌'.repeat(b), options: choices(ans, r, 0, 10, 4), a: ans, kind: id };
      case 'm4': a = int(r, 1, 9); ans = 10 - a;
        return { type: 'choice', q: a + ' + ? = 10', options: choices(ans, r, 0, 10, 4), a: ans, kind: id };
      case 'm5': a = int(r, 6, 14); b = int(r, Math.max(2, 11 - a), 20 - a); ans = a + b;
        return { type: 'choice', q: a + ' + ' + b + ' = ?', options: choices(ans, r, 5, 22, 4), a: ans, kind: id };
      case 'm6': a = int(r, 11, 20); { const lo = a - 9, hi = Math.min(9, a - 1); b = (r() < 0.6 && lo <= hi) ? int(r, lo, hi) : int(r, 2, hi); } ans = a - b;
        return { type: 'choice', q: a + ' − ' + b + ' = ?', options: choices(ans, r, 0, 20, 4), a: ans, kind: id };
      case 'm7': a = int(r, 10, 99); do { b = int(r, 10, 99); } while (b === a);
        { const big = r() < 0.5;
          return { type: 'choice', qk: big ? 'bigger' : 'smaller', options: [a, b], a: big ? Math.max(a, b) : Math.min(a, b), kind: id, keepOrder: false, big: true }; }
      case 'm8': a = int(r, 11, 89); b = int(r, 1, Math.min(60, 100 - a)); ans = a + b;
        return { type: 'number', q: a + ' + ' + b + ' = ?', a: ans, kind: id };
      case 'm9': a = int(r, 20, 99); b = int(r, 1, Math.min(70, a - 1)); ans = a - b;
        return { type: 'number', q: a + ' − ' + b + ' = ?', a: ans, kind: id };
      case 'm10': a = [2, 5, 10][int(r, 0, 2)]; b = int(r, 1, 10);
        return { type: 'number', q: a + ' × ' + b + ' = ?', a: a * b, kind: id };
      case 'm11': a = int(r, 2, 10); b = int(r, 2, 10);
        return { type: 'number', q: a + ' × ' + b + ' = ?', a: a * b, kind: id };
      case 'm12': b = int(r, 2, 10); c = int(r, 2, 10);
        return { type: 'number', q: (b * c) + ' ÷ ' + b + ' = ?', a: c, kind: id };
      case 'm13': { const form = int(r, 0, 2); a = int(r, 2, 12); b = int(r, 2, 12);
        if (form === 0) return { type: 'number', q: '? + ' + a + ' = ' + (a + b), a: b, kind: id };
        if (form === 1) return { type: 'number', q: a + ' + ? = ' + (a + b), a: b, kind: id };
        return { type: 'number', q: (a + b) + ' − ? = ' + a, a: b, kind: id }; }
      default: throw new Error('unknown level ' + id);
    }
  }
  const api = { LEVELS, make, choices };
  g.KA_MATHS = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
