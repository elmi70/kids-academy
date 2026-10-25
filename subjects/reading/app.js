(function () {
  'use strict';
  const { $, $$, el, esc, t, shuffle } = KA;
  KA.addStrings({
    en: { 'rd.pic': 'Read the word. Tap the picture.', 'rd.listen': 'Listen. Tap the word you hear.', 'rd.sounds': 'Sounds', 'rd.blend': 'Blend', 'rd.sentences': 'Sentences', 'rd.quiz': 'Quiz',
      'rd.tapSound': 'Tap a sound to hear a word that starts with it.', 'rd.blendBtn': 'Blend it', 'rd.hear': 'Hear the word', 'rd.nextWord': 'Next word', 'rd.prevWord': 'Previous word', 'rd.readTo': 'Read to me',
      'rd.toBlend': 'Next: blend words', 'rd.toSent': 'Next: sentences', 'rd.toQuiz': 'Next: quiz', 'rd.tip': 'Tip for grown-ups: ask your child to say each sound, then blend them. Voices say letter names, so the example words show the real sound.', 'rd.english': 'English reading', 'rd.german': 'Deutsch lesen', 'rd.word': 'Word' },
    de: { 'rd.pic': 'Lies das Wort. Tippe auf das Bild.', 'rd.listen': 'Hör zu. Tippe auf das Wort, das du hörst.', 'rd.sounds': 'Laute', 'rd.blend': 'Verschleifen', 'rd.sentences': 'Sätze', 'rd.quiz': 'Quiz',
      'rd.tapSound': 'Tippe auf einen Laut und hör ein Wort, das damit beginnt.', 'rd.blendBtn': 'Zusammenschleifen', 'rd.hear': 'Wort anhören', 'rd.nextWord': 'Nächstes Wort', 'rd.prevWord': 'Vorheriges Wort', 'rd.readTo': 'Vorlesen',
      'rd.toBlend': 'Weiter: Wörter verschleifen', 'rd.toSent': 'Weiter: Sätze', 'rd.toQuiz': 'Weiter: Quiz', 'rd.tip': 'Tipp für Eltern: Das Kind spricht jeden Laut und schleift sie dann zusammen. Sprachausgaben nennen Buchstabennamen, deshalb zeigen die Beispielwörter den echten Laut.', 'rd.english': 'English reading', 'rd.german': 'Deutsch lesen', 'rd.word': 'Wort' }
  });
  const DATA = window.KA_READING, app = $('#app');
  let lang = 'en';

  const parse = w => w.split('.');
  const text = w => parse(w).join('');
  const emojiOf = (D, w) => D.emoji[text(w).toLowerCase()];

  function home() {
    const D = DATA[lang];
    const rec = KA.firstUnfinished('reading', D.units.map(u => ({ id: u.id })));
    app.innerHTML = '<div id="vox"></div><div class="ka-tabs" role="tablist"><button class="ka-tab" role="tab" data-l="en" aria-selected="' + (lang === 'en') + '">🇬🇧 ' + esc(t('rd.english')) + '</button><button class="ka-tab" role="tab" data-l="de" aria-selected="' + (lang === 'de') + '">🇩🇪 ' + esc(t('rd.german')) + '</button></div>' +
      '<p class="muted small">' + esc(t('rd.tip')) + '</p><div class="ka-units" id="units"></div>';
    KA.voiceCheck(lang, $('#vox'));
    $$('.ka-tab', app).forEach(b => b.addEventListener('click', () => { lang = b.dataset.l; home(); }));
    KA.unitGrid($('#units'), 'reading', D.units.map(u => ({ id: u.id, icon: u.icon, title: u.title })), u => lesson(D.units.find(x => x.id === u.id), 0), rec);
  }

  function steps(u, step) {
    const names = ['rd.sounds', 'rd.blend', 'rd.sentences', 'rd.quiz'];
    return '<div class="ka-tabs">' + names.map((n, i) => '<span class="ka-tab" aria-current="' + (i === step ? 'step' : 'false') + '" aria-selected="' + (i === step) + '">' + (i + 1) + '. ' + esc(t(n)) + '</span>').join('') + '</div>';
  }

  function lesson(u, step) {
    const D = DATA[lang];
    if (step === 0) sounds(D, u);
    else if (step === 1) blend(D, u, 0);
    else if (step === 2) sentences(D, u);
    else quiz(D, u);
  }

  function sounds(D, u) {
    app.innerHTML = '<div id="vox"></div>' + steps(u, 0) + '<div class="ka-card ka-center"><h2>' + esc(t('rd.sounds')) + ': ' + esc(u.title) + '</h2><p class="muted">' + esc(t('rd.tapSound')) + '</p><div class="ka-graph" id="gt"></div><div class="ka-bigword" id="exw" aria-live="polite">&nbsp;</div></div>' +
      '<p><button class="ka-btn" id="bk">← ' + esc(t('back')) + '</button><button class="ka-btn primary" id="nx">' + esc(t('rd.toBlend')) + ' →</button></p>';
    KA.voiceCheck(lang, $('#vox'));
    u.graphemes.forEach(gr => {
      const b = el('button', 'ka-gtile', esc(gr)); b.type = 'button';
      b.addEventListener('click', () => {
        $$('.ka-gtile', app).forEach(x => x.classList.toggle('on', x === b));
        const ex = D.ex[gr.toLowerCase()];
        if (ex) { $('#exw').innerHTML = '<span style="font-size:60px">' + esc(ex[1]) + '</span><br>' + hi(ex[0], gr); KA.speak(ex[0], lang, 0.75); }
      });
      $('#gt').appendChild(b);
    });
    $('#bk').addEventListener('click', home); $('#nx').addEventListener('click', () => blend(D, u, 0));
  }
  function hi(word, gr) { const i = word.toLowerCase().indexOf(gr.toLowerCase()); if (i < 0) return esc(word); return esc(word.slice(0, i)) + '<mark>' + esc(word.slice(i, i + gr.length)) + '</mark>' + esc(word.slice(i + gr.length)); }

  function blend(D, u, idx) {
    const w = u.words[idx], gs = parse(w), word = text(w), em = emojiOf(D, w);
    app.innerHTML = '<div id="vox"></div>' + steps(u, 1) + '<div class="ka-card ka-center"><p class="muted">' + esc(t('rd.word')) + ' ' + (idx + 1) + ' / ' + u.words.length + '</p>' + (em ? '<div class="ka-visual" aria-hidden="true">' + esc(em) + '</div>' : '') +
      '<div class="ka-graph" id="gt" aria-label="' + esc(word) + '"></div><p><button class="ka-btn primary" id="bl">▶ ' + esc(t('rd.blendBtn')) + '</button><button class="ka-btn listen" id="hr">🔊 ' + esc(t('rd.hear')) + '</button></p></div>' +
      '<p><button class="ka-btn" id="pv"' + (idx === 0 ? ' disabled' : '') + '>← ' + esc(t('rd.prevWord')) + '</button>' + (idx < u.words.length - 1 ? '<button class="ka-btn" id="nw">' + esc(t('rd.nextWord')) + ' →</button>' : '') +
      '<button class="ka-btn primary" id="nx">' + esc(t('rd.toSent')) + ' →</button></p>';
    KA.voiceCheck(lang, $('#vox'));
    const tiles = gs.map(gr => { const b = el('button', 'ka-gtile', esc(gr)); b.type = 'button'; $('#gt').appendChild(b); b.addEventListener('click', () => { $$('.ka-gtile', app).forEach(x => x.classList.toggle('on', x === b)); }); return b; });
    let timer = null;
    $('#bl').addEventListener('click', () => {
      clearTimeout(timer); let i = 0;
      const step = () => { tiles.forEach((b, k) => b.classList.toggle('on', k === i)); i++; if (i <= tiles.length) timer = setTimeout(step, 650); else { tiles.forEach(b => b.classList.add('on')); KA.speak(word, lang, 0.7); } };
      step();
    });
    $('#hr').addEventListener('click', () => KA.speak(word, lang, 0.7));
    $('#pv').addEventListener('click', () => { clearTimeout(timer); blend(D, u, idx - 1); });
    const nw = $('#nw'); if (nw) nw.addEventListener('click', () => { clearTimeout(timer); blend(D, u, idx + 1); });
    $('#nx').addEventListener('click', () => { clearTimeout(timer); sentences(D, u); });
  }

  function sentences(D, u) {
    app.innerHTML = '<div id="vox"></div>' + steps(u, 2) + '<div class="ka-card"><h2>' + esc(t('rd.sentences')) + '</h2><div id="sl"></div></div><p><button class="ka-btn" id="pv">← ' + esc(t('back')) + '</button><button class="ka-btn primary" id="nx">' + esc(t('rd.toQuiz')) + ' →</button></p>';
    KA.voiceCheck(lang, $('#vox'));
    let timer = null;
    u.sentences.forEach(s => {
      const row = el('div', 'ka-card ghost'), ws = s.split(' ');
      row.innerHTML = '<div class="ka-bigword" style="font-size:36px;text-align:left">' + ws.map((w, i) => '<span data-i="' + i + '">' + esc(w) + '</span>').join(' ') + '</div>';
      const b = el('button', 'ka-btn listen', '🔊 ' + esc(t('rd.readTo'))); b.type = 'button';
      b.addEventListener('click', () => {
        clearTimeout(timer); KA.speak(s, lang, 0.7); let i = 0;
        const step = () => { $$('span', row).forEach((sp, k) => { sp.style.background = k === i ? 'var(--yellow)' : ''; sp.style.color = k === i ? '#23304a' : ''; sp.style.borderRadius = '8px'; }); i++; if (i <= ws.length) timer = setTimeout(step, 420 + ws[i - 1].length * 70); else $$('span', row).forEach(sp => { sp.style.background = ''; sp.style.color = ''; }); };
        step();
      });
      row.appendChild(b); $('#sl').appendChild(row);
    });
    $('#pv').addEventListener('click', () => { clearTimeout(timer); blend(D, u, 0); });
    $('#nx').addEventListener('click', () => { clearTimeout(timer); quiz(D, u); });
  }

  function distractors(words, target, n) {
    const tw = text(target).toLowerCase();
    const others = words.filter(w => text(w).toLowerCase() !== tw).map(w => ({ w, s: (text(w)[0].toLowerCase() === tw[0] ? 2 : 0) + (text(w).length === tw.length ? 1 : 0) + Math.random() * 0.9 }));
    others.sort((a, b) => b.s - a.s); return others.slice(0, n).map(o => text(o.w));
  }
  function buildQuiz(D, u) {
    const words = u.words, pics = shuffle(words.filter(w => emojiOf(D, w))), items = [];
    const picN = Math.min(3, pics.length);
    pics.slice(0, picN).forEach(w => {
      const em = emojiOf(D, w), others = shuffle(Object.keys(D.emoji).filter(k => D.emoji[k] !== em && D.emoji[k] !== '')).slice(0, 2).map(k => D.emoji[k]);
      items.push({ type: 'choice', q: t('rd.pic'), visual: text(w), big: true, options: [{ t: em, v: 'ok' }].concat(others.map((e, i) => ({ t: e, v: 'x' + i }))), a: 'ok', autoSay: false });
    });
    const rest = shuffle(words.filter(w => !pics.slice(0, picN).includes(w)));
    rest.slice(0, 6 - picN).concat(rest.length < 6 - picN ? shuffle(words).slice(0, 6 - picN - rest.length) : []).forEach(w => {
      const word = text(w);
      items.push({ type: 'choice', q: t('rd.listen'), say: word, sayLang: lang, rate: 0.7, options: [word].concat(distractors(words, w, 2)), a: word });
    });
    const q = u.q;
    return shuffle(items).concat([{ type: 'choice', q: q.q, say: q.q, sayLang: lang, rate: 0.85, visual: u.sentences.join(' '), options: q.options, a: q.a, autoSay: true }]);
  }
  function quiz(D, u) {
    app.innerHTML = '<div id="vox"></div>' + steps(u, 3) + '<div id="qz"></div>';
    KA.voiceCheck(lang, $('#vox'));
    KA.run($('#qz'), buildQuiz(D, u), { subject: 'reading', unit: u.id, lang, onBack: home, onAgain: () => quiz(D, u) });
  }
  KA.boot('reading', p => { lang = p.ui === 'de' ? 'de' : 'en'; home(); });
})();
