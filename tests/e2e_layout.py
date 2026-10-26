"""Offline use, fresh files after an update, phone layout, and untranslated text. Run: python3 tests/e2e_layout.py"""
import re, os
from _pw import *
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
with sync_playwright() as p:
    b = launch(p)
    # ---------- service worker: offline, and fixed files reach the phone ----------
    ctx = b.new_context(viewport={'width': 800, 'height': 800}); pg = ctx.new_page(); pg.add_init_script(stub('ok')); watch(pg); seed(pg)
    mk = os.path.join(ROOT, 'marker_test.txt'); open(mk, 'w').write('old')
    try:
        pg.goto(BASE + 'index.html'); pg.wait_for_function("navigator.serviceWorker.getRegistrations().then(r => r.length > 0)", timeout=8000)
        pg.wait_for_function("caches.keys().then(k => k.length > 0)", timeout=8000); pg.wait_for_timeout(1500)
        check(pg.evaluate("caches.keys().then(k => k.join(','))") == 'kids-academy-v3', 'offline: cache is named kids-academy-v3 (old v1 caches are removed)')
        check(pg.evaluate("fetch('marker_test.txt').then(r => r.text())") == 'old', 'update: file is fetched through the service worker')
        open(mk, 'w').write('new'); pg.reload(); pg.wait_for_timeout(500)
        check(pg.evaluate("fetch('marker_test.txt').then(r => r.text())") == 'new', 'update: a fixed file reaches the phone straight away (network first, not a stale copy)')
        pg.evaluate("fetch('marker_test.txt').then(r => r.text())"); pg.wait_for_timeout(300)
        ctx.set_offline(True)
        for path in ['subjects/maths/index.html', 'subjects/writing/index.html', 'sound.html', 'subjects/reading/index.html']:
            pg.goto(BASE + path); pg.wait_for_timeout(500); check(pg.locator('#app *').count() > 3, 'offline: %s opens from the saved copy' % path)
        pg.goto(BASE + 'subjects/reading/index.html'); pg.evaluate("localStorage.setItem('ka.v1', JSON.stringify(Object.assign(JSON.parse(localStorage.getItem('ka.v1')), {settings: {sound: true, voice: 'clips'}})))"); pg.reload(); pg.wait_for_timeout(300)
        pg.click('.ka-unit >> nth=5'); pg.click('.ka-gtile >> nth=0'); pg.wait_for_timeout(800)
        check(pg.evaluate('KA.audioInfo().clipPlays') >= 1 and pg.evaluate('KA.audioInfo().clips.en'), 'offline: the recorded voice still works with no network (the clip file comes from the saved copy)')
        ctx.set_offline(False)
    finally:
        os.remove(mk)
    # ---------- phone layout: no sideways scroll anywhere ----------
    m = b.new_context(viewport={'width': 375, 'height': 760}, is_mobile=True, has_touch=True); mp = m.new_page(); mp.add_init_script(stub('ok')); watch(mp); seed(mp)
    def wide(label):
        w = mp.evaluate('document.documentElement.scrollWidth'); check(w <= 376, 'phone: %s fits the screen (width %d)' % (label, w))
    for pth in ['index.html', 'sound.html', 'subjects/reading/', 'subjects/writing/', 'subjects/maths/', 'subjects/english/', 'subjects/german/', 'subjects/coding/']:
        mp.goto(BASE + pth); mp.wait_for_timeout(250); wide(pth)
    mp.goto(BASE + 'subjects/coding/'); mp.click('.ka-unit >> nth=7'); wide('coding board with 8 columns')
    mp.goto(BASE + 'subjects/coding/'); mp.click('.ka-unit >> nth=9'); mp.click('#pal .ka-btn >> text=Repeat'); mp.click('#pal .ka-btn >> text=Forward'); wide('coding with an open repeat block')
    mp.goto(BASE + 'subjects/maths/'); mp.click('.ka-unit >> nth=7'); wide('maths number pad'); check(mp.locator('.ka-key').count() == 12, 'phone: number pad shows')
    mp.goto(BASE + 'subjects/writing/'); mp.click('.ka-unit >> nth=2'); wide('tracing page'); mp.click('#ck'); wide('tracing page with a message')
    mp.goto(BASE + 'subjects/reading/'); mp.click('.ka-unit >> nth=5'); wide('reading sounds'); mp.click('#nx'); wide('reading blend'); mp.click('#nx'); wide('reading sentences'); mp.click('#nx'); wide('reading quiz')
    mp.goto(BASE + 'subjects/german/'); mp.click('.ka-unit >> nth=7'); wide('german sentences')
    mp.goto(BASE + 'subjects/reading/'); mp.evaluate("KA.speak('x','en')"); mp.wait_for_timeout(100)
    # ---------- untranslated text or raw keys, in both app languages ----------
    bad = []
    for ui in ('en', 'de'):
        c = b.new_context(viewport={'width': 900, 'height': 900}); q = c.new_page(); q.add_init_script(stub('ok')); watch(q); seed(q, ui)
        def scan(tag):
            txt = q.inner_text('body')
            for k in re.findall(r'\b(?:rd|wr|mt|lg|cd|sh)\.[A-Za-z]+\b|\bsubject\.\w+|\bdesc\.\w+', txt): bad.append((ui, tag, k))
            if re.search(r'\{[a-z]+\}', txt): bad.append((ui, tag, 'unfilled {var}'))
        q.goto(BASE); q.wait_for_timeout(150); scan('hub'); q.goto(BASE + 'sound.html'); q.wait_for_timeout(250); scan('sound')
        for s, us in (('reading', [0, 5]), ('writing', [0]), ('maths', [0, 6]), ('english', [0, 5, 8, 9]), ('german', [0, 5, 6, 7]), ('coding', [0, 5])):
            for u in us:
                q.goto(BASE + 'subjects/%s/index.html' % s); q.wait_for_timeout(100); scan(s + '-home'); q.click('.ka-unit >> nth=%d' % u); q.wait_for_timeout(250); scan('%s-%d' % (s, u))
                if s == 'writing': q.click('#ck'); scan('trace-empty')
    check(not bad, 'no raw translation keys or unfilled placeholders on any screen in English or German %s' % sorted(set(bad))[:6])
    b.close()
finish()
