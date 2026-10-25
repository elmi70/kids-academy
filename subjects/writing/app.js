(function () {
  'use strict';
  const { $, $$, el, esc, t, shuffle } = KA;
  KA.addStrings({
    en: { 'wr.trace': '✏️ Trace letters', 'wr.spell': '🔤 Spell words', 'wr.upper': 'ABC', 'wr.lower': 'abc', 'wr.umlaut': 'Ä Ö Ü ß', 'wr.clear': 'Clear', 'wr.check': 'Check my letter', 'wr.hear': 'Hear the letter',
      'wr.follow': 'Trace the grey letter with your finger or mouse.', 'wr.good': 'Lovely tracing!', 'wr.again': 'Not quite. Stay on the grey letter and try again.', 'wr.covered': 'You covered {p}% of the letter.', 'wr.next': 'Next letter', 'wr.spellQ': 'Spell the word', 'wr.spellEn': 'English words', 'wr.spellDe': 'German words',
      'wr.tip': 'Tip for grown-ups: this page checks how well the tracing follows the letter shape. It does not teach stroke order, so please show your child where to start.' },
    de: { 'wr.trace': '✏️ Buchstaben nachspuren', 'wr.spell': '🔤 Wörter schreiben', 'wr.upper': 'ABC', 'wr.lower': 'abc', 'wr.umlaut': 'Ä Ö Ü ß', 'wr.clear': 'Löschen', 'wr.check': 'Meinen Buchstaben prüfen', 'wr.hear': 'Buchstaben anhören',
      'wr.follow': 'Fahre den grauen Buchstaben mit dem Finger oder der Maus nach.', 'wr.good': 'Schön nachgespurt!', 'wr.again': 'Nicht ganz. Bleib auf dem grauen Buchstaben und versuche es nochmal.', 'wr.covered': 'Du hast {p}% des Buchstabens getroffen.', 'wr.next': 'Nächster Buchstabe', 'wr.spellQ': 'Buchstabiere das Wort', 'wr.spellEn': 'Englische Wörter', 'wr.spellDe': 'Deutsche Wörter',
      'wr.tip': 'Tipp für Eltern: Diese Seite prüft, wie gut die Spur der Buchstabenform folgt. Die Schreibrichtung wird nicht geübt. Bitte zeige deinem Kind, wo es beginnt.' }
  });
  const W = window.KA_WRITING, app = $('#app');
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
  const S = 320, FONT = 'bold 250px "Arial Rounded MT Bold", Arial, "Segoe UI", "DejaVu Sans", sans-serif';
  function glyphPos(ctx, ch) {
    ctx.font = FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    const m = ctx.measureText(ch);
    const asc = m.actualBoundingBoxAscent, desc = m.actualBoundingBoxDescent;
    const y = (asc || desc) ? S / 2 + (asc - desc) / 2 : S * 0.72;
    return { x: S / 2, y };
  }
  function layer() { const c = document.createElement('canvas'); c.width = S; c.height = S; return c; }
  function scoreTrace(ch, strokeCanvas) {
    const m = layer(), mc = m.getContext('2d'), pos = glyphPos(mc, ch);
    mc.fillStyle = '#000'; mc.fillText(ch, pos.x, pos.y);
    const d = layer(), dc = d.getContext('2d'); glyphPos(dc, ch);
    dc.fillStyle = '#000'; dc.strokeStyle = '#000'; dc.lineWidth = 46; dc.lineJoin = 'round'; dc.strokeText(ch, pos.x, pos.y); dc.fillText(ch, pos.x, pos.y);
    const mk = mc.getImageData(0, 0, S, S).data, dk = dc.getImageData(0, 0, S, S).data, sk = strokeCanvas.getContext('2d').getImageData(0, 0, S, S).data;
    let letter = 0, covered = 0, ink = 0, out = 0;
    for (let i = 3; i < mk.length; i += 4) {
      const inL = mk[i] > 128, inD = dk[i] > 128, st = sk[i] > 128;
      if (inL) { letter++; if (st) covered++; }
      if (st) { ink++; if (!inD) out++; }
    }
    return { coverage: letter ? covered / letter : 0, spill: ink ? out / ink : 1, ink };
  }
  window.KA_WRITING_SCORE = scoreTrace;   // used by the automated tests

  function trace(ch) {
    const list = W[set], idx = list.indexOf(ch);
    let attempts = 0, done = false;
    app.innerHTML = '<div id="vox"></div><div class="ka-card ka-center"><h2>' + esc(ch) + '</h2><p class="muted">' + esc(t('wr.follow')) + '</p><div class="wr-wrap" style="width:min(92vw,360px);margin:0 auto"><canvas id="cv" width="' + S + '" height="' + S + '" aria-label="' + esc(ch) + '" style="width:100%;height:auto;touch-action:none;background:#fffdf6;border:3px solid var(--line);border-radius:18px"></canvas></div>' +
      '<div class="ka-fb" id="fb" role="status" aria-live="polite"></div><p><button class="ka-btn primary" id="ck">✔ ' + esc(t('wr.check')) + '</button><button class="ka-btn" id="cl">🧽 ' + esc(t('wr.clear')) + '</button><button class="ka-btn listen" id="hr">🔊 ' + esc(t('wr.hear')) + '</button></p><div id="nav"></div></div><p><button class="ka-btn" id="bk">← ' + esc(t('back')) + '</button></p>';
    KA.voiceCheck(KA.getUi(), $('#vox'));
    const cv = $('#cv'), ctx = cv.getContext('2d'), strokes = layer(), sctx = strokes.getContext('2d');
    sctx.lineCap = 'round'; sctx.lineJoin = 'round'; sctx.lineWidth = 30; sctx.strokeStyle = '#2f6fed';
    function redraw() {
      ctx.clearRect(0, 0, S, S); const pos = glyphPos(ctx, ch);
      ctx.fillStyle = '#d9d9d9'; ctx.fillText(ch, pos.x, pos.y);
      ctx.drawImage(strokes, 0, 0);
    }
    redraw();
    let drawing = false, last = null;
    const pt = e => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * S / r.width, y: (e.clientY - r.top) * S / r.height }; };
    cv.addEventListener('pointerdown', e => { if (done) return; drawing = true; last = pt(e); try { cv.setPointerCapture(e.pointerId); } catch (_) { } sctx.beginPath(); sctx.moveTo(last.x, last.y); sctx.lineTo(last.x + 0.01, last.y); sctx.stroke(); redraw(); e.preventDefault(); });
    cv.addEventListener('pointermove', e => { if (!drawing) return; const p = pt(e); sctx.beginPath(); sctx.moveTo(last.x, last.y); sctx.lineTo(p.x, p.y); sctx.stroke(); last = p; redraw(); e.preventDefault(); });
    const up = () => { drawing = false; };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up); cv.addEventListener('pointerleave', up);
    $('#cl').addEventListener('click', () => { sctx.clearRect(0, 0, S, S); redraw(); $('#fb').textContent = ''; });
    $('#hr').addEventListener('click', () => KA.speak(ch === 'ß' ? 'Eszett' : ch, KA.getUi(), 0.8));
    $('#bk').addEventListener('click', home);
    $('#ck').addEventListener('click', () => {
      if (done) return;
      const r = scoreTrace(ch, strokes), fb = $('#fb'), pct = Math.round(r.coverage * 100);
      attempts++;
      if (r.coverage >= 0.5 && r.spill <= 0.4) {
        done = true; const stars = attempts === 1 ? 3 : attempts === 2 ? 2 : 1;
        KA.awardStars('writing', 't:' + ch, stars); KA.refreshStars(); KA.beep(true);
        fb.textContent = '✅ ' + t('wr.good') + ' ' + '⭐'.repeat(stars);
        const nav = $('#nav'); nav.innerHTML = '';
        if (idx < list.length - 1) { const b = el('button', 'ka-btn primary', esc(t('wr.next')) + ' →'); b.type = 'button'; b.addEventListener('click', () => trace(list[idx + 1])); nav.appendChild(b); b.focus(); }
      } else {
        KA.beep(false); fb.textContent = '❌ ' + t('wr.again') + ' ' + t('wr.covered', { p: pct });
        sctx.clearRect(0, 0, S, S); redraw();
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
