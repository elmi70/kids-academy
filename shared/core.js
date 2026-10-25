/* Kids Academy shared engine: profiles, progress, translations, speech, exercises.
   No network calls. Everything is stored in this browser (localStorage). */
(function (g) {
  'use strict';
  const KEY = 'ka.v1';
  const AVATARS = ['🦊', '🐼', '🦁', '🐸', '🐙', '🦄', '🐯', '🐵', '🐧', '🦉', '🐢', '🐬'];
  const SPEECH = { en: 'en-GB', de: 'de-DE' };
  const SUBJECTS = [
    { id: 'reading', icon: '📖', units: 16, path: 'subjects/reading/' },
    { id: 'writing', icon: '✏️', units: 61, path: 'subjects/writing/' },
    { id: 'maths', icon: '🔢', units: 13, path: 'subjects/maths/' },
    { id: 'english', icon: '🇬🇧', units: 10, path: 'subjects/english/' },
    { id: 'german', icon: '🇩🇪', units: 8, path: 'subjects/german/' },
    { id: 'coding', icon: '🤖', units: 10, path: 'subjects/coding/' }
  ];

  /* ---------- helpers ---------- */
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  function el(tag, cls, html) { const e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; }
  function shuffle(a, rnd) { a = a.slice(); rnd = rnd || Math.random; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function rng(seed) { let t = seed >>> 0; return function () { t = (t + 0x6D2B79F5) >>> 0; let r = Math.imul(t ^ (t >>> 15), 1 | t); r ^= r + Math.imul(r ^ (r >>> 7), 61 | r); return ((r ^ (r >>> 14)) >>> 0) / 4294967296; }; }
  const pick = (a, rnd) => a[Math.floor((rnd || Math.random)() * a.length)];

  /* ---------- translations ---------- */
  const STR = {
    en: {
      app: 'Kids Academy', who: 'Who is learning today?', addChild: 'Add a child', name: 'Name', age: 'Age group', uiLang: 'App language',
      save: 'Save', cancel: 'Cancel', back: 'Back', next: 'Next', check: 'Check', again: 'Try again', great: 'Great!',
      notQuite: 'Not quite. Try again!', stars: 'Stars', question: 'Question', done: 'Well done!', firstTry: 'Only first tries count for stars.',
      parent: 'Parents', gate: 'Parent check: what is {q}?', gateWrong: 'That is not right.', ok: 'OK',
      exportB: 'Save a backup', importB: 'Load a backup', resetC: 'Reset this child', deleteC: 'Delete this child',
      confirmReset: 'Reset all progress for this child?', confirmDelete: 'Delete this child and their progress?',
      privacy: 'Everything stays on this device. Nothing is sent anywhere.',
      noVoice: 'No {lang} voice found on this device. Words may sound wrong.', noSpeech: 'This browser cannot speak. Ask a grown-up to read aloud.',
      listen: 'Listen', recommended: 'Recommended', needProfile: 'Please choose a child first.', goHub: 'Go to the start page',
      sound: 'Sound', original: 'Original 90-day reading plan', imported: 'Backup loaded.', badFile: 'This file is not a Kids Academy backup.',
      best: 'Best', newChild: 'New child', noChildren: 'No children yet. Add one to start.', switchChild: 'Switch child',
      result: 'You got {n} of {m} right the first time.', repeatAdvice: 'Practise this once more to make it stick.', masteredMsg: 'This is going well!',
      'subject.reading': 'Reading', 'subject.writing': 'Writing', 'subject.maths': 'Maths', 'subject.english': 'English', 'subject.german': 'German', 'subject.coding': 'Coding',
      'desc.reading': 'Sounds, blending and reading words', 'desc.writing': 'Trace letters and spell words', 'desc.maths': 'Counting, adding, times tables',
      'desc.english': 'Words, sentences and grammar', 'desc.german': 'der, die, das and German words', 'desc.coding': 'Program a robot with commands',
      age45: 'Age 4–5', age67: 'Age 6–7', age810: 'Age 8–10', unit: 'Unit', lessons: 'lessons', progress: 'Progress', open: 'Open'
    },
    de: {
      app: 'Kinder-Akademie', who: 'Wer lernt heute?', addChild: 'Kind hinzufügen', name: 'Name', age: 'Altersgruppe', uiLang: 'App-Sprache',
      save: 'Speichern', cancel: 'Abbrechen', back: 'Zurück', next: 'Weiter', check: 'Prüfen', again: 'Nochmal', great: 'Super!',
      notQuite: 'Nicht ganz. Versuch es nochmal!', stars: 'Sterne', question: 'Frage', done: 'Gut gemacht!', firstTry: 'Für Sterne zählt nur der erste Versuch.',
      parent: 'Eltern', gate: 'Eltern-Check: Was ist {q}?', gateWrong: 'Das stimmt nicht.', ok: 'OK',
      exportB: 'Sicherung speichern', importB: 'Sicherung laden', resetC: 'Dieses Kind zurücksetzen', deleteC: 'Dieses Kind löschen',
      confirmReset: 'Den ganzen Fortschritt dieses Kindes zurücksetzen?', confirmDelete: 'Dieses Kind und seinen Fortschritt löschen?',
      privacy: 'Alles bleibt auf diesem Gerät. Nichts wird gesendet.',
      noVoice: 'Keine {lang}-Stimme auf diesem Gerät gefunden. Wörter klingen vielleicht falsch.', noSpeech: 'Dieser Browser kann nicht sprechen. Bitte lass dir vorlesen.',
      listen: 'Anhören', recommended: 'Empfohlen', needProfile: 'Bitte zuerst ein Kind auswählen.', goHub: 'Zur Startseite',
      sound: 'Ton', original: 'Ursprünglicher 90-Tage-Leseplan', imported: 'Sicherung geladen.', badFile: 'Diese Datei ist keine Kinder-Akademie-Sicherung.',
      best: 'Beste', newChild: 'Neues Kind', noChildren: 'Noch keine Kinder. Füge eines hinzu.', switchChild: 'Kind wechseln',
      result: 'Du hattest {n} von {m} gleich beim ersten Mal richtig.', repeatAdvice: 'Übe das noch einmal, dann sitzt es.', masteredMsg: 'Das läuft gut!',
      'subject.reading': 'Lesen', 'subject.writing': 'Schreiben', 'subject.maths': 'Mathe', 'subject.english': 'Englisch', 'subject.german': 'Deutsch', 'subject.coding': 'Programmieren',
      'desc.reading': 'Laute, Verschleifen und Wörter lesen', 'desc.writing': 'Buchstaben nachspuren und Wörter schreiben', 'desc.maths': 'Zählen, Plus, Minus, Einmaleins',
      'desc.english': 'Wörter, Sätze und Grammatik', 'desc.german': 'der, die, das und deutsche Wörter', 'desc.coding': 'Einen Roboter mit Befehlen steuern',
      age45: 'Alter 4–5', age67: 'Alter 6–7', age810: 'Alter 8–10', unit: 'Einheit', lessons: 'Lektionen', progress: 'Fortschritt', open: 'Öffnen'
    }
  };
  let UI = 'en';
  function t(key, vars) {
    let s = (STR[UI] && STR[UI][key]) || STR.en[key] || key;
    if (vars) for (const k in vars) s = s.split('{' + k + '}').join(vars[k]);
    return s;
  }
  function addStrings(obj) { for (const l in obj) STR[l] = Object.assign(STR[l] || {}, obj[l]); }

  /* ---------- storage ---------- */
  function blank() { return { v: 1, current: null, profiles: {}, settings: { sound: true } }; }
  function load() {
    try {
      const s = JSON.parse(g.localStorage.getItem(KEY));
      if (s && s.v === 1 && s.profiles && typeof s.profiles === 'object') { s.settings = s.settings || { sound: true }; return s; }
    } catch (e) { /* ignore */ }
    return blank();
  }
  let store = load();
  function save() { try { g.localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) { /* storage may be blocked */ } }
  function reload() { store = load(); }
  const profile = () => (store.current && store.profiles[store.current]) || null;
  const profiles = () => Object.values(store.profiles);
  function addProfile(name, avatar, band, ui) {
    name = String(name || '').trim().slice(0, 20);
    if (!name) return null;
    const id = 'c' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36);
    store.profiles[id] = { id, name, avatar: avatar || AVATARS[0], band: band || '67', ui: ui === 'de' ? 'de' : 'en', progress: {}, created: Date.now() };
    store.current = id; save(); return store.profiles[id];
  }
  function selectProfile(id) { if (store.profiles[id]) { store.current = id; save(); UI = store.profiles[id].ui; } }
  function setUi(lang) { const p = profile(); if (p) { p.ui = lang === 'de' ? 'de' : 'en'; save(); } UI = lang === 'de' ? 'de' : 'en'; }
  function removeProfile(id) { delete store.profiles[id]; if (store.current === id) store.current = null; save(); }
  function resetProfile(id) { if (store.profiles[id]) { store.profiles[id].progress = {}; save(); } }
  function unitRec(subject, unit) { const p = profile(); return (p && p.progress[subject] && p.progress[subject][unit]) || null; }
  function award(subject, unit, correct, total) {
    const acc = total ? correct / total : 0;
    const stars = acc >= 0.9 ? 3 : acc >= 0.7 ? 2 : acc >= 0.4 ? 1 : 0;
    const p = profile();
    if (p) {
      const s = (p.progress[subject] = p.progress[subject] || {});
      const r = (s[unit] = s[unit] || { stars: 0, acc: 0, tries: 0 });
      r.tries++; r.stars = Math.max(r.stars, stars); r.acc = Math.max(r.acc, acc); r.last = Date.now();
      save();
    }
    return { stars, acc, mastered: acc >= 0.8 };
  }
  function awardStars(subject, unit, stars) {   // for activities scored by stars directly (tracing, coding)
    const p = profile();
    if (p) { const s = (p.progress[subject] = p.progress[subject] || {}); const r = (s[unit] = s[unit] || { stars: 0, acc: 0, tries: 0 }); r.tries++; r.stars = Math.max(r.stars, stars); r.acc = Math.max(r.acc, stars / 3); r.last = Date.now(); save(); }
    return stars;
  }
  function subjectStars(subject) { const p = profile(); if (!p || !p.progress[subject]) return 0; return Object.values(p.progress[subject]).reduce((a, r) => a + (r.stars || 0), 0); }
  function subjectDone(subject) { const p = profile(); if (!p || !p.progress[subject]) return 0; return Object.values(p.progress[subject]).filter(r => r.stars > 0).length; }
  const totalStars = () => SUBJECTS.reduce((a, s) => a + subjectStars(s.id), 0);
  function exportJSON() { return JSON.stringify(store, null, 1); }
  function importJSON(text) {
    let d; try { d = JSON.parse(text); } catch (e) { return false; }
    if (!d || d.v !== 1 || !d.profiles || typeof d.profiles !== 'object') return false;
    for (const id in d.profiles) { const p = d.profiles[id]; if (!p || typeof p.name !== 'string' || typeof p.progress !== 'object') return false; }
    store = d; store.settings = store.settings || { sound: true }; save(); return true;
  }
  const settings = () => store.settings;
  function setSound(on) { store.settings.sound = !!on; save(); }

  /* ---------- sound effects ---------- */
  let actx = null;
  function beep(ok) {
    if (!store.settings.sound) return;
    try {
      const AC = g.AudioContext || g.webkitAudioContext; if (!AC) return;
      actx = actx || new AC();
      const now = actx.currentTime;
      (ok ? [660, 880] : [220]).forEach((f, i) => {
        const o = actx.createOscillator(), gn = actx.createGain();
        o.type = 'sine'; o.frequency.value = f; gn.gain.setValueAtTime(0.0001, now + i * 0.12);
        gn.gain.exponentialRampToValueAtTime(0.15, now + i * 0.12 + 0.02); gn.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.12 + 0.18);
        o.connect(gn); gn.connect(actx.destination); o.start(now + i * 0.12); o.stop(now + i * 0.12 + 0.2);
      });
    } catch (e) { /* audio is optional */ }
  }

  /* ---------- speech ---------- */
  let voices = [];
  const hasSpeech = () => !!(g.speechSynthesis && g.SpeechSynthesisUtterance);
  function refreshVoices() { try { voices = hasSpeech() ? (g.speechSynthesis.getVoices() || []) : []; } catch (e) { voices = []; } }
  if (hasSpeech()) { refreshVoices(); try { g.speechSynthesis.addEventListener('voiceschanged', refreshVoices); } catch (e) { /* older browsers */ } }
  function findVoice(lang) {
    const want = (SPEECH[lang] || lang).toLowerCase(), short = want.slice(0, 2);
    return voices.find(v => v.lang.toLowerCase().replace('_', '-') === want) || voices.find(v => v.lang.toLowerCase().replace('_', '-').startsWith(short)) || null;
  }
  function speak(text, lang, rate) {
    if (!hasSpeech() || !text) return false;
    try {
      g.speechSynthesis.cancel();
      const u = new g.SpeechSynthesisUtterance(String(text));
      u.lang = SPEECH[lang] || lang || 'en-GB'; u.rate = rate || 0.85;
      const v = findVoice(lang); if (v) u.voice = v;
      g.speechSynthesis.speak(u); return true;
    } catch (e) { return false; }
  }
  function voiceCheck(lang, host) {
    if (!host) return;
    const show = () => {
      host.innerHTML = '';
      if (!hasSpeech()) host.appendChild(el('div', 'ka-note', '🔇 ' + esc(t('noSpeech'))));
      else if (!findVoice(lang)) host.appendChild(el('div', 'ka-note', '⚠️ ' + esc(t('noVoice', { lang: lang === 'de' ? 'German' : 'English' }))));
    };
    show();
    if (hasSpeech()) { setTimeout(() => { refreshVoices(); show(); }, 800); try { g.speechSynthesis.addEventListener('voiceschanged', () => { refreshVoices(); show(); }); } catch (e) { /* ignore */ } }
  }

  /* ---------- header, boot ---------- */
  function boot(subjectId, start) {
    reload();
    const p = profile(); UI = p ? p.ui : 'en';
    document.documentElement.lang = UI;
    const head = $('#ka-header'), app = $('#app');
    document.title = (subjectId ? t('subject.' + subjectId) + ' · ' : '') + t('app');
    if (!p) {
      head.innerHTML = '';
      app.innerHTML = '<div class="ka-card"><p>' + esc(t('needProfile')) + '</p><a class="ka-btn primary" href="../../index.html">' + esc(t('goHub')) + '</a></div>';
      return;
    }
    const s = SUBJECTS.find(x => x.id === subjectId);
    head.className = 'ka-head';
    head.innerHTML = '<a class="ka-back" href="../../index.html" aria-label="' + esc(t('goHub')) + '">←</a>' +
      '<h1 class="ka-title">' + (s ? s.icon + ' ' : '') + esc(t('subject.' + subjectId)) + '</h1>' +
      '<span class="ka-who">' + esc(p.avatar) + ' ' + esc(p.name) + '</span>' +
      '<span class="ka-stars" id="ka-stars" aria-label="' + esc(t('stars')) + '">⭐ ' + totalStars() + '</span>' +
      '<button type="button" class="ka-icon" id="ka-snd" aria-pressed="' + (store.settings.sound ? 'true' : 'false') + '" aria-label="' + esc(t('sound')) + '">' + (store.settings.sound ? '🔊' : '🔇') + '</button>';
    $('#ka-snd').addEventListener('click', () => { setSound(!store.settings.sound); $('#ka-snd').textContent = store.settings.sound ? '🔊' : '🔇'; $('#ka-snd').setAttribute('aria-pressed', String(store.settings.sound)); });
    start(p);
  }
  function refreshStars() { const s = $('#ka-stars'); if (s) s.textContent = '⭐ ' + totalStars(); }

  /* ---------- parent gate ---------- */
  function gate(onPass) {
    const a = 6 + Math.floor(Math.random() * 4), b = 6 + Math.floor(Math.random() * 4), c = 3 + Math.floor(Math.random() * 6);
    const box = el('div', 'ka-modal');
    box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true');
    box.innerHTML = '<div class="ka-card"><p><label for="ka-gate-in">' + esc(t('gate', { q: a + ' × ' + b + ' + ' + c })) + '</label></p>' +
      '<input id="ka-gate-in" inputmode="numeric" autocomplete="off" class="ka-input"><p class="ka-err" id="ka-gate-err" role="alert"></p>' +
      '<button type="button" class="ka-btn primary" id="ka-gate-ok">' + esc(t('ok')) + '</button> <button type="button" class="ka-btn" id="ka-gate-no">' + esc(t('cancel')) + '</button></div>';
    document.body.appendChild(box);
    const input = $('#ka-gate-in', box); input.focus();
    const close = () => box.remove();
    const tryIt = () => { if (Number(input.value) === a * b + c) { close(); onPass(); } else { $('#ka-gate-err', box).textContent = t('gateWrong'); input.select(); } };
    $('#ka-gate-ok', box).addEventListener('click', tryIt);
    $('#ka-gate-no', box).addEventListener('click', close);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') tryIt(); if (e.key === 'Escape') close(); });
  }

  /* ---------- exercise engine ---------- */
  /* items: {type:'choice'|'number'|'reorder', q, say, sayLang, visual, options:[{t,v}|string], a, keepOrder, words, join, end, explain} */
  function run(host, items, opts) {
    opts = opts || {};
    const lang = opts.lang || 'en';
    let i = 0, firstTry = 0, wrong = false, locked = false, finished = false;
    const total = items.length;

    function head(it) {
      let h = '<div class="ka-prog" aria-live="polite">' + esc(t('question')) + ' ' + (i + 1) + ' / ' + total + '</div>';
      h += '<div class="ka-meter" aria-hidden="true"><i style="width:' + Math.round(i / total * 100) + '%"></i></div>';
      if (it.q) h += '<div class="ka-prompt">' + esc(it.q) + '</div>';
      if (it.visual) h += '<div class="ka-visual" aria-hidden="true">' + (it.visualHtml ? it.visual : esc(it.visual)) + '</div>';
      if (it.say) h += '<button type="button" class="ka-btn listen" data-say>🔊 ' + esc(t('listen')) + '</button>';
      return h;
    }
    function sayIt(it) { if (it.say) speak(it.say, it.sayLang || lang, it.rate); }
    function correct(it, fb) {
      locked = true; if (!wrong) firstTry++;
      beep(true); fb.textContent = '✅ ' + t('great') + (it.explain ? ' ' + it.explain : '');
      if (it.sayCorrect) setTimeout(() => speak(it.sayCorrect, it.sayLang || lang, it.rate), 250);
      const nav = $('.ka-nav', host); nav.innerHTML = '';
      const b = el('button', 'ka-btn primary', esc(i + 1 >= total ? t('done') : t('next')) + ' →'); b.type = 'button'; nav.appendChild(b);
      b.addEventListener('click', () => { i++; show(); }); b.focus();
    }
    function miss(fb) { wrong = true; beep(false); fb.textContent = '❌ ' + t('notQuite'); }

    function show() {
      if (i >= total) return result();
      const it = items[i]; wrong = false; locked = false;
      const type = it.type || 'choice';
      host.innerHTML = '<div class="ka-q">' + head(it) + '<div class="ka-body"></div><div class="ka-fb" role="status" aria-live="polite"></div><div class="ka-nav"></div></div>';
      const body = $('.ka-body', host), fb = $('.ka-fb', host);
      const sb = $('[data-say]', host); if (sb) sb.addEventListener('click', () => sayIt(it));
      if (type === 'choice') {
        let opts2 = it.options.map(o => typeof o === 'object' ? o : { t: o, v: o });
        if (!it.keepOrder) opts2 = shuffle(opts2);
        const wrap = el('div', 'ka-opts' + (it.big ? ' big' : '')); body.appendChild(wrap);
        opts2.forEach(o => {
          const b = el('button', 'ka-opt', it.optionsHtml ? o.t : esc(o.t)); b.type = 'button'; b.dataset.v = String(o.v);
          if (o.label) b.setAttribute('aria-label', o.label);
          b.addEventListener('click', () => {
            if (locked || b.disabled) return;
            if (String(o.v) === String(it.a)) { b.classList.add('good'); $$('.ka-opt', wrap).forEach(x => { if (x !== b) x.disabled = true; }); correct(it, fb); }
            else { b.classList.add('bad'); b.disabled = true; miss(fb); }
          });
          wrap.appendChild(b);
        });
      } else if (type === 'number') {
        body.innerHTML = '<input class="ka-input num" id="ka-num" inputmode="numeric" autocomplete="off" aria-label="' + esc(it.q || 'answer') + '"><div class="ka-pad"></div>';
        const inp = $('#ka-num', host), pad = $('.ka-pad', host);
        const submit = () => {
          if (locked || inp.value === '') return;
          if (Number(inp.value) === Number(it.a)) { inp.classList.add('good'); inp.readOnly = true; correct(it, fb); }
          else { miss(fb); inp.value = ''; inp.focus(); }
        };
        ['7', '8', '9', '4', '5', '6', '1', '2', '3', '⌫', '0', '✔'].forEach(k => {
          const b = el('button', 'ka-key' + (k === '✔' ? ' ok' : ''), k); b.type = 'button';
          b.setAttribute('aria-label', k === '⌫' ? 'delete' : k === '✔' ? t('check') : k);
          b.addEventListener('click', () => { if (locked) return; if (k === '⌫') inp.value = inp.value.slice(0, -1); else if (k === '✔') submit(); else if (inp.value.length < 4) inp.value += k; });
          pad.appendChild(b);
        });
        inp.addEventListener('keydown', e => { if (e.key === 'Enter') submit(); });
        inp.addEventListener('input', () => { inp.value = inp.value.replace(/\D/g, '').slice(0, 4); });
        if (!(g.matchMedia && g.matchMedia('(pointer:coarse)').matches)) inp.focus(); else inp.readOnly = true;
      } else if (type === 'reorder') {
        const words = it.words, n = words.length, join = it.join === undefined ? ' ' : it.join;
        let order = shuffle(words.map((w, k) => k));
        for (let tries = 0; n > 1 && tries < 8 && order.every((o, k) => words[o] === words[k]); tries++) order = shuffle(order);
        body.innerHTML = '<div class="ka-slots" aria-label="answer"></div><div class="ka-bank"></div>';
        const slots = $('.ka-slots', host), bank = $('.ka-bank', host);
        const placed = new Array(n).fill(null);
        const draw = () => {
          slots.innerHTML = ''; bank.innerHTML = '';
          placed.forEach((k, s) => {
            const b = el('button', 'ka-slot' + (k === null ? ' empty' : ''), k === null ? '&nbsp;' : esc(words[k])); b.type = 'button';
            if (k !== null) b.addEventListener('click', () => { if (locked) return; placed[s] = null; draw(); });
            slots.appendChild(b);
          });
          if (it.end) slots.appendChild(el('span', 'ka-end', esc(it.end)));
          order.forEach(k => { if (placed.includes(k)) return; const b = el('button', 'ka-tile', esc(words[k])); b.type = 'button'; b.addEventListener('click', () => { if (locked) return; const s = placed.indexOf(null); if (s < 0) return; placed[s] = k; draw(); if (!placed.includes(null)) check(); }); bank.appendChild(b); });
        };
        const check = () => {
          const got = placed.map(k => words[k]);
          if (got.every((w, k) => w === words[k])) { slots.classList.add('good'); correct(it, fb); if (it.say) sayIt(it); }
          else { miss(fb); slots.classList.add('shake'); setTimeout(() => { slots.classList.remove('shake'); placed.fill(null); draw(); }, 700); }
        };
        draw();
      }
      if (it.autoSay !== false && it.say) setTimeout(() => sayIt(it), 150);
    }

    function result() {
      if (finished) return; finished = true;
      const r = opts.subject && opts.unit ? award(opts.subject, opts.unit, firstTry, total) : { stars: firstTry === total ? 3 : 0, acc: firstTry / total, mastered: firstTry / total >= 0.8 };
      refreshStars(); beep(true);
      host.innerHTML = '<div class="ka-result"><div class="ka-bigstars" role="img" aria-label="' + r.stars + ' / 3">' + '⭐'.repeat(r.stars) + '☆'.repeat(3 - r.stars) + '</div>' +
        '<h2>' + esc(t('done')) + '</h2><p>' + esc(t('result', { n: firstTry, m: total })) + '</p><p class="muted">' + esc(r.mastered ? t('masteredMsg') : t('repeatAdvice')) + '</p>' +
        '<p class="muted small">' + esc(t('firstTry')) + '</p><div class="ka-nav"></div></div>';
      const nav = $('.ka-nav', host);
      const again = el('button', 'ka-btn primary', '↻ ' + esc(t('again'))); again.type = 'button'; again.addEventListener('click', () => { if (opts.onAgain) opts.onAgain(); });
      const back = el('button', 'ka-btn', '← ' + esc(t('back'))); back.type = 'button'; back.addEventListener('click', () => { if (opts.onBack) opts.onBack(); });
      nav.append(again, back); again.focus();
      if (opts.onDone) opts.onDone({ correct: firstTry, total, stars: r.stars });
    }
    show();
    return { result: () => ({ correct: firstTry, total, index: i }) };
  }

  /* ---------- unit grid used by subject pages ---------- */
  function unitGrid(host, subject, list, onOpen, recommendedId) {
    host.innerHTML = '';
    list.forEach(u => {
      const r = unitRec(subject, u.id), stars = r ? r.stars : 0;
      const b = el('button', 'ka-unit' + (recommendedId === u.id ? ' rec' : ''), '<span class="ka-unit-ic">' + esc(u.icon || '') + '</span><span class="ka-unit-t">' + esc(u.title) + '</span>' +
        '<span class="ka-unit-s" aria-label="' + stars + ' / 3">' + '⭐'.repeat(stars) + '☆'.repeat(3 - stars) + '</span>' + (recommendedId === u.id ? '<span class="ka-rec">' + esc(t('recommended')) + '</span>' : ''));
      b.type = 'button'; b.addEventListener('click', () => onOpen(u)); host.appendChild(b);
    });
  }
  function firstUnfinished(subject, list, minStars) { const f = list.find(u => { const r = unitRec(subject, u.id); return !r || r.stars < (minStars || 2); }); return f ? f.id : null; }

  g.KA = { $, $$, el, esc, shuffle, rng, pick, t, addStrings, AVATARS, SPEECH, SUBJECTS, profile, profiles, addProfile, selectProfile, setUi, removeProfile, resetProfile, reload,
    unitRec, award, awardStars, subjectStars, subjectDone, totalStars, exportJSON, importJSON, settings, setSound, beep, speak, voiceCheck, hasSpeech, boot, gate, run, unitGrid, firstUnfinished, refreshStars,
    setUiLang: l => { UI = l === 'de' ? 'de' : 'en'; document.documentElement.lang = UI; }, getUi: () => UI };
  if (typeof module !== 'undefined') module.exports = g.KA;
})(typeof window !== 'undefined' ? window : globalThis);
