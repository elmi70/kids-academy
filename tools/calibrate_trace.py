"""Calibrates the tracing check against real glyphs with simulated children. Not shipped to children; run by hand:
   python3 -m http.server 8765  (in the repo root)   then   python3 tools/calibrate_trace.py"""
import json, math, os, random, sys
import numpy as np
from skimage.morphology import skeletonize
from scipy.ndimage import convolve
from playwright.sync_api import sync_playwright
EXE = os.environ.get('CHROME', '/opt/pw-browsers/chromium_headless_shell-1228/chrome-headless-shell-linux64/chrome-headless-shell')
BASE = os.environ.get('BASE', 'http://localhost:8765/')
rnd = random.Random(7); np.random.seed(7)
LET = list('ABCDEFGHIJKLMNOPQRSTUVWXYZ') + list('abcdefghijklmnopqrstuvwxyz') + list('ÄÖÜäöüß')

def skel_points(mask):
    sk = skeletonize(mask.astype(bool))
    ys, xs = np.nonzero(sk)
    return sk, np.stack([xs, ys], 1).astype(float)

def endpoints(sk):
    k = np.ones((3, 3)); k[1, 1] = 0
    n = convolve(sk.astype(int), k, mode='constant')
    ys, xs = np.nonzero(sk & (n == 1))
    return list(zip(xs, ys))

def jitter(pts, amp, bias):
    if amp == 0 and bias == 0: return pts
    ph = [rnd.uniform(0, 6.28) for _ in range(6)]; fq = [rnd.uniform(0.012, 0.035) for _ in range(6)]
    out = []
    bx, by = rnd.uniform(-bias, bias), rnd.uniform(-bias, bias)
    for x, y in pts:
        dx = amp * 0.5 * (math.sin(fq[0] * y + ph[0]) + math.sin(fq[1] * x + ph[1])) + bx
        dy = amp * 0.5 * (math.sin(fq[2] * x + ph[2]) + math.sin(fq[3] * y + ph[3])) + by
        out.append((x + dx, y + dy))
    return out

def line(a, b, step=2):
    d = math.hypot(b[0] - a[0], b[1] - a[1]); n = max(1, int(d / step))
    return [(a[0] + (b[0] - a[0]) * i / n, a[1] + (b[1] - a[1]) * i / n) for i in range(n + 1)]

def order_path(pts):
    """order skeleton pixels like a pen would: walk to the nearest unvisited pixel, start a new stroke after a gap"""
    pts = [tuple(q) for q in pts]; left = set(pts); out = []
    if not pts: return out
    cur = min(pts, key=lambda q: (q[0], q[1]))
    while left:
        left.discard(cur); out.append(cur)
        best = None; bd = 1e9
        for dx in range(-3, 4):
            for dy in range(-3, 4):
                q = (cur[0] + dx, cur[1] + dy)
                if q in left:
                    d = dx * dx + dy * dy
                    if d < bd: bd, best = d, q
        if best is None:
            if not left: break
            best = min(left, key=lambda q: (q[0] - cur[0]) ** 2 + (q[1] - cur[1]) ** 2)
        cur = best
    return out

def thin(pts, k=2): return list(pts)[::k]

