# Hebrew transliteration trainer

A browser drill for transliterating Hebrew, using the system in C. L. Seow's
*A Grammar for Biblical Hebrew* (Abingdon, 1995). It starts you with a single
character and unlocks the rest one at a time as you learn them.

React + [Mantine](https://mantine.dev), built with Vite.

## Running it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # static site into dist/
npm run preview  # serve the built output
```

### Node version

Node 18, 20 or 22+ all work; there's a `.nvmrc` pinning 22 if you use nvm.

The toolchain is deliberately on **Vite 6** rather than Vite 8. Vite 7 and 8
bundle Rolldown, which imports `styleText` from `node:util` — an API that only
landed in Node 20.12 — so they require Node 20.19+ or 22.12+ and fail at startup
on anything older with:

```
SyntaxError: The requested module 'node:util' does not provide an export named 'styleText'
```

Vite 6 declares `^18.0.0 || ^20.0.0 || >=22.0.0` and has none of that
constraint. If you're on a current Node and would rather be on Vite 8, bump
`vite` and `@vitejs/plugin-react` in `package.json`; nothing in the source
depends on the version.

## Deploying to GitHub Pages

`.github/workflows/deploy.yml` builds the site and publishes it on every push to
`main`. To turn it on:

1. Push this repository to GitHub.
2. Open **Settings → Pages** and set **Source** to **GitHub Actions**.
3. Push to `main`. The workflow builds and deploys; the URL appears in the
   Actions run and under Settings → Pages.

If your default branch isn't `main`, change the branch name in the workflow.

`vite.config.js` sets `base: "./"` so asset paths stay relative. That means the
build works both at a user-page root and at a project-page subpath
(`username.github.io/repo/`) without further configuration.

> This is a build step, not a folder of static files. Opening `index.html`
> from disk will not work, and neither will committing the source to a branch
> and serving it directly — Pages has to run the build, which is what the
> workflow does.

## Troubleshooting

**`does not provide an export named 'styleText'`** — your Node is older than
20.12 and something pulled in Vite 7 or 8. Either run `nvm use` to pick up the
pinned version, or check that `package.json` still has `vite: ^6`.

**Blank page after deploying** — check that Settings → Pages has **Source** set
to **GitHub Actions**, not "Deploy from a branch". Serving the repository
directly gives you the unbuilt source and a blank `<div id="root">`.

**Fonts look wrong, or transliteration shows boxes** — the Google Fonts request
was blocked. See the typography note at the end of this file for how to vendor
the three faces locally.

## How the progression works

Every character carries a confidence score. Correct answers raise it — more if
you answer quickly, since fast recall is a different thing from working it out —
and wrong answers knock it down. When the newest character is solid and the
rotation as a whole is steady, the next one unlocks and is introduced with its
answer shown. Which card you get is weighted toward whatever you are weakest on.

The order is deliberately not alphabetical. Look-alikes are kept apart so you
are never learning two at once: resh arrives at 8 and dalet at 19, he at 13 and
ḥet at 27, vav at 16 and zayin at 34. Vowel points are interleaved with
consonants rather than taught as a block.

Once ten characters are in rotation, words start appearing — but only words
spelled entirely from characters you have unlocked. *Shemesh* becomes readable
around unlock 9, *shalom* at 17, and all fifty by the end.

After every answer the reveal panel shows the character's **name** as the
largest element, since the glyph and its transliteration are already in front of
you and the name is the part that needs drilling. The four most recent
characters stay visible below the card with their names attached.

Progress is kept in `localStorage`: one browser, one device, nothing sent
anywhere. **Start over** in the progress panel clears it.

## The transliteration system

**Everyday** is loose romanization (*shalom*, *melekh*, *chesed*). **Seow**
follows the grammar mark for mark:

- Soft begadkefat underlined — `ḇ ḏ ḵ ṯ` — with `ḡ` and `p̄` overlined instead,
  because those letters descend below the line. Hard forms are bare.
- Four vowel classes: short unmarked (`a e i o u`), long with a macron
  (`ā ē ī ō ū`), reduced with a breve (`ă ĕ ŏ`) plus `ə` for vocal shewa, and
  historic long with a circumflex (`â ê î ô û`).
- A final vowel-letter he in parentheses: `tôrā(h)`, `ʾiššā(h)`, `ḥoḵmā(h)`.
- Furtive patach as `a` in parentheses *before* the guttural: `rû(a)ḥ`.

**Forgiving** grading accepts unmarked answers (`h` for `ḥ`, `torah` for
`tôrā(h)`). **Exact marks** requires every diacritic and parenthesis.

Seow marks stress with an acute where it falls off the final syllable
(`méleḵ`); the trainer doesn't ask you to type it. To require it, add the
accents to the `a` values in `src/data.js`.

## Editing

| File | What's in it |
| --- | --- |
| `src/data.js` | The curriculum, the word list, the convention switches |
| `src/trainer.js` | Grading and progression — pure functions, no React |
| `src/App.jsx` | Layout, state, keyboard handling |
| `src/theme.js` | Mantine theme: colours, type, radius |
| `src/styles.css` | Only what Mantine can't express: the glyph, tiles, tape |
| `src/components/` | Answer reveal, progress grid, conventions panel |

Two conventions vary between editions, so they're switches at the top of
`src/data.js`:

```js
export const STYLE_OPTIONS = {
  shewa:   "\u0259",   // "ə" — set to "\u1D49" for a raised e
  finalHe: "paren"     // "paren" -> tôrā(h)  |  "circumflex" -> tôrâ
};
```

Beyond that: reorder the curriculum by moving a line in `CURRICULUM`; add a word
by copying a line in `WORDS`. Words surface automatically once every codepoint
in them is unlocked, so there's no other bookkeeping — but a word using a
character that no curriculum item lists in its `cov` array will never become
eligible.

Pacing lives in the constants at the top of `src/trainer.js`. Those numbers came
from simulating learners across a range of accuracies; an earlier version
required nearly every character to be solid at once, which walled out anyone
below about 85% accuracy and stopped them unlocking at around a dozen
characters. If you touch `MASTER_SCORE` or `slackFor`, re-check that a
struggling learner still moves forward.

## Typography

Three faces, because one can't do the job. **Montserrat** carries the interface.
**Frank Ruhl Libre** renders the Hebrew, which Montserrat has no glyphs for.
**Gentium Book Plus** sets the transliteration, because it covers marks like
`ḥ`, `ṣ` and `p̄` that most interface faces lack — a missing glyph there would
silently turn a correct answer into a box. All three load from Google Fonts; to
vendor them instead, drop the files into `public/`, add `@font-face` rules to
`src/styles.css`, and remove the `<link>` tags from `index.html`.
