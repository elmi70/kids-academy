/* Robot levels and the program runner (pure functions, tested in tests/validate.mjs).
   Grid: '.' floor, '#' wall, '*' star, 'G' goal, 'S' start (floor). Directions: 0 north, 1 east, 2 south, 3 west. */
(function (g) {
  'use strict';
  const T = (en, de) => ({ en, de });
  const DX = [0, 1, 0, -1], DY = [-1, 0, 1, 0];
  const LEVELS = [
    { id: 'c1', icon: '1️⃣', title: T('Go forward', 'Geradeaus'), dir: 1, grid: ['.....', '.....', 'S..G.', '.....', '.....'], tools: ['F'], solution: [{ c: 'F' }, { c: 'F' }, { c: 'F' }] },
    { id: 'c2', icon: '↱', title: T('Turn right', 'Rechts abbiegen'), dir: 1, grid: ['S....', '.....', '..G..', '.....', '.....'], tools: ['F', 'R'], solution: [{ c: 'F' }, { c: 'F' }, { c: 'R' }, { c: 'F' }, { c: 'F' }] },
    { id: 'c3', icon: '↰', title: T('Turn left', 'Links abbiegen'), dir: 1, grid: ['.....', '.....', '...G.', '.....', 'S....'], tools: ['F', 'L', 'R'], solution: [{ c: 'F' }, { c: 'F' }, { c: 'F' }, { c: 'L' }, { c: 'F' }, { c: 'F' }] },
    { id: 'c4', icon: '🧱', title: T('Around the wall', 'Um die Mauer'), dir: 1, grid: ['S.#.G', '..#..', '.....', '.....', '.....'], tools: ['F', 'L', 'R'],
      solution: [{ c: 'R' }, { c: 'F' }, { c: 'F' }, { c: 'L' }, { c: 'F' }, { c: 'F' }, { c: 'F' }, { c: 'F' }, { c: 'L' }, { c: 'F' }, { c: 'F' }] },
    { id: 'c5', icon: '⭐', title: T('Collect the star', 'Stern einsammeln'), dir: 1, grid: ['S.*..', '.....', '.G...', '.....', '.....'], tools: ['F', 'L', 'R'],
      solution: [{ c: 'F' }, { c: 'F' }, { c: 'R' }, { c: 'F' }, { c: 'F' }, { c: 'R' }, { c: 'F' }] },
    { id: 'c6', icon: '🔁', title: T('Repeat', 'Wiederholen'), dir: 1, grid: ['.......', 'S.....G', '.......'], tools: ['F', 'L', 'R', 'REP'], solution: [{ c: 'REP', n: 6, body: [{ c: 'F' }] }] },
    { id: 'c7', icon: '🪜', title: T('Stairs', 'Treppe'), dir: 1, grid: ['S....', '.....', '.....', '...G.', '.....'], tools: ['F', 'L', 'R', 'REP'],
      solution: [{ c: 'REP', n: 3, body: [{ c: 'F' }, { c: 'R' }, { c: 'F' }, { c: 'L' }] }] },
    { id: 'c8', icon: '🌟', title: T('Three stars', 'Drei Sterne'), dir: 1, grid: ['........', 'S*.*.*.G', '........'], tools: ['F', 'L', 'R', 'REP'], solution: [{ c: 'REP', n: 7, body: [{ c: 'F' }] }] },
    { id: 'c9', icon: '📐', title: T('Two loops', 'Zwei Schleifen'), dir: 1, grid: ['S....', '.....', '.....', '.....', '....G'], tools: ['F', 'L', 'R', 'REP'],
      solution: [{ c: 'REP', n: 4, body: [{ c: 'F' }] }, { c: 'R' }, { c: 'REP', n: 4, body: [{ c: 'F' }] }] },
    { id: 'c10', icon: '🏆', title: T('The maze', 'Das Labyrinth'), dir: 1, grid: ['S..#..', '.#.#*.', '.#....', '.####.', '.....G'], tools: ['F', 'L', 'R', 'REP'] }
  ];

  function cells(level) {
    const rows = level.grid, h = rows.length, w = rows[0].length;
    let start = null, goal = null; const stars = [], walls = new Set();
    rows.forEach((row, y) => row.split('').forEach((ch, x) => {
      if (ch === 'S') start = { x, y }; else if (ch === 'G') goal = { x, y }; else if (ch === '*') stars.push({ x, y }); else if (ch === '#') walls.add(x + ',' + y);
    }));
    return { w, h, start, goal, stars, walls };
  }
  function flatten(prog, out, limit) {
    for (const it of prog) {
      if (out.length > limit) return out;
      if (it.c === 'REP') { for (let i = 0; i < it.n && out.length <= limit; i++) flatten(it.body, out, limit); } else out.push(it.c);
    }
    return out;
  }
  function count(prog) { return prog.reduce((a, it) => a + 1 + (it.c === 'REP' ? count(it.body) : 0), 0); }

  /* Runs a program. Returns {status, path:[{x,y,d,got}], collected}. status: win | crash | short | missing | toolong | empty */
  function run(level, prog) {
    const C = cells(level), cmds = flatten(prog, [], 300);
    let x = C.start.x, y = C.start.y, d = level.dir; const got = new Set(); const path = [{ x, y, d, got: 0 }];
    if (!cmds.length) return { status: 'empty', path, collected: 0 };
    if (cmds.length > 300) return { status: 'toolong', path, collected: 0 };
    for (const c of cmds) {
      if (c === 'L') d = (d + 3) % 4; else if (c === 'R') d = (d + 1) % 4;
      else {
        const nx = x + DX[d], ny = y + DY[d];
        if (nx < 0 || ny < 0 || nx >= C.w || ny >= C.h || C.walls.has(nx + ',' + ny)) { path.push({ x, y, d, got: got.size, bump: true }); return { status: 'crash', path, collected: got.size }; }
        x = nx; y = ny; C.stars.forEach((s, i) => { if (s.x === x && s.y === y) got.add(i); });
      }
      path.push({ x, y, d, got: got.size });
      if (x === C.goal.x && y === C.goal.y && got.size === C.stars.length) return { status: 'win', path, collected: got.size };
    }
    if (x === C.goal.x && y === C.goal.y) return { status: 'missing', path, collected: got.size };
    return { status: 'short', path, collected: got.size };
  }
  /* shortest list of F/L/R commands (no loops), breadth-first search */
  function bfs(level) {
    const C = cells(level), n = C.stars.length, full = (1 << n) - 1;
    const key = (x, y, d, m) => x + ',' + y + ',' + d + ',' + m;
    const start = { x: C.start.x, y: C.start.y, d: level.dir, m: 0, p: [] }; const seen = new Set([key(start.x, start.y, start.d, 0)]); const q = [start];
    while (q.length) {
      const s = q.shift();
      if (s.x === C.goal.x && s.y === C.goal.y && s.m === full) return s.p;
      for (const c of ['F', 'L', 'R']) {
        let { x, y, d, m } = s;
        if (c === 'L') d = (d + 3) % 4; else if (c === 'R') d = (d + 1) % 4; else {
          const nx = x + DX[d], ny = y + DY[d];
          if (nx < 0 || ny < 0 || nx >= C.w || ny >= C.h || C.walls.has(nx + ',' + ny)) continue;
          x = nx; y = ny; C.stars.forEach((st, i) => { if (st.x === x && st.y === y) m |= (1 << i); });
        }
        const k = key(x, y, d, m); if (seen.has(k)) continue; seen.add(k); q.push({ x, y, d, m, p: s.p.concat([c]) });
      }
    }
    return null;
  }
  function par(level) { return level.solution ? count(level.solution) : (bfs(level) || []).length; }
  function rate(level, prog) { const n = count(prog), p = par(level); return n <= p ? 3 : n <= p + 3 ? 2 : 1; }
  function toPython(prog, ind) {
    ind = ind || '';
    return prog.map(it => it.c === 'REP' ? ind + 'for i in range(' + it.n + '):\n' + (it.body.length ? toPython(it.body, ind + '    ') : ind + '    pass') : ind + ({ F: 'forward()', L: 'turn_left()', R: 'turn_right()' })[it.c]).join('\n');
  }
  const api = { LEVELS, DX, DY, cells, flatten, count, run, bfs, par, rate, toPython };
  g.KA_CODE = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
