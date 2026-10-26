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
const READ = R('subjects/reading/data.js'), WR = R('subjects/writing/data.js'), TR = R('subjects/writing/trace.js');
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

/* ---- reading: every word uses only sounds that were taught; pictures cannot be mixed up ---- */
for (const lang of ['en', 'de']) {
  const D = READ[lang]; const taught = new Set(); const ids = new Set();
  D.units.forEach(u => {
    ok(!ids.has(u.id), lang + ' unit id unique ' + u.id); ids.add(u.id);
    u.graphemes.forEach(g => taught.add(g.toLowerCase()));
    u.graphemes.forEach(g => ok(D.ex[g.toLowerCase()], lang + ' ' + u.id + ': example word for sound "' + g + '"'));
    ok(u.words.length >= 6, lang + ' ' + u.id + ' has at least 6 words');
    u.words.forEach(w => {
      const gs = w.split('.');
      gs.forEach(g => ok(taught.has(g.toLowerCase()), lang + ' ' + u.id + ': word "' + gs.join('') + '" uses sound "' + g + '" that is not taught yet'));
    });
    const sorted = [...taught].sort((a, b) => b.length - a.length), sight = new Set(D.sight);
    const parse = tok => { let i = 0; while (i < tok.length) { const m = sorted.find(g => tok.startsWith(g, i)); if (!m) return false; i += m.length; } return true; };
    u.sentences.forEach(s => s.replace(/[.,!?]/g, '').split(/\s+/).forEach(tok => {
      const tl = tok.toLowerCase();
      ok(sight.has(tl) || parse(tl), lang + ' ' + u.id + ': sentence word "' + tok + '" in "' + s + '" is not decodable yet');
    }));
    ok(u.q.options.includes(u.q.a), lang + ' ' + u.id + ': comprehension answer is one of the options');
    ok(new Set(u.q.options).size === u.q.options.length, lang + ' ' + u.id + ': options are unique');
    ok(new Set(u.words.map(w => w.split('.').join('').toLowerCase())).size === u.words.length, lang + ' ' + u.id + ': no duplicate words');
  });
  const keys = Object.keys(D.emoji), vals = Object.values(D.emoji);
  ok(new Set(vals).size === vals.length, lang + ': every picture is used for one word only');
  keys.forEach(k => ok(D.units.some(u => u.words.some(w => w.split('.').join('').toLowerCase() === k)), lang + ': emoji for "' + k + '" belongs to a word in some unit'));
  (D.confuse || []).forEach(gp => gp.forEach(k => ok(D.emoji[k], lang + ': confusable group member "' + k + '" has a picture')));
  // no picture that needs a very new emoji font (shows as an empty box on older phones)
  const NEWER = ['🪨', '🪟', '🫖', '🪑'];
  vals.forEach(v => ok(!NEWER.includes(v), lang + ': picture ' + v + ' may not show on older phones'));
}
ok(READ.de.units[0].q.options.indexOf('Oma') < 0, 'de1 question: no answer option is also true in the text');

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
  let allGood = true;
  for (let i = 0; i < 400 && allGood; i++) {
    const q = M.make(L.id, rnd);
    if (q.kind !== L.id) { ok(false, L.id + ': kind'); allGood = false; break; }
    if (q.type === 'choice') {
      const opts = q.options;
      if (!(opts.includes(q.a) && new Set(opts).size === opts.length && opts.every(o => Number.isInteger(o) && o >= 0))) { ok(false, L.id + ': bad options ' + JSON.stringify(q)); allGood = false; break; }
      if (L.id === 'm1') { if ([...q.visual].length !== q.a) { ok(false, 'm1 visual count'); allGood = false; break; } }
      else if (L.id === 'm7') { const [a, b] = opts; const want = q.qk === 'bigger' ? Math.max(a, b) : Math.min(a, b); if (a === b || want !== q.a) { ok(false, 'm7 compare ' + JSON.stringify(q)); allGood = false; break; } }
      else if (evalQ(q.q) !== q.a) { ok(false, L.id + ': ' + q.q + ' expected ' + evalQ(q.q) + ' got ' + q.a); allGood = false; break; }
    } else if (evalQ(q.q) !== q.a || !Number.isInteger(q.a) || q.a < 0) { ok(false, L.id + ': ' + q.q + ' expected ' + evalQ(q.q) + ' got ' + q.a); allGood = false; break; }
  }
  if (allGood) ok(true, L.id + ': 400 questions all correct');
}
const lim = (id, f) => { for (let i = 0; i < 300; i++) if (!f(M.make(id, rnd))) return false; return true; };
ok(lim('m2', q => q.a <= 10), 'm2 stays within 10'); ok(lim('m5', q => q.a >= 11 && q.a <= 20), 'm5 sums are 11 to 20');
ok(lim('m6', q => q.a >= 0 && q.a <= 19), 'm6 results are valid'); ok(lim('m8', q => q.a <= 100), 'm8 stays within 100'); ok(lim('m12', q => q.a >= 2 && q.a <= 10), 'm12 whole-number division');

