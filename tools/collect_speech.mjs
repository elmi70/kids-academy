// Lists every phrase the app can speak, per language, by running the real content code.
// Usage: node tools/collect_speech.mjs > /tmp/speech.json
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const R = p => require(path.join(root, p));
const KA = R('shared/core.js');
const CODE = R('subjects/coding/levels.js');
const READ = R('subjects/reading/data.js'), WR = R('subjects/writing/data.js'), EN = R('subjects/english/data.js'), DE = R('subjects/german/data.js'), LANG = R('shared/lang.js');
const out = { en: new Set(), de: new Set() };
const add = (l, s) => { s = KA.norm(s || ''); if (s) out[l].add(s); };

for (const lang of ['en', 'de']) {
  const D = READ[lang];
  Object.values(D.ex).forEach(v => add(lang, v[0]));                       // example word shown for a sound
  D.units.forEach(u => {
    u.words.forEach(w => add(lang, w.split('.').join('')));               // blending + listen questions
    u.sentences.forEach(s => add(lang, s));                                // read-to-me sentences
    add(lang, u.q.q);                                                      // comprehension question
  });
  WR.words[lang].forEach(([w]) => add(lang, w));                           // spelling words
}
for (const [lang, D] of [['en', EN], ['de', DE]]) {
  D.units.forEach(u => { for (let k = 0; k < 600; k++) LANG.build(u, lang).forEach(it => { add(lang, it.say); add(lang, it.sayCorrect); }); });
}
for (const L of CODE.LEVELS) for (const lang of ['en', 'de']) add(lang, CODE.speech(L, lang));        // coding: spoken mission text
add('en', 'Hello! This is a sound test. One, two, three.'); add('de', 'Hallo! Das ist ein Tontest. Eins, zwei, drei.');
const letters = [...WR.upper, ...WR.lower, ...WR.umlaut.filter(c => c !== 'ß')];
console.log(JSON.stringify({ en: [...out.en].sort(), de: [...out.de].sort(), letters, extra: ['Eszett'] }, null, 1));
