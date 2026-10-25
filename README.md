# 🎒 Kids Academy

Small interactive lessons for children: **reading, writing, maths, English, German and coding**.
Plain HTML, CSS and JavaScript. No accounts, no tracking, no network calls. It works offline once opened.

## How it works

- Open `index.html` (or the GitHub Pages link). Add a child (name, avatar, age group, app language).
- Each child has their own progress, saved **only in that browser** (`localStorage`). Nothing is stored in this repo.
- Stars count **first tries only**. A wrong tap still teaches (the right answer is shown) but does not earn the star.
- Parents area (behind a small sum): save or load a backup file, reset or delete a child.
- Your original page, `super_reader_90_day_academy.html`, is untouched and linked from the start page.

## Folders

```text
index.html                 start page: child profiles and subject cards
shared/core.js             profiles, progress, translations (EN/DE), speech, exercise engine
shared/app.css             one look for everything
shared/lang.js             engine used by the English and German subjects
subjects/<subject>/        index.html + data.js (content) + app.js (screens)
tests/validate.mjs         checks the content and the logic          (node tests/validate.mjs)
tests/e2e_smoke.py         optional browser walk-through             (needs Playwright)
sw.js, manifest.webmanifest, icons/   offline use and "add to home screen"
```

## Subjects in this first version

| Subject | What is in it |
|---|---|
| Reading | 8 English and 8 German units: sounds, blending (digraphs stay together, `sh·i·p`), sentences, quiz. Every word only uses sounds taught so far, and the test enforces it. |
| Writing | Trace A–Z, a–z and Ä Ö Ü ß on a canvas (the page scores how well the line follows the letter), and spell words with letter tiles. |
| Maths | 13 levels from counting to division, generated fresh each time. Level starts at the child's age group. |
| English | Vocabulary, sight words, sentence building, a/an, plurals. |
| German | der/die/das by topic, colours, numbers, weekdays, sentence building. |
| Coding | 10 robot levels: forward and turns, then repeat loops. Shows the same program as Python text. |

## Add or change content

1. Edit the subject's `data.js` (or `gen.js` for maths, `levels.js` for coding).
2. Run `node tests/validate.mjs`. It fails if a reading word uses a sound that has not been taught yet, if a maths answer is wrong, if a coding level cannot be solved, or if a file is missing from `sw.js`.
3. If you changed any file, change `CACHE = 'kids-academy-v1'` in `sw.js` (for example to `v2`) so tablets pick up the new version.

New subject: copy a folder in `subjects/`, add it to `SUBJECTS` in `shared/core.js` (with its unit count), add its files to `sw.js`.

## Publish with GitHub Pages

Settings → Pages → Deploy from a branch → `main` / root. The link is `https://<user>.github.io/kids-academy/`.
On a free GitHub account the repository must be **public**. Never add names, photos or progress files to it.

## Honest limits

- **Voices** come from the child's device. If no German voice is installed, the page says so. Voices say letter *names*, so the reading sounds use example words (`sh` → "ship") instead.
- **Tracing** checks the shape, not the stroke order or direction. Show your child where to start.
- **German reading order** follows common phonics sequences, not one specific school primer. Compare it with your school's book.
- **Emoji** are drawn by the device's own emoji font. Very old devices may show empty boxes.
- **The parent sum** keeps small children out of the settings. It is not security.
- These are practice activities. A grown-up listening to the child read aloud is worth more than any app.