/* ---- coding levels ---- */
for (const L of CODE.LEVELS) {
  const prog = L.solution || CODE.bfs(L).map(c => ({ c }));
  const r = CODE.run(L, prog);
  ok(r.status === 'win', L.id + ': reference solution wins (got ' + r.status + ')');
  ok(CODE.rate(L, prog) === 3, L.id + ': reference solution earns 3 stars');
  ok(CODE.run(L, []).status === 'empty', L.id + ': empty program is reported');
  const bfs = CODE.bfs(L); ok(bfs && CODE.run(L, bfs.map(c => ({ c }))).status === 'win', L.id + ': shortest loop-free program wins');
}
ok(CODE.run(CODE.LEVELS[0], [{ c: 'L' }, { c: 'L' }, { c: 'F' }]).status === 'crash', 'running into the edge crashes');
/* instructions: every level explains itself in both languages, the hint plan and the shown answer really work */
for (const L of CODE.LEVELS) {
  for (const lang of ['en', 'de']) {
    ok(L.intro && L.intro[lang] && L.intro[lang].length > 25, L.id + ': has an intro in ' + lang);
    ok(L.plan && L.plan[lang] && L.plan[lang].length > 8, L.id + ': has a hint plan in ' + lang);
    for (const fn of [CODE.intro, CODE.plan]) ok(!/\{\w+\}/.test(fn(L, lang, 'show')) && !/\{\w+\}/.test(fn(L, lang, 'say')), L.id + ': no unknown {token} left in ' + lang);
    ok(!/[^\u0000-\u024F\u2010-\u206F]/.test(CODE.speech(L, lang)), L.id + ': the spoken text has no emoji (' + lang + ')');
  }
  ok(CODE.run(L, CODE.hintProg(L)).status === 'win', L.id + ': the answer shown by the hint wins');
  const stars = L.grid.some(r => r.includes('*'));
  ok(CODE.goals(L, 'en', 'show').length === (stars ? 2 : 1), L.id + ': the mission lists ' + (stars ? 'the stars and the flag' : 'only the flag'));
  ok(stars === /star/i.test(L.intro.en), L.id + ': the intro mentions stars exactly when the level has stars');
}
{
  const c5 = CODE.LEVELS.find(l => l.id === 'c5'), c4 = CODE.LEVELS.find(l => l.id === 'c4');
  let r = CODE.run(c5, [{ c: 'R' }, { c: 'F' }, { c: 'F' }, { c: 'L' }, { c: 'F' }]);
  ok(r.status === 'missing' && r.atGoal && r.missed.length === 1, 'c5: reaching the flag without the star is "missing" and lists the star (' + r.status + ')');
  r = CODE.run(c5, [{ c: 'F' }]); ok(r.status === 'short' && r.missed.length === 1 && !r.atGoal, 'c5: stopping early lists the missed star');
  r = CODE.run(c4, [{ c: 'F' }, { c: 'F' }]); ok(r.status === 'crash' && r.failRef === '1' && r.failKind === 'wall', 'c4: a crash names the command (2nd) and says it was a wall');
  r = CODE.run(c4, [{ c: 'F' }, { c: 'REP', n: 3, body: [{ c: 'L' }, { c: 'F' }] }]); ok(r.status === 'crash' && r.failRef === '1.1' && r.failKind === 'edge', 'c4: a crash inside a repeat block names the command inside it (1.1) and says it was the edge');
  r = CODE.run(c4, CODE.LEVELS[3].solution); ok(r.status === 'win' && r.missed.length === 0 && r.path.every((p, i) => i === 0 || p.ref !== null), 'c4: every executed step remembers its program tile');
  ok(CODE.hasEmptyRepeat([{ c: 'REP', n: 2, body: [] }]) && !CODE.hasEmptyRepeat([{ c: 'REP', n: 2, body: [{ c: 'F' }] }]), 'an empty repeat block is detected');
  ok(CODE.flattenRefs([{ c: 'F' }, { c: 'REP', n: 2, body: [{ c: 'L' }, { c: 'F' }] }], '', [], 300).map(s => s.ref).join(',') === '0,1.0,1.1,1.0,1.1', 'refs follow the program tiles through a repeat block');
}
ok(CODE.run(CODE.LEVELS[0], [{ c: 'F' }]).status === 'short', 'stopping early is "short"');
ok(CODE.run(CODE.LEVELS.find(l => l.id === 'c8'), [{ c: 'REP', n: 1, body: [{ c: 'F' }] }]).status === 'short', 'c8 needs all stars');
ok(CODE.toPython([{ c: 'F' }, { c: 'REP', n: 3, body: [{ c: 'R' }, { c: 'F' }] }]) === 'forward()\nfor i in range(3):\n    turn_right()\n    forward()', 'python text');

