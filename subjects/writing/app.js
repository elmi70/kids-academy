(function () {
  'use strict';
  const { $, $$, el, esc, t, shuffle } = KA;
  KA.addStrings({
    en: { 'wr.trace': '✏️ Trace letters', 'wr.spell': '🔤 Spell words', 'wr.upper': 'ABC', 'wr.lower': 'abc', 'wr.umlaut': 'Ä Ö Ü ß', 'wr.clear': 'Clear', 'wr.check': 'Check my letter', 'wr.hear': 'Hear the letter',
      'wr.follow': 'Trace the grey letter with your finger or mouse.', 'wr.good': 'Lovely tracing!', 'wr.next': 'Next letter', 'wr.spellQ': 'Spell the word', 'wr.spellEn': 'English words', 'wr.spellDe': 'German words',
      'wr.off': 'Stay on the grey letter. The red parts are off the letter.', 'wr.missed': 'You missed the orange parts. Trace the whole letter.', 'wr.scribble': 'Trace once, slowly, from the start to the end.', 'wr.empty': 'Draw on the grey letter first.',
      'wr.stat': 'Letter covered: {c}%. Staying on the letter: {a}%.',
      'wr.tip': 'Tip for grown-ups: this page checks how well the line follows the letter shape and that it stays on the letter. It does not check stroke order or direction, so please show your child where to start.' },
    de: { 'wr.trace': '✏️ Buchstaben nachspuren', 'wr.spell': '🔤 Wörter schreiben', 'wr.upper': 'ABC', 'wr.lower': 'abc', 'wr.umlaut': 'Ä Ö Ü ß', 'wr.clear': 'Löschen', 'wr.check': 'Meinen Buchstaben prüfen', 'wr.hear': 'Buchstaben anhören',
      'wr.follow': 'Fahre den grauen Buchstaben mit dem Finger oder der Maus nach.', 'wr.good': 'Schön nachgespurt!', 'wr.next': 'Nächster Buchstabe', 'wr.spellQ': 'Buchstabiere das Wort', 'wr.spellEn': 'Englische Wörter', 'wr.spellDe': 'Deutsche Wörter',
      'wr.off': 'Bleib auf dem grauen Buchstaben. Die roten Stellen liegen neben dem Buchstaben.', 'wr.missed': 'Du hast die orangen Stellen ausgelassen. Spure den ganzen Buchstaben nach.', 'wr.scribble': 'Spure einmal langsam vom Anfang bis zum Ende.', 'wr.empty': 'Male zuerst auf den grauen Buchstaben.',
      'wr.stat': 'Buchstabe abgedeckt: {c}%. Auf dem Buchstaben geblieben: {a}%.',
      'wr.tip': 'Tipp für Eltern: Diese Seite prüft, wie gut die Linie der Buchstabenform folgt und ob sie auf dem Buchstaben bleibt. Schreibrichtung und Reihenfolge werden nicht geprüft. Bitte zeige deinem Kind, wo es beginnt.' }
  });
  const W = window.KA_WRITING, T = window.KA_TRACE, app = $('#app');
  const S = T.S, FONT = 'bold 250px "Arial Rounded MT Bold", Arial, "Segoe UI", "DejaVu Sans", sans-serif';
  let tab = 'trace', set = 'upper';

  function home() {
    const ui = KA.getUi();
    app.innerHTML = '<div class="ka-tabs" role="tablist"><button class="ka-tab" role="tab" data-tab="trace" aria-selected="' + (tab === 'trace') + '">' + esc(t('wr.trace')) + '</button><button class="ka-tab" role="tab" data-tab="spell" aria-selected="' + (tab === 'spell') + '">' + esc(t('wr.spell')) + '</button></div><div id="body"></div>';
    $$('[data-tab]', app).forEach(b => b.addEventListener('click', () => { tab = b.dataset.tab; home(); }));
    if (tab === 'trace') letters(); else spellHome(ui);
  }

  function letters() {
    const body = $('#body');
    body.innerHTML = '<p class="muted small">' + esc(t('wr.tip')) + '</p><div class="ka-tabs"><button class="ka-tab" data-set="upper" aria-selected="' + (set === 'upper') + '">' + esc(t('wr.upper')) + '</button><button class="ka-tab" data-set="lower" aria-selected="' + (set === 'lower') + '">' + esc(t('wr.lower')) + '</button><button class="ka-tab" data-set="umlaut" aria-selected="' + (set === 'umlaut') + '">' + esc(t('wr.umlaut')) + '</button></div><div class="ka-units" id="units"></div>';
    $$('[data-set]', body).forEach(b => b.addEventListener('click', () => { set = b.dataset.set; letters(); }));
    const list = W[set].map(ch => ({ id: 't:' + ch, icon: ch, title: ' ' }));
    const rec = KA.firstUnfinished('writing', list, 1);
    KA.unitGrid($('#units'), 'writing', list, u => trace(u.id.slice(2)), rec);
    $$('.ka-unit-ic', body).forEach(e => { e.style.fontSize = '52px'; e.style.fontWeight = '800'; });
  }

  /* ----- tracing ----- */
  function glyphPos(ctx, ch) {
    ctx.font = FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    const m = ctx.measureText(ch), asc = m.actualBoundingBoxAscent, desc = m.actualBoundingBoxDescent;
    return { x: S / 2, y: (asc || desc) ? S / 2 + (asc - desc) / 2 : S * 0.72 };
  }
  function glyphMask(ch) {
    const c = document.createElement('canvas'); c.width = c.height = S;
    const x = c.getContext('2d', { willReadFrequently: true }), p = glyphPos(x, ch);
    x.fillStyle = '#000'; x.fillText(ch, p.x, p.y);
    const d = x.getImageData(0, 0, S, S).data, m = new Uint8Array(S * S);
    for (let i = 0; i < m.length; i++) m[i] = d[i * 4 + 3] > 128 ? 1 : 0;
    return m;
  }
  window.KA_WRITING_MASK = glyphMask;   // used by the automated tests

  function trace(ch) {
    const list = W[set], idx = list.indexOf(ch), mask = glyphMask(ch);
    let attempts = 0, done = false, feedback = false, pts = [], res = null;
    app.innerHTML = '<div id="vox"></div><div class="ka-card ka-center"><h2>' + esc(ch) + '</h2><p class="muted">' + esc(t('wr.follow')) + '</p><div style="width:100%;max-width:360px;margin:0 auto"><canvas id="cv" width="' + S + '" height="' + S + '" aria-label="' + esc(ch) + '" style="width:100%;height:auto;touch-action:none;background:#fffdf6;border:3px solid var(--line);border-radius:18px"></canvas></div>' +
      '<div class="ka-fb" id="fb" role="status" aria-live="polite"></div><p><button class="ka-btn primary" id="ck">✔ ' + esc(t('wr.check')) + '</button><button class="ka-btn" id="cl">🧽 ' + esc(t('wr.clear')) + '</button><button class="ka-btn listen" id="hr">🔊 ' + esc(t('wr.hear')) + '</button></p><div id="nav"></div></div><p><button class="ka-btn" id="bk">← ' + esc(t('back')) + '</button></p>';
    KA.voiceCheck(KA.getUi(), $('#vox'));
    const cv = $('#cv'), ctx = cv.getContext('2d');
    const ink = document.createElement('canvas'); ink.width = ink.height = S; const ictx = ink.getContext('2d');
    ictx.lineCap = 'round'; ictx.lineJoin = 'round'; ictx.lineWidth = T.P.STROKE_W; ictx.strokeStyle = '#2f6fed';
    const grey = document.createElement('canvas'); grey.width = grey.height = S;
    { const g2 = grey.getContext('2d'), im = g2.createImageData(S, S); for (let i = 0; i < mask.length; i++) if (mask[i]) { im.data[i * 4] = 217; im.data[i * 4 + 1] = 217; im.data[i * 4 + 2] = 217; im.data[i * 4 + 3] = 255; } g2.putImageData(im, 0, 0); }
    function overlay() {
      if (!res || !res.missed) return;
      const o = document.createElement('canvas'); o.width = o.height = S; const oc = o.getContext('2d'), im = oc.createImageData(S, S);
      for (let i = 0; i < res.missed.length; i++) if (res.missed[i]) { im.data[i * 4] = 240; im.data[i * 4 + 1] = 138; im.data[i * 4 + 2] = 36; im.data[i * 4 + 3] = 230; }
      oc.putImageData(im, 0, 0); ctx.drawImage(o, 0, 0);
      ctx.fillStyle = '#d92d20'; res.off.forEach((p, k) => { if (k % 4 === 0) { ctx.beginPath(); ctx.arc(p.x, p.y, 9, 0, 6.2832); ctx.fill(); } });
    }
    function redraw() { ctx.clearRect(0, 0, S, S); ctx.drawImage(grey, 0, 0); ctx.drawImage(ink, 0, 0); if (feedback) overlay(); }
    function wipe() { ictx.clearRect(0, 0, S, S); pts = []; feedback = false; res = null; redraw(); }
    redraw();
    let drawing = false, last = null;
    const pt = e => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * S / r.width, y: (e.clientY - r.top) * S / r.height }; };
    cv.addEventListener('pointerdown', e => {
      if (done) return;
      if (feedback) { wipe(); $('#fb').textContent = ''; }
      drawing = true; last = pt(e); try { cv.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
      pts.push(last); ictx.beginPath(); ictx.moveTo(last.x, last.y); ictx.lineTo(last.x + 0.01, last.y); ictx.stroke(); redraw(); e.preventDefault();
    });
    cv.addEventListener('pointermove', e => {
      if (!drawing) return; const p = pt(e);
      T.densify(last, p, 2).forEach(q => pts.push(q));
      ictx.beginPath(); ictx.moveTo(last.x, last.y); ictx.lineTo(p.x, p.y); ictx.stroke(); last = p; redraw(); e.preventDefault();
    });
    const up = () => { drawing = false; };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up); cv.addEventListener('pointerleave', up);
    $('#cl').addEventListener('click', () => { wipe(); $('#fb').textContent = ''; });
    $('#hr').addEventListener('click', () => KA.speak(ch === 'ß' ? 'Eszett' : ch, KA.getUi(), 0.8));
    $('#bk').addEventListener('click', home);
    $('#ck').addEventListener('click', () => {
      if (done) return; const fb = $('#fb');
      if (!pts.length) { fb.textContent = '💬 ' + t('wr.empty'); return; }
      res = T.score(mask, pts); attempts++;
      const stat = t('wr.stat', { c: Math.round(res.coverage * 100), a: Math.round(res.accuracy * 100) });
      window.KA_WRITING_LAST = { ok: res.ok, coverage: res.coverage, accuracy: res.accuracy, overdraw: res.overdraw, run: res.run, dev: res.dev, reason: res.reason, stars: res.stars };
      if (res.ok) {
        done = true; feedback = false; redraw();
        KA.awardStars('writing', 't:' + ch, res.stars); KA.refreshStars(); KA.beep(true);
        fb.textContent = '✅ ' + t('wr.good') + ' ' + '⭐'.repeat(res.stars) + '  ' + stat;
        const nav = $('#nav'); nav.innerHTML = '';
        if (idx < list.length - 1) { const b = el('button', 'ka-btn primary', esc(t('wr.next')) + ' →'); b.type = 'button'; b.addEventListener('click', () => trace(list[idx + 1])); nav.appendChild(b); b.focus(); }
      } else {
        KA.beep(false); feedback = true; redraw();
        fb.textContent = '❌ ' + t('wr.' + res.reason);          // a hint only: numbers next to "wrong" would confuse a child
      }
    });
  }

  /* ----- spelling ----- */
  function spellHome() {
    const body = $('#body');
    const list = [{ id: 's:en', icon: '🇬🇧', title: t('wr.spellEn') }, { id: 's:de', icon: '🇩🇪', title: t('wr.spellDe') }];
    body.innerHTML = '<div class="ka-units" id="units"></div>';
    KA.unitGrid($('#units'), 'writing', list, u => spell(u.id.slice(2)), null);
  }
  function spell(lang) {
    const ws = shuffle(W.words[lang]).slice(0, 8);
    const items = ws.map(([w, em]) => ({ type: 'reorder', q: t('wr.spellQ'), visual: em, say: w, sayLang: lang, words: w.split(''), join: '', a: w }));
    app.innerHTML = '<div id="vox"></div><div id="qz"></div>';
    KA.voiceCheck(lang, $('#vox'));
    KA.run($('#qz'), items, { subject: 'writing', unit: 's:' + lang, lang, onBack: home, onAgain: () => spell(lang) });
  }
  KA.boot('writing', home);
})();
