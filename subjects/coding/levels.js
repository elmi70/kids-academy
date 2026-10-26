/* Robot levels, instructions and the program runner (pure functions, tested in tests/validate.mjs).
   Grid: '.' floor, '#' wall, '*' star, 'G' goal, 'S' start (floor). Directions: 0 north, 1 east, 2 south, 3 west.
   Texts may contain tokens such as {star} or {F}. fmt() turns them into emoji for the screen, or into words for the voice. */
(function (g) {
  'use strict';
  const T = (en, de) => ({ en, de });
  const DX = [0, 1, 0, -1], DY = [-1, 0, 1, 0];

  const TOKENS = {
    star: { show: '⭐', en: 'star', de: 'Stern' }, stars: { show: '⭐', en: 'stars', de: 'Sterne' }, flag: { show: '🏁', en: 'flag', de: 'Flagge' }, wall: { show: '🧱', en: 'wall', de: 'Mauer' },
    F: { show: '⬆️', en: 'forward', de: 'vorwärts' }, L: { show: '↰', en: 'turn left', de: 'links drehen' }, R: { show: '↱', en: 'turn right', de: 'rechts drehen' }, REP: { show: '🔁', en: 'repeat', de: 'wiederholen' }
  };
  /* mode 'show' → emoji for the screen; mode 'say' → words for the voice */
  function fmt(text, lang, mode) {
    return String(text).replace(/\{(\w+)\}/g, (m, k) => { const t = TOKENS[k]; if (!t) return m; return mode === 'say' ? (t[lang] || t.en) : t.show; });
  }

  const GOAL = {
    stars: T('Walk over every {star} on the way.', 'Laufe auf dem Weg über jeden {star}.'),
    flag: T('Stop on the {flag}.', 'Bleibe auf der {flag} stehen.'),
    flagLast: T('Then stop on the {flag}.', 'Bleibe danach auf der {flag} stehen.')
  };

  const LEVELS = [
    { id: 'c1', icon: '1️⃣', title: T('Go forward', 'Geradeaus'), dir: 1, grid: ['.....', '.....', 'S..G.', '.....', '.....'], tools: ['F'], solution: [{ c: 'F' }, { c: 'F' }, { c: 'F' }],
      intro: T('Tap {F} to add a command. The robot walks one square for each command. Bring it to the {flag}.', 'Tippe auf {F}, um einen Befehl hinzuzufügen. Der Roboter geht für jeden Befehl ein Feld. Bring ihn zur {flag}.'),
      plan: T('Walk forward 3 times.', 'Gehe 3 Mal vorwärts.') },
    { id: 'c2', icon: '↱', title: T('Turn right', 'Rechts abbiegen'), dir: 1, grid: ['S....', '.....', '..G..', '.....', '.....'], tools: ['F', 'R'], solution: [{ c: 'F' }, { c: 'F' }, { c: 'R' }, { c: 'F' }, { c: 'F' }],
      intro: T('The robot can turn. {R} turns it to the right. Then {F} walks in the new direction.', 'Der Roboter kann sich drehen. {R} dreht ihn nach rechts. Danach geht {F} in die neue Richtung.'),
      plan: T('Forward 2 times, turn right, forward 2 times.', '2 Mal vorwärts, nach rechts drehen, 2 Mal vorwärts.') },
    { id: 'c3', icon: '↰', title: T('Turn left', 'Links abbiegen'), dir: 1, grid: ['.....', '.....', '...G.', '.....', 'S....'], tools: ['F', 'L', 'R'], solution: [{ c: 'F' }, { c: 'F' }, { c: 'F' }, { c: 'L' }, { c: 'F' }, { c: 'F' }],
      intro: T('{L} turns the robot to the left. Walk to the right first, then turn to go up.', '{L} dreht den Roboter nach links. Gehe zuerst nach rechts, dann drehe dich, um nach oben zu gehen.'),
      plan: T('Forward 3 times, turn left, forward 2 times.', '3 Mal vorwärts, nach links drehen, 2 Mal vorwärts.') },
    { id: 'c4', icon: '🧱', title: T('Around the wall', 'Um die Mauer'), dir: 1, grid: ['S.#.G', '..#..', '.....', '.....', '.....'], tools: ['F', 'L', 'R'],
      solution: [{ c: 'R' }, { c: 'F' }, { c: 'F' }, { c: 'L' }, { c: 'F' }, { c: 'F' }, { c: 'F' }, { c: 'F' }, { c: 'L' }, { c: 'F' }, { c: 'F' }],
      intro: T('A {wall} blocks the way. Go around it. If the robot bumps into a wall, the command that went wrong turns red.', 'Eine {wall} versperrt den Weg. Geh darum herum. Wenn der Roboter gegen eine Mauer stößt, wird der Befehl, der schiefging, rot.'),
      plan: T('Go down 2, then right 4, then up 2.', '2 Felder nach unten, dann 4 nach rechts, dann 2 nach oben.') },
    { id: 'c5', icon: '⭐', title: T('Collect the star', 'Stern einsammeln'), dir: 1, grid: ['S.*..', '.....', '.G...', '.....', '.....'], tools: ['F', 'L', 'R'],
      solution: [{ c: 'F' }, { c: 'F' }, { c: 'R' }, { c: 'F' }, { c: 'F' }, { c: 'R' }, { c: 'F' }],
      intro: T('This level has a {star}. The robot must walk over the {star} on its way to the {flag}. If it skips the star, the level does not count.', 'In diesem Level gibt es einen {star}. Der Roboter muss auf dem Weg zur {flag} über den {star} laufen. Wenn er den Stern auslässt, zählt das Level nicht.'),
      plan: T('Go right 2 to the star, then down 2, then left 1 to the flag.', '2 Felder nach rechts zum Stern, dann 2 nach unten, dann 1 nach links zur Flagge.') },
    { id: 'c6', icon: '🔁', title: T('Repeat', 'Wiederholen'), dir: 1, grid: ['.......', 'S.....G', '.......'], tools: ['F', 'L', 'R', 'REP'], solution: [{ c: 'REP', n: 6, body: [{ c: 'F' }] }],
      intro: T('{REP} repeats the commands inside it. Tap the number to change how many times.', '{REP} wiederholt die Befehle darin. Tippe auf die Zahl, um die Anzahl zu ändern.'),
      plan: T('Repeat forward 6 times.', 'Wiederhole vorwärts 6 Mal.') },
    { id: 'c7', icon: '🪜', title: T('Stairs', 'Treppe'), dir: 1, grid: ['S....', '.....', '.....', '...G.', '.....'], tools: ['F', 'L', 'R', 'REP'],
      solution: [{ c: 'REP', n: 3, body: [{ c: 'F' }, { c: 'R' }, { c: 'F' }, { c: 'L' }] }],
      intro: T('A staircase repeats the same small pattern. Find the pattern, put it inside one {REP} block and choose how many times.', 'Eine Treppe wiederholt immer dasselbe kleine Muster. Finde das Muster, setze es in einen {REP}-Block und wähle die Anzahl.'),
      plan: T('The pattern is: forward, turn right, forward, turn left. Repeat it 3 times.', 'Das Muster ist: vorwärts, nach rechts drehen, vorwärts, nach links drehen. Wiederhole es 3 Mal.') },
    { id: 'c8', icon: '🌟', title: T('Three stars', 'Drei Sterne'), dir: 1, grid: ['........', 'S*.*.*.G', '........'], tools: ['F', 'L', 'R', 'REP'], solution: [{ c: 'REP', n: 7, body: [{ c: 'F' }] }],
      intro: T('There are 3 {stars} in a row. Walk over all of them, then stop on the {flag}. A loop makes it short.', 'Hier liegen 3 {stars} in einer Reihe. Laufe über alle und bleibe dann auf der {flag} stehen. Mit einer Schleife wird es kurz.'),
      plan: T('Walk right 7 times. The stars are on the way. Put forward inside a repeat block and choose 7.', 'Gehe 7 Mal nach rechts. Die Sterne liegen auf dem Weg. Setze vorwärts in einen Wiederholen-Block und wähle 7.') },
    { id: 'c9', icon: '📐', title: T('Two loops', 'Zwei Schleifen'), dir: 1, grid: ['S....', '.....', '.....', '.....', '....G'], tools: ['F', 'L', 'R', 'REP'],
      solution: [{ c: 'REP', n: 4, body: [{ c: 'F' }] }, { c: 'R' }, { c: 'REP', n: 4, body: [{ c: 'F' }] }],
      intro: T('Two long walks with one turn in between. Use a {REP} block for each walk.', 'Zwei lange Wege mit einer Drehung dazwischen. Nimm für jeden Weg einen {REP}-Block.'),
      plan: T('Repeat forward 4 times, turn right, repeat forward 4 times.', 'Wiederhole vorwärts 4 Mal, nach rechts drehen, wiederhole vorwärts 4 Mal.') },
    { id: 'c10', icon: '🏆', title: T('The maze', 'Das Labyrinth'), dir: 1, grid: ['S..#..', '.#.#*.', '.#....', '.####.', '.....G'], tools: ['F', 'L', 'R', 'REP'],
      hintSolution: [{ c: 'F' }, { c: 'F' }, { c: 'R' }, { c: 'F' }, { c: 'F' }, { c: 'L' }, { c: 'F' }, { c: 'F' }, { c: 'L' }, { c: 'F' }, { c: 'R' }, { c: 'F' }, { c: 'R' }, { c: 'F' }, { c: 'F' }, { c: 'F' }],
      intro: T('The maze! Pick up the {star} on the way to the {flag}. You may use loops, but you do not have to.', 'Das Labyrinth! Sammle auf dem Weg zur {flag} den {star} ein. Du darfst Schleifen benutzen, musst aber nicht.'),
      plan: T('Right 2, down 2, right 2, up 1 (that is the star), right 1, down 3.', '2 nach rechts, 2 nach unten, 2 nach rechts, 1 nach oben (dort liegt der Stern), 1 nach rechts, 3 nach unten.') }
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
  /* like flatten, but every command remembers which tile of the program it came from: "2" or "3.1" (block 3, command 1 inside it) */
  function flattenRefs(prog, prefix, out, limit) {
    prog.forEach((it, i) => {
      if (out.length > limit) return;
      const ref = prefix === '' ? String(i) : prefix + '.' + i;
      if (it.c === 'REP') { for (let k = 0; k < it.n && out.length <= limit; k++) flattenRefs(it.body, ref, out, limit); } else out.push({ c: it.c, ref });
    });
    return out;
  }
  function count(prog) { return prog.reduce((a, it) => a + 1 + (it.c === 'REP' ? count(it.body) : 0), 0); }
  const hasEmptyRepeat = prog => prog.some(it => it.c === 'REP' && !it.body.length);

  /* Runs a program. status: win | crash | short | missing | toolong | empty
     path: one entry per executed command {x,y,d,got,ref}.  missed: stars not collected.  failRef/failKind: which command crashed and into what ("wall" or "edge"). */
  function run(level, prog) {
    const C = cells(level), steps = flattenRefs(prog, '', [], 300);
    let x = C.start.x, y = C.start.y, d = level.dir; const got = new Set(); const path = [{ x, y, d, got: 0, ref: null }];
    const res = st => ({ status: st, path, collected: got.size, missed: C.stars.map((s, i) => i).filter(i => !got.has(i)), end: { x, y }, atGoal: x === C.goal.x && y === C.goal.y, failRef: null, failKind: null });
    if (!steps.length) return res('empty');
    if (steps.length > 300) return res('toolong');
    for (const st of steps) {
      const c = st.c;
      if (c === 'L') d = (d + 3) % 4; else if (c === 'R') d = (d + 1) % 4;
      else {
        const nx = x + DX[d], ny = y + DY[d];
        const edge = nx < 0 || ny < 0 || nx >= C.w || ny >= C.h;
        if (edge || C.walls.has(nx + ',' + ny)) { path.push({ x, y, d, got: got.size, ref: st.ref, bump: true }); const r = res('crash'); r.failRef = st.ref; r.failKind = edge ? 'edge' : 'wall'; return r; }
        x = nx; y = ny; C.stars.forEach((s, i) => { if (s.x === x && s.y === y) got.add(i); });
      }
      path.push({ x, y, d, got: got.size, ref: st.ref });
      if (x === C.goal.x && y === C.goal.y && got.size === C.stars.length) return res('win');
    }
    return res(x === C.goal.x && y === C.goal.y ? 'missing' : 'short');
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
  const hintProg = level => level.hintSolution || level.solution || (bfs(level) || []).map(c => ({ c }));
  function toPython(prog, ind) {
    ind = ind || '';
    return prog.map(it => it.c === 'REP' ? ind + 'for i in range(' + it.n + '):\n' + (it.body.length ? toPython(it.body, ind + '    ') : ind + '    pass') : ind + ({ F: 'forward()', L: 'turn_left()', R: 'turn_right()' })[it.c]).join('\n');
  }

  /* what the mission says, for the screen (mode 'show') or the voice (mode 'say') */
  const text = (obj, lang, mode) => fmt(obj[lang] || obj.en, lang, mode);
  function goals(level, lang, mode) {
    const hasStars = level.grid.some(r => r.includes('*'));
    return hasStars ? [text(GOAL.stars, lang, mode), text(GOAL.flagLast, lang, mode)] : [text(GOAL.flag, lang, mode)];
  }
  const intro = (level, lang, mode) => text(level.intro, lang, mode);
  const plan = (level, lang, mode) => text(level.plan, lang, mode);
  const speech = (level, lang) => [intro(level, lang, 'say')].concat(goals(level, lang, 'say')).join(' ');

  const api = { LEVELS, DX, DY, TOKENS, GOAL, fmt, cells, flatten, flattenRefs, count, hasEmptyRepeat, run, bfs, par, rate, hintProg, toPython, goals, intro, plan, speech };
  g.KA_CODE = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