/* ---- language subjects ---- */
for (const [name, D, lang] of [['english', EN, 'en'], ['german', DE, 'de']]) {
  const ids = new Set();
  D.units.forEach(u => {
    ok(!ids.has(u.id), name + ' unit id unique ' + u.id); ids.add(u.id);
    ok(u.title.en && u.title.de, name + ' ' + u.id + ' has both titles');
    let bad = null;
    for (let k = 0; k < 40 && !bad; k++) {
      const items = LANG.build(u, lang);
      if (!items.length) bad = 'builds no items';
      items.forEach(it => {
        if (it.type === 'choice') {
          const vals = it.options.map(o => typeof o === 'object' ? String(o.v) : String(o));
          if (!vals.includes(String(it.a)) || new Set(vals).size !== vals.length || vals.length < 2) bad = 'choice options ' + JSON.stringify(it);
        } else if (it.type === 'reorder' && !it.words.length) bad = 'empty reorder';
      });
    }
    ok(!bad, name + ' ' + u.id + ': 40 random builds valid ' + (bad || ''));
    if (u.type === 'articles') u.nouns.forEach(n => ok(['der', 'die', 'das'].includes(n[0]), 'article valid for ' + n[1]));
  });
}
const allNouns = DE.units.filter(u => u.type === 'articles').flatMap(u => u.nouns.map(n => n[1]));
ok(new Set(allNouns).size === allNouns.length, 'german nouns are unique across units');

