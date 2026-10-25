// Content and logic checks. Run with:  node tests/validate.mjs
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const R = p => require(path.join(root, p));
let failed = 0, passed = 0;
const ok = (c, m) => { if (c) passed++; else { failed++; console.log('FAIL  ' + m); } };

const KA = R('shared/core.js');
const READ = R('subjects/reading/data.js'), WR = R('subjects/writing/data.js');
const M = R('subjects/maths/gen.js'), CODE = R('subjects/coding/levels.js');
const EN = R('subjects/english/data.js'), DE = R('subjects/german/data.js'), LANG = R('shared/lang.js');

/* ---- subjects table matches the content ---- */
const units = Object.fromEntries(KA.SUBJECTS.map(s => [s.id, s.units]));
ok(units.reading === READ.en.units.length + READ.de.units.length, 'reading unit count matches shared/core.js');
ok(units.writing === WR.units, 'writing unit count matches shared/core.js (' + WR.units + ')');
ok(units.maths === M.LEVELS.length, 'maths level count matches');
ok(units.english === EN.units.length, 'english unit count matches');
ok(units.german === DE.units.length, 'german unit count matches');
ok(units.coding === CODE.LEVELS.length, 'coding level count matches');

/* ---- reading: every word uses only sounds that were taught ---- */
for (const lang of ['en', 'de']) {
  const D = READ[lang]; const taught = new Set(); const ids = new Set();
  D.units.forEach((u, k) => {
    ok(!ids.has(u.id), lang + ' unit id unique ' + u.id); ids.add(u.id);
    u.graphemes.forEach(g => taught.add(g.toLowerCase()));
    u.graphemes.forEach(g => ok(D.ex[g.toLowerCase()], lang + ' ' + u.id + ': example word for sound "' + g + '"'));
    ok(u.words.length >= 6, lang + ' ' + u.id + ' has at least 6 words');
    u.words.forEach(w => {
      const gs = w.split('.');
      gs.forEach(g => ok(taught.has(g.toLowerCase()), lang + ' ' + u.id + ': word "' + gs.join('') + '" uses sound "' + g + '" that is not taught yet'));
    });
    const sorted = [...taught].sort((a, b) => b.length - a.length);
    const sight = new Set(D.sight);
    const parse = tok => { let i = 0; while (i < tok.length) { const m = sorted.find(g => tok.startsWith(g, i)); if (!m) return false; i += m.length; } return true; };
    u.sentences.forEach(s => s.replace(/[.,!?]/g, '').split(/\s+/).forEach(tok => {
      const tl = tok.toLowerCase();
      ok(sight.has(tl) || parse(tl), lang + ' ' + u.id + ': sentence word "' + tok + '" in "' + s + '" is not decodable yet');
    }));
    ok(u.q.options.includes(u.q.a), lang + ' ' + u.id + ': comprehension answer is one of the options');
    ok(new Set(u.q.options).size === u.q.options.length, lang + ' ' + u.id + ': options are unique');
    ok(new Set(u.words.map(w => w.split('.').join('').toLowerCase())).size === u.words.length, lang + ' ' + u.id + ': no duplicate words');
  });
  Object.keys(D.emoji).forEach(k => ok(D.units.some(u => u.words.some(w => w.split('.').join('').toLowerCase() === k)), lang + ': emoji for "' + k + '" belongs to a word in some unit'));
}

