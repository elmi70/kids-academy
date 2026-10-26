"""Sweeps ALL 59 letters with child-like drawings and reports false accepts (bad drawing accepted) and false rejects (careful trace rejected).
   python3 -m http.server 8765  (repo root), then:   FONT="Liberation Sans" python3 tools/sweep_trace.py good|blob|walk|partial|shift|pairs"""
import base64, json, math, os, random, sys
import numpy as np
from skimage.morphology import skeletonize
from scipy.ndimage import convolve
from playwright.sync_api import sync_playwright
EXE = os.environ.get('CHROME', '/opt/pw-browsers/chromium_headless_shell-1228/chrome-headless-shell-linux64/chrome-headless-shell')
BASE = os.environ.get('BASE', 'http://localhost:8765/'); FONT = os.environ.get('FONT', 'Liberation Sans'); PART = sys.argv[1] if len(sys.argv) > 1 else 'good'
LET = list('ABCDEFGHIJKLMNOPQRSTUVWXYZ') + list('abcdefghijklmnopqrstuvwxyz') + list('ÄÖÜäöüß')
rnd = random.Random(11)

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
def jitter(pts, amp, bias):
    if amp == 0 and bias == 0: return pts
    ph = [rnd.uniform(0, 6.28) for _ in range(4)]; fq = [rnd.uniform(0.012, 0.035) for _ in range(4)]; bx, by = rnd.uniform(-bias, bias), rnd.uniform(-bias, bias)
    return [(x + amp * 0.5 * (math.sin(fq[0] * y + ph[0]) + math.sin(fq[1] * x + ph[1])) + bx, y + amp * 0.5 * (math.sin(fq[2] * x + ph[2]) + math.sin(fq[3] * y + ph[3])) + by) for x, y in pts]

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=EXE, args=['--no-sandbox']); pg = b.new_page(); pg.goto(BASE + 'subjects/writing/trace.js')
    pg.set_content('<html><body></body></html>'); pg.add_script_tag(url=BASE + 'subjects/writing/trace.js')
    packed = pg.evaluate("""([L, font]) => { const S = 320, out = {}; for (const ch of L) { const c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d', {willReadFrequently:true});
        x.font = 'bold 250px "' + font + '"'; x.textAlign = 'center'; x.textBaseline = 'alphabetic'; const m = x.measureText(ch), y = S/2 + (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent)/2; x.fillText(ch, S/2, y);
        const d = x.getImageData(0,0,S,S).data, o = new Uint8Array(S*S/8); for (let i = 0; i < S*S; i++) if (d[i*4+3] > 128) o[i>>3] |= (128 >> (i&7)); let s = ''; for (const v of o) s += String.fromCharCode(v); out[ch] = btoa(s); } return out; }""", [LET, FONT])
    M = {ch: np.unpackbits(np.frombuffer(base64.b64decode(v), dtype=np.uint8))[:320 * 320].reshape(320, 320) for ch, v in packed.items()}
    SK = {}
    for ch in LET:
        sk = skeletonize(M[ch].astype(bool)); ys, xs = np.nonzero(sk); SK[ch] = order_path(list(zip(xs.tolist(), ys.tolist())))
    bbox = {ch: (np.argwhere(M[ch]).min(0)[::-1].tolist(), np.argwhere(M[ch]).max(0)[::-1].tolist()) for ch in LET}   # (x0,y0),(x1,y1)
    pg.evaluate("""(m) => { window.__M = {}; window.__D = {}; for (const ch in m) { const bin = atob(m[ch]), mask = new Uint8Array(320*320); for (let i = 0; i < mask.length; i++) mask[i] = (bin.charCodeAt(i >> 3) >> (7 - (i & 7))) & 1; window.__M[ch] = mask; window.__D[ch] = KA_TRACE.edt(mask, 320, 320); } }""", packed)
    def score(cases):
        payload = [[ch, [[float(x), float(y)] for x, y in pts]] for ch, pts in cases]
        return pg.evaluate("""(cs) => cs.map(([ch, pts]) => { const r = KA_TRACE.score(window.__M[ch], pts.map(q => ({x:q[0], y:q[1]})), {dGlyph: window.__D[ch]}); return [r.ok ? 1 : 0, r.stars, r.reason, +r.coverage.toFixed(2), +r.accuracy.toFixed(2)]; })""", payload)
    def densify(p, step=2):
        out = [p[0]]
        for a, c in zip(p, p[1:]):
            n = max(1, int(math.hypot(c[0] - a[0], c[1] - a[1]) / step)); out += [(a[0] + (c[0] - a[0]) * i / n, a[1] + (c[1] - a[1]) * i / n) for i in range(1, n + 1)]
        return out
    cases = []; meta = []
    if PART == 'good':
        for amp, bias in [(0, 0), (6, 4), (10, 6)]:
            for ch in LET:
                for _ in range(2): cases.append((ch, jitter(order_path(SK[ch]), amp, bias)[::2])); meta.append((ch, amp))
    elif PART == 'blob':
        for ch in LET:
            (x0, y0), (x1, y1) = bbox[ch]; cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
            for _ in range(10):
                ox, oy = cx + rnd.uniform(-0.35, 0.35) * (x1 - x0), cy + rnd.uniform(-0.35, 0.35) * (y1 - y0); r = rnd.uniform(25, 75); p1, p2 = rnd.uniform(0, 6.28), rnd.uniform(0, 6.28); loops = rnd.choice([1, 1, 2])
                pts = [(ox + r * (1 + 0.25 * math.sin(2 * t + p1) + 0.15 * math.sin(3 * t + p2)) * math.cos(t), oy + r * (1 + 0.25 * math.sin(2 * t + p1) + 0.15 * math.sin(3 * t + p2)) * math.sin(t)) for t in np.linspace(0, 6.283 * loops, 120 * loops)]
                cases.append((ch, densify(pts))); meta.append((ch, 'blob'))
    elif PART == 'walk':
        for ch in LET:
            (x0, y0), (x1, y1) = bbox[ch]
            for steps in (100, 220, 400):
                for _ in range(3):
                    x, y, h = rnd.uniform(x0, x1), rnd.uniform(y0, y1), rnd.uniform(0, 6.28); pts = [(x, y)]
                    for _ in range(steps):
                        h += rnd.gauss(0, 0.35); x += 3 * math.cos(h); y += 3 * math.sin(h)
                        if x < x0 - 12 or x > x1 + 12: h = math.pi - h
                        if y < y0 - 12 or y > y1 + 12: h = -h
                        pts.append((x, y))
                    cases.append((ch, pts)); meta.append((ch, 'walk%d' % steps))
    elif PART == 'partial':
        for ch in LET:
            path = order_path(SK[ch]); n = len(path)
            for f in (0.3, 0.45, 0.6, 0.7):
                for _ in range(3):
                    L = int(n * f); s0 = rnd.randint(0, max(0, n - L)); cases.append((ch, path[s0:s0 + L][::2])); meta.append((ch, 'part%.2f' % f))
    elif PART == 'shift':
        for ch in LET:
            path = order_path(SK[ch])[::2]
            for dx, dy in ((30, 0), (-30, 0), (0, 30), (0, -30), (26, 26)): cases.append((ch, [(x + dx, y + dy) for x, y in path])); meta.append((ch, 'shift'))
            for sc in (1.35, 0.6): cases.append((ch, [(160 + (x - 160) * sc, 160 + (y - 160) * sc) for x, y in path])); meta.append((ch, 'scale%.2f' % sc))
    elif PART == 'pairs':
        groups = [list('ABCDEFGHIJKLMNOPQRSTUVWXYZ'), list('abcdefghijklmnopqrstuvwxyz'), list('ÄÖÜ'), list('äöüß')]
        for gi, grp in enumerate(groups):
            if os.environ.get('GROUP') and str(gi) != os.environ['GROUP']: continue
            for a in grp:
                for c in grp:
                    if a != c: cases.append((a, jitter(order_path(SK[c]), 6, 3)[::2])); meta.append((a + '<-' + c, 'pair'))
    res = score(cases)
    n = len(res); acc = [(meta[i], res[i]) for i in range(n) if res[i][0]]
    print('FONT %s | %s | %d drawings | accepted %d (%.1f%%)' % (FONT, PART, n, len(acc), 100 * len(acc) / n))
    if PART == 'good':
        for amp in (0, 6, 10):
            idx = [i for i in range(n) if meta[i][1] == amp]; rej = sorted({meta[i][0] for i in idx if not res[i][0]})
            print('   careful trace, wobble %2d px: %d of %d accepted (%.1f%%) | rejected letters: %s | stars %s' % (amp, sum(res[i][0] for i in idx), len(idx), 100 * sum(res[i][0] for i in idx) / len(idx), ''.join(rej), {s: sum(1 for i in idx if res[i][1] == s) for s in (0, 1, 2, 3)}))
    else:
        by = {}
        for (ch, kind), r in acc: by.setdefault(ch, []).append((kind, r[2] if False else r[1]))
        print('   letters with at least one false accept: %s' % ' '.join('%s:%d' % (k, len(v)) for k, v in sorted(by.items())))
        kinds = {}
        for (ch, kind), r in acc: kinds[kind] = kinds.get(kind, 0) + 1
        print('   accepted, by kind of drawing:', kinds, ' | out of', {k: sum(1 for m in meta if m[1] == k) for k in sorted({m[1] for m in meta})})
        print('   stars given to accepted bad drawings:', {s: sum(1 for _, r in acc if r[1] == s) for s in (1, 2, 3)})
        wrong3 = [(m, r) for m, r in acc if r[1] == 3]
        print('   accepted with 3 stars (the worst kind):', [(m[0], m[1]) for m, r in wrong3][:20])
    b.close()
