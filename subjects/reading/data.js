/* Reading content. Words are written as sounds separated by dots: "sh.i.p" is the word "ship".
   tests/validate.mjs checks that every word only uses sounds taught in this unit or an earlier one. */
(function (g) {
  const EN = {
    lang: 'en',
    sight: ['the', 'is', 'i', 'to', 'you', 'was', 'my', 'we', 'he', 'she', 'me', 'be'],
    ex: {
      s: ['sun', '☀️'], a: ['ant', '🐜'], t: ['tent', '⛺'], p: ['pig', '🐷'], i: ['ink', '🖋️'], n: ['nut', '🥜'], m: ['moon', '🌙'], d: ['duck', '🦆'],
      g: ['goat', '🐐'], o: ['octopus', '🐙'], c: ['cat', '🐱'], k: ['kite', '🪁'], e: ['egg', '🥚'], u: ['umbrella', '☂️'], r: ['rainbow', '🌈'], h: ['hat', '🎩'],
      b: ['bee', '🐝'], f: ['frog', '🐸'], l: ['lemon', '🍋'], ck: ['sock', '🧦'], sh: ['ship', '🚢'], ch: ['chip', '🍟'], th: ['thumb', '👍'],
      ai: ['rain', '🌧️'], ee: ['tree', '🌳'], oa: ['boat', '⛵'], ar: ['star', '⭐'], or: ['fork', '🍴']
    },
    emoji: {
      pin: '📌', tin: '🥫', map: '🗺️', dog: '🐶', cat: '🐱', cap: '🧢', pot: '🍲', kid: '🧒', hen: '🐔', sun: '☀️', run: '🏃', ten: '🔟', hug: '🤗',
      leg: '🦵', lip: '👄', duck: '🦆', sock: '🧦', ship: '🚢', fish: '🐟', chip: '🍟', bath: '🛁', shop: '🏪', dish: '🍽️',
      rain: '🌧️', tree: '🌳', feet: '🦶', bee: '🐝', boat: '⛵', coat: '🧥', goat: '🐐', car: '🚗', star: '⭐', farm: '🚜', fork: '🍴', corn: '🌽', horn: '📯'
    },
    units: [
      { id: 'en1', icon: '🐍', title: 's a t p', graphemes: ['s', 'a', 't', 'p'], words: ['a.t', 's.a.t', 'p.a.t', 't.a.p', 's.a.p', 't.a.p.s', 'p.a.t.s'], sentences: ['Pat sat.', 'Pat sat at a tap.'], q: { q: 'Who sat?', options: ['Pat', 'Tap', 'Sap'], a: 'Pat' } },
      { id: 'en2', icon: '🐟', title: 'i n m d', graphemes: ['i', 'n', 'm', 'd'], words: ['p.i.n', 't.i.n', 's.i.t', 'd.i.p', 'm.a.n', 'm.a.p', 'd.a.d', 's.a.d'], sentences: ['Dad and Tim sat.', 'Dan sat in a pan.'], q: { q: 'Who sat in a pan?', options: ['Dan', 'Tim', 'Dad'], a: 'Dan' } },
      { id: 'en3', icon: '🐶', title: 'g o c k', graphemes: ['g', 'o', 'c', 'k'], words: ['d.o.g', 'c.a.t', 'c.a.p', 'p.o.t', 't.o.p', 'k.i.d', 'k.i.t', 'g.o.t'], sentences: ['A dog got a cap.', 'Tim got a kit.', 'The kid sat on top.'], q: { q: 'Who got a cap?', options: ['The dog', 'The cat', 'The kid'], a: 'The dog' } },
      { id: 'en4', icon: '☀️', title: 'e u r h', graphemes: ['e', 'u', 'r', 'h'], words: ['h.e.n', 'r.e.d', 't.e.n', 's.u.n', 'r.u.n', 'm.u.d', 'h.u.g', 'h.u.t'], sentences: ['The hen is red.', 'The sun is hot.', 'A rat ran in the mud.'], q: { q: 'What is red?', options: ['The hen', 'The sun', 'The mud'], a: 'The hen' } },
      { id: 'en5', icon: '🦆', title: 'b f l ck', graphemes: ['b', 'f', 'l', 'ck'], words: ['b.i.g', 'f.a.n', 'l.e.g', 'l.i.p', 'd.u.ck', 's.o.ck', 'b.a.ck', 'k.i.ck'], sentences: ['A duck sat on the log.', 'The big dog got a sock.'], q: { q: 'What sat on the log?', options: ['A duck', 'A dog', 'A cat'], a: 'A duck' } },
      { id: 'en6', icon: '🚢', title: 'sh ch th', graphemes: ['sh', 'ch', 'th'], words: ['sh.i.p', 'sh.o.p', 'f.i.sh', 'd.i.sh', 'ch.i.p', 'ch.i.n', 'th.i.n', 'b.a.th'], sentences: ['The fish is in the dish.', 'Dad got a chip.'], q: { q: 'What is in the dish?', options: ['The fish', 'The ship', 'The chin'], a: 'The fish' } },
      { id: 'en7', icon: '🌳', title: 'ai ee oa', graphemes: ['ai', 'ee', 'oa'], words: ['r.ai.n', 't.ai.l', 't.r.ee', 'f.ee.t', 'b.ee', 'b.oa.t', 'c.oa.t', 'g.oa.t'], sentences: ['The goat is in the rain.', 'I see a bee in the tree.'], q: { q: 'What is in the tree?', options: ['A bee', 'A goat', 'A boat'], a: 'A bee' } },
      { id: 'en8', icon: '⭐', title: 'ar or', graphemes: ['ar', 'or'], words: ['c.ar', 's.t.ar', 'f.ar.m', 'p.ar.k', 'f.or.k', 'c.or.n', 'h.or.n', 's.or.t'], sentences: ['The car is in the park.', 'A star is in the dark.'], q: { q: 'Where is the car?', options: ['In the park', 'On the farm', 'In the dark'], a: 'In the park' } }
    ]
  };
  const DE = {
    lang: 'de',
    sight: ['ist', 'und', 'die', 'der', 'das', 'dem', 'den', 'ein', 'eine', 'einen', 'ich', 'du', 'wir', 'sie', 'er', 'es', 'mit', 'in', 'im', 'am', 'auf', 'da', 'hat', 'sind'],
    ex: {
      m: ['Maus', '🐭'], a: ['Affe', '🐒'], s: ['Sonne', '☀️'], i: ['Igel', '🦔'], o: ['Oma', '👵'], l: ['Löwe', '🦁'], e: ['Ente', '🦆'], n: ['Nase', '👃'], t: ['Tiger', '🐯'], r: ['Rose', '🌹'],
      u: ['Uhr', '⏰'], p: ['Pilz', '🍄'], f: ['Fisch', '🐟'], d: ['Dose', '🥫'], h: ['Hund', '🐶'], b: ['Bär', '🐻'], k: ['Katze', '🐱'], g: ['Gabel', '🍴'], w: ['Wal', '🐋'], z: ['Zug', '🚆'],
      ei: ['Eis', '🍦'], au: ['Auto', '🚗'], eu: ['Eule', '🦉'], sch: ['Schaf', '🐑'], ch: ['Buch', '📖'], ie: ['Biene', '🐝'], 'ä': ['Käse', '🧀'], 'ö': ['Löwe', '🦁'], 'ü': ['Tür', '🚪'],
      sp: ['Spiel', '🎲'], st: ['Stern', '⭐'], ck: ['Decke', '🛏️'], tz: ['Katze', '🐱'], pf: ['Apfel', '🍎']
    },
    emoji: {
      oma: '👵', mama: '👩', nase: '👃', rose: '🌹', ente: '🦆', tomate: '🍅', salat: '🥗', hund: '🐶', hase: '🐰', hand: '✋', mund: '👄', bus: '🚌', wal: '🐋', zebra: '🦓', zug: '🚆',
      gabel: '🍴', kamel: '🐫', tiger: '🐯', eis: '🍦', haus: '🏠', maus: '🐭', auto: '🚗', baum: '🌳', eule: '🦉', bein: '🦵', schaf: '🐑', fisch: '🐟', buch: '📖', kuchen: '🍰', milch: '🥛',
      schule: '🏫', nacht: '🌙', biene: '🐝', 'bär': '🐻', 'käse': '🧀', 'löwe': '🦁', 'tür': '🚪', 'küche': '🍳', spiel: '🎲', stern: '⭐', katze: '🐱', pferd: '🐴', apfel: '🍎', stein: '🪨'
    },
    units: [
      { id: 'de1', icon: '👵', title: 'm a s i o', graphemes: ['m', 'a', 's', 'i', 'o'], words: ['O.m.a', 'M.a.m.a', 'M.i.a', 'O.m.i', 's.o', 'a.m', 'i.m', 'M.i.m.i'], sentences: ['Oma ist da.', 'Mia und Mama sind da.'], q: { q: 'Wer ist mit Mia da?', options: ['Mama', 'Oma', 'Omi'], a: 'Mama' } },
      { id: 'de2', icon: '🌹', title: 'l e n t r', graphemes: ['l', 'e', 'n', 't', 'r'], words: ['N.a.s.e', 'R.o.s.e', 'E.n.t.e', 'S.a.l.a.t', 'T.o.m.a.t.e', 'R.a.t', 'S.i.r.e.n.e', 'l.i.l.a'], sentences: ['Die Rose ist rot.', 'Die Ente ist da.'], q: { q: 'Was ist rot?', options: ['Die Rose', 'Die Ente', 'Die Nase'], a: 'Die Rose' } },
      { id: 'de3', icon: '🐶', title: 'u p f d h', graphemes: ['u', 'p', 'f', 'd', 'h'], words: ['H.u.n.d', 'H.u.t', 'H.a.s.e', 'H.a.n.d', 'M.u.n.d', 'P.u.m.a', 'D.o.s.e', 'P.u.t.e'], sentences: ['Der Hund ist da.', 'Der Hund hat die Dose.'], q: { q: 'Wer hat die Dose?', options: ['Der Hund', 'Der Hase', 'Die Pute'], a: 'Der Hund' } },
      { id: 'de4', icon: '🦓', title: 'b k g w z', graphemes: ['b', 'k', 'g', 'w', 'z'], words: ['B.u.s', 'G.a.n.s', 'W.a.l', 'Z.e.b.r.a', 'Z.u.g', 'G.a.b.e.l', 'K.a.m.e.l', 'T.i.g.e.r'], sentences: ['Das Zebra ist im Zug.', 'Der Tiger ist im Bus.'], q: { q: 'Wer ist im Zug?', options: ['Das Zebra', 'Der Tiger', 'Das Kamel'], a: 'Das Zebra' } },
      { id: 'de5', icon: '🏠', title: 'ei au eu', graphemes: ['ei', 'au', 'eu'], words: ['Ei.s', 'H.au.s', 'M.au.s', 'B.ei.n', 'Au.t.o', 'B.au.m', 'Eu.l.e', 'Z.ei.t'], sentences: ['Die Maus ist im Haus.', 'Das Auto ist am Baum.'], q: { q: 'Wer ist im Haus?', options: ['Die Maus', 'Die Eule', 'Das Auto'], a: 'Die Maus' } },
      { id: 'de6', icon: '🐑', title: 'sch ch', graphemes: ['sch', 'ch'], words: ['Sch.a.f', 'T.i.sch', 'F.i.sch', 'B.u.ch', 'K.u.ch.e.n', 'M.i.l.ch', 'Sch.u.l.e', 'N.a.ch.t'], sentences: ['Der Kuchen ist auf dem Tisch.', 'Das Schaf hat Milch.'], q: { q: 'Was ist auf dem Tisch?', options: ['Der Kuchen', 'Das Buch', 'Das Schaf'], a: 'Der Kuchen' } },
      { id: 'de7', icon: '🐝', title: 'ie ä ö ü', graphemes: ['ie', 'ä', 'ö', 'ü'], words: ['B.ie.n.e', 'W.ie.s.e', 'B.ä.r', 'K.ä.s.e', 'M.ö.w.e', 'L.ö.w.e', 'T.ü.r', 'K.ü.ch.e'], sentences: ['Der Bär ist in der Küche.', 'Die Biene ist auf der Wiese.'], q: { q: 'Wer ist in der Küche?', options: ['Der Bär', 'Die Biene', 'Der Löwe'], a: 'Der Bär' } },
      { id: 'de8', icon: '🐴', title: 'sp st ck tz pf', graphemes: ['sp', 'st', 'ck', 'tz', 'pf'], words: ['Sp.ie.l', 'St.ei.n', 'St.e.r.n', 'K.a.tz.e', 'Pf.e.r.d', 'A.pf.e.l', 'D.e.ck.e', 'E.ck.e'], sentences: ['Die Katze ist auf der Decke.', 'Das Pferd hat einen Apfel.'], q: { q: 'Was hat das Pferd?', options: ['Einen Apfel', 'Einen Stein', 'Einen Stern'], a: 'Einen Apfel' } }
    ]
  };
  g.KA_READING = { en: EN, de: DE };
  if (typeof module !== 'undefined') module.exports = g.KA_READING;
})(typeof window !== 'undefined' ? window : globalThis);