/* ---- maths generator ---- */
function evalQ(q) {
  let m;
  if ((m = q.match(/^(\d+) \+ (\d+) = \?$/))) return +m[1] + +m[2];
  if ((m = q.match(/^(\d+) − (\d+) = \?$/))) return +m[1] - +m[2];
  if ((m = q.match(/^(\d+) \+ \? = (\d+)$/))) return +m[2] - +m[1];
  if ((m = q.match(/^\? \+ (\d+) = (\d+)$/))) return +m[2] - +m[1];
  if ((m = q.match(/^(\d+) − \? = (\d+)$/))) return +m[1] - +m[2];
  if ((m = q.match(/^(\d+) × (\d+) = \?$/))) return +m[1] * +m[2];
  if ((m = q.match(/^(\d+) ÷ (\d+) = \?$/))) return +m[1] / +m[2];
  return null;
}
const rnd = KA.rng(42);
for (const L of M.LEVELS) {
  for (let i = 0; i < 400; i++) {
    const q = M.make(L.id, rnd);
    if (q.kind !== L.id) { ok(false, L.id + ': kind'); break; }
    if (q.type === 'choice') {
      const opts = q.options;
      if (!(opts.includes(q.a) && new Set(opts).size === opts.length && opts.every(o => Number.isInteger(o) && o >= 0))) { ok(false, L.id + ': bad options ' + JSON.stringify(q)); break; }
      if (L.id === 'm1') { const n = [...q.visual].length; if (n !== q.a) { ok(false, 'm1 visual count ' + q.visual + ' vs ' + q.a); break; } }
      else if (L.id === 'm7') { const [a, b] = opts; const want = q.qk === 'bigger' ? Math.max(a, b) : Math.min(a, b); if (a === b || want !== q.a) { ok(false, 'm7 compare ' + JSON.stringify(q)); break; } }
      else { const v = evalQ(q.q); if (v !== q.a) { ok(false, L.id + ': ' + q.q + ' expected ' + v + ' got ' + q.a); break; } }
    } else {
      const v = evalQ(q.q);
      if (v !== q.a || !Number.isInteger(q.a) || q.a < 0) { ok(false, L.id + ': ' + q.q + ' expected ' + v + ' got ' + q.a); break; }
    }
    if (i === 399) ok(true, L.id + ': 400 questions all correct');
  }
}
const lim = (id, f) => { for (let i = 0; i < 300; i++) { const q = M.make(id, rnd); if (!f(q)) return false; } return true; };
ok(lim('m2', q => q.a <= 10), 'm2 stays within 10');
ok(lim('m5', q => q.a >= 11 && q.a <= 20), 'm5 sums are 11 to 20');
ok(lim('m6', q => q.a >= 0 && q.a <= 19), 'm6 results are valid');
ok(lim('m8', q => q.a <= 100), 'm8 stays within 100');
ok(lim('m12', q => q.a >= 2 && q.a <= 10), 'm12 whole-number division');

/* ---- coding levels ---- */
for (const L of CODE.LEVELS) {
  const prog = L.solution || CODE.bfs(L).map(c => ({ c }));
  ok(L.solution ? true : prog.length > 0, L.id + ': solvable');
  const r = CODE.run(L, prog);
  ok(r.status === 'win', L.id + ': reference solution wins (got ' + r.status + ')');
  ok(CODE.par(L) >= 1, L.id + ': par');
  ok(CODE.rate(L, prog) === 3, L.id + ': reference solution earns 3 stars');
  ok(CODE.run(L, []).status === 'empty', L.id + ': empty program is reported');
  const bfs = CODE.bfs(L); ok(bfs && bfs.length <= CODE.count(prog) + 20, L.id + ': a solution without loops exists');
  const flat = bfs.map(c => ({ c })); ok(CODE.run(L, flat).status === 'win', L.id + ': shortest loop-free program wins');
}
ok(CODE.run(CODE.LEVELS[0], [{ c: 'L' }, { c: 'L' }, { c: 'F' }]).status === 'crash', 'running into the edge crashes');
ok(CODE.run(CODE.LEVELS[0], [{ c: 'F' }]).status === 'short', 'stopping early is "short"');
const c8 = CODE.LEVELS.find(l => l.id === 'c8');
ok(CODE.run(c8, [{ c: 'REP', n: 1, body: [{ c: 'F' }] }]).status === 'short', 'c8 needs all stars');
ok(CODE.toPython([{ c: 'F' }, { c: 'REP', n: 3, body: [{ c: 'R' }, { c: 'F' }] }]) === 'forward()\nfor i in range(3):\n    turn_right()\n    forward()', 'python text');

