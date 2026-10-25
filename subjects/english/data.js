(function (g) {
  const T = (en, de) => ({ en, de });
  g.KA_ENGLISH = {
    units: [
      { id: 'e1', icon: '🐶', title: T('Animals', 'Tiere'), type: 'vocab', words: [['cat', '🐱'], ['dog', '🐶'], ['fish', '🐟'], ['bird', '🐦'], ['horse', '🐴'], ['cow', '🐮'], ['pig', '🐷'], ['sheep', '🐑'], ['frog', '🐸'], ['duck', '🦆']] },
      { id: 'e2', icon: '🍎', title: T('Food', 'Essen'), type: 'vocab', words: [['apple', '🍎'], ['banana', '🍌'], ['bread', '🍞'], ['milk', '🥛'], ['cheese', '🧀'], ['egg', '🥚'], ['pizza', '🍕'], ['cake', '🍰'], ['carrot', '🥕'], ['cookie', '🍪']] },
      { id: 'e3', icon: '🎨', title: T('Colours', 'Farben'), type: 'vocab', words: [['red', '🔴'], ['blue', '🔵'], ['green', '🟢'], ['yellow', '🟡'], ['orange', '🟠'], ['purple', '🟣'], ['black', '⚫'], ['white', '⚪'], ['brown', '🟤']] },
      { id: 'e4', icon: '👨‍👩‍👧', title: T('Family', 'Familie'), type: 'vocab', words: [['mum', '👩'], ['dad', '👨'], ['baby', '👶'], ['boy', '👦'], ['girl', '👧'], ['grandma', '👵'], ['grandpa', '👴']] },
      { id: 'e5', icon: '✋', title: T('My body', 'Mein Körper'), type: 'vocab', words: [['hand', '✋'], ['foot', '🦶'], ['eye', '👁️'], ['ear', '👂'], ['nose', '👃'], ['mouth', '👄'], ['leg', '🦵'], ['arm', '💪'], ['tooth', '🦷']] },
      { id: 'e6', icon: '👀', title: T('Sight words', 'Wichtige Wörter'), type: 'sight', words: ['the', 'and', 'you', 'said', 'are', 'was', 'they', 'have', 'with', 'this', 'that', 'what'] },
      { id: 'e7', icon: '🧩', title: T('Sentences 1', 'Sätze 1'), type: 'sentences', sentences: [
        { words: ['I', 'like', 'pizza'], emoji: '🍕' }, { words: ['The', 'cat', 'is', 'big'], emoji: '🐱' }, { words: ['We', 'can', 'run'], emoji: '🏃' },
        { words: ['I', 'see', 'a', 'bird'], emoji: '🐦' }, { words: ['She', 'has', 'a', 'red', 'hat'], emoji: '🎩' }, { words: ['The', 'dog', 'is', 'in', 'the', 'bed'], emoji: '🐶' }] },
      { id: 'e8', icon: '🧩', title: T('Sentences 2', 'Sätze 2'), type: 'sentences', sentences: [
        { words: ['He', 'is', 'my', 'dad'], emoji: '👨' }, { words: ['We', 'play', 'in', 'the', 'park'], emoji: '⚽' }, { words: ['The', 'sun', 'is', 'hot'], emoji: '☀️' },
        { words: ['I', 'have', 'two', 'eyes'], emoji: '👀' }, { words: ['Mum', 'makes', 'a', 'cake'], emoji: '🍰' }, { words: ['The', 'frog', 'can', 'jump'], emoji: '🐸' }] },
      { id: 'e9', icon: '🅰️', title: T('a or an', 'a oder an'), type: 'aan', nouns: [
        ['apple', 'an', '🍎'], ['ant', 'an', '🐜'], ['egg', 'an', '🥚'], ['orange', 'an', '🍊'], ['umbrella', 'an', '☂️'], ['elephant', 'an', '🐘'],
        ['cat', 'a', '🐱'], ['dog', 'a', '🐶'], ['pig', 'a', '🐷'], ['bus', 'a', '🚌'], ['sun', 'a', '☀️'], ['hat', 'a', '🎩']] },
      { id: 'e10', icon: '✌️', title: T('One and many', 'Einzahl und Mehrzahl'), type: 'plural', nouns: [
        ['cat', 'cats', '🐱🐱', ['cates', 'cat']], ['dog', 'dogs', '🐶🐶', ['doges', 'dog']], ['bus', 'buses', '🚌🚌', ['buss', 'bus']], ['box', 'boxes', '📦📦', ['boxs', 'box']],
        ['child', 'children', '🧒🧒', ['childs', 'childes']], ['man', 'men', '👨👨', ['mans', 'manes']], ['foot', 'feet', '🦶🦶', ['foots', 'feets']], ['mouse', 'mice', '🐭🐭', ['mouses', 'mices']]] }
    ]
  };
  if (typeof module !== 'undefined') module.exports = g.KA_ENGLISH;
})(typeof window !== 'undefined' ? window : globalThis);
