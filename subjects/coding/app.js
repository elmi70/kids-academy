(function () {
  'use strict';
  const { $, $$, el, esc, t } = KA;
  KA.addStrings({
    en: { 'cd.F': 'Forward', 'cd.L': 'Turn left', 'cd.R': 'Turn right', 'cd.REP': 'Repeat', 'cd.done': 'Done', 'cd.run': 'Run', 'cd.reset': 'Reset', 'cd.clear': 'Clear all', 'cd.win': 'You did it!',
      'cd.mission': 'Mission', 'cd.goalStars': 'Walk over every {star}: {n} / {m}', 'cd.goalFlag': 'Stop on the {flag}', 'cd.listen': 'Listen', 'cd.hint': 'Hint', 'cd.showAnswer': 'Show the answer', 'cd.hintTitle': 'Plan', 'cd.answerTitle': 'The answer',
      'cd.answerNote': 'When you use the answer, you can earn 1 ⭐ at most.', 'cd.hintCapped': 'You used the answer, so this is 1 ⭐ at most.',
      'cd.legendRobot': 'robot', 'cd.legendStar': 'star', 'cd.legendFlag': 'flag', 'cd.legendWall': 'wall',
      'cd.crashWall': 'Oops! The robot bumped into a {wall} at command {n}. The red command went wrong.', 'cd.crashEdge': 'Oops! The robot walked off the board at command {n}. The red command went wrong.',
      'cd.stopped': 'The robot stopped before the {flag}. Add more commands.', 'cd.skipped': 'You reached the {flag}, but you skipped {k} {star}. The robot must walk over every star. The missed stars have an orange ring.',
      'cd.stillMissing': 'It also missed {k} {star} (orange ring).', 'cd.empty': 'Add some commands first.', 'cd.emptyRep': 'The {REP} block is empty. Tap ➕ Add inside, then tap a command.',
      'cd.finishRep': 'Tap ✔ Done on the {REP} block first. Then you can add the next command.', 'cd.full': 'Your program is full. Remove a command first.',
      'cd.python': 'The same program as Python text', 'cd.used': 'Commands used: {n}. Best: {p}.', 'cd.inside': 'Add inside', 'cd.facing': 'Robot at column {x}, row {y}, facing {d}.', 'cd.dir0': 'north', 'cd.dir1': 'east', 'cd.dir2': 'south', 'cd.dir3': 'west', 'cd.many': 'Times', 'cd.program': 'My program',
      'cd.tip': 'Tip for grown-ups: the text under the program is real Python-style code. It is a first look at how typed programs work.' },
    de: { 'cd.F': 'Vorwärts', 'cd.L': 'Links drehen', 'cd.R': 'Rechts drehen', 'cd.REP': 'Wiederholen', 'cd.done': 'Fertig', 'cd.run': 'Start', 'cd.reset': 'Zurücksetzen', 'cd.clear': 'Alles löschen', 'cd.win': 'Geschafft!',
      'cd.mission': 'Aufgabe', 'cd.goalStars': 'Laufe über jeden {star}: {n} / {m}', 'cd.goalFlag': 'Bleibe auf der {flag} stehen', 'cd.listen': 'Anhören', 'cd.hint': 'Tipp', 'cd.showAnswer': 'Lösung zeigen', 'cd.hintTitle': 'Plan', 'cd.answerTitle': 'Die Lösung',
      'cd.answerNote': 'Wenn du die Lösung benutzt, bekommst du höchstens 1 ⭐.', 'cd.hintCapped': 'Du hast die Lösung benutzt, deshalb gibt es höchstens 1 ⭐.',
      'cd.legendRobot': 'Roboter', 'cd.legendStar': 'Stern', 'cd.legendFlag': 'Flagge', 'cd.legendWall': 'Mauer',
      'cd.crashWall': 'Huch! Der Roboter ist bei Befehl {n} gegen eine {wall} gestoßen. Der rote Befehl ist schiefgegangen.', 'cd.crashEdge': 'Huch! Der Roboter ist bei Befehl {n} vom Spielfeld gelaufen. Der rote Befehl ist schiefgegangen.',
      'cd.stopped': 'Der Roboter ist vor der {flag} stehen geblieben. Füge mehr Befehle hinzu.', 'cd.skipped': 'Du hast die {flag} erreicht, aber {k} {star} ausgelassen. Der Roboter muss über jeden Stern laufen. Die ausgelassenen Sterne haben einen orangen Ring.',
      'cd.stillMissing': 'Außerdem fehlen {k} {star} (oranger Ring).', 'cd.empty': 'Füge zuerst Befehle hinzu.', 'cd.emptyRep': 'Der {REP}-Block ist leer. Tippe auf ➕ Hinein einfügen und dann auf einen Befehl.',
      'cd.finishRep': 'Tippe zuerst im {REP}-Block auf ✔ Fertig. Danach kannst du den nächsten Befehl einfügen.', 'cd.full': 'Dein Programm ist voll. Entferne zuerst einen Befehl.',
      'cd.python': 'Dasselbe Programm als Python-Text', 'cd.used': 'Benutzte Befehle: {n}. Bestwert: {p}.', 'cd.inside': 'Hinein einfügen', 'cd.facing': 'Roboter in Spalte {x}, Zeile {y}, Blick nach {d}.', 'cd.dir0': 'Norden', 'cd.dir1': 'Osten', 'cd.dir2': 'Süden', 'cd.dir3': 'Westen', 'cd.many': 'Mal', 'cd.program': 'Mein Programm',
      'cd.tip': 'Tipp für Eltern: Der Text unter dem Programm sieht aus wie echter Python-Code. So bekommt dein Kind einen ersten Einblick, wie getippte Programme funktionieren.' }
  });
  const C = window.KA_CODE, app = $('#app');
  const ICON = { F: '⬆️', L: '↰', R: '↱', REP: '🔁' }, ARROW = ['▲', '▶', '▼', '◀'], MAXCMDS = 30;
  const show = s => C.fmt(s, KA.getUi(), 'show');                       // {star} → ⭐ etc. in messages

  function home() {
    const ui = KA.getUi(), list = C.LEVELS.map(l => ({ id: l.id, icon: l.icon, title: l.title[ui] }));
    app.innerHTML = '<div id="vox"></div><p class="muted small">' + esc(t('cd.tip')) + '</p><div class="ka-units" id="units"></div>';
    KA.voiceCheck(KA.getUi(), $('#vox'));
    KA.unitGrid($('#units'), 'coding', list, u => level(u.id), KA.firstUnfinished('coding', list));
  }

  function level(id) {
    const L = C.LEVELS.find(x => x.id === id), cells = C.cells(L), ui = KA.getUi(), nStars = cells.stars.length;
    let prog = [], open = null, running = null, failRef = null, hintStage = 0, usedAnswer = false;
    const goalLines = C.goals(L, ui, 'show');
    const legend = ['🤖 ' + t('cd.legendRobot')].concat(nStars ? ['⭐ ' + t('cd.legendStar')] : [], ['🏁 ' + t('cd.legendFlag')], cells.walls.size ? ['🧱 ' + t('cd.legendWall')] : []).join('   ·   ');
    app.innerHTML = '<div id="vox"></div><h2>' + esc(L.icon + ' ' + L.title[ui]) + '</h2>' +
      '<div class="ka-card cd-mission"><h3 style="margin-top:0">🎯 ' + esc(t('cd.mission')) + '</h3><p id="intro" style="margin-bottom:8px">' + esc(C.intro(L, ui, 'show')) + '</p>' +
      '<ul class="cd-goals" id="goals"></ul><p style="margin-bottom:0"><button type="button" class="ka-btn listen" id="say">🔊 ' + esc(t('cd.listen')) + '</button><button type="button" class="ka-btn" id="hintbtn">💡 ' + esc(t('cd.hint')) + '</button></p><div id="hint" aria-live="polite"></div></div>' +
      '<div style="display:flex;justify-content:center"><div id="board" role="img"></div></div><p class="muted small ka-center" style="margin:6px 0">' + esc(legend) + '</p>' +
      '<div class="ka-fb" id="msg" role="status" aria-live="polite"></div><div class="ka-card"><div id="pal" role="group" aria-label="commands"></div><h3>' + esc(t('cd.program')) + '</h3><div id="prog" class="cd-prog" aria-live="polite"></div><p><button class="ka-btn primary" id="run">▶ ' + esc(t('cd.run')) + '</button><button class="ka-btn" id="rst">↺ ' + esc(t('cd.reset')) + '</button><button class="ka-btn" id="clr">🧽 ' + esc(t('cd.clear')) + '</button></p></div>' +
      '<div class="ka-card ghost"><h3>' + esc(t('cd.python')) + '</h3><pre id="py" style="background:#16213a;color:#e6edf8;padding:12px;border-radius:12px;overflow:auto;min-height:48px;margin:0"></pre></div><p><button class="ka-btn" id="bk">← ' + esc(t('back')) + '</button></p>';
    KA.voiceCheck(ui, $('#vox'));
    const board = $('#board');
    const cs = 'min(58px, calc((100vw - 64px) / ' + cells.w + '))';
    board.style.cssText = 'display:grid;grid-template-columns:repeat(' + cells.w + ',' + cs + ');gap:3px;padding:6px;background:#cfd8ea;border-radius:16px';
    const state = { x: cells.start.x, y: cells.start.y, d: L.dir, got: new Set(), bump: false, trail: new Set(), missed: new Set() };
    const goalState = { phase: 'idle', starOk: null, flagOk: null };

    /* ----- the mission checklist ----- */
    function drawGoals() {
      const rows = []; const mark = ok => ok === null ? '⬜' : ok ? '✅' : '❌';
      if (nStars) rows.push('<li data-goal="stars">' + mark(goalState.starOk) + ' ' + esc(show(t('cd.goalStars', { n: state.got.size, m: nStars }))) + '</li>');
      rows.push('<li data-goal="flag">' + mark(goalState.flagOk) + ' ' + esc(show(t('cd.goalFlag'))) + '</li>');
      $('#goals').innerHTML = rows.join('');
    }
    $('#say').addEventListener('click', () => KA.speak(C.speech(L, ui), ui, 0.85));

    /* ----- hint ----- */
    function drawHint() {
      const h = $('#hint'); h.innerHTML = '';
      if (hintStage === 0) return;
      let html = '<div class="cd-hint"><b>' + esc(t('cd.hintTitle')) + ':</b> ' + esc(C.plan(L, ui, 'show')) + '</div>';
      if (hintStage === 1) html += '<p style="margin:6px 0 0"><button type="button" class="ka-btn" id="ans">🧩 ' + esc(t('cd.showAnswer')) + '</button></p>';
      else {
        const hp = C.hintProg(L);
        const tiles = hp.map(it => it.c === 'REP' ? '<span class="cd-mini rep">🔁×' + it.n + ' ' + it.body.map(b => ICON[b.c]).join('') + '</span>' : '<span class="cd-mini">' + ICON[it.c] + '</span>').join('');
        html += '<div class="cd-hint"><b>' + esc(t('cd.answerTitle')) + ':</b><div class="cd-answer">' + tiles + '</div><span class="muted small">' + esc(t('cd.answerNote')) + '</span></div>';
      }
      h.innerHTML = html;
      const a = $('#ans'); if (a) a.addEventListener('click', () => { hintStage = 2; usedAnswer = true; drawHint(); });
    }
    $('#hintbtn').addEventListener('click', () => { if (hintStage === 0) hintStage = 1; else if (hintStage === 1) hintStage = 0; else hintStage = 0; drawHint(); });

    /* ----- board ----- */
    function drawBoard() {
      board.innerHTML = '';
      for (let y = 0; y < cells.h; y++) for (let x = 0; x < cells.w; x++) {
        const k = x + ',' + y, c = el('div'); c.style.cssText = 'width:' + cs + ';height:' + cs + ';display:flex;align-items:center;justify-content:center;border-radius:10px;font-size:calc(' + cs + ' * .62);position:relative;background:' + (cells.walls.has(k) ? '#6b7690' : '#f7fbff');
        let ch = '';
        if (cells.walls.has(k)) ch = '🧱';
        else if (x === cells.goal.x && y === cells.goal.y) ch = '🏁';
        else {
          const si = cells.stars.findIndex(s => s.x === x && s.y === y);
          if (si >= 0 && !state.got.has(si)) { ch = '⭐'; if (state.missed.has(si)) { c.style.outline = '4px solid var(--orange)'; c.style.outlineOffset = '-4px'; c.style.background = '#fff1d6'; c.dataset.missed = '1'; } }
          else if (state.trail.has(k)) ch = '<span style="font-size:.35em;color:#9fb3d9">●</span>';
        }
        c.innerHTML = ch;
        if (x === state.x && y === state.y) { c.innerHTML = '<span style="' + (state.bump ? 'filter:hue-rotate(160deg)' : '') + '">🤖</span><span aria-hidden="true" style="position:absolute;font-size:calc(' + cs + ' * .28);color:#2f6fed;font-weight:900;' + ['top:0;left:50%;transform:translateX(-50%)', 'right:2px;top:50%;transform:translateY(-50%)', 'bottom:0;left:50%;transform:translateX(-50%)', 'left:2px;top:50%;transform:translateY(-50%)'][state.d] + '">' + ARROW[state.d] + '</span>'; }
        board.appendChild(c);
      }
      board.setAttribute('aria-label', t('cd.facing', { x: state.x + 1, y: state.y + 1, d: t('cd.dir' + state.d) }));
    }

    /* ----- program ----- */
    function tile(it, ref, onClick) {
      const b = el('button', 'ka-tile' + (ref === failRef ? ' cd-bad' : ''), ICON[it.c]); b.type = 'button'; b.dataset.ref = ref; b.setAttribute('aria-label', t('cd.' + it.c)); b.addEventListener('click', onClick); return b;
    }
    function drawProg() {
      const host = $('#prog'); host.innerHTML = '';
      host.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;min-height:64px;padding:8px;border:3px dashed var(--line);border-radius:14px;align-items:center';
      prog.forEach((it, i) => {
        const ref = String(i);
        if (it.c !== 'REP') { host.appendChild(tile(it, ref, () => { if (running) return; prog.splice(i, 1); if (open && !prog.includes(open)) open = null; edited(); })); return; }
        const box = el('div'); box.style.cssText = 'display:flex;flex-wrap:wrap;gap:4px;align-items:center;padding:6px;border-radius:14px;background:var(--blue-bg);border:3px solid ' + (open === it ? 'var(--orange)' : 'var(--blue)');
        const n = el('button', 'ka-tile', '🔁 ×' + it.n); n.type = 'button'; n.setAttribute('aria-label', t('cd.REP') + ' ' + it.n + ' ' + t('cd.many'));
        n.addEventListener('click', () => { if (running) return; it.n = it.n >= 9 ? 2 : it.n + 1; edited(); });
        box.appendChild(n);
        it.body.forEach((b, j) => box.appendChild(tile(b, ref + '.' + j, () => { if (running) return; it.body.splice(j, 1); edited(); })));
        const o = el('button', 'ka-btn' + (open === it ? ' primary' : ''), open === it ? '✔ ' + esc(t('cd.done')) : '➕ ' + esc(t('cd.inside'))); o.type = 'button'; o.style.minHeight = '44px';
        o.addEventListener('click', () => { if (running) return; open = open === it ? null : it; edited(); });
        box.appendChild(o);
        const x = el('button', 'ka-btn', '✖'); x.type = 'button'; x.style.minHeight = '44px'; x.setAttribute('aria-label', 'remove'); x.addEventListener('click', () => { if (running) return; prog.splice(i, 1); if (open === it) open = null; edited(); });
        box.appendChild(x); host.appendChild(box);
      });
      $('#py').textContent = prog.length ? C.toPython(prog) : '# …';
    }
    function setCur(ref) { $$('#prog .cd-cur').forEach(e => e.classList.remove('cd-cur')); if (ref !== null && ref !== undefined) { const e = $('#prog [data-ref="' + ref + '"]'); if (e) e.classList.add('cd-cur'); } }
    function say(msg) { $('#msg').textContent = msg; }
    function edited() { failRef = null; drawProg(); }
    function drawPal() {
      const pal = $('#pal'); pal.innerHTML = '';
      L.tools.forEach(c => {
        const b = el('button', 'ka-btn', ICON[c] + ' ' + esc(t('cd.' + c))); b.type = 'button';
        b.addEventListener('click', () => {
          if (running) return;
          if (C.count(prog) >= MAXCMDS) { say('💬 ' + t('cd.full')); return; }
          if (c === 'REP') { if (open) { say('💬 ' + show(t('cd.finishRep'))); return; } const r = { c: 'REP', n: 2, body: [] }; prog.push(r); open = r; }
          else if (open) open.body.push({ c }); else prog.push({ c });
          say(''); edited();
        });
        pal.appendChild(b);
      });
    }
    function reset() {
      clearInterval(running); running = null; state.x = cells.start.x; state.y = cells.start.y; state.d = L.dir; state.got = new Set(); state.bump = false; state.trail = new Set(); state.missed = new Set();
      goalState.phase = 'idle'; goalState.starOk = null; goalState.flagOk = null; setCur(null); say(''); drawBoard(); drawGoals();
    }

    /* ----- run ----- */
    function explain(r) {
      if (r.status === 'crash') { const n = Number(String(r.failRef).split('.')[0]) + 1; return '💬 ' + show(t(r.failKind === 'edge' ? 'cd.crashEdge' : 'cd.crashWall', { n })); }
      if (r.status === 'missing') return '💬 ' + show(t('cd.skipped', { k: r.missed.length }));
      let m = '💬 ' + show(t('cd.stopped'));
      if (r.missed.length) m += ' ' + show(t('cd.stillMissing', { k: r.missed.length }));
      return m;
    }
    $('#run').addEventListener('click', () => {
      if (running) return;
      if (C.hasEmptyRepeat(prog)) { say('💬 ' + show(t('cd.emptyRep'))); return; }
      reset();
      const r = C.run(L, prog);
      if (r.status === 'empty') { say('💬 ' + t('cd.empty')); return; }
      goalState.phase = 'run'; let i = 0;
      running = setInterval(() => {
        i++;
        if (i >= r.path.length) {
          clearInterval(running); running = null; setCur(null); goalState.phase = 'done';
          goalState.starOk = nStars ? r.missed.length === 0 : null; goalState.flagOk = r.atGoal && r.status !== 'crash';
          r.missed.forEach(k => state.missed.add(k));
          if (r.status === 'win') {
            let st = C.rate(L, prog); const capped = usedAnswer && st > 1; if (usedAnswer) st = Math.min(st, 1);
            KA.awardStars('coding', L.id, st); KA.refreshStars(); KA.beep(true);
            say('🎉 ' + t('cd.win') + ' ' + '⭐'.repeat(st) + '  ' + t('cd.used', { n: C.count(prog), p: C.par(L) }) + (capped ? '  ' + t('cd.hintCapped') : ''));
          } else {
            KA.beep(false); say(explain(r));
            if (r.status === 'crash') { failRef = r.failRef; drawProg(); }
          }
          drawBoard(); drawGoals(); return;
        }
        const s = r.path[i]; state.x = s.x; state.y = s.y; state.d = s.d; state.bump = !!s.bump; state.trail.add(s.x + ',' + s.y);
        cells.stars.forEach((st, k) => { if (st.x === s.x && st.y === s.y) state.got.add(k); });
        setCur(s.bump ? null : s.ref); drawBoard(); drawGoals();
      }, 420);
    });
    $('#rst').addEventListener('click', () => { failRef = null; drawProg(); reset(); });
    $('#clr').addEventListener('click', () => { if (running) return; prog = []; open = null; failRef = null; reset(); drawProg(); });
    $('#bk').addEventListener('click', () => { clearInterval(running); home(); });
    drawPal(); drawBoard(); drawGoals(); drawProg();
  }
  KA.boot('coding', home);
})();
