(function (g) {
  const T = (en, de) => ({ en, de });
  g.KA_GERMAN = {
    units: [
      { id: 'g1', icon: '🐶', title: T('Animals: der, die, das', 'Tiere: der, die, das'), type: 'articles', nouns: [
        ['der', 'Hund', '🐶'], ['die', 'Katze', '🐱'], ['das', 'Pferd', '🐴'], ['der', 'Fisch', '🐟'], ['die', 'Maus', '🐭'], ['der', 'Vogel', '🐦'], ['die', 'Kuh', '🐮'], ['das', 'Schaf', '🐑'], ['der', 'Hase', '🐰'], ['die', 'Ente', '🦆']] },
      { id: 'g2', icon: '🏠', title: T('At home: der, die, das', 'Zuhause: der, die, das'), type: 'articles', nouns: [
        ['das', 'Haus', '🏠'], ['die', 'Tür', '🚪'], ['das', 'Fenster', '🪟'], ['der', 'Stuhl', '🪑'], ['die', 'Uhr', '⏰'], ['das', 'Bett', '🛏️'], ['die', 'Lampe', '💡'], ['das', 'Sofa', '🛋️']] },
      { id: 'g3', icon: '🍎', title: T('Food: der, die, das', 'Essen: der, die, das'), type: 'articles', nouns: [
        ['der', 'Apfel', '🍎'], ['die', 'Banane', '🍌'], ['das', 'Brot', '🍞'], ['der', 'Käse', '🧀'], ['die', 'Milch', '🥛'], ['das', 'Ei', '🥚'], ['die', 'Suppe', '🍲'], ['der', 'Kuchen', '🍰'], ['das', 'Eis', '🍦'], ['die', 'Tomate', '🍅']] },
      { id: 'g4', icon: '✋', title: T('My body: der, die, das', 'Mein Körper: der, die, das'), type: 'articles', nouns: [
        ['die', 'Hand', '✋'], ['der', 'Fuß', '🦶'], ['das', 'Auge', '👁️'], ['die', 'Nase', '👃'], ['der', 'Mund', '👄'], ['das', 'Ohr', '👂'], ['der', 'Arm', '💪'], ['das', 'Bein', '🦵'], ['der', 'Kopf', '🙂']] },
      { id: 'g5', icon: '🎨', title: T('Colours', 'Farben'), type: 'vocab', words: [['rot', '🔴'], ['blau', '🔵'], ['grün', '🟢'], ['gelb', '🟡'], ['orange', '🟠'], ['lila', '🟣'], ['schwarz', '⚫'], ['weiß', '⚪'], ['braun', '🟤']] },
      { id: 'g6', icon: '🔟', title: T('Numbers 1–10', 'Zahlen 1–10'), type: 'numbers', words: [['eins', '1️⃣'], ['zwei', '2️⃣'], ['drei', '3️⃣'], ['vier', '4️⃣'], ['fünf', '5️⃣'], ['sechs', '6️⃣'], ['sieben', '7️⃣'], ['acht', '8️⃣'], ['neun', '9️⃣'], ['zehn', '🔟']] },
      { id: 'g7', icon: '📅', title: T('Days of the week', 'Wochentage'), type: 'days', days: ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'] },
      { id: 'g8', icon: '🧩', title: T('Sentences', 'Sätze'), type: 'sentences', sentences: [
        { words: ['Ich', 'habe', 'einen', 'Hund'], emoji: '🐶' }, { words: ['Die', 'Katze', 'ist', 'klein'], emoji: '🐱' }, { words: ['Wir', 'essen', 'einen', 'Apfel'], emoji: '🍎' },
        { words: ['Der', 'Hund', 'läuft', 'schnell'], emoji: '🐕' }, { words: ['Das', 'Haus', 'ist', 'groß'], emoji: '🏠' }, { words: ['Ich', 'trinke', 'Milch'], emoji: '🥛' },
        { words: ['Mama', 'kocht', 'Suppe'], emoji: '🍲' }, { words: ['Ich', 'gehe', 'in', 'die', 'Schule'], emoji: '🏫' }] }
    ]
  };
  if (typeof module !== 'undefined') module.exports = g.KA_GERMAN;
})(typeof window !== 'undefined' ? window : globalThis);
