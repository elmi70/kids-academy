"""Shared helpers for the browser tests. Serve the repo first:  python3 -m http.server 8765   (from the repo root)
   Needs: pip install playwright   and a Chromium (set CHROME=/path/to/chrome if it is not found automatically)."""
import json, os, sys
from playwright.sync_api import sync_playwright
EXE = os.environ.get('CHROME', '/opt/pw-browsers/chromium_headless_shell-1228/chrome-headless-shell-linux64/chrome-headless-shell')
BASE = os.environ.get('BASE', 'http://localhost:8765/')
fails, errs = [], []

def check(c, m):
    print(('ok   ' if c else 'FAIL ') + m); sys.stdout.flush()
    if not c: fails.append(m)

def launch(p):
    kw = {'args': ['--no-sandbox']}
    if EXE and os.path.exists(EXE): kw['executable_path'] = EXE
    return p.chromium.launch(**kw)

PROFILE = {'v': 1, 'current': 'c1', 'settings': {'sound': True}, 'profiles': {'c1': {'id': 'c1', 'name': 'Lena', 'avatar': '🦄', 'band': '67', 'ui': 'en', 'progress': {}}}}
def seed(pg, ui='en', extra=None):
    d = json.loads(json.dumps(PROFILE)); d['profiles']['c1']['ui'] = ui
    if extra: d['settings'].update(extra)
    pg.goto(BASE + 'sound.html'); pg.evaluate("(d) => localStorage.setItem('ka.v1', JSON.stringify(d))", d)

def watch(pg):
    pg.on('pageerror', lambda e: errs.append('pageerror: ' + str(e)))
    pg.on('console', lambda m: errs.append('console.' + m.type + ': ' + m.text) if m.type == 'error' else None)

# ---- speech engine stubs (the headless browser has no real voices) ----
BASE_STUB = """
window.__calls = []; window.__spoken = []; window.__gesture = false;
document.addEventListener('click', () => { window.__gesture = true; }, true);
document.addEventListener('touchend', () => { window.__gesture = true; }, true);
const mkSynth = (mode) => ({
  speaking: false, pending: false, paused: false,
  speak(u) {
    window.__calls.push('speak:' + u.text + ':v' + u.volume);
    if (u.text.trim()) window.__spoken.push(u.text);
    if (mode === 'silent') return;                                         // the phone accepts the call but never makes a sound
    if (mode === 'blocked' && !window.__gesture) { setTimeout(() => u.onerror && u.onerror({ error: 'not-allowed' }), 10); return; }
    this.speaking = true;
    setTimeout(() => { u.onstart && u.onstart({}); setTimeout(() => { this.speaking = false; u.onend && u.onend({}); }, 250); }, 20);
  },
  cancel() { window.__calls.push('cancel'); this.speaking = false; },
  resume() { window.__calls.push('resume'); },
  getVoices() { return VOICES; }, addEventListener() {}
});
"""
def stub(mode, voices="[{lang:'en-GB',name:'English UK',localService:true},{lang:'de-DE',name:'Deutsch',localService:true}]"):
    if mode == 'none':
        return "window.__calls=[];window.__spoken=[];Object.defineProperty(window,'speechSynthesis',{value:undefined,configurable:true});Object.defineProperty(window,'SpeechSynthesisUtterance',{value:undefined,configurable:true});"
    return "const VOICES = %s;\n%s\nObject.defineProperty(window,'speechSynthesis',{value:mkSynth('%s'),configurable:true});Object.defineProperty(window,'SpeechSynthesisUtterance',{value:function(t){this.text=t;this.volume=1},configurable:true,writable:true});" % (voices, BASE_STUB, mode)

def finish():
    print('console/page errors:', errs); print('FAILS:', fails)
    sys.exit(1 if fails or errs else 0)
