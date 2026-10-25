(function () {
  'use strict';
  const { $, $$, el, esc, t } = KA;
  KA.addStrings({
    en: { 'cd.F': 'Forward', 'cd.L': 'Turn left', 'cd.R': 'Turn right', 'cd.REP': 'Repeat', 'cd.done': 'Done', 'cd.run': 'Run', 'cd.reset': 'Reset', 'cd.clear': 'Clear all', 'cd.win': 'You did it!', 'cd.crash': 'Oops! The robot bumped into something.',
      'cd.short': 'The robot did not reach the flag. Add more commands.', 'cd.missing': 'Collect all the stars before you finish.', 'cd.empty': 'Add some commands first.', 'cd.goal': 'Goal: bring the robot to the flag 🏁. Tap a command to add it. Tap a command in your program to remove it.',
      'cd.python': 'The same program as Python text', 'cd.used': 'Commands used: {n}. Best: {p}.', 'cd.inside': 'Add inside', 'cd.facing': 'Robot at column {x}, row {y}, facing {d}.', 'cd.dir0': 'north', 'cd.dir1': 'east', 'cd.dir2': 'south', 'cd.dir3': 'west', 'cd.many': 'Times', 'cd.program': 'My program',
      'cd.tip': 'Tip for grown-ups: the text under the program is real Python-style code. It is a first look at how typed programs work.' },
    de: { 'cd.F': 'Vorwärts', 'cd.L': 'Links drehen', 'cd.R': 'Rechts drehen', 'cd.REP': 'Wiederholen', 'cd.done': 'Fertig', 'cd.run': 'Start', 'cd.reset': 'Zurücksetzen', 'cd.clear': 'Alles löschen', 'cd.win': 'Geschafft!', 'cd.crash': 'Huch! Der Roboter ist gegen etwas gestoßen.',
      'cd.short': 'Der Roboter hat die Flagge nicht erreicht. Füge mehr Befehle hinzu.', 'cd.missing': 'Sammle erst alle Sterne ein, bevor du fertig bist.', 'cd.empty': 'Füge zuerst Befehle hinzu.', 'cd.goal': 'Ziel: Bring den Roboter zur Flagge 🏁. Tippe einen Befehl an, um ihn einzufügen. Tippe einen Befehl im Programm an, um ihn zu entfernen.',
      'cd.python': 'Dasselbe Programm als Python-Text', 'cd.used': 'Benutzte Befehle: {n}. Bestwert: {p}.', 'cd.inside': 'Hinein einfügen', 'cd.facing': 'Roboter in Spalte {x}, Zeile {y}, Blick nach {d}.', 'cd.dir0': 'Norden', 'cd.dir1': 'Osten', 'cd.dir2': 'Süden', 'cd.dir3': 'Westen', 'cd.many': 'Mal', 'cd.program': 'Mein Programm',
      'cd.tip': 'Tipp für Eltern: Der Text unter dem Programm sieht aus wie echter Python-Code. So bekommt dein Kind einen ersten Einblick, wie getippte Programme funktionieren.' }
  });
  const C = window.KA_CODE, app = $('#app');
  const ICON = { F: '⬆️', L: '↰', R: '↱', REP: '🔁' }, ARROW = ['▲', '▶', '▼', '◀'], MAXCMDS = 30;

  function home() {
    const ui = KA.getUi(), list = C.LEVELS.map(l => ({ id: l.id, icon: l.icon, title: l.title[ui] }));
    app.innerHTML = '<p class="muted small">' + esc(t('cd.tip')) + '</p><div class="ka-units" id="units"></div>';
    KA.unitGrid($('#units'), 'coding', list, u => level(u.id), KA.firstUnfinished('coding', list));
  }

  function level(id) {
    const L = C.LEVELS.find(x => x.id === id), cells = C.cells(L), ui = KA.getUi();
    let prog = [], open = null, running = null;
    app.innerHTML = '<h2>' + esc(L.icon + ' ' + L.title[ui]) + '</h2><p class="muted">' + esc(t('cd.goal')) + '</p><div class="cd-board-wrap" style="display:flex;justify-content:center"><div id="board" role="img"></div></div>' +
      '<div class="ka-fb" id="msg" role="status" aria-live="polite"></div><div class="ka-card"><div id="pal" role="group" aria-label="commands"></div><h3>' + esc(t('cd.program')) + '</h3><div id="prog" class="cd-prog" aria-live="polite"></div><p><button class="ka-btn primary" id="run">▶ ' + esc(t('cd.run')) + '</button><button class="ka-btn" id="rst">↺ ' + esc(t('cd.reset')) + '</button><button class="ka-btn" id="clr">🧽 ' + esc(t('cd.clear')) + '</button></p></div>' +
      '<div class="ka-card ghost"><h3>' + esc(t('cd.python')) + '</h3><pre id="py" style="background:#16213a;color:#e6edf8;padding:12px;border-radius:12px;overflow:auto;min-height:48px;margin:0"></pre></div><p><button class="ka-btn" id="bk">← ' + esc(t('back')) + '</button></p>';
    const board = $('#board');
    const cs = 'min(58px, calc((100vw - 64px) / ' + cells.w + '))';
    board.style.cssText = 'display:grid;grid-template-columns:repeat(' + cells.w + ',' + cs + ');gap:3px;padding:6px;background:#cfd8ea;border-radius:16px';
    const state = { x: cells.start.x, y: cells.start.y, d: L.dir, got: new Set(), bump: false };
    function drawBoard() {
      board.innerHTML = '';
      for (let y = 0; y < cells.h; y++) for (let x = 0; x < cells.w; x++) {
        const k = x + ',' + y, c = el('div'); c.style.cssText = 'width:' + cs + ';height:' + cs + ';display:flex;align-items:center;justify-content:center;border-radius:10px;font-size:calc(' + cs + ' * .62);position:relative;background:' + (cells.walls.has(k) ? '#6b7690' : '#f7fbff');
        let ch = '';
        if (cells.walls.has(k)) ch = '🧱';
        else if (x === cells.goal.x && y === cells.goal.y) ch = '🏁';
        else { const si = cells.stars.findIndex(s => s.x === x && s.y === y); if (si >= 0 && !state.got.has(si)) ch = '⭐'; }
        c.textContent = ch;
        if (x === state.x && y === state.y) { c.innerHTML = '<span style="' + (state.bump ? 'filter:hue-rotate(160deg)' : '') + '">🤖</span><span aria-hidden="true" style="position:absolute;font-size:calc(' + cs + ' * .28);color:#2f6fed;font-weight:900;' + ['top:0;left:50%;transform:translateX(-50%)', 'right:2px;top:50%;transform:translateY(-50%)', 'bottom:0;left:50%;transform:translateX(-50%)', 'left:2px;top:50%;transform:translateY(-50%)'][state.d] + '">' + ARROW[state.d] + '</span>'; }
        board.appendChild(c);
      }
      board.setAttribute('aria-label', t('cd.facing', { x: state.x + 1, y: state.y + 1, d: t('cd.dir' + state.d) }));
    }
    function tile(it, onClick, extra) {
      const b = el('button', 'ka-tile', ICON[it.c] + (extra || '')); b.type = 'button'; b.setAttribute('aria-label', t('cd.' + it.c)); b.addEventListener('click', onClick); return b;
    }
    function drawProg() {
      const host = $('#prog'); host.innerHTML = '';
      host.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;min-height:64px;padding:8px;border:3px dashed var(--line);border-radius:14px;align-items:center';
      prog.forEach((it, i) => {
        if (it.c !== 'REP') { host.appendChild(tile(it, () => { if (running) return; prog.splice(i, 1); if (open && !prog.includes(open)) open = null; sync(); })); return; }
        const box = el('div'); box.style.cssText = 'display:flex;flex-wrap:wrap;gap:4px;align-items:center;padding:6px;border-radius:14px;background:var(--blue-bg);border:3px solid ' + (open === it ? 'var(--orange)' : 'var(--blue)');
        const n = el('button', 'ka-tile', '🔁 ×' + it.n); n.type = 'button'; n.setAttribute('aria-label', t('cd.REP') + ' ' + it.n + ' ' + t('cd.many'));
        n.addEventListener('click', () => { if (running) return; it.n = it.n >= 9 ? 2 : it.n + 1; sync(); });
        box.appendChild(n);
        it.body.forEach((b, j) => box.appendChild(tile(b, () => { if (running) return; it.body.splice(j, 1); sync(); })));
        const o = el('button', 'ka-btn' + (open === it ? ' primary' : ''), open === it ? '✔ ' + esc(t('cd.done')) : '➕ ' + esc(t('cd.inside'))); o.type = 'button'; o.style.minHeight = '44px';
        o.addEventListener('click', () => { if (running) return; open = open === it ? null : it; sync(); });
        box.appendChild(o);
        const x = el('button', 'ka-btn', '✖'); x.type = 'button'; x.style.minHeight = '44px'; x.setAttribute('aria-label', 'remove'); x.addEventListener('click', () => { if (running) return; prog.splice(i, 1); if (open === it) open = null; sync(); });
        box.appendChild(x); host.appendChild(box);
      });
      $('#py').textContent = prog.length ? C.toPython(prog) : '# …';
    }
    function drawPal() {
      const pal = $('#pal'); pal.innerHTML = '';
      L.tools.forEach(c => {
        const b = el('button', 'ka-btn', ICON[c] + ' ' + esc(t('cd.' + c))); b.type = 'button';
        b.addEventListener('click', () => {
          if (running) return; if (C.count(prog) >= MAXCMDS) return;
          if (c === 'REP') { if (open) return; const r = { c: 'REP', n: 2, body: [] }; prog.push(r); open = r; }
          else if (open) open.body.push({ c }); else prog.push({ c });
          sync();
        });
        pal.appendChild(b);
      });
    }
    function sync() { drawProg(); }
    function reset() { clearInterval(running); running = null; state.x = cells.start.x; state.y = cells.start.y; state.d = L.dir; state.got = new Set(); state.bump = false; $('#msg').textContent = ''; drawBoard(); }
    $('#run').addEventListener('click', () => {
      if (running) return; reset();
      const r = C.run(L, prog), msg = $('#msg');
      if (r.status === 'empty') { msg.textContent = '💬 ' + t('cd.empty'); return; }
      let i = 0;
      running = setInterval(() => {
        i++;
        if (i >= r.path.length) {
          clearInterval(running); running = null;
          if (r.status === 'win') { const st = C.rate(L, prog); KA.awardStars('coding', L.id, st); KA.refreshStars(); KA.beep(true); msg.textContent = '🎉 ' + t('cd.win') + ' ' + '⭐'.repeat(st) + '  ' + t('cd.used', { n: C.count(prog), p: C.par(L) }); }
          else { KA.beep(false); msg.textContent = '💬 ' + t(r.status === 'crash' ? 'cd.crash' : r.status === 'missing' ? 'cd.missing' : 'cd.short'); }
          return;
        }
        const s = r.path[i]; state.x = s.x; state.y = s.y; state.d = s.d; state.bump = !!s.bump;
        cells.stars.forEach((st, k) => { if (st.x === s.x && st.y === s.y) state.got.add(k); });
        drawBoard();
      }, 420);
    });
    $('#rst').addEventListener('click', reset);
    $('#clr').addEventListener('click', () => { if (running) return; prog = []; open = null; reset(); sync(); });
    $('#bk').addEventListener('click', () => { clearInterval(running); home(); });
    drawPal(); drawBoard(); sync();
  }
  KA.boot('coding', home);
})();
