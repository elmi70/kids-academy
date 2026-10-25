/* Shared engine for the English and German subjects. Content lives in each subject's data.js. */
(function (g) {
  'use strict';
  const { $, esc, t, shuffle } = KA;
  KA.addStrings({
    en: { 'lg.see': 'Which word matches the picture?', 'lg.hearPic': 'Listen. Tap the picture.', 'lg.hearWord': 'Listen. Tap the word.', 'lg.spell': 'Spell the word', 'lg.order': 'Put the words in the right order.',
      'lg.aan': 'a or an?', 'lg.plural': 'Which word is right?', 'lg.article': 'der, die or das?', 'lg.num': 'Which word is this number?', 'lg.after': 'Which day comes after {d}?', 'lg.before': 'Which day comes before {d}?',
      'lg.tip': 'Tip for grown-ups: the questions use pictures so your child can learn without reading instructions. Use the 🔊 button to hear each word.' },
    de: { 'lg.see': 'Welches Wort passt zum Bild?', 'lg.hearPic': 'Hör zu. Tippe auf das Bild.', 'lg.hearWord': 'Hör zu. Tippe auf das Wort.', 'lg.spell': 'Buchstabiere das Wort', 'lg.order': 'Bringe die Wörter in die richtige Reihenfolge.',
      'lg.aan': 'a oder an?', 'lg.plural': 'Welches Wort stimmt?', 'lg.article': 'der, die oder das?', 'lg.num': 'Welches Wort passt zu dieser Zahl?', 'lg.after': 'Welcher Tag kommt nach {d}?', 'lg.before': 'Welcher Tag kommt vor {d}?',
      'lg.tip': 'Tipp für Eltern: Die Fragen nutzen Bilder, damit dein Kind ohne Leseanleitung lernen kann. Mit 🔊 hört es jedes Wort.' }
  });

  function pickN(arr, n) { return shuffle(arr).slice(0, n); }
  function others(list, correct, n, key) { return pickN(list.filter(x => key(x) !== key(correct)), n); }

  function build(unit, lang) {
    const items = [];
    if (unit.type === 'vocab') {
      const words = pickN(unit.words, Math.min(8, unit.words.length));
      words.slice(0, 4).forEach(w => {
        items.push({ type: 'choice', q: t('lg.see'), visual: w[1], say: w[0], sayLang: lang, options: [w[0]].concat(others(unit.words, w, 2, x => x[0]).map(x => x[0])), a: w[0] });
      });
      words.slice(4, 8).forEach(w => {
        items.push({ type: 'choice', q: t('lg.hearPic'), say: w[0], sayLang: lang, big: true, options: [{ t: w[1], v: w[0] }].concat(others(unit.words, w, 2, x => x[0]).map(x => ({ t: x[1], v: x[0] }))), a: w[0] });
      });
      pickN(unit.words.filter(w => w[0].length <= 6 && !/\s/.test(w[0])), 2).forEach(w => {
        items.push({ type: 'reorder', q: t('lg.spell'), visual: w[1], say: w[0], sayLang: lang, words: w[0].split(''), join: '' });
      });
    } else if (unit.type === 'articles') {
      pickN(unit.nouns, Math.min(10, unit.nouns.length)).forEach(n => {
        items.push({ type: 'choice', q: t('lg.article'), visual: n[2], options: ['der', 'die', 'das'], keepOrder: true, a: n[0], explain: n[0] + ' ' + n[1], sayCorrect: n[0] + ' ' + n[1], sayLang: lang });
        items[items.length - 1].q = '___ ' + n[1] + '  (' + t('lg.article') + ')';
      });
    } else if (unit.type === 'sight') {
      pickN(unit.words, Math.min(10, unit.words.length)).forEach(w => {
        items.push({ type: 'choice', q: t('lg.hearWord'), say: w, sayLang: lang, options: [w].concat(pickN(unit.words.filter(x => x !== w), 2)), a: w });
      });
    } else if (unit.type === 'sentences') {
      pickN(unit.sentences, Math.min(6, unit.sentences.length)).forEach(s => {
        items.push({ type: 'reorder', q: t('lg.order'), visual: s.emoji, say: s.words.join(' ') + (s.end || ''), sayLang: lang, words: s.words, end: s.end || '.' });
      });
    } else if (unit.type === 'aan') {
      pickN(unit.nouns, Math.min(10, unit.nouns.length)).forEach(n => {
        items.push({ type: 'choice', q: '___ ' + n[0] + '  (' + t('lg.aan') + ')', visual: n[2], options: ['a', 'an'], keepOrder: true, a: n[1], explain: n[1] + ' ' + n[0], sayCorrect: n[1] + ' ' + n[0], sayLang: lang });
      });
    } else if (unit.type === 'plural') {
      pickN(unit.nouns, Math.min(8, unit.nouns.length)).forEach(n => {
        const wrong = pickN(n[3], 2);
        items.push({ type: 'choice', q: 'one ' + n[0] + ', two ___', visual: n[2], visualHtml: false, options: [n[1]].concat(wrong), a: n[1], sayCorrect: 'two ' + n[1], sayLang: lang });
      });
    } else if (unit.type === 'numbers') {
      pickN(unit.words, Math.min(8, unit.words.length)).forEach((w, i) => {
        if (i % 2 === 0) items.push({ type: 'choice', q: t('lg.num'), visual: w[1], options: [w[0]].concat(others(unit.words, w, 2, x => x[0]).map(x => x[0])), a: w[0], sayCorrect: w[0], sayLang: lang });
        else items.push({ type: 'choice', q: t('lg.hearPic'), say: w[0], sayLang: lang, big: true, options: [{ t: w[1], v: w[0] }].concat(others(unit.words, w, 2, x => x[0]).map(x => ({ t: x[1], v: x[0] }))), a: w[0] });
      });
    } else if (unit.type === 'days') {
      const d = unit.days;
      for (let k = 0; k < 8; k++) {
        const i = Math.floor(Math.random() * d.length), after = Math.random() < 0.5;
        const ans = d[(i + (after ? 1 : d.length - 1)) % d.length];
        items.push({ type: 'choice', q: t(after ? 'lg.after' : 'lg.before', { d: d[i] }), say: d[i], sayLang: lang, options: [ans].concat(pickN(d.filter(x => x !== ans && x !== d[i]), 2)), a: ans, sayCorrect: ans });
      }
    }
    return items;
  }

  g.KA_LANGAPP = function (subject, lang, DATA) {
    const app = $('#app');
    function home(p) {
      const ui = KA.getUi();
      const list = DATA.units.map(u => ({ id: u.id, icon: u.icon, title: u.title[ui] || u.title.en }));
      app.innerHTML = '<div id="vox"></div><p class="muted small">' + esc(t('lg.tip')) + '</p><div class="ka-units" id="units"></div>';
      KA.voiceCheck(lang, $('#vox'));
      KA.unitGrid($('#units'), subject, list, u => lesson(p, u.id), KA.firstUnfinished(subject, list));
    }
    function lesson(p, id) {
      const u = DATA.units.find(x => x.id === id);
      app.innerHTML = '<div id="vox"></div><h2>' + esc(u.icon + ' ' + (u.title[KA.getUi()] || u.title.en)) + '</h2><div id="qz"></div>';
      KA.voiceCheck(lang, $('#vox'));
      KA.run($('#qz'), build(u, lang), { subject, unit: id, lang, onBack: () => home(p), onAgain: () => lesson(p, id) });
    }
    KA.boot(subject, home);
  };
  g.KA_LANG_BUILD = build;
  if (typeof module !== 'undefined') module.exports = { build };
})(typeof window !== 'undefined' ? window : globalThis);
