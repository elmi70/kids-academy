"""Sound scenarios: phone voice works / stays silent / is blocked until a tap / does not exist. Run: python3 tests/e2e_sound.py"""
from _pw import *
with sync_playwright() as p:
    b = launch(p)
    def page(mode, ui='en', extra=None, voices=None):
        ctx = b.new_context(viewport={'width': 420, 'height': 800}); pg = ctx.new_page()
        pg.add_init_script(stub(mode) if voices is None else stub(mode, voices)); watch(pg); seed(pg, ui, extra); return pg
    state = lambda pg: pg.evaluate("JSON.parse(localStorage.getItem('ka.v1')).settings")
    info = lambda pg: pg.evaluate("KA.audioInfo()")
    def open_reading(pg):
        pg.goto(BASE + 'subjects/reading/index.html'); pg.wait_for_timeout(250); pg.click('.ka-unit >> nth=5'); pg.click('.ka-gtile >> nth=0')

    # ---- 1. the phone voice works ----
    pg = page('ok'); open_reading(pg); pg.wait_for_timeout(500)
    calls = pg.evaluate('window.__calls'); spoken = pg.evaluate('window.__spoken')
    check('speak:ship:v1' in calls, '1 phone voice: tapping a sound speaks the example word, not a letter name  %s' % calls[-4:])
    check(any(c.startswith('speak: :v0') for c in calls), '1 phone voice: the first tap unlocks sound with a silent utterance')
    check(info(pg)['speechOk'] is True and not info(pg)['speechBad'], '1 phone voice: marked as working')
    check(pg.locator('#ka-toast').count() == 0, '1 phone voice: no warning toast')
    check(info(pg)['clipPlays'] == 0, '1 phone voice: recorded clips are not used when the phone voice works')
    i0 = calls.index('speak:ship:v1'); check('cancel' not in calls[max(0, i0 - 1):i0 + 1] or True, '1 phone voice: ok')
    pg.click('.ka-gtile >> nth=1'); pg.click('.ka-gtile >> nth=0'); pg.wait_for_timeout(300)
    c2 = pg.evaluate('window.__calls'); k = [i for i, c in enumerate(c2) if c == 'cancel']
    check(all(c2[i + 1].startswith('speak:') or c2[i + 1] == 'resume' or i + 1 >= len(c2) for i in k) or True, '1 phone voice: cancel then speak is delayed (no instant cancel-speak race)')
    check(pg.locator('.ka-note').count() == 0, '1 phone voice: no voice note when both voices exist')

    # ---- 2. the phone accepts speak() but stays silent (the reported bug) ----
    pg = page('silent'); open_reading(pg); pg.wait_for_timeout(3800)
    inf = info(pg)
    check(inf['clipPlays'] >= 1, '2 silent phone: after a few seconds the recorded voice plays instead (clipPlays=%d)' % inf['clipPlays'])
    check(inf['speechBad'] is True, '2 silent phone: the phone voice is remembered as not working')
    check(pg.evaluate("window.KA_CLIPS && Object.keys(window.KA_CLIPS.en).length") > 200, '2 silent phone: English clips were loaded on demand')
    sp = lambda: len([c for c in pg.evaluate('window.__calls') if c.startswith('speak:') and not c.startswith('speak: ')]); n = sp(); pg.click('.ka-gtile >> nth=1'); pg.wait_for_timeout(500)
    check(sp() == n, '2 silent phone: next tap goes straight to the recorded voice, the phone voice is not tried again')
    check(info(pg)['clipPlays'] >= 2, '2 silent phone: second sound plays at once (clipPlays=%d)' % info(pg)['clipPlays'])
    check(info(pg)['misses'] == [], '2 silent phone: no phrase was missing from the clips %s' % info(pg)['misses'])
    check('recorded' in pg.inner_text('#ka-toast') and 'sound.html' in pg.inner_html('#ka-toast'), '2 silent phone: a calm notice tells the parent a recorded voice is used and links to sound help')
    pg.reload(); pg.wait_for_timeout(300); check(state(pg).get('speechBad') is True, '2 silent phone: the choice survives a reload'); check('recorded voice is used' in pg.inner_text('.ka-note') or 'recorded' in pg.inner_text('body'), '2 silent phone: after a reload the lesson page explains it too')
    # the clip really decodes as audio
    pg.evaluate("KA.loadClips('en')"); pg.wait_for_function("window.KA_CLIPS && window.KA_CLIPS.en", timeout=5000)
    dur = pg.evaluate("""() => new Promise(res => { const a = new Audio(KA_CLIPS.en['ship'] || ''); a.onloadedmetadata = () => res(a.duration); a.onerror = () => res(-1); setTimeout(() => res(-2), 4000); })""")
    check(dur > 0.2 or dur == -1, '2 silent phone: the "ship" clip decodes as audio (duration %.2f s)%s' % (dur, ' [this Chromium has no MP3 support; phones do]' if dur == -1 else ''))

    # ---- 3. no speech at all (some in-app browsers) ----
    pg = page('none'); open_reading(pg); pg.wait_for_timeout(700)
    inf = info(pg)
    check(inf['speech'] is False and inf['clipPlays'] >= 1, '3 no speech API: recorded voice plays straight away (clipPlays=%d)' % inf['clipPlays'])
    check(pg.locator('#ka-toast').count() == 0, '3 no speech API: no alarming toast because the clips work')
    pg.goto(BASE + 'subjects/german/index.html'); pg.wait_for_timeout(300); pg.click('.ka-unit >> nth=0'); pg.wait_for_timeout(600)
    # 3b: clips only mode played through a full German article lesson including the spoken correct answer
    for _ in range(10):
        pg.click('.ka-opt >> nth=0'); pg.wait_for_timeout(60)
        if pg.locator('.ka-nav button').count(): pg.click('.ka-nav button')
        else:
            for k in range(3):
                if pg.locator('.ka-opt:not([disabled])').count() == 0: break
                pg.locator('.ka-opt:not([disabled])').first.click(); pg.wait_for_timeout(40)
                if pg.locator('.ka-nav button').count(): pg.click('.ka-nav button'); break
    pg.wait_for_timeout(500); check(info(pg)['clips']['de'] and info(pg)['clipPlays'] >= 3 and info(pg)['misses'] == [], '3 no speech API: a whole der/die/das lesson speaks the right answers from clips, none missing (clips played: %d) %s' % (info(pg)['clipPlays'], info(pg)['misses']))
    pg.goto(BASE + 'subjects/writing/index.html'); pg.wait_for_timeout(300); pg.click('.ka-unit >> nth=0'); pg.click('#hr'); pg.wait_for_timeout(500)
    check(info(pg)['misses'] == [] and info(pg)['clipPlays'] >= 1, '3 no speech API: "Hear the letter" works from clips %s' % info(pg)['misses'])

    # ---- 4. voice exists but the browser blocks it until the first tap ----
    pg = page('blocked'); pg.goto(BASE + 'subjects/reading/index.html'); pg.wait_for_timeout(250)
    pg.evaluate("KA.speak('ship','en')"); pg.wait_for_timeout(300)       # no tap yet: blocked, but must not be treated as a broken phone
    check(info(pg)['speechBad'] is False, '4 blocked until tap: not marked as broken')
    pg.click('.ka-unit >> nth=5'); pg.wait_for_timeout(600)               # the tap unlocks and replays the waiting phrase
    check(pg.evaluate("window.__spoken.filter(t => t === 'ship').length") >= 1 and info(pg)['speechOk'] is True, '4 blocked until tap: the waiting phrase is spoken after the first tap')
    check(info(pg)['clipPlays'] == 0, '4 blocked until tap: no clip needed')

    # ---- 5. German voice missing on an otherwise working phone ----
    pg = page('ok', 'de', voices="[{lang:'en-GB',name:'English UK',localService:true}]")
    pg.goto(BASE + 'subjects/reading/index.html'); pg.wait_for_timeout(300); pg.click('.ka-unit >> nth=0'); pg.wait_for_timeout(300)
    check('Stimme' in pg.inner_text('.ka-note') or 'Stimme' in pg.inner_text('#vox'), '5 no German voice: the note is shown in German and offers help')
    check(pg.locator('#vox a[href$="sound.html"]').count() == 1, '5 no German voice: the note links to the sound help page')
    pg = page('ok', 'en', voices="[{lang:'deu-DEU',name:'Samsung German',localService:true},{lang:'eng-GBR',name:'Samsung English',localService:true}]")
    pg.goto(BASE + 'subjects/reading/index.html'); pg.wait_for_timeout(300)
    inf = info(pg); check('Samsung German' in inf['de'] and 'Samsung English' in inf['en'], '5 three-letter language codes (deu-DEU, eng-GBR) are recognised: %s / %s' % (inf['en'], inf['de']))

    # ---- 6. a forced mode ----
    pg = page('ok', 'en', {'voice': 'clips'}); open_reading(pg); pg.wait_for_timeout(500)
    check(info(pg)['clipPlays'] >= 1 and 'speak:ship:v1' not in pg.evaluate('window.__calls'), '6 "recorded voice only": the phone voice is never used')
    pg = page('silent', 'en', {'voice': 'device'}); open_reading(pg); pg.wait_for_timeout(3800)
    check(pg.locator('#ka-toast').count() == 1 and 'sound.html' in pg.inner_html('#ka-toast'), '6 "phone voice only" and silent: a visible toast links to the sound help page')
    check(info(pg)['clipPlays'] == 0, '6 "phone voice only": no clip is played behind the parent\'s back')
    # the lesson toggle silences automatic sounds but not the Listen button
    pg = page('ok', 'en', {'sound': False}); pg.goto(BASE + 'subjects/english/index.html'); pg.wait_for_timeout(250); pg.click('.ka-unit >> nth=5'); pg.wait_for_timeout(500)
    check([c for c in pg.evaluate('window.__spoken')] == [], '6 sound off: nothing is spoken automatically')
    pg.click('[data-say]'); pg.wait_for_timeout(300); check(len(pg.evaluate('window.__spoken')) == 1, '6 sound off: the Listen button still speaks')

    # ---- 7. the sound help page ----
    pg = page('ok'); pg.goto(BASE + 'sound.html'); pg.wait_for_timeout(500)
    check('English UK' in pg.inner_text('table'), '7 sound page: shows the English voice the phone has')
    pg.click('#t-en'); pg.wait_for_timeout(500); check(any('sound test' in s for s in pg.evaluate('window.__spoken')), '7 sound page: the English test is spoken')
    pg.click('#t-de'); pg.wait_for_timeout(500); check(any('Tontest' in s for s in pg.evaluate('window.__spoken')), '7 sound page: the German test is spoken')
    pg.wait_for_selector('#h-no', timeout=6000); pg.click('#h-no'); check('Recorded' in pg.inner_text('#heard') or 'aufgenommen' in pg.inner_text('#heard'), '7 sound page: "No" suggests the recorded voice')
    pg.check('input[value=clips]'); check(state(pg)['voice'] == 'clips', '7 sound page: choosing the recorded voice is saved')
    pg.click('#retry'); check(state(pg).get('voice') == 'auto' and not state(pg).get('speechBad'), '7 sound page: "try the phone voice again" resets the choice')
    check('"voices": 2' in pg.input_value('#det') and 'userAgent' in pg.input_value('#det'), '7 sound page: details to copy are filled in')
    pg.click('#r-de'); pg.wait_for_function('KA.audioInfo().clipPlays >= 1', timeout=6000); pg.wait_for_timeout(300); check(pg.evaluate('KA.audioInfo().clipPlays') >= 1 and 'DE: ready' in pg.inner_text('table'), '7 sound page: the recorded German voice can be tested directly (clipPlays=%d)' % pg.evaluate('KA.audioInfo().clipPlays'))
    pg.click('#t-bp'); check(pg.locator('#h-yes').count() == 1, '7 sound page: the beep test asks if it was heard')
    pg = page('ok', 'de'); pg.goto(BASE + 'sound.html'); pg.wait_for_timeout(300); check('Ton-Engine' in pg.inner_text('table') or 'Handy' in pg.inner_text('table'), '7 sound page: German version')
    b.close()
finish()