/* ---- tracing: deterministic checks with a synthetic open "C" (ring with a gap on the right) ---- */
{
  const S = TR.S;
  const ring = (rOut, rIn, gapDeg) => { const m = new Uint8Array(S * S); for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) { const dx = x - 160, dy = y - 160, r = Math.hypot(dx, dy), a = Math.abs(Math.atan2(dy, dx) * 180 / Math.PI); if (r <= rOut && r >= rIn && a > gapDeg) m[y * S + x] = 1; } return m; };
  const C = ring(110, 74, 38), O = ring(110, 74, -1), rm = 92;
  const arc = (a0, a1, r, jit = 0, seed = 1) => { const q = KA.rng(seed), pts = []; for (let a = a0; a <= a1; a += 0.5) { const rad = a * Math.PI / 180, rr = r + (q() - 0.5) * jit; pts.push({ x: 160 + rr * Math.cos(rad), y: 160 + rr * Math.sin(rad) }); } return pts; };
  const dens = pts => { const out = [pts[0]]; for (let i = 1; i < pts.length; i++) out.push(...TR.densify(pts[i - 1], pts[i], 2)); return out; };
  const good = dens(arc(40, 320, rm)), shaky = dens(arc(40, 320, rm, 10, 3));
  let r = TR.score(C, good); ok(r.ok && r.stars === 3, 'trace: careful trace of an open C passes with 3 stars (' + r.reason + ' cov ' + r.coverage.toFixed(2) + ' acc ' + r.accuracy.toFixed(2) + ')');
  r = TR.score(C, shaky); ok(r.ok, 'trace: shaky but honest trace of the C passes (' + r.reason + ')');
  const closed = dens(arc(40, 320, rm).concat(arc(320, 400, rm)));          // the user's mistake: the loop is closed, so the gap is covered
  r = TR.score(C, closed); ok(!r.ok && r.reason === 'off', 'trace: closing the gap of the C (an O drawn over it) is rejected (' + r.reason + ' run ' + r.run.toFixed(0) + ' dev ' + r.dev.toFixed(0) + ')');
  r = TR.score(C, dens(arc(40, 190, rm))); ok(!r.ok && r.reason === 'missed', 'trace: tracing only half of the C is rejected (' + r.reason + ')');
  const zig = []; for (let k = 0; k < 9; k++) { const y = 40 + k * 30; zig.push(...(k % 2 ? TR.densify({ x: 280, y }, { x: 40, y }) : TR.densify({ x: 40, y }, { x: 280, y }))); }
  r = TR.score(C, zig); ok(!r.ok, 'trace: a scribble across the page is rejected (' + r.reason + ')');
  r = TR.score(C, [{ x: 160, y: 160 }]); ok(!r.ok, 'trace: a single dot is rejected'); r = TR.score(C, []); ok(!r.ok && r.reason === 'empty', 'trace: nothing drawn is rejected');
  r = TR.score(C, dens(arc(0, 360, 135))); ok(!r.ok, 'trace: a big circle around the letter is rejected (' + r.reason + ')');
  r = TR.score(O, dens(arc(0, 360, rm))); ok(r.ok, 'trace: a full circle on a closed O passes');
  const seven = []; for (let k = 0; k < 6; k++) seven.push(...good); r = TR.score(C, seven); ok(!r.ok && r.reason === 'scribble', 'trace: drawing the same line six times is rejected as scribbling (' + r.reason + ')');
  const two = dens(arc(40, 180, rm)).concat(dens(arc(185, 320, rm))); r = TR.score(C, two); ok(r.ok, 'trace: a pen lift (second stroke) does not count as scribbling');
  // distance transform against brute force on a tiny grid
  const W = 24, mask = new Uint8Array(W * W); mask[5 * W + 7] = 1; mask[18 * W + 3] = 1; mask[10 * W + 20] = 1; const d = TR.edt(mask, W, W); let maxErr = 0;
  for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) { let b = 1e9; for (let yy = 0; yy < W; yy++) for (let xx = 0; xx < W; xx++) if (mask[yy * W + xx]) b = Math.min(b, Math.hypot(x - xx, y - yy)); maxErr = Math.max(maxErr, Math.abs(b - d[y * W + x])); }
  ok(maxErr < 1e-4, 'trace: distance transform matches brute force (max error ' + maxErr.toExponential(1) + ')');
}

