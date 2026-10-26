# 🎒 Kids Academy

Small interactive lessons for children: **reading, writing, maths, English, German and coding**.
Plain HTML, CSS and JavaScript. No accounts, no tracking, no network calls. It works offline once opened.

## How it works

- Open `index.html` (or the GitHub Pages link). Add a child (name, avatar, age group, app language).
- Each child has their own progress, saved **only in that browser** (`localStorage`). Nothing about a child is stored in this repo.
- Stars count **first tries only**. A wrong tap shows the right answer but does not earn the star.
- Parents area (behind a small sum): save or load a backup file, reset or delete a child.
- `super_reader_90_day_academy.html` (your original page) is linked from the start page and is not changed by this project.

## Folders

```text
index.html, sound.html     start page; sound help and tests for the phone
shared/core.js             profiles, progress, translations (EN/DE), sound engine, exercise engine
shared/lang.js             engine used by the English and German subjects
shared/sound.js            the sound help page
shared/audio-en.js, audio-de.js   recorded fallback voice (generated, see tools/)
shared/app.css, hub.js     look and start page
subjects/<subject>/        index.html + data.js (content) + app.js (screens)
subjects/writing/trace.js  the tracing score (tested separately)
tests/validate.mjs         content and logic checks      node tests/validate.mjs
tests/e2e_*.py             browser tests                  see "Tests" below
tools/                     scripts that build the clips and the offline file list
sw.js, manifest.webmanifest, icons/   offline use and "add to home screen"
```

## Sound: how it is meant to work on every phone

1. **The phone's own voice** (best quality). Sound is unlocked on the first tap, because phones only allow it after a tap.
2. **Watchdog.** If the phone accepts the request but nothing starts within about 3 seconds, the app switches to
3. **recorded clips** (`shared/audio-en.js`, `audio-de.js`: a simple robotic voice, about 1.4 MB each, loaded only when needed) and tells the parent with a calm notice.
4. **Sound help** (`sound.html`, linked from the start page and from every notice): test buttons, what the phone can do, a choice between *Automatic*, *Phone voice only* and *Recorded voice only*, and copy-able details.

The speaker button in a lesson turns automatic sounds off (beeps and automatic reading aloud). The 🔊 *Listen* buttons always work.

## Coding: how a level explains itself

- **Mission card** above the board: a short instruction for this level, plus a checklist (`⭐ Walk over every star: 0 / 3` and `🏁 Stop on the flag`). It exists before the robot moves, so the child knows a star must be collected.
- **Live feedback while running:** the command being executed is highlighted, the star counter ticks up, visited squares get a dot.
- **Specific feedback after a failed run:** the command that crashed turns **red** (also inside a repeat block); skipped stars get an **orange ring**; the message says what was missed ("You reached the flag, but you skipped 1 star").
- **Hints:** 💡 Hint shows a plan in words; *Show the answer* shows the commands and limits the stars for that level to 1 (stars already earned are never taken away).
- **🔊 Listen** reads the mission aloud (words, not emoji). The recorded fallback voice covers these texts too.
- Texts use tokens such as `{star}` and `{F}`. `fmt()` turns them into emoji for the screen and words for the voice. Keep the intro, the hint plan and the board in step: `tests/validate.mjs` checks that an intro mentions stars exactly when the level has stars, and that the hint answer really solves the level.

## Tracing: what is checked

`subjects/writing/trace.js` scores the line a child draws over the grey letter:

- **coverage:** how much of the letter was covered (at least 78 %)
- **accuracy:** how much of the line stayed on or very near the letter (at least 86 %), and **no long stretch away from the letter**.
  That second part is what stops a "C" being closed into an "O": the line across the gap is a long stretch off the letter.
- **overdraw:** the line was drawn about once, not scribbled back and forth.

When a trace is rejected the page paints the missed parts **orange** and the off-letter parts **red**, so the child can see what to fix.
The limits are in one place (`P` at the top of `trace.js`). Stroke order and direction are not checked.

## Tests

```bash
node tests/validate.mjs                 # content, maths, robot levels, tracing logic, clips for every phrase, file list
python3 -m http.server 8765 &           # then, with  pip install playwright scikit-image scipy :
python3 tests/e2e_sound.py              # phone voice works / silent / blocked / missing, recorded voice, sound page
python3 tests/e2e_trace.py              # tracing in a real canvas, with mouse and with a finger
python3 tests/e2e_coding.py             # coding screen: mission, checklist, error feedback, hints, German, phone
python3 tests/e2e_flows.py              # hub, every subject answered, first-try scoring, picture look-alikes
python3 tests/e2e_layout.py             # offline, fresh files after an update, phone layout, untranslated text
```

`tools/calibrate_trace.py` measures the tracing limits against simulated shaky children (it needs the same packages).

## Add or change content

1. Edit the subject's `data.js` (or `gen.js` for maths, `levels.js` for coding).
2. Run `node tests/validate.mjs`. It fails if a reading word uses a sound that has not been taught yet, if a maths answer is wrong, if a robot level cannot be solved, or if a spoken phrase has no recorded clip.
3. New or changed spoken phrases: `node tools/collect_speech.mjs > /tmp/speech.json && python3 tools/make_clips.py` (needs `espeak-ng` and `ffmpeg`).
4. Run `python3 tools/make_sw.py v3` (change the number each time) so phones pick up the new version, then upload.

New subject: copy a folder in `subjects/`, add it to `SUBJECTS` in `shared/core.js` (with its unit count), run `tools/make_sw.py`.

## Publish with GitHub Pages

Settings → Pages → Deploy from a branch → `main` / root. The link is `https://<user>.github.io/kids-academy/`.
On a free GitHub account the repository must be **public**. Never add names, photos or progress files to it.
After an update, open the app on the phone once or twice: the first load may still show the old version.

## Honest limits

- **Voices** come from the child's device. The recorded fallback voice is simple and robotic. Voices say letter *names*, so the reading sounds use example words (`sh` → "ship") instead.
- **Tracing limits were tuned on simulated children, not real ones.** Letters that look alike (for example D and O, or a, e, s) can still be accepted for each other. If real children fail too often, loosen `ACC_MIN` / `COV_MIN` / `RUN_MAX` / `DEV_MAX` in `trace.js`.
- **German reading order** follows common phonics sequences, not one specific school primer. Compare it with your school's book.
- **Emoji** are drawn by the device's own font. Very old phones may show empty boxes.
- **The parent sum** keeps small children out of the settings. It is not security.
- These are practice activities. A grown-up listening to the child read aloud is worth more than any app.
