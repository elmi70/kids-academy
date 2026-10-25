(function (g) {
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const lower = 'abcdefghijklmnopqrstuvwxyz'.split('');
  const umlaut = ['Ä', 'Ö', 'Ü', 'ä', 'ö', 'ü', 'ß'];
  const words = {
    en: [['cat', '🐱'], ['dog', '🐶'], ['sun', '☀️'], ['hat', '🎩'], ['bus', '🚌'], ['pig', '🐷'], ['hen', '🐔'], ['cup', '☕'], ['fish', '🐟'], ['tree', '🌳'], ['book', '📖'], ['milk', '🥛']],
    de: [['Hund', '🐶'], ['Haus', '🏠'], ['Mond', '🌙'], ['Baum', '🌳'], ['Buch', '📖'], ['Eis', '🍦'], ['Hase', '🐰'], ['Katze', '🐱'], ['Auto', '🚗'], ['Ball', '⚽'], ['Fisch', '🐟'], ['Milch', '🥛']]
  };
  g.KA_WRITING = { upper, lower, umlaut, words, units: upper.length + lower.length + umlaut.length + 2 };
  if (typeof module !== 'undefined') module.exports = g.KA_WRITING;
})(typeof window !== 'undefined' ? window : globalThis);