/* ---- sound: every phrase the app can speak has a recorded clip ---- */
import { execFileSync } from 'node:child_process';
const phrases = JSON.parse(execFileSync(process.execPath, [path.join(root, 'tools/collect_speech.mjs')], { maxBuffer: 1 << 26 }).toString());
for (const lang of ['en', 'de']) {
  const file = path.join(root, 'shared/audio-' + lang + '.js'), txt = fs.readFileSync(file, 'utf8');
  const m = txt.match(/g\.KA_CLIPS\.\w+=(\{.*\});\}\)/s); let clips = null; try { clips = JSON.parse(m[1]); } catch (e) { /* reported below */ }
  ok(!!clips, 'audio-' + lang + '.js can be read');
  if (!clips) continue;
  const need = new Set(phrases[lang].concat(phrases.letters, phrases.extra));
  const missing = [...need].filter(s => !clips[s]); ok(!missing.length, 'audio-' + lang + '.js has a clip for every phrase (' + need.size + ' needed, missing: ' + missing.slice(0, 8).join(' | ') + ')');
  const badHead = Object.entries(clips).filter(([k, v]) => { const b = Buffer.from(v.split(',')[1], 'base64'); return !(b.length > 800 && ((b[0] === 0x49 && b[1] === 0x44 && b[2] === 0x33) || (b[0] === 0xFF && (b[1] & 0xE0) === 0xE0))); });
  ok(!badHead.length, 'audio-' + lang + '.js clips are all non-empty MP3 data (' + Object.keys(clips).length + ' clips)');
  ok(txt.length < 2.2e6, 'audio-' + lang + '.js stays small (' + (txt.length / 1e6).toFixed(2) + ' MB)');
}

/* ---- file references, privacy, service worker ---- */
function walk(dir, out = []) { for (const f of fs.readdirSync(dir)) { if (['node_modules', '.git', 'tests', '.github', 'tools', '__pycache__'].includes(f)) continue; const p = path.join(dir, f); fs.statSync(p).isDirectory() ? walk(p, out) : out.push(p); } return out; }
const files = walk(root);
for (const f of files.filter(f => f.endsWith('.html') && !f.endsWith('super_reader_90_day_academy.html'))) {
  const html = fs.readFileSync(f, 'utf8'), dir = path.dirname(f);
  for (const m of html.matchAll(/(?:src|href)="([^"#]+)"/g)) {
    const ref = m[1]; if (/^(https?:|mailto:|data:)/.test(ref)) { ok(false, path.relative(root, f) + ' references an external URL: ' + ref); continue; }
    ok(fs.existsSync(path.join(dir, ref.split('?')[0])) || ref.endsWith('super_reader_90_day_academy.html'), path.relative(root, f) + ' links to missing file ' + ref);
  }
}
for (const f of files.filter(f => /\.(js|html|css|webmanifest)$/.test(f) && !f.endsWith('super_reader_90_day_academy.html') && !f.endsWith('sw.js') && !/audio-(en|de)\.js$/.test(f))) {
  const txt = fs.readFileSync(f, 'utf8');
  ok(!/\b(fetch|XMLHttpRequest|WebSocket|sendBeacon)\s*\(/.test(txt), path.relative(root, f) + ' makes no network calls');
  ok(!/https?:\/\//.test(txt.replace(/<!--[\s\S]*?-->/g, '').replace(/\/\*[\s\S]*?\*\//g, '')), path.relative(root, f) + ' contains no web address');
}
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
const listed = [...sw.matchAll(/^\s+'([^']+)',?$/gm)].map(m => m[1]).filter(x => x !== './');
listed.forEach(f => ok(fs.existsSync(path.join(root, f)), 'sw.js lists existing file ' + f));
files.map(f => path.relative(root, f).split(path.sep).join('/')).filter(f => !/\.md$|^sw\.js$|^\.nojekyll$|super_reader/.test(f)).forEach(f => ok(listed.includes(f), 'sw.js precaches ' + f));
JSON.parse(fs.readFileSync(path.join(root, 'manifest.webmanifest'), 'utf8')).icons.forEach(i => ok(fs.existsSync(path.join(root, i.src)), 'manifest icon exists ' + i.src));

console.log('\n' + passed + ' checks passed, ' + failed + ' failed.');
process.exit(failed ? 1 : 0);
