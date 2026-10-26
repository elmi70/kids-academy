/* Sound help page: tests the sound, shows what the phone can do, lets a parent choose the voice. */
(function () {
  'use strict';
  const { $, $$, el, esc, t } = KA;
  const ui = (function () { const p = KA.profile(); if (p) return p.ui; return /^de/i.test((navigator.language || '')) ? 'de' : 'en'; })();
  KA.setUiLang(ui);
  KA.addStrings({
    en: { 'sh.intro': 'Press a test button. You should hear a voice. If you do not, this page helps you find out why.', 'sh.testEn': 'Play English test', 'sh.testDe': 'Play German test', 'sh.beep': 'Play a beep', 'sh.recEn': 'Recorded voice: English', 'sh.recDe': 'Recorded voice: German', 'sh.ready': 'ready', 'sh.onDemand': 'loads when needed', 'sh.recNote': 'The recorded voice is a simple voice that is stored in the app. It works even when the phone has no voice.',
      'sh.heard': 'Did you hear it?', 'sh.yes': 'Yes', 'sh.no': 'No', 'sh.great': 'Great, sound works.', 'sh.tryClips': 'Try "Recorded voice only" below. It works even when the phone has no voice.',
      'sh.mode': 'Which voice should be used?', 'sh.auto': 'Automatic (recommended): the phone voice, or a recorded voice if the phone is silent', 'sh.device': 'Phone voice only (nicer, but silent on some phones)', 'sh.clips': 'Recorded voice only (simple voice, works everywhere)',
      'sh.retry': 'Try the phone voice again', 'sh.status': 'What this device can do', 'sh.speech': 'Phone speech available', 'sh.voices': 'Phone voices found', 'sh.en': 'English voice', 'sh.de': 'German voice', 'sh.ctx': 'Sound engine', 'sh.curMode': 'Voice setting',
      'sh.bad': 'Phone voice marked as not working', 'sh.clipsOk': 'Recorded voices loaded', 'sh.err': 'Last problem', 'sh.none': 'none', 'sh.yesN': 'yes', 'sh.noN': 'no',
      'sh.tips': 'Things to check', 'sh.t1': 'Turn the volume up. On an iPhone, switch off silent mode (the small switch on the side).', 'sh.t2': 'Open the page in Safari (iPhone) or Chrome (Android). Links opened inside Teams, Outlook or WhatsApp often have no sound.',
      'sh.t3': 'Tap once on the page before listening. Phones only allow sound after a tap.', 'sh.t4': 'Android: install or enable the phone\'s text-to-speech voices (Speech Services by Google) and add German. The setting name differs by phone: look for "Text-to-speech output".',
      'sh.t5': 'iPhone: add voices under Settings, Accessibility, Spoken Content, Voices.', 'sh.t6': 'Close other apps that use the microphone or speaker, then reload this page.',
      'sh.details': 'Details for support (you can copy these)', 'sh.copy': 'Copy details', 'sh.copied': 'Copied', 'sh.effects': 'Sound effects are switched off in the lesson header (speaker button). Switch them on to hear the beep.', 'sh.home': 'Back to Kids Academy', 'sh.refresh': 'Refresh' },
    de: { 'sh.intro': 'Drücke einen Test-Knopf. Du solltest eine Stimme hören. Wenn nicht, hilft dir diese Seite herauszufinden, warum.', 'sh.testEn': 'Englischen Test abspielen', 'sh.testDe': 'Deutschen Test abspielen', 'sh.beep': 'Piepton abspielen', 'sh.recEn': 'Aufgenommene Stimme: Englisch', 'sh.recDe': 'Aufgenommene Stimme: Deutsch', 'sh.ready': 'bereit', 'sh.onDemand': 'wird bei Bedarf geladen', 'sh.recNote': 'Die aufgenommene Stimme ist eine einfache Stimme, die in der App gespeichert ist. Sie funktioniert auch, wenn das Handy keine Stimme hat.',
      'sh.heard': 'Hast du es gehört?', 'sh.yes': 'Ja', 'sh.no': 'Nein', 'sh.great': 'Super, der Ton funktioniert.', 'sh.tryClips': 'Probiere unten „Nur aufgenommene Stimme“. Sie funktioniert auch, wenn das Handy keine Stimme hat.',
      'sh.mode': 'Welche Stimme soll benutzt werden?', 'sh.auto': 'Automatisch (empfohlen): die Handy-Stimme, oder eine aufgenommene Stimme, wenn das Handy stumm bleibt', 'sh.device': 'Nur Handy-Stimme (schöner, aber auf manchen Handys stumm)', 'sh.clips': 'Nur aufgenommene Stimme (einfache Stimme, geht überall)',
      'sh.retry': 'Handy-Stimme nochmal versuchen', 'sh.status': 'Was dieses Gerät kann', 'sh.speech': 'Handy-Sprachausgabe vorhanden', 'sh.voices': 'Gefundene Handy-Stimmen', 'sh.en': 'Englische Stimme', 'sh.de': 'Deutsche Stimme', 'sh.ctx': 'Ton-Engine', 'sh.curMode': 'Stimmen-Einstellung',
      'sh.bad': 'Handy-Stimme als nicht funktionierend markiert', 'sh.clipsOk': 'Aufgenommene Stimmen geladen', 'sh.err': 'Letztes Problem', 'sh.none': 'keines', 'sh.yesN': 'ja', 'sh.noN': 'nein',
      'sh.tips': 'Das kannst du prüfen', 'sh.t1': 'Mach die Lautstärke hoch. Beim iPhone den Stumm-Schalter (kleiner Schalter an der Seite) ausschalten.', 'sh.t2': 'Öffne die Seite in Safari (iPhone) oder Chrome (Android). Links, die in Teams, Outlook oder WhatsApp geöffnet werden, haben oft keinen Ton.',
      'sh.t3': 'Tippe einmal auf die Seite, bevor du zuhörst. Handys erlauben Ton erst nach einem Tippen.', 'sh.t4': 'Android: Installiere oder aktiviere die Sprachausgabe-Stimmen des Handys (Sprachdienste von Google) und füge Deutsch hinzu. Die Einstellung heißt je nach Handy anders: such nach „Text-in-Sprache-Ausgabe“.',
      'sh.t5': 'iPhone: Stimmen findest du unter Einstellungen, Bedienungshilfen, Gesprochene Inhalte, Stimmen.', 'sh.t6': 'Schließe andere Apps, die Mikrofon oder Lautsprecher benutzen, und lade diese Seite neu.',
      'sh.details': 'Details für den Support (zum Kopieren)', 'sh.copy': 'Details kopieren', 'sh.copied': 'Kopiert', 'sh.effects': 'Die Toneffekte sind oben in der Lektion (Lautsprecher-Knopf) ausgeschaltet. Schalte sie ein, um den Piepton zu hören.', 'sh.home': 'Zurück zur Kinder-Akademie', 'sh.refresh': 'Aktualisieren' }
  });
  document.documentElement.lang = ui;
  const app = $('#app');
  let heardBox = '';

  function yn(v) { return v ? t('sh.yesN') : t('sh.noN'); }
  function rows() {
    const i = KA.audioInfo(), modeName = { auto: t('sh.auto').split(':')[0].replace(/ \(.*\)/, ''), device: t('sh.device').split('(')[0].trim(), clips: t('sh.clips').split('(')[0].trim() }[i.mode];
    return [
      [t('sh.speech'), yn(i.speech)], [t('sh.voices'), String(i.voices)], [t('sh.en'), i.en || '—'], [t('sh.de'), i.de || '—'], [t('sh.ctx'), i.ctx],
      [t('sh.curMode'), modeName], [t('sh.bad'), yn(i.speechBad)], [t('sh.clipsOk'), 'EN: ' + (i.clips.en ? t('sh.ready') : t('sh.onDemand')) + '   DE: ' + (i.clips.de ? t('sh.ready') : t('sh.onDemand'))], [t('sh.err'), i.lastError || t('sh.none')]
    ];
  }
  function details() { const i = KA.audioInfo(); return JSON.stringify({ speech: i.speech, voices: i.voices, enVoice: i.en, deVoice: i.de, audioEngine: i.ctx, mode: i.mode, phoneVoiceMarkedBad: i.speechBad, clipsLoaded: i.clips, clipPlays: i.clipPlays, lastError: i.lastError, secureContext: i.secure, userAgent: i.ua, recentEvents: i.log }, null, 1); }

  function draw() {
    const i = KA.audioInfo(), st = KA.settings();
    app.innerHTML = '<div class="ka-card"><p>' + esc(t('sh.intro')) + '</p><p>' +
      '<button type="button" class="ka-btn primary" id="t-en">🇬🇧 ' + esc(t('sh.testEn')) + '</button><button type="button" class="ka-btn primary" id="t-de">🇩🇪 ' + esc(t('sh.testDe')) + '</button><button type="button" class="ka-btn" id="t-bp">🔔 ' + esc(t('sh.beep')) + '</button></p>' +
      '<p><button type="button" class="ka-btn" id="r-en">🎙 ' + esc(t('sh.recEn')) + '</button><button type="button" class="ka-btn" id="r-de">🎙 ' + esc(t('sh.recDe')) + '</button></p><p class="muted small">' + esc(t('sh.recNote')) + '</p>' +
      '<div id="heard" aria-live="polite">' + heardBox + '</div></div>' +
      '<div class="ka-card"><h3>' + esc(t('sh.mode')) + '</h3>' + ['auto', 'device', 'clips'].map(m => '<label style="display:flex;gap:10px;align-items:flex-start;margin:8px 0;cursor:pointer"><input type="radio" name="vm" value="' + m + '"' + (i.mode === m ? ' checked' : '') + ' style="margin-top:6px;width:22px;height:22px"><span>' + esc(t('sh.' + m)) + '</span></label>').join('') +
      '<p><button type="button" class="ka-btn" id="retry">↻ ' + esc(t('sh.retry')) + '</button></p></div>' +
      '<div class="ka-card"><h3>' + esc(t('sh.status')) + '</h3><table class="ka-table"><tbody>' + rows().map(r => '<tr><td>' + esc(r[0]) + '</td><td><b>' + esc(r[1]) + '</b></td></tr>').join('') + '</tbody></table><p><button type="button" class="ka-btn" id="refresh">⟳ ' + esc(t('sh.refresh')) + '</button></p></div>' +
      '<div class="ka-card"><h3>' + esc(t('sh.tips')) + '</h3><ul>' + [1, 2, 3, 4, 5, 6].map(n => '<li>' + esc(t('sh.t' + n)) + '</li>').join('') + '</ul></div>' +
      '<div class="ka-card ghost"><h3>' + esc(t('sh.details')) + '</h3><textarea id="det" readonly rows="9" style="width:100%;font:13px monospace">' + esc(details()) + '</textarea><p><button type="button" class="ka-btn" id="cp">📋 ' + esc(t('sh.copy')) + '</button></p></div>' +
      '<p><a class="ka-btn" href="index.html">← ' + esc(t('sh.home')) + '</a></p>';
    $('#t-en').addEventListener('click', () => test('Hello! This is a sound test. One, two, three.', 'en'));
    $('#t-de').addEventListener('click', () => test('Hallo! Das ist ein Tontest. Eins, zwei, drei.', 'de'));
    const rec = (text, lang) => { KA.playClip(text, lang).then(() => { heardBox = askHeard(); draw(); }); };
    $('#r-en').addEventListener('click', () => rec('Hello! This is a sound test. One, two, three.', 'en'));
    $('#r-de').addEventListener('click', () => rec('Hallo! Das ist ein Tontest. Eins, zwei, drei.', 'de'));
    $('#t-bp').addEventListener('click', () => { KA.beep(true); heardBox = KA.settings().sound ? askHeard() : '<div class="ka-note">' + esc(t('sh.effects')) + '</div>'; draw(); });
    $$('input[name=vm]').forEach(r => r.addEventListener('change', () => { KA.setVoiceMode(r.value); draw(); }));
    $('#retry').addEventListener('click', () => { KA.resetSpeech(); KA.setVoiceMode('auto'); heardBox = ''; draw(); });
    $('#refresh').addEventListener('click', draw);
    $('#cp').addEventListener('click', async () => { const txt = details(); try { await navigator.clipboard.writeText(txt); } catch (e) { const d = $('#det'); d.select(); try { document.execCommand('copy'); } catch (_) { /* ignore */ } } $('#cp').textContent = '✔ ' + t('sh.copied'); });
    const yes = $('#h-yes'), no = $('#h-no');
    if (yes) yes.addEventListener('click', () => { heardBox = '<div class="ka-note" style="background:#dcf6e8;border-color:#12915a;color:#0b3d2a">✅ ' + esc(t('sh.great')) + '</div>'; draw(); });
    if (no) no.addEventListener('click', () => { heardBox = '<div class="ka-note">' + esc(t('sh.tryClips')) + '</div>'; draw(); });
  }
  function askHeard() { return '<p><b>' + esc(t('sh.heard')) + '</b> <button type="button" class="ka-btn" id="h-yes">👍 ' + esc(t('sh.yes')) + '</button><button type="button" class="ka-btn" id="h-no">👎 ' + esc(t('sh.no')) + '</button></p>'; }
  function test(text, lang) {
    KA.speak(text, lang, 0.85);
    heardBox = '';
    setTimeout(() => { heardBox = askHeard(); draw(); }, 3600);
    draw();
  }
  draw();
  KA.voiceCheck('en', document.createElement('div'));   // warms up the voice list
  setTimeout(draw, 900);
})();
