(function () {
  'use strict';
  const { $, esc, t } = KA;
  KA.addStrings({
    en: { 'mt.howmany': 'How many?', 'mt.bigger': 'Which number is bigger?', 'mt.smaller': 'Which number is smaller?', 'mt.solve': 'Solve it', 'mt.intro': 'Ten questions in each lesson. The star lesson is a good place to start.' },
    de: { 'mt.howmany': 'Wie viele?', 'mt.bigger': 'Welche Zahl ist größer?', 'mt.smaller': 'Welche Zahl ist kleiner?', 'mt.solve': 'Rechne', 'mt.intro': 'In jeder Lektion gibt es zehn Fragen. Beginne mit der empfohlenen Lektion.' }
  });
  const app = $('#app'), M = window.KA_MATHS;
  const START = { '45': 0, '67': 1, '810': 7 };

  function home(p) {
    const start = START[p.band] || 0, ui = KA.getUi();
    const list = M.LEVELS.map(l => ({ id: l.id, icon: l.icon, title: l.title[ui] }));
    const rec = KA.firstUnfinished('maths', list.slice(start)) || null;
    app.innerHTML = '<p class="muted">' + esc(t('mt.intro')) + '</p><div class="ka-units" id="units"></div>';
    KA.unitGrid($('#units'), 'maths', list, u => lesson(p, u.id), rec);
  }
  function items(levelId) {
    return Array.from({ length: 10 }, () => {
      const q = M.make(levelId);
      const it = { type: q.type, q: q.qk ? t('mt.' + q.qk) : q.q, a: q.a, visual: q.visual, big: q.big };
      if (q.type === 'choice') it.options = q.options.map(o => ({ t: String(o), v: o }));
      if (q.type === 'choice' && q.options.length === 4) it.keepOrder = false;
      return it;
    });
  }
  function lesson(p, id) {
    const l = M.LEVELS.find(x => x.id === id);
    app.innerHTML = '<h2>' + esc(l.icon + ' ' + l.title[KA.getUi()]) + '</h2><div id="qz"></div>';
    KA.run($('#qz'), items(id), { subject: 'maths', unit: id, lang: 'en', onBack: () => home(p), onAgain: () => lesson(p, id) });
  }
  KA.boot('maths', home);
})();
