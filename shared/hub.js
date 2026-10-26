(function () {
  'use strict';
  const { $, $$, el, esc, t } = KA;
  const app = $('#app');
  let adding = false, newAv = KA.AVATARS[0], newBand = '67', newUi = 'en';

  function render() {
    KA.reload();
    const p = KA.profile();
    KA.setUiLang(p ? p.ui : (adding ? newUi : KA.getUi()));
    document.documentElement.lang = KA.getUi();
    document.title = t('app');
    const kids = KA.profiles();
    let h = '<div class="ka-langbar"><button type="button" class="ka-tab" data-ui="en" aria-selected="' + (KA.getUi() === 'en') + '">English</button> <button type="button" class="ka-tab" data-ui="de" aria-selected="' + (KA.getUi() === 'de') + '">Deutsch</button></div>';
    h += '<h2>' + esc(t('who')) + '</h2>';
    if (!kids.length && !adding) h += '<p class="muted">' + esc(t('noChildren')) + '</p>';
    h += '<div class="ka-kids" role="group" aria-label="' + esc(t('who')) + '">' + kids.map(k => '<button type="button" class="ka-kid' + (p && p.id === k.id ? ' sel' : '') + '" data-kid="' + esc(k.id) + '" aria-pressed="' + (p && p.id === k.id) + '"><span class="av">' + esc(k.avatar) + '</span>' + esc(k.name) + '</button>').join('') +
      '<button type="button" class="ka-kid" id="add-kid"><span class="av">➕</span>' + esc(t('addChild')) + '</button></div>';
    if (adding) {
      h += '<form class="ka-card" id="kid-form"><h3>' + esc(t('newChild')) + '</h3><label class="ka-lab" for="kid-name">' + esc(t('name')) + '</label><input class="ka-input" id="kid-name" maxlength="20" autocomplete="off" required>' +
        '<div class="ka-avs" role="group" aria-label="avatar">' + KA.AVATARS.map(a => '<button type="button" class="ka-av" data-av="' + a + '" aria-pressed="' + (a === newAv) + '">' + a + '</button>').join('') + '</div>' +
        '<label class="ka-lab" for="kid-band">' + esc(t('age')) + '</label><select class="ka-input" id="kid-band"><option value="45"' + (newBand === '45' ? ' selected' : '') + '>' + esc(t('age45')) + '</option><option value="67"' + (newBand === '67' ? ' selected' : '') + '>' + esc(t('age67')) + '</option><option value="810"' + (newBand === '810' ? ' selected' : '') + '>' + esc(t('age810')) + '</option></select>' +
        '<label class="ka-lab" for="kid-ui">' + esc(t('uiLang')) + '</label><select class="ka-input" id="kid-ui"><option value="en"' + (newUi === 'en' ? ' selected' : '') + '>English</option><option value="de"' + (newUi === 'de' ? ' selected' : '') + '>Deutsch</option></select>' +
        '<p><button class="ka-btn primary" type="submit">' + esc(t('save')) + '</button><button class="ka-btn" type="button" id="kid-cancel">' + esc(t('cancel')) + '</button></p></form>';
    }
    if (p) {
      h += '<h2>' + esc(p.avatar) + ' ' + esc(p.name) + ' · ⭐ ' + KA.totalStars() + '</h2><div class="ka-grid">' + KA.SUBJECTS.map(s => {
        const done = KA.subjectDone(s.id), pct = Math.round(done / s.units * 100);
        return '<a class="ka-subject" href="' + s.path + 'index.html"><span class="ic" aria-hidden="true">' + s.icon + '</span><span class="nm">' + esc(t('subject.' + s.id)) + '</span><span class="muted small">' + esc(t('desc.' + s.id)) + '</span>' +
          '<span class="ka-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + pct + '" aria-label="' + esc(t('progress')) + '"><i style="width:' + pct + '%"></i></span><span class="muted small">' + done + ' / ' + s.units + ' ' + esc(t('lessons')) + ' · ⭐ ' + KA.subjectStars(s.id) + '</span></a>';
      }).join('') + '</div>';
      h += '<p><a class="ka-btn" href="super_reader_90_day_academy.html">📚 ' + esc(t('original')) + '</a></p>';
    }
    h += '<div class="ka-card ghost"><h3>' + esc(t('parent')) + '</h3><p class="muted small">' + esc(t('privacy')) + '</p><button type="button" class="ka-btn" id="p-open">🔒 ' + esc(t('parent')) + '</button><div id="p-area"></div></div>';
    h += '<p class="ka-foot"><a class="ka-btn" href="sound.html">🔊 ' + esc(t('soundHelp')) + '</a></p>';
    app.innerHTML = h;
    bind();
  }

  function parentArea() {
    const area = $('#p-area'), p = KA.profile();
    area.innerHTML = '<button type="button" class="ka-btn" id="p-exp">💾 ' + esc(t('exportB')) + '</button> <label class="ka-btn" for="p-imp">📂 ' + esc(t('importB')) + '</label><input type="file" id="p-imp" accept="application/json,.json" hidden>' +
      (p ? ' <button type="button" class="ka-btn danger" id="p-reset">♻️ ' + esc(t('resetC')) + '</button> <button type="button" class="ka-btn danger" id="p-del">🗑️ ' + esc(t('deleteC')) + '</button>' : '') + '<p class="ka-err" id="p-msg" role="status"></p>';
    $('#p-exp').addEventListener('click', () => {
      const blob = new Blob([KA.exportJSON()], { type: 'application/json' }), a = el('a'); a.href = URL.createObjectURL(blob);
      a.download = 'kids-academy-backup-' + new Date().toISOString().slice(0, 10) + '.json'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 500);
    });
    $('#p-imp').addEventListener('change', e => {
      const f = e.target.files[0]; if (!f) return; const r = new FileReader();
      r.onload = () => { const ok = KA.importJSON(String(r.result)); if (ok) render(); else { $('#p-msg').textContent = t('badFile'); } };
      r.readAsText(f);
    });
    if (p) {
      $('#p-reset').addEventListener('click', () => { if (confirm(t('confirmReset'))) { KA.resetProfile(p.id); render(); } });
      $('#p-del').addEventListener('click', () => { if (confirm(t('confirmDelete'))) { KA.removeProfile(p.id); render(); } });
    }
  }

  function bind() {
    $$('[data-ui]').forEach(b => b.addEventListener('click', () => { if (KA.profile()) KA.setUi(b.dataset.ui); else { newUi = b.dataset.ui; KA.setUiLang(newUi); } render(); }));
    $$('[data-kid]').forEach(b => b.addEventListener('click', () => { KA.selectProfile(b.dataset.kid); adding = false; render(); }));
    $('#add-kid').addEventListener('click', () => { adding = true; newUi = KA.getUi(); render(); const n = $('#kid-name'); if (n) n.focus(); });
    $('#p-open').addEventListener('click', () => KA.gate(parentArea));
    if (adding) {
      $$('[data-av]').forEach(b => b.addEventListener('click', () => { newAv = b.dataset.av; $$('[data-av]').forEach(x => x.setAttribute('aria-pressed', String(x === b))); }));
      $('#kid-band').addEventListener('change', e => { newBand = e.target.value; });
      $('#kid-ui').addEventListener('change', e => { newUi = e.target.value; const nm = $('#kid-name').value; render(); $('#kid-name').value = nm; });
      $('#kid-cancel').addEventListener('click', () => { adding = false; render(); });
      $('#kid-form').addEventListener('submit', e => { e.preventDefault(); const k = KA.addProfile($('#kid-name').value, newAv, $('#kid-band').value, $('#kid-ui').value); if (k) { adding = false; render(); } });
    }
  }

  const q = new URLSearchParams(location.search);
  if (q.get('add') === '1') adding = true;
  render();
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) navigator.serviceWorker.register('sw.js').catch(() => { });
})();
