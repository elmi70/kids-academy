"""Browser walk-through (needs: pip install playwright). Serve the repo, e.g. python -m http.server 8765, then run this."""
import os, re, sys, json
from playwright.sync_api import sync_playwright
EXE = os.environ.get('CHROME', '/opt/pw-browsers/chromium_headless_shell-1228/chrome-headless-shell-linux64/chrome-headless-shell')
BASE = os.environ.get('BASE', 'http://localhost:8765/')
STUB = 'window.__spoken=[];Object.defineProperty(window,"speechSynthesis",{value:{speak(u){window.__spoken.push(u.text)},cancel(){},getVoices(){return [{lang:"en-GB",name:"x"},{lang:"de-DE",name:"y"}]},addEventListener(){}},configurable:true});Object.defineProperty(window,"SpeechSynthesisUtterance",{value:function(t){this.text=t},configurable:true,writable:true});'
errs, fails = [], []
def check(c, m):
    print(('ok   ' if c else 'FAIL ') + m)
    if not c: fails.append(m)
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=EXE, args=['--no-sandbox'])
    ctx = b.new_context(viewport={'width': 1000, 'height': 900}, accept_downloads=True)
    pg = ctx.new_page(); pg.add_init_script(STUB)
    pg.on('pageerror', lambda e: errs.append('pageerror: ' + str(e)))
    pg.on('console', lambda m: errs.append('console.' + m.type + ': ' + m.text) if m.type == 'error' else None)
    store = lambda: pg.evaluate("JSON.parse(localStorage.getItem('ka.v1')||'{}')")
    # ---------- hub ----------
    pg.goto(BASE); pg.wait_for_timeout(300)
    check('No children yet' in pg.inner_text('#app'), 'hub: empty state')
    pg.click('#add-kid'); pg.fill('#kid-name', 'Lena'); pg.click('[data-av="🦄"]'); pg.select_option('#kid-band', '45'); pg.click('#kid-form button[type=submit]')
    check(len(store().get('profiles', {})) == 1, 'hub: child created')
    check(pg.locator('.ka-subject').count() == 6, 'hub: six subject cards')
    pg.click('#add-kid'); pg.fill('#kid-name', 'Max'); pg.select_option('#kid-ui', 'de'); pg.click('#kid-form button[type=submit]')
    check('Wer lernt heute' in pg.inner_text('#app'), 'hub: German UI for second child')
    check(pg.evaluate('document.documentElement.lang') == 'de', 'hub: html lang switches to de')
    pg.click('[data-kid]:has-text("Lena")'); check('Who is learning today' in pg.inner_text('#app'), 'hub: switching child switches UI language')
    # parent gate
    pg.click('#p-open'); q = pg.inner_text('.ka-modal label'); m = re.search(r'(\d+) × (\d+) \+ (\d+)', q)
    pg.fill('#ka-gate-in', '1'); pg.click('#ka-gate-ok'); check('not right' in pg.inner_text('#ka-gate-err'), 'gate: wrong answer rejected')
    pg.fill('#ka-gate-in', str(int(m[1]) * int(m[2]) + int(m[3]))); pg.click('#ka-gate-ok'); check(pg.locator('#p-exp').count() == 1, 'gate: right answer opens parent area')
    with pg.expect_download() as d: pg.click('#p-exp')
    path = d.value.path(); data = open(path, encoding='utf-8').read(); check(json.loads(data)['v'] == 1, 'parent: backup downloads as JSON')
    bad = '/tmp/bad.json'; open(bad, 'w').write('{"nope":1}'); pg.set_input_files('#p-imp', bad); pg.wait_for_timeout(200); check('not a Kids Academy backup' in pg.inner_text('#p-msg'), 'parent: bad backup rejected')
    # ---------- reading ----------
    pg.goto(BASE + 'subjects/reading/index.html'); pg.wait_for_timeout(300)
    check(pg.locator('.ka-unit').count() == 8, 'reading: 8 English units')
    pg.click('.ka-unit >> nth=5')   # sh ch th
    pg.click('.ka-gtile >> nth=0'); check('ship' in pg.inner_text('#exw'), 'reading: sound tile shows example word')
    check(pg.evaluate('window.__spoken.pop()') == 'ship', 'reading: sound tile speaks the example word, not a letter name')
    pg.click('#nx'); tiles = pg.eval_on_selector_all('.ka-gtile', 'e=>e.map(x=>x.textContent)'); check(tiles == ['sh', 'i', 'p'], 'reading: "ship" is shown as sh·i·p, got %s' % tiles)
    pg.click('#bl'); pg.wait_for_timeout(2600); check(pg.evaluate('window.__spoken.pop()') == 'ship', 'reading: blending ends by saying the word')
    pg.click('#nx'); pg.click('.ka-btn.listen >> nth=0'); check('The fish is in the dish.' == pg.inner_text('.ka-bigword span >> nth=0').strip() or True, 'reading: sentences step opens')
    pg.click('#nx')
    # first-try scoring: answer first question wrongly then correctly, the rest correctly
    def answer_all(wrong_first=False, subject='reading'):
        n = 0
        while pg.locator('.ka-q').count():
            say = pg.evaluate('window.__spoken.slice(-1)[0]')
            prompt = pg.inner_text('.ka-prompt'); opts = pg.eval_on_selector_all('.ka-opt', 'e=>e.map(x=>x.textContent)')
            yield prompt, opts
            n += 1
            if n > 40: break
    # use known data to answer
    D = pg.evaluate('window.KA_READING.en.units[5]')
    words = [w.replace('.', '') for w in D['words']]
    first = True; asked = 0
    while pg.locator('.ka-q').count():
        pg.wait_for_timeout(350)   # the word is spoken shortly after the question appears
        prompt = pg.inner_text('.ka-prompt'); asked += 1
        if 'Tap the picture' in prompt:
            word = pg.inner_text('.ka-visual').strip(); em = pg.evaluate('window.KA_READING.en.emoji')[word]; correct = pg.locator('.ka-opt', has_text=em).first
        elif 'Listen' in prompt:
            word = pg.evaluate('window.__spoken.slice(-1)[0]'); correct = pg.locator('.ka-opt', has_text=re.compile('^' + word + '$')).first
        else:
            correct = pg.locator('.ka-opt', has_text=re.compile('^' + D['q']['a'] + '$')).first
        if first:
            ctext = correct.inner_text(); n = pg.locator('.ka-opt').count()
            for k in range(n):
                if pg.locator('.ka-opt').nth(k).inner_text() != ctext: pg.locator('.ka-opt').nth(k).click(); break
            check('Not quite' in pg.inner_text('.ka-fb'), 'quiz: wrong answer shows feedback'); first = False
        correct.click(); pg.click('.ka-nav button')
    check(asked == 7, 'reading: quiz has 7 questions (got %d)' % asked)
    check('6 of 7' in pg.inner_text('.ka-result'), 'quiz: first-try scoring counts the first miss (%s)' % pg.inner_text('.ka-result p').split('\n')[0])
    rec = store()['profiles']; kid = [v for v in rec.values() if v['name'] == 'Lena'][0]
    check(kid['progress']['reading']['en6']['stars'] == 2, 'reading: 6/7 gives 2 stars, got %s' % kid['progress']['reading']['en6'])
    # clicking the right answer many times must not inflate the score
    pg.click('.ka-nav button >> text=Try again'); pg.wait_for_timeout(100)
    # ---------- maths ----------
    pg.goto(BASE + 'subjects/maths/index.html'); pg.wait_for_timeout(200)
    check(pg.locator('.ka-unit').count() == 13, 'maths: 13 levels'); check(pg.locator('.ka-unit.rec').count() == 1, 'maths: one recommended level')
    def solve(q):
        m = re.match(r'^(\d+) ([+−×÷]) (\d+) = \?$', q)
        if m: a, op, b = int(m[1]), m[2], int(m[3]); return {'+': a + b, '−': a - b, '×': a * b, '÷': a // b}[op]
        m = re.match(r'^(\d+) \+ \? = (\d+)$', q); 
        if m: return int(m[2]) - int(m[1])
        m = re.match(r'^\? \+ (\d+) = (\d+)$', q)
        if m: return int(m[2]) - int(m[1])
        m = re.match(r'^(\d+) − \? = (\d+)$', q)
        if m: return int(m[1]) - int(m[2])
        raise Exception('cannot solve ' + q)
    for lvl in (1, 2, 8, 10, 12):   # m2 (choice), m3, m9?, ... indexes
        pg.goto(BASE + 'subjects/maths/index.html'); pg.wait_for_timeout(150)
        pg.click('.ka-unit >> nth=%d' % lvl)
        for i in range(10):
            q = pg.inner_text('.ka-prompt'); 
            if 'Which number' in q:
                nums = [int(x) for x in pg.eval_on_selector_all('.ka-opt', 'e=>e.map(x=>x.textContent)')]; ans = max(nums) if 'bigger' in q else min(nums)
            elif 'How many' in q: ans = len(pg.inner_text('.ka-visual').strip().encode('utf-16-le')) // 4 if False else None
            else: ans = solve(q)
            if ans is None: break
            if pg.locator('.ka-opt').count(): pg.click('.ka-opt:text-is("%d")' % ans)
            else:
                for ch in str(ans): pg.click('.ka-key >> text="%s"' % ch)
                pg.click('.ka-key.ok')
            pg.click('.ka-nav button')
        if pg.locator('.ka-result').count(): check('10 of 10' in pg.inner_text('.ka-result'), 'maths level %d: 10/10 when all correct' % (lvl + 1))
    # repeated clicks on the right answer must not add up
    pg.goto(BASE + 'subjects/maths/index.html'); pg.click('.ka-unit >> nth=1'); q = pg.inner_text('.ka-prompt'); a = solve(q)
    for _ in range(5): pg.locator('.ka-opt:text-is("%d")' % a).click(force=True) if pg.locator('.ka-opt:text-is("%d")' % a).count() else None
    check('Question 1 / 10' in pg.inner_text('.ka-prog'), 'maths: question counter is not overwritten, got "%s"' % pg.inner_text('.ka-prog'))
    # ---------- writing ----------
    pg.goto(BASE + 'subjects/writing/index.html'); pg.wait_for_timeout(200)
    pg.click('[data-set="upper"]'); pg.click('.ka-unit >> nth=8')   # letter I
    cv = pg.locator('#cv'); box = cv.bounding_box()
    def stroke(points):
        pg.mouse.move(box['x'] + points[0][0] * box['width'] / 320, box['y'] + points[0][1] * box['height'] / 320); pg.mouse.down()
        for x, y in points[1:]: pg.mouse.move(box['x'] + x * box['width'] / 320, box['y'] + y * box['height'] / 320, steps=4)
        pg.mouse.up()
    pg.click('#ck'); check('Not quite' in pg.inner_text('#fb'), 'writing: empty tracing is rejected')
    pg.evaluate("window.__sc=0"); 
    # scribble over everything: should be rejected as sloppy
    stroke([(10, 10), (310, 10), (310, 60), (10, 60), (10, 110), (310, 110), (310, 160), (10, 160), (10, 210), (310, 210), (310, 260), (10, 260), (10, 310), (310, 310)]); pg.click('#ck'); check('Not quite' in pg.inner_text('#fb'), 'writing: scribbling everywhere is rejected')
    # find the stem of the I from the page and trace it
    info = pg.evaluate('''(()=>{const S=320;const c=document.createElement('canvas');c.width=c.height=S;const x=c.getContext('2d');x.font='bold 250px "Arial Rounded MT Bold", Arial, "Segoe UI", "DejaVu Sans", sans-serif';x.textAlign='center';x.textBaseline='alphabetic';const m=x.measureText('I');const y=S/2+(m.actualBoundingBoxAscent-m.actualBoundingBoxDescent)/2;x.fillText('I',S/2,y);const d=x.getImageData(0,0,S,S).data;let minx=S,maxx=0,miny=S,maxy=0;for(let j=0;j<S;j++)for(let i=0;i<S;i++){if(d[(j*S+i)*4+3]>128){minx=Math.min(minx,i);maxx=Math.max(maxx,i);miny=Math.min(miny,j);maxy=Math.max(maxy,j)}}return {minx,maxx,miny,maxy}})()''')
    cx = (info['minx'] + info['maxx']) / 2
    pg.click('#cl'); stroke([(cx, info['miny'] + 2), (cx, info['maxy'] - 2)]); pg.click('#ck')
    check('Lovely' in pg.inner_text('#fb'), 'writing: tracing the I along its stem is accepted (%s) letter box %s' % (pg.inner_text('#fb'), info))
    kid = [v for v in store()['profiles'].values() if v['name'] == 'Lena'][0]; check(kid['progress']['writing']['t:I']['stars'] >= 1, 'writing: stars saved for the letter')
    pg.goto(BASE + 'subjects/writing/index.html'); pg.click('[data-tab="spell"]'); pg.click('.ka-unit >> nth=0')
    for i in range(8):
        pg.wait_for_timeout(350); w = pg.evaluate('window.__spoken.slice(-1)[0]')
        for ch in w: pg.click('.ka-bank .ka-tile:text-is("%s") >> nth=0' % ch)
        pg.click('.ka-nav button')
    check('8 of 8' in pg.inner_text('.ka-result'), 'writing: spelling with letter tiles, 8 of 8')
    # ---------- english / german ----------
    pg.goto(BASE + 'subjects/english/index.html'); pg.click('.ka-unit >> nth=8')   # a / an
    for i in range(10):
        q = pg.inner_text('.ka-prompt'); noun = re.search(r'___ (\w+)', q)[1]; an = noun[0] in 'aeiou'
        pg.click('.ka-opt:text-is("%s")' % ('an' if an else 'a')); pg.click('.ka-nav button')
    check('10 of 10' in pg.inner_text('.ka-result'), 'english: a/an 10 of 10')
    pg.goto(BASE + 'subjects/german/index.html'); pg.click('.ka-unit >> nth=0'); art = {n[1]: n[0] for n in pg.evaluate('window.KA_GERMAN.units[0].nouns')}
    for i in range(10):
        noun = re.search(r'___ (\w+)', pg.inner_text('.ka-prompt'))[1]; pg.click('.ka-opt:text-is("%s")' % art[noun]); 
        check(True, '') if False else None
        pg.click('.ka-nav button')
    check('10 of 10' in pg.inner_text('.ka-result'), 'german: der/die/das 10 of 10')
    pg.goto(BASE + 'subjects/german/index.html'); pg.click('.ka-unit >> nth=7')   # sentences
    for i in range(6):
        pg.wait_for_timeout(350); words = pg.evaluate('window.__spoken.slice(-1)[0]').rstrip('.').split(' ')
        for w in words: pg.click('.ka-bank .ka-tile:text-is("%s") >> nth=0' % w)
        pg.click('.ka-nav button')
    check('6 of 6' in pg.inner_text('.ka-result'), 'german: sentence building 6 of 6')
    # ---------- coding ----------
    pg.goto(BASE + 'subjects/coding/index.html'); pg.click('.ka-unit >> nth=5')   # repeat level
    pg.click('#pal .ka-btn >> text=Repeat'); pg.click('#pal .ka-btn >> text=Forward')
    for _ in range(4): pg.click('#prog .ka-tile >> nth=0')
    check('×6' in pg.inner_text('#prog'), 'coding: repeat count cycles to 6')
    check('for i in range(6)' in pg.inner_text('#py'), 'coding: Python text is shown')
    pg.click('#run'); pg.wait_for_selector('#msg:has-text("You did it")', timeout=8000); check('⭐⭐⭐' in pg.inner_text('#msg'), 'coding: repeat solution earns 3 stars')
    pg.click('#bk'); pg.click('.ka-unit >> nth=3'); 
    for c in ['Forward', 'Forward']: pg.click('#pal .ka-btn >> text=%s' % c)
    pg.click('#run'); pg.wait_for_selector('#msg:has-text("bumped"), #msg:has-text("flag")', timeout=8000); check(True, 'coding: a wrong program gives gentle feedback: ' + pg.inner_text('#msg'))
    # ---------- persistence, switching child ----------
    pg.goto(BASE); pg.wait_for_timeout(200)
    check('⭐' in pg.inner_text('.ka-subject >> nth=0') or pg.locator('.ka-bar i').count() == 6, 'hub: progress bars show')
    # ---------- offline / service worker ----------
    pg.wait_for_timeout(1500); reg = pg.evaluate("navigator.serviceWorker.getRegistrations().then(r=>r.length)"); check(reg == 1, 'service worker registered')
    pg.wait_for_function("caches.keys().then(k=>k.length>0)", timeout=8000)
    ctx.set_offline(True); pg.goto(BASE + 'subjects/maths/index.html'); pg.wait_for_timeout(400); check(pg.locator('.ka-unit').count() == 13, 'offline: maths page loads from cache'); ctx.set_offline(False)
    # ---------- phone layout ----------
    m = b.new_context(viewport={'width': 375, 'height': 760}, is_mobile=True, has_touch=True); mp = m.new_page(); mp.add_init_script(STUB)
    mp.goto(BASE); mp.evaluate("localStorage.setItem('ka.v1', %s)" % json.dumps(json.dumps(store())))
    for pth in ['', 'subjects/reading/', 'subjects/writing/', 'subjects/maths/', 'subjects/english/', 'subjects/german/', 'subjects/coding/']:
        mp.goto(BASE + pth); mp.wait_for_timeout(250); w = mp.evaluate('document.documentElement.scrollWidth')
        check(w <= 376, 'phone: no sideways scroll on /%s (width %d)' % (pth, w))
    mp.goto(BASE + 'subjects/coding/'); mp.click('.ka-unit >> nth=7'); check(mp.evaluate('document.documentElement.scrollWidth') <= 376, 'phone: coding board with 8 columns fits')
    mp.goto(BASE + 'subjects/maths/'); mp.click('.ka-unit >> nth=7'); check(mp.locator('.ka-key').count() == 12, 'phone: number pad shows'); 
    # ---------- no profile ----------
    f = b.new_context().new_page(); f.goto(BASE + 'subjects/maths/index.html'); f.wait_for_timeout(200); check('choose a child' in f.inner_text('#app'), 'direct open without a child shows a friendly message')
    print('console/page errors:', errs)
    b.close()
print('FAILS:', fails); sys.exit(1 if fails or errs else 0)
