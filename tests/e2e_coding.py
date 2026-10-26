"""Coding screen: mission card, live checklist, specific error feedback, hints, star cap, German, phone. Run: python3 tests/e2e_coding.py"""
from _pw import *
with sync_playwright() as p:
    b = launch(p)
    ctx = b.new_context(viewport={'width': 900, 'height': 1000}); pg = ctx.new_page(); pg.add_init_script(stub('ok')); watch(pg); seed(pg)
    prog = lambda: pg.evaluate("JSON.parse(localStorage.getItem('ka.v1')).profiles.c1.progress.coding || {}")
    def open_level(n, page=None):
        q = page or pg; q.goto(BASE + 'subjects/coding/index.html'); q.wait_for_timeout(200); q.click('.ka-unit >> nth=%d' % (n - 1)); q.wait_for_timeout(150)
    def add(*names):
        for n in names: pg.click('#pal .ka-btn >> text=%s' % n)
    msg = lambda: pg.inner_text('#msg')
    def run_wait(text=None):
        pg.click('#run'); pg.wait_for_function("document.querySelector('#msg').textContent.trim().length > 0", timeout=15000)
    # ---- the mission is visible BEFORE the robot runs ----
    open_level(5)
    check('Mission' in pg.inner_text('.cd-mission'), 'c5: a Mission card is shown at the top')
    check('walk over the ⭐' in pg.inner_text('#intro') and 'does not count' in pg.inner_text('#intro'), 'c5: the intro says up front that the star must be collected [%s]' % pg.inner_text('#intro')[:80])
    goals = pg.eval_on_selector_all('#goals li', 'e => e.map(x => x.textContent)')
    check(len(goals) == 2 and 'Walk over every ⭐' in goals[0] and '0 / 1' in goals[0] and 'Stop on the 🏁' in goals[1], 'c5: the checklist lists the star and the flag before running %s' % goals)
    check(pg.inner_text('.cd-mission').count('⬜') == 2, 'c5: both goals start unchecked')
    check('⭐ star' in pg.inner_text('p.small.ka-center') and '🧱' not in pg.inner_text('p.small.ka-center'), 'c5: the legend lists only things on this board')
    open_level(1); check(len(pg.eval_on_selector_all('#goals li', 'e => e')) == 1 and 'star' not in pg.inner_text('#goals').lower(), 'c1: no star goal on a level without stars')

    # ---- skipping the star: the page says exactly what was missed ----
    open_level(5); add('Turn right', 'Forward', 'Forward', 'Turn left', 'Forward')       # reaches the flag at (1,2) without the star at (2,0)
    pg.click('#run'); pg.wait_for_function("document.querySelector('#msg').textContent.includes('skipped')", timeout=15000)
    check('skipped 1 ⭐' in msg() and 'orange ring' in msg(), 'c5 skipped star: the message names the skipped star and the ring [%s]' % msg()[:110])
    check(pg.locator('#board div[data-missed="1"]').count() == 1, 'c5 skipped star: the star on the board gets an orange ring')
    gl = pg.eval_on_selector_all('#goals li', 'e => e.map(x => x.textContent)')
    check(gl[0].startswith('❌') and gl[1].startswith('✅'), 'c5 skipped star: checklist shows ❌ stars and ✅ flag %s' % gl)
    check(prog().get('c5') is None, 'c5 skipped star: no stars were awarded')
    # ---- stopping early with a star still missing ----
    pg.click('#clr'); add('Turn right', 'Forward'); pg.click('#run'); pg.wait_for_function("document.querySelector('#msg').textContent.includes('stopped')", timeout=15000)
    check('stopped before the 🏁' in msg() and 'missed 1 ⭐' in msg(), 'c5 stopped early: the message also reports the missing star [%s]' % msg()[:120])
    # ---- the live checklist and highlight move while the robot runs ----
    pg.click('#clr'); add('Forward', 'Forward', 'Turn right', 'Forward', 'Forward', 'Turn right', 'Forward')
    pg.click('#run'); seen_cur = False; star_live = False
    for _ in range(40):
        pg.wait_for_timeout(120)
        if pg.locator('#prog .cd-cur').count() == 1: seen_cur = True
        if '1 / 1' in pg.inner_text('#goals li >> nth=0') and pg.locator('#msg:has-text("did it")').count() == 0: star_live = True
        if 'did it' in msg(): break
    check(seen_cur, 'c5 run: the command being executed is highlighted in the program')
    check(star_live, 'c5 run: the star counter ticks up to 1 / 1 while the robot is still walking (before the win message)')
    check('You did it' in msg() and '⭐⭐⭐' in msg(), 'c5 solution: wins with 3 stars [%s]' % msg()[:60])
    gl = pg.eval_on_selector_all('#goals li', 'e => e.map(x => x.textContent)')
    check(all(x.startswith('✅') for x in gl) and '1 / 1' in gl[0], 'c5 solution: both goals are ticked ✅ %s' % gl)
    check(pg.locator('#prog .cd-cur').count() == 0, 'c5 solution: no command stays highlighted after the run')
    check(prog().get('c5', {}).get('stars') == 3, 'c5 solution: 3 stars saved')
    check(pg.locator('#board span:text("●")').count() >= 3, 'c5 solution: the robot leaves a trail of dots on the board')

    # ---- a crash: the failing command turns red and the message names it ----
    open_level(4); add('Forward', 'Forward'); pg.click('#run'); pg.wait_for_function("document.querySelector('#msg').textContent.includes('bumped')", timeout=15000)
    check('bumped into a 🧱 at command 2' in msg() and 'red command' in msg(), 'c4 crash: the message names the wall and the command number [%s]' % msg()[:100])
    check(pg.locator('#prog .cd-bad').count() == 1 and pg.eval_on_selector('#prog .cd-bad', 'e => e.dataset.ref') == '1', 'c4 crash: exactly the 2nd command is marked red')
    check(pg.eval_on_selector_all('#goals li', 'e => e.map(x => x.textContent)')[0].startswith('❌'), 'c4 crash: the flag goal shows ❌')
    pg.click('#prog .cd-bad'); check(pg.locator('#prog .cd-bad').count() == 0, 'c4 crash: removing a command clears the red mark')
    # crash inside a repeat block marks the inner command
    open_level(7); add('Repeat', 'Turn left'); pg.click('#pal .ka-btn >> text=Forward'); pg.click('#run'); pg.wait_for_function("document.querySelector('#msg').textContent.includes('Oops')", timeout=15000)
    check(pg.locator('#prog .cd-bad').count() == 1 and '.' in pg.eval_on_selector('#prog .cd-bad', 'e => e.dataset.ref'), 'c7 crash inside a repeat: the command inside the block is marked red')

    # ---- clear messages instead of silent buttons ----
    open_level(6); add('Repeat'); pg.click('#pal .ka-btn >> text=Repeat'); check('Done' in msg() and 'first' in msg(), 'c6: pressing Repeat while a block is open explains what to do [%s]' % msg()[:80])
    pg.click('#run'); check('empty' in msg(), 'c6: running with an empty repeat block explains it [%s]' % msg()[:70])
    pg.click('#clr'); pg.click('#run'); check('Add some commands' in msg(), 'c6: running an empty program explains it')
    open_level(1)
    for _ in range(31): pg.click('#pal .ka-btn >> text=Forward') if pg.locator('#prog .ka-tile').count() < 30 else None
    pg.click('#pal .ka-btn >> text=Forward'); check('full' in msg(), 'c1: a full program (30 commands) says so instead of ignoring the tap')

    # ---- hints: plan first, answer second, and the answer caps the stars ----
    open_level(5); check(pg.locator('#hint .cd-hint').count() == 0, 'hint: nothing is shown until asked')
    pg.click('#hintbtn'); check('Go right 2 to the star' in pg.inner_text('#hint'), 'hint 1: a plan in words [%s]' % pg.inner_text('#hint')[:80])
    check(pg.locator('#ans').count() == 1 and pg.locator('.cd-mini').count() == 0, 'hint 1: the answer is still hidden')
    pg.click('#ans'); check(pg.locator('.cd-mini').count() == 7 and '1 ⭐ at most' in pg.inner_text('#hint'), 'hint 2: the answer is shown as 7 command tiles with a warning about the star limit')
    add('Forward', 'Forward', 'Turn right', 'Forward', 'Forward', 'Turn right', 'Forward')
    pg.click('#run'); pg.wait_for_function("document.querySelector('#msg').textContent.includes('did it')", timeout=15000)
    check('1 ⭐ at most' in msg() and '⭐⭐' not in msg().split('Commands')[0], 'hint 2: winning after showing the answer gives 1 star and says why [%s]' % msg()[:110])
    check(prog().get('c5', {}).get('stars') == 3, 'hint 2: stars already earned before are never taken away (still 3)')
    open_level(6); pg.click('#hintbtn'); pg.click('#ans'); check('🔁×6' in pg.inner_text('#hint'), 'hint 2 on a loop level: the answer shows 🔁×6')
    open_level(10); pg.click('#hintbtn'); pg.click('#ans'); check(pg.locator('.cd-mini').count() == 16 and 'Right 2, down 2' in pg.inner_text('#hint'), 'c10: plan and 16-step answer are shown')
    add('Forward', 'Forward', 'Turn right', 'Forward', 'Forward', 'Turn left', 'Forward', 'Forward', 'Turn left', 'Forward', 'Turn right', 'Forward', 'Turn right', 'Forward', 'Forward', 'Forward')
    pg.click('#run'); pg.wait_for_function("document.querySelector('#msg').textContent.includes('did it')", timeout=25000); check('1 ⭐ at most' in msg(), 'c10: the answer from the hint really solves the maze')

    # ---- every level: mission text matches the board ----
    for n in range(1, 11):
        open_level(n); has_star = '⭐' in pg.eval_on_selector('#board', 'e => e.textContent')
        check((pg.locator('#goals li').count() == 2) == has_star, 'level %d: the checklist has a star goal exactly when the board has a star' % n)

    # ---- Listen button speaks the mission, without emoji ----
    open_level(5); pg.click('#say'); pg.wait_for_timeout(300)
    sp = pg.evaluate('window.__spoken.slice(-1)[0]'); check('star' in sp and 'flag' in sp and '⭐' not in sp and '🏁' not in sp, 'listen: the mission is read aloud in words, not emoji [%s]' % sp[:80])
    pg2 = b.new_context(viewport={'width': 400, 'height': 800}).new_page(); pg2.add_init_script(stub('none')); watch(pg2); seed(pg2); open_level(5, pg2); pg2.click('#say'); pg2.wait_for_timeout(900)
    check(pg2.evaluate('KA.audioInfo().clipPlays') >= 1 and pg2.evaluate('KA.audioInfo().misses.length') == 0, 'listen: works with the recorded voice when the phone cannot speak (no clip missing)')

    # ---- German ----
    g = b.new_context(viewport={'width': 900, 'height': 900}).new_page(); g.add_init_script(stub('ok')); watch(g); seed(g, 'de'); open_level(5, g)
    check('Aufgabe' in g.inner_text('.cd-mission') and 'Stern' in g.inner_text('#intro') and 'zählt das Level nicht' in g.inner_text('#intro'), 'German: mission and intro are in German')
    g.click('#pal .ka-btn >> text=Vorwärts'); g.click('#run'); g.wait_for_function("document.querySelector('#msg').textContent.length > 3", timeout=15000)
    check('stehen geblieben' in g.inner_text('#msg') and 'fehlen 1' in g.inner_text('#msg'), 'German: the stopped message reports the missing star [%s]' % g.inner_text('#msg')[:90])
    g.click('#hintbtn'); check('Stern' in g.inner_text('#hint'), 'German: the hint is in German')
    g.click('#say'); g.wait_for_timeout(300); check('Flagge' in g.evaluate('window.__spoken.slice(-1)[0]'), 'German: Listen reads the German mission')

    # ---- phone: nothing sticks out, mission fits ----
    m = b.new_context(viewport={'width': 375, 'height': 760}, is_mobile=True, has_touch=True); mp = m.new_page(); mp.add_init_script(stub('ok')); watch(mp); seed(mp)
    for n in (1, 5, 8, 10):
        open_level(n, mp); w = mp.evaluate('document.documentElement.scrollWidth'); check(w <= 376, 'phone: level %d mission screen fits (width %d)' % (n, w))
    mp.click('#hintbtn'); mp.click('#ans'); check(mp.evaluate('document.documentElement.scrollWidth') <= 376, 'phone: the 16-tile answer wraps and fits')
    mp.click('#pal .ka-btn >> text=Forward'); mp.click('#run'); mp.wait_for_function("document.querySelector('#msg').textContent.length > 3", timeout=15000); check(mp.evaluate('document.documentElement.scrollWidth') <= 376, 'phone: the longest feedback message fits')
    b.close()
finish()
