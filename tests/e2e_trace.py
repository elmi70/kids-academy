"""Tracing in the real page: honest traces pass, closing the gap of a C does not. Needs: scikit-image. Run: python3 tests/e2e_trace.py"""
import math, base64
import numpy as np
from skimage.morphology import skeletonize
from scipy.ndimage import convolve
from _pw import *

def order_path(pts):
    pts = [tuple(q) for q in pts]; left = set(pts); out = []; cur = min(pts, key=lambda q: (q[0], q[1]))
    while left:
        left.discard(cur); out.append(cur); best = None; bd = 1e9
        for dx in range(-3, 4):
            for dy in range(-3, 4):
                q = (cur[0] + dx, cur[1] + dy)
                if q in left and dx * dx + dy * dy < bd: bd, best = dx * dx + dy * dy, q
        if best is None:
            if not left: break
            best = min(left, key=lambda q: (q[0] - cur[0]) ** 2 + (q[1] - cur[1]) ** 2)
        cur = best
    return out
def mask_of(pg, ch):
    packed = pg.evaluate("""(ch) => { const m = KA_WRITING_MASK(ch), o = new Uint8Array(m.length / 8); for (let i = 0; i < m.length; i++) if (m[i]) o[i >> 3] |= (128 >> (i & 7)); let s = ''; for (const b of o) s += String.fromCharCode(b); return btoa(s); }""", ch)
    return np.unpackbits(np.frombuffer(base64.b64decode(packed), dtype=np.uint8))[:320 * 320].reshape(320, 320)
def skeleton(mask):
    sk = skeletonize(mask.astype(bool)); ys, xs = np.nonzero(sk); pts = order_path(list(zip(xs.tolist(), ys.tolist())))
    k = np.ones((3, 3)); k[1, 1] = 0; n = convolve(sk.astype(int), k, mode='constant'); ep = list(zip(*[a.tolist() for a in np.nonzero(sk & (n == 1))[::-1]]))
    return pts, ep
def line(a, b, step=3):
    n = max(1, int(math.hypot(b[0] - a[0], b[1] - a[1]) / step)); return [(a[0] + (b[0] - a[0]) * i / n, a[1] + (b[1] - a[1]) * i / n) for i in range(n + 1)]