/* ---- language subjects ---- */
for (const [name, D, lang] of [['english', EN, 'en'], ['german', DE, 'de']]) {
  const ids = new Set();
  D.units.forEach(u => {
    ok(!ids.has(u.id), name + ' unit id unique ' + u.id); ids.add(u.id);
    ok(u.title.en && u.title.de, name + ' ' + u.id + ' has both titles');
    for (let k = 0; k < 25; k++) {
      const items = LANG.build(u, lang);
      if (!items.length) { ok(false, name + ' ' + u.id + ' builds no items'); break; }
      let bad = null;
      items.forEach(it => {
        if (it.type === 'choice') {
          const vals = it.options.map(o => typeof o === 'object' ? String(o.v) : String(o));
          if (!vals.includes(String(it.a)) || new Set(vals).size !== vals.length || vals.length < 2) bad = 'choice options ' + JSON.stringify(it);
        } else if (it.type === 'reorder') { if (!it.words.length) bad = 'empty reorder'; }
      });
      if (bad) { ok(false, name + ' ' + u.id + ': ' + bad); break; }
      if (k === 24) ok(true, name + ' ' + u.id + ': 25 random builds valid');
    }
    if (u.type === 'articles') u.nouns.forEach(n => ok(['der', 'die', 'das'].includes(n[0]), 'article valid for ' + n[1]));
  });
}
const allNouns = DE.units.filter(u => u.type === 'articles').flatMap(u => u.nouns.map(n => n[1]));
ok(new Set(allNouns).size === allNouns.length, 'german nouns are unique across units');

/* ---- file references, privacy, service worker ---- */
function walk(dir, out = []) { for (const f of fs.readdirSync(dir)) { if (['node_modules', '.git', 'tests', '.github'].includes(f)) continue; const p = path.join(dir, f); fs.statSync(p).isDirectory() ? walk(p, out) : out.push(p); } return out; }
const files = walk(root);
for (const f of files.filter(f => f.endsWith('.html'))) {
  const html = fs.readFileSync(f, 'utf8'), dir = path.dirname(f);
  if (path.basename(f) === 'super_reader_90_day_academy.html') continue;
  for (const m of html.matchAll(/(?:src|href)="([^"#]+)"/g)) {
    const ref = m[1]; if (/^(https?:|mailto:|data:)/.test(ref)) { ok(false, path.relative(root, f) + ' references an external URL: ' + ref); continue; }
    ok(fs.existsSync(path.join(dir, ref.split('?')[0])) || ref.endsWith('super_reader_90_day_academy.html'), path.relative(root, f) + ' links to missing file ' + ref);
  }
}
for (const f of files.filter(f => /\.(js|html|css|webmanifest)$/.test(f) && !f.endsWith('super_reader_90_day_academy.html'))) {
  const txt = fs.readFileSync(f, 'utf8');
  ok(!/\b(fetch|XMLHttpRequest|WebSocket|sendBeacon)\s*\(/.test(txt.replace(/self\.addEventListener[\s\S]*$/m, '')) || f.endsWith('sw.js'), path.relative(root, f) + ' makes no network calls');
}
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
const listed = [...sw.matchAll(/^\s+'([^']+)',?$/gm)].map(m => m[1]).filter(x => x !== './');
listed.forEach(f => ok(fs.existsSync(path.join(root, f)), 'sw.js lists existing file ' + f));
const needed = files.map(f => path.relative(root, f).split(path.sep).join('/')).filter(f => !/\.md$|^sw\.js$|^\.nojekyll$|super_reader/.test(f));
needed.forEach(f => ok(listed.includes(f), 'sw.js precaches ' + f));
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.webmanifest'), 'utf8'));
manifest.icons.forEach(i => ok(fs.existsSync(path.join(root, i.src)), 'manifest icon exists ' + i.src));

console.log('\n' + passed + ' checks passed, ' + failed + ' failed.');
process.exit(failed ? 1 : 0);