with sync_playwright() as p:
    b = p.chromium.launch(executable_path=EXE, args=['--no-sandbox'])
    pg = b.new_page(); pg.goto(BASE)
    pg.evaluate("""localStorage.setItem('ka.v1', JSON.stringify({v:1,current:'c1',settings:{sound:false},profiles:{c1:{id:'c1',name:'T',avatar:'🦊',band:'67',ui:'en',progress:{}}}}))""")
    pg.goto(BASE + 'subjects/writing/index.html'); pg.wait_for_timeout(300)
    CACHE = '/tmp/ka_masks.npz'
    if os.path.exists(CACHE):
        z = np.load(CACHE); M = {ch: z[str(i)] for i, ch in enumerate(LET)}
    else:
        packed = pg.evaluate("""(L) => L.map(ch => { const m = window.KA_WRITING_MASK(ch), out = new Uint8Array(m.length / 8); for (let i = 0; i < m.length; i++) if (m[i]) out[i >> 3] |= (128 >> (i & 7)); let s = ''; for (const b of out) s += String.fromCharCode(b); return btoa(s); })""", LET)
        import base64
        M = {ch: np.unpackbits(np.frombuffer(base64.b64decode(b64), dtype=np.uint8))[:320 * 320].reshape(320, 320) for ch, b64 in zip(LET, packed)}
        np.savez(CACHE, **{str(i): M[ch] for i, ch in enumerate(LET)})
    SK = {ch: skel_points(M[ch]) for ch in LET}

    import base64
    pk = {ch: base64.b64encode(np.packbits(M[ch].flatten()).tobytes()).decode() for ch in LET}
    pg.evaluate("""(m) => { window.__M = {}; window.__D = {}; for (const ch in m) { const bin = atob(m[ch]), mask = new Uint8Array(320 * 320); for (let i = 0; i < mask.length; i++) mask[i] = (bin.charCodeAt(i >> 3) >> (7 - (i & 7))) & 1; window.__M[ch] = mask; window.__D[ch] = KA_TRACE.edt(mask, 320, 320); } }""", pk)
    def score_all(cases):
        """cases: list of (letter, points). returns list of score dicts."""
        payload = [[ch, [[float(x), float(y)] for x, y in pts]] for ch, pts in cases]
        return pg.evaluate("""([cases, ov]) => cases.map(([ch, pts]) => { const r = KA_TRACE.score(window.__M[ch], pts.map(q => ({x:q[0], y:q[1]})), Object.assign({dGlyph: window.__D[ch]}, ov)); return {c:+r.coverage.toFixed(3), a:+r.accuracy.toFixed(3), o:+r.overdraw.toFixed(2), run:+r.run.toFixed(1), dev:+r.dev.toFixed(1), ok:r.ok, why:r.reason, s:r.stars}; })""", [payload, OV])
    OV = json.loads(os.environ.get('OV', '{}'))

    def rate(res): return sum(1 for r in res if r['ok']) / len(res)
    print('=== thresholds', OV or 'defaults', pg.evaluate("KA_TRACE.P"))
    PART = sys.argv[1] if len(sys.argv) > 1 else 'all'
    PART = sys.argv[1] if len(sys.argv) > 1 else 'all'
    if PART in ('all', 'good'):
      for amp, bias in [(0, 0), (4, 3), (8, 5), (12, 6), (16, 8)]:
          cases = []
          for ch in LET:
              sk, pts = SK[ch]
              for _ in range(3): cases.append((ch, thin(jitter(order_path(pts), amp, bias))))
          res = score_all(cases)
          fails = sorted({LET[i // 3] for i, r in enumerate(res) if not r['ok']})
          q = lambda k, pc: float(np.percentile([r[k] for r in res], pc))
          print('good  jitter %2d bias %d : pass %5.1f%%  | stars %s | run p95 %.0f p99 %.0f max %.0f | dev p95 %.0f p99 %.0f max %.0f | fails %s' % (amp, bias, 100 * rate(res), {s: sum(1 for r in res if r['s'] == s) for s in (0, 1, 2, 3)}, q('run', 95), q('run', 99), q('run', 100), q('dev', 95), q('dev', 99), q('dev', 100), ''.join(fails)[:30]))
      # ---- the failing case from the screenshot: C closed into an O-like loop ----
      cases = []; 
      for ch in 'CcUuGgSsJjLVv':
          sk, pts = SK[ch]; ep = endpoints(sk)
          if len(ep) < 2: continue
          best = max(((a, c) for i, a in enumerate(ep) for c in ep[i + 1:]), key=lambda ac: (ac[0][0]-ac[1][0])**2 + (ac[0][1]-ac[1][1])**2)
          for amp in (0, 6): cases.append((ch, thin(jitter(order_path(pts), amp, 3)) + line(best[0], best[1])))
      res = score_all(cases)
      print('closed loop over open letter: pass %d of %d' % (sum(r['ok'] for r in res), len(res)))
      for (ch, _), r in zip(cases, res): print('   ', ch, 'run', r['run'], 'dev', r['dev'], 'acc', r['a'], r['why'])
      # thick, wobbly, closed C like the screenshot (overshoot outside + closed on the right)
    if PART in ('all', 'wrong'):
      # ---- other letter's skeleton over this letter ----
      groups = [list('ABCDEFGHIJKLMNOPQRSTUVWXYZ'), list('abcdefghijklmnopqrstuvwxyz'), list('ÄÖÜ'), list('äöüß')]
      allpass = []
      for gi, grp in enumerate(groups):
          if os.environ.get('GROUPS') and str(gi) not in os.environ['GROUPS']: continue
          cases = []; pairs = []
          for a in grp:
              for c in grp:
                  if a == c: continue
                  _, pts = SK[c]; cases.append((a, thin(jitter(order_path(pts), 6, 3)))); pairs.append((a, c))
          res = score_all(cases)
          allpass += [(pr, r) for pr, r in zip(pairs, res) if r['ok']]
          print('wrong letter traced, group %s: %d of %d accepted' % (''.join(grp)[:6], sum(r['ok'] for r in res), len(res)))
      print('  accepted wrong-letter pairs (shown / traced):', ' '.join(a + '/' + c for (a, c), r in allpass))
    if PART in ('all', 'junk'):
      # ---- junk ----
      cases = []
      for ch in LET:
          bb = np.argwhere(M[ch]); y0, x0 = bb.min(0); y1, x1 = bb.max(0)
          zig = []
          for k in range(9):
              yy = y0 + (y1 - y0) * k / 8; zig += line((x0 - 10, yy), (x1 + 10, yy)) if k % 2 == 0 else line((x1 + 10, yy), (x0 - 10, yy))
          cases.append((ch, zig))
      res = score_all(cases); print('zig-zag scribble over every letter: pass', sum(r['ok'] for r in res), 'of', len(res), [ch for (ch, _), r in zip(cases, res) if r['ok']])
      cases = [(ch, [(160, 160)]) for ch in LET]; res = score_all(cases); print('single dot: pass', sum(r['ok'] for r in res))
      cases = [(ch, line((40, 40), (280, 280))) for ch in LET]; res = score_all(cases); print('diagonal line: pass', sum(r['ok'] for r in res), [ch for (ch, _), r in zip(cases, res) if r['ok']])
      cases = []
      for ch in LET:
          sk, pts = SK[ch]; xs = np.median(pts[:, 0]); cases.append((ch, thin([tuple(q) for q in pts if q[0] < xs])))
      res = score_all(cases); print('only left half traced: pass', sum(r['ok'] for r in res), [ch for (ch, _), r in zip(cases, res) if r['ok']])
      cases = []
      for ch in LET:
          sk, pts = SK[ch]; cases.append((ch, thin([(160 + (x - 160) * 1.5, 160 + (y - 160) * 1.5) for x, y in pts])))
      res = score_all(cases); print('letter drawn 50%% too big: pass', sum(r['ok'] for r in res), [ch for (ch, _), r in zip(cases, res) if r['ok']])
      cases = []
      for ch in LET:
          sk, pts = SK[ch]; pp = order_path(pts); cases.append((ch, thin(pp) + thin(pp[::-1]) + thin(pp) + thin(pp[::-1]) + thin(pp) + thin(pp[::-1])))
      res = score_all(cases); print('same line drawn 6 times (overdraw): pass', sum(r['ok'] for r in res), 'reasons', {w: sum(1 for r in res if r['why'] == w) for w in set(r['why'] for r in res)}, [ch for (ch, _), r in zip(cases, res) if r['ok']])
    b.close()