with sync_playwright() as p:
    b = launch(p)
    ctx = b.new_context(viewport={'width': 430, 'height': 900}); pg = ctx.new_page(); pg.add_init_script(stub('ok')); watch(pg); seed(pg)
    prog = lambda: pg.evaluate("JSON.parse(localStorage.getItem('ka.v1')).profiles.c1.progress.writing || {}")
    last = lambda: pg.evaluate("window.KA_WRITING_LAST")
    fb = lambda: pg.inner_text('#fb')
    def open_letter(set_btn, idx):
        pg.goto(BASE + 'subjects/writing/index.html'); pg.wait_for_timeout(200)
        if set_btn: pg.click('[data-set="%s"]' % set_btn)
        pg.click('.ka-unit >> nth=%d' % idx); pg.wait_for_timeout(150)
    def draw(path):
        """moves the mouse along the path; the pen is lifted wherever the path jumps (like a child would)"""
        box = pg.locator('#cv').bounding_box(); sx, sy = box['width'] / 320, box['height'] / 320
        mv = lambda q: pg.mouse.move(box['x'] + q[0] * sx, box['y'] + q[1] * sy)
        pts = path[::4] if len(path) > 40 else path
        down = False; prev = None
        for q in pts:
            if prev is not None and math.hypot(q[0] - prev[0], q[1] - prev[1]) > 16 and down: pg.mouse.up(); down = False
            if not down: mv(q); pg.mouse.down(); down = True
            else: mv(q)
            prev = q
        if down: pg.mouse.up()

    # ---- the reported case: a C drawn as a closed loop (an O) ----
    open_letter(None, 2)       # C
    C = mask_of(pg, 'C'); path, ends = skeleton(C)
    a, c = max(((x, y) for i, x in enumerate(ends) for y in ends[i + 1:]), key=lambda xy: (xy[0][0] - xy[1][0]) ** 2 + (xy[0][1] - xy[1][1]) ** 2)
    draw(path + line(c, a)); pg.click('#ck'); pg.wait_for_timeout(100)
    check('red parts' in fb() or 'roten' in fb(), 'closed C: told to stay on the letter, red parts mentioned  [%s]' % fb()[:90]); check('%' not in fb(), 'closed C: no confusing percentages next to the hint')
    check('❌' in fb() and last()['reason'] == 'off', 'closed C: rejected (reason %s, accuracy %.2f, coverage %.2f)' % (last()['reason'], last()['accuracy'], last()['coverage']))
    check('t:C' not in prog(), 'closed C: no stars were awarded')
    red = pg.evaluate("""() => { const c = document.getElementById('cv').getContext('2d'), d = c.getImageData(0, 0, 320, 320).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i] > 200 && d[i+1] < 80 && d[i+2] < 80) n++; return n; }""")
    check(red > 150, 'closed C: the parts that are off the letter are shown in red (%d red pixels)' % red)
    # now trace it properly: starting to draw clears the red marks
    draw(path); pg.click('#ck'); pg.wait_for_timeout(100)
    check('✅' in fb() and last()['ok'] and last()['stars'] >= 2, 'open C traced along the letter: accepted with %s stars  [%s]' % (last()['stars'], fb()[:70]))
    check(prog().get('t:C', {}).get('stars', 0) >= 2, 'open C: stars are saved')
    check(pg.locator('#nav button').count() == 1, 'open C: a Next letter button appears')

    # ---- other mistakes ----
    open_letter(None, 2); draw(path[: len(path) // 2]); pg.click('#ck'); pg.wait_for_timeout(100)
    check(last()['reason'] == 'missed' and 'orange' in fb(), 'half a C: told which parts were missed (orange)  [%s]' % fb()[:70])
    orange = pg.evaluate("""() => { const c = document.getElementById('cv').getContext('2d'), d = c.getImageData(0, 0, 320, 320).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i] > 220 && d[i+1] > 110 && d[i+1] < 160 && d[i+2] < 80) n++; return n; }""")
    check(orange > 500, 'half a C: the missed half is shown in orange (%d px)' % orange)
    open_letter(None, 2); pg.click('#ck'); check('Draw on the grey letter' in fb(), 'pressing Check with nothing drawn asks to draw first')
    open_letter(None, 2); zig = []
    for k in range(9): y = 50 + k * 28; zig += line((40, y), (280, y)) if k % 2 == 0 else line((280, y), (40, y))
    draw(zig); pg.click('#ck'); check(not last()['ok'], 'scribbling across the page is rejected (%s)' % last()['reason'])
    open_letter(None, 2); circle = [(160 + 135 * math.cos(t / 30), 160 + 135 * math.sin(t / 30)) for t in range(0, 189)]
    draw(circle); pg.click('#ck'); check(not last()['ok'], 'a big circle around the letter is rejected (%s)' % last()['reason'])
    open_letter(None, 2); draw(line((60, 40), (260, 280))); pg.click('#ck'); check(not last()['ok'], 'a straight diagonal line is rejected (%s)' % last()['reason'])

    # ---- a different letter drawn over this one ----
    open_letter(None, 14)      # O
    O = mask_of(pg, 'O'); po, _ = skeleton(O)
    open_letter(None, 3)       # D
    D = mask_of(pg, 'D'); pd, _ = skeleton(D)
    draw(po); pg.click('#ck'); check(not last()['ok'] or last()['stars'] <= 1, 'O traced over a D: rejected or lowest stars (%s, %s stars)' % (last()['reason'], last()['stars']))
    open_letter(None, 3); draw(pd); pg.click('#ck'); check(last()['ok'], 'D traced over a D: accepted')

    # ---- lowercase, umlaut and a letter with two strokes (the dot of i) ----
    open_letter('lower', 8)    # i
    I = mask_of(pg, 'i'); pts, _ = skeleton(I)
    comps = {}
    from scipy.ndimage import label
    lab, n = label(I); strokes = [np.argwhere(lab == k) for k in range(1, n + 1)]
    check(n == 2, 'lowercase i has two parts (stem and dot)')
    box = pg.locator('#cv').bounding_box(); sx, sy = box['width'] / 320, box['height'] / 320
    for part in strokes:
        cy, cx = part.mean(0); ys, xs = part[:, 0], part[:, 1]
        a, c = (cx, ys.min() + 8), (cx, ys.max() - 8)
        pg.mouse.move(box['x'] + a[0] * sx, box['y'] + a[1] * sy); pg.mouse.down()
        for q in line(a, c, 4): pg.mouse.move(box['x'] + q[0] * sx, box['y'] + q[1] * sy)
        pg.mouse.up()
    pg.click('#ck'); check(last()['ok'], 'lowercase i: stem and dot as two strokes are accepted (%s, coverage %.2f)' % (last()['reason'], last()['coverage']))
    open_letter('umlaut', 0)
    A = mask_of(pg, 'Ä'); pa, _ = skeleton(A); draw(pa); pg.click('#ck'); check(last()['coverage'] > 0.5, 'Ä: tracing runs (coverage %.2f, %s)' % (last()['coverage'], last()['reason']))

    # ---- a finger on a phone: real touch events ----
    m = b.new_context(viewport={'width': 390, 'height': 780}, is_mobile=True, has_touch=True); mp = m.new_page(); mp.add_init_script(stub('ok')); watch(mp); seed(mp)
    mp.goto(BASE + 'subjects/writing/index.html'); mp.wait_for_timeout(200); mp.click('.ka-unit >> nth=8'); mp.wait_for_timeout(150)   # I
    cdp = m.new_cdp_session(mp)
    Im = mask_of(mp, 'I'); ip, _ = skeleton(Im); bx = mp.locator('#cv').bounding_box(); k = bx['width'] / 320
    tp = lambda q: {'x': bx['x'] + q[0] * k, 'y': bx['y'] + q[1] * k}
    ip = ip[::4]
    cdp.send('Input.dispatchTouchEvent', {'type': 'touchStart', 'touchPoints': [tp(ip[0])]})
    for q in ip[1:]: cdp.send('Input.dispatchTouchEvent', {'type': 'touchMove', 'touchPoints': [tp(q)]})
    cdp.send('Input.dispatchTouchEvent', {'type': 'touchEnd', 'touchPoints': []})
    mp.click('#ck'); mp.wait_for_timeout(100)
    check(mp.evaluate('window.KA_WRITING_LAST.ok') is True, 'finger drag on a phone: the I is accepted (%s)' % mp.evaluate('KA_WRITING_LAST.reason'))
    check(mp.evaluate('document.documentElement.scrollWidth') <= 391, 'phone: tracing page does not scroll sideways')
    b.close()
finish()
