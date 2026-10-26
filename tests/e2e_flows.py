"""Walk-through of the hub and every subject with correct answers. Run: python3 tests/e2e_flows.py"""
import re
from _pw import *
with sync_playwright() as p:
    b = launch(p)
    ctx = b.new_context(viewport={'width': 1000, 'height': 900}, accept_downloads=True); pg = ctx.new_page(); pg.add_init_script(stub('ok')); watch(pg)
    store = lambda: pg.evaluate("JSON.parse(localStorage.getItem('ka.v1')||'{}')")
    nxt = lambda: pg.click('.ka-nav button')
    # ---------- hub ----------
    pg.goto(BASE); pg.wait_for_timeout(300)
    check('No children yet' in pg.inner_text('#app'), 'hub: empty state')
    pg.click('#add-kid'); pg.fill('#kid-name', 'Lena'); pg.click('[data-av="🦄"]'); pg.select_option('#kid-band', '45'); pg.click('#kid-form button[type=submit]')
    check(len(store().get('profiles', {})) == 1 and pg.locator('.ka-subject').count() == 6, 'hub: child created, six subject cards')
    pg.click('#add-kid'); pg.fill('#kid-name', 'Max'); pg.select_option('#kid-ui', 'de'); pg.click('#kid-form button[type=submit]')
    check('Wer lernt heute' in pg.inner_text('#app') and pg.evaluate('document.documentElement.lang') == 'de', 'hub: German UI for second child, html lang is de')
    pg.click('[data-kid]:has-text("Lena")'); check('Who is learning today' in pg.inner_text('#app'), 'hub: switching child switches UI language')
    check(pg.locator('a[href="sound.html"]').count() == 1, 'hub: a Sound help link is on the start page')
    pg.click('#p-open'); m = re.search(r'(\d+) × (\d+) \+ (\d+)', pg.inner_text('.ka-modal label'))
    pg.fill('#ka-gate-in', '1'); pg.click('#ka-gate-ok'); check('not right' in pg.inner_text('#ka-gate-err'), 'gate: wrong answer rejected')
    pg.fill('#ka-gate-in', str(int(m[1]) * int(m[2]) + int(m[3]))); pg.click('#ka-gate-ok'); check(pg.locator('#p-exp').count() == 1, 'gate: right answer opens the parent area')
    with pg.expect_download() as d: pg.click('#p-exp')
    import json; check(json.loads(open(d.value.path(), encoding='utf-8').read())['v'] == 1, 'parent: backup downloads as JSON')
    open('/tmp/bad.json', 'w').write('{"nope":1}'); pg.set_input_files('#p-imp', '/tmp/bad.json'); pg.wait_for_timeout(200); check('not a Kids Academy backup' in pg.inner_text('#p-msg'), 'parent: bad backup rejected')
    # ---------- reading ----------
    pg.goto(BASE + 'subjects/reading/index.html'); pg.wait_for_timeout(300)
    check(pg.locator('.ka-unit').count() == 8, 'reading: 8 English units'); pg.click('.ka-unit >> nth=5')
    pg.click('.ka-gtile >> nth=0'); pg.wait_for_timeout(250); check('ship' in pg.inner_text('#exw') and pg.evaluate('window.__spoken.pop()') == 'ship', 'reading: sound tile shows and speaks the example word (ship), not a letter name')
    pg.click('#nx'); tiles = pg.eval_on_selector_all('.ka-gtile', 'e=>e.map(x=>x.textContent)'); check(tiles == ['sh', 'i', 'p'], 'reading: "ship" is shown as sh·i·p, got %s' % tiles)
    pg.click('#bl'); pg.wait_for_timeout(2900); check(pg.evaluate('window.__spoken.pop()') == 'ship', 'reading: blending ends by saying the word')
    pg.click('#nx'); pg.click('#nx')
    D = pg.evaluate('window.KA_READING.en.units[5]'); EM = pg.evaluate('window.KA_READING.en.emoji'); first = True; asked = 0
    while pg.locator('.ka-q').count():
        pg.wait_for_timeout(350); prompt = pg.inner_text('.ka-prompt'); asked += 1
        if 'Tap the picture' in prompt and 'Listen' not in prompt:
            correct = pg.locator('.ka-opt', has_text=EM[pg.inner_text('.ka-visual').strip()]).first
        elif 'Listen' in prompt:
            correct = pg.locator('.ka-opt', has_text=re.compile('^' + pg.evaluate('window.__spoken.slice(-1)[0]') + '$')).first
        else: correct = pg.locator('.ka-opt', has_text=re.compile('^' + D['q']['a'] + '$')).first
        if first:
            ct = correct.inner_text()
            for k in range(pg.locator('.ka-opt').count()):
                if pg.locator('.ka-opt').nth(k).inner_text() != ct: pg.locator('.ka-opt').nth(k).click(); break
            check('Not quite' in pg.inner_text('.ka-fb'), 'quiz: a wrong answer shows feedback'); first = False
        correct.click(); nxt()
    check(asked == 7 and '6 of 7' in pg.inner_text('.ka-result'), 'reading: 7 questions, first-try scoring counts the first miss (%s)' % pg.inner_text('.ka-result p').split('\n')[0])
    kid = [v for v in store()['profiles'].values() if v['name'] == 'Lena'][0]
    check(kid['progress']['reading']['en6']['stars'] == 2, 'reading: 6/7 gives 2 stars')
    # picture questions never offer pictures a child could mix up; every option is a different picture
    bad = pg.evaluate("""() => { const out = []; for (const lang of ['en', 'de']) { const D = KA_READING[lang]; const inv = {}; for (const k in D.emoji) inv[D.emoji[k]] = k;
      for (const u of D.units) for (let n = 0; n < 150; n++) for (const it of KA_READING_BUILD(D, u)) { if (!it.visual || it.type !== 'choice' || it.a !== 'ok') continue;
        const key = it.visual.toLowerCase(), banned = new Set([key]); (D.confuse || []).filter(g => g.includes(key)).forEach(g => g.forEach(k => banned.add(k)));
        const ems = it.options.map(o => o.t); if (new Set(ems).size !== ems.length) out.push(lang + ':' + key + ' duplicate pictures');
        it.options.forEach(o => { if (o.v !== 'ok' && banned.has(inv[o.t])) out.push(lang + ':' + key + ' offered with ' + inv[o.t]); }); } } return [...new Set(out)].slice(0, 8); }""")
    check(bad == [], 'reading: picture choices never mix up look-alikes and never repeat a picture %s' % bad)
    pg.goto(BASE + 'subjects/reading/index.html'); pg.click('.ka-unit >> nth=5'); pg.click('#nx'); pg.click('#nx'); pg.click('#nx')
    for _ in range(5): pg.locator('.ka-opt').first.click(force=True)
    check('Question 1 / 7' in pg.inner_text('.ka-prog'), 'quiz: clicking repeatedly cannot raise the score or move on (%s)' % pg.inner_text('.ka-prog'))
    # ---------- maths ----------
    def solve(q):
        m = re.match(r'^(\d+) ([+−×÷]) (\d+) = \?$', q)
        if m: a, op, c = int(m[1]), m[2], int(m[3]); return {'+': a + c, '−': a - c, '×': a * c, '÷': a // c}[op]
        m = re.match(r'^(\d+) \+ \? = (\d+)$', q) or re.match(r'^\? \+ (\d+) = (\d+)$', q)
        if m: return int(m[2]) - int(m[1])
        m = re.match(r'^(\d+) − \? = (\d+)$', q); return int(m[1]) - int(m[2])
    for lvl in (1, 2, 8, 9, 12):
        pg.goto(BASE + 'subjects/maths/index.html'); pg.wait_for_timeout(120); pg.click('.ka-unit >> nth=%d' % lvl)
        for i in range(10):
            q = pg.inner_text('.ka-prompt')
            if 'Which number' in q: nums = [int(x) for x in pg.eval_on_selector_all('.ka-opt', 'e=>e.map(x=>x.textContent)')]; ans = max(nums) if 'bigger' in q else min(nums)
            else: ans = solve(q)
            if pg.locator('.ka-opt').count(): pg.click('.ka-opt:text-is("%d")' % ans)
            else:
                for ch in str(ans): pg.click('.ka-key >> text="%s"' % ch)
                pg.click('.ka-key.ok')
            nxt()
        check('10 of 10' in pg.inner_text('.ka-result'), 'maths level %d: 10 of 10 with correct answers' % (lvl + 1))
    pg.goto(BASE + 'subjects/maths/index.html'); check(pg.locator('.ka-unit').count() == 13 and pg.locator('.ka-unit.rec').count() == 1, 'maths: 13 levels, one recommended')
    # ---------- writing: spelling ----------
    pg.goto(BASE + 'subjects/writing/index.html'); pg.click('[data-tab="spell"]'); pg.click('.ka-unit >> nth=0')
    for i in range(8):
        pg.wait_for_timeout(350); w = pg.evaluate('window.__spoken.slice(-1)[0]')
        for ch in w: pg.click('.ka-bank .ka-tile:text-is("%s") >> nth=0' % ch)
        nxt()
    check('8 of 8' in pg.inner_text('.ka-result'), 'writing: spelling with letter tiles, 8 of 8')
    # ---------- english / german ----------
    pg.goto(BASE + 'subjects/english/index.html'); pg.click('.ka-unit >> nth=8')
    for i in range(10):
        noun = re.search(r'___ (\w+)', pg.inner_text('.ka-prompt'))[1]; pg.click('.ka-opt:text-is("%s")' % ('an' if noun[0] in 'aeiou' else 'a')); nxt()
    check('10 of 10' in pg.inner_text('.ka-result'), 'english: a / an 10 of 10')
    pg.goto(BASE + 'subjects/german/index.html'); pg.click('.ka-unit >> nth=0'); art = {n[1]: n[0] for n in pg.evaluate('window.KA_GERMAN.units[0].nouns')}
    for i in range(10): pg.click('.ka-opt:text-is("%s")' % art[re.search(r'___ (\w+)', pg.inner_text('.ka-prompt'))[1]]); nxt()
    check('10 of 10' in pg.inner_text('.ka-result'), 'german: der / die / das 10 of 10')
    pg.goto(BASE + 'subjects/german/index.html'); pg.click('.ka-unit >> nth=7')
    for i in range(6):
        pg.wait_for_timeout(350)
        for w in pg.evaluate('window.__spoken.slice(-1)[0]').split(' '): pg.click('.ka-bank .ka-tile:text-is("%s") >> nth=0' % w)
        nxt()
    check('6 of 6' in pg.inner_text('.ka-result'), 'german: sentence building 6 of 6')
    # ---------- coding ----------
    pg.goto(BASE + 'subjects/coding/index.html'); pg.click('.ka-unit >> nth=5')
    pg.click('#pal .ka-btn >> text=Repeat'); pg.click('#pal .ka-btn >> text=Forward')
    for _ in range(4): pg.click('#prog .ka-tile >> nth=0')
    check('×6' in pg.inner_text('#prog') and 'for i in range(6)' in pg.inner_text('#py'), 'coding: repeat count cycles to 6 and the Python text is shown')
    pg.click('#run'); pg.wait_for_selector('#msg:has-text("You did it")', timeout=8000); check('⭐⭐⭐' in pg.inner_text('#msg'), 'coding: the repeat solution earns 3 stars')
    pg.click('#bk'); pg.click('.ka-unit >> nth=3'); pg.click('#pal .ka-btn >> text=Forward'); pg.click('#run'); pg.wait_for_selector('#msg:has-text("stopped")', timeout=8000); check(True, 'coding: a wrong program gets gentle feedback')
    f = b.new_context().new_page(); f.goto(BASE + 'subjects/maths/index.html'); f.wait_for_timeout(200); check('choose a child' in f.inner_text('#app'), 'opening a subject without a child shows a friendly message')
    b.close()
finish()
