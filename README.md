# Pantheon Sorter

A 28-statement test for the Pantheon Typology: fourteen Greek gods at the two ends of seven polarities. It names a lead god, a second god and the god you neglect, and shows a tag cloud and a few paragraphs for each.

It is a static site with no build step and no dependencies. Everything a person answers stays in their browser.

**Status: provisional.** The statements have not been tested on a sample, so every cut-off in `config/scoring.json` is a placeholder.

## Run it

```sh
npm start          # serves the folder at http://localhost:8000 (python3 -m http.server)
npm run check      # validates config against content, then runs the scoring tests
```

Open it through a server, not by double-clicking `index.html`: browsers refuse to load the data files from `file://`.

## Put it on GitHub Pages

1. Push this folder to a repository.
2. In the repository, open Settings, then Pages. Under "Build and deployment" choose "Deploy from a branch", then `main` and `/ (root)`.

The site works from any path, so a project page such as `https://<user>.github.io/<repo>/` needs no changes. The empty `.nojekyll` file tells Pages to serve the files as they are. `.github/workflows/check.yml` runs `npm run check` on every push.

## What lives where

```
config/            structure and rules, no prose
  model.json         the gods and which two face each other
  items.json         which statements exist and which god each counts toward
  scoring.json       answer scale, bands, tier rules, minimum paragraphs, norms
  app.json           statement order, page size, result-page sections, feature switches
content/en/        every word a visitor reads, one folder per language
  items.json         the statements
  gods.json          names, Greek names, pole words, gift, wrath, sources
  polarities.json    the question each polarity asks
  tags.json          the tag clouds
  snippets.json      the result paragraphs
  ui.json            buttons, headings, labels
css/
  theme.css          colours, typefaces, measures, and one colour per god (the only file to edit for a new look)
  fonts.css          the self-hosted typefaces
  app.css            layout and components
img/
  meander.svg        one repeat of the Greek key, used as a mask for every border
js/
  scoring.js         the numbers: order, scores, bands, type            (pure, tested)
  report.js          the words: which paragraphs a result shows         (pure, tested)
  validate.js        checks that config and content agree               (pure)
  model.js, data.js, text.js, store.js, dom.js    small helpers
  art/               the drawings: emblems.js (one sign per god), ornament.js (temple, meander ring)
  components/        emblem, tag cloud, polarity bar, wheel
  views/             the four pages; result-sections.js holds the result page's blocks
tests/, tools/     the test suite and the validator
```

## What to change, and where

| To change | Edit |
| --- | --- |
| The wording of a statement | `content/en/items.json` |
| The number of statements | `config/items.json` (add ids, bump `version`) and the wording file. Any number per god works. |
| A statement that counts against its god | add `"reverse": true` to it in `config/items.json` |
| The answer scale, for example seven points | `scale` in `config/scoring.json`, and the labels in `quiz.scale` and `quiz.scaleSpoken` in `ui.json` |
| The cut-offs, or how many bands there are | `bands` in `config/scoring.json`, then a paragraph per god for each band with `describe: true` in `snippets.json`, and a label in `result.band` in `ui.json` |
| What counts as a lead, a clear lead, a second god | `tiers` in `config/scoring.json` |
| The fewest paragraphs anyone sees | `result.minParagraphs` in `config/scoring.json` |
| Any result paragraph | `content/en/snippets.json` |
| A tag cloud | `content/en/tags.json` |
| The gods or the pairings | `config/model.json`, then matching entries in every content file |
| The order of statements | `itemOrder` and `orderSeed` in `config/app.json`; add a strategy to `orderStrategies` in `js/scoring.js` |
| Statements per page | `itemsPerPage` in `config/app.json` (`0` for one long page) |
| The blocks of the result page and their order | `resultSections` in `config/app.json`; add a block as a function in `js/views/result-sections.js` |
| Saving progress, result links, the gods page | `features` in `config/app.json` |
| Colours and typefaces | `css/theme.css` and `css/fonts.css` |
| A god's colour | the `[data-god='…']` lines in `css/theme.css`: one colour for the light page, one for the dark |
| A god's emblem | its drawing in `js/art/emblems.js` (a 48 by 48 box, stroked in `currentColor`) |
| A god's epithet and list of emblems | `epithet` and `symbols` in `content/en/gods.json` |
| The scoring method itself | `js/scoring.js`; the views only read its output |

After any change to `config/` or `content/`, run `npm run check`. The validator names the file and the entry that no longer lines up.

## How it looks

The look is painted pottery: a cream page, black words, terracotta ornament, and a dark scheme that turns the same colours round. All of the artwork is drawn in code or kept as small SVG files in this repository, so nothing is fetched from elsewhere.

- **Each god has a colour and an emblem.** Any element with `data-god="<id>"` takes that god's colour through the `--god` token. The emblem is a single sign on a disc: the thunderbolt for Zeus, the owl for Athena, the trident for Poseidon and so on. A hollow disc marks a god who is not pulling, or the one neglected.
- **The wheel** is drawn like the inside of a cup, with a meander round the rim and the fourteen discs on the edge. On the result page it carries the seven points of the result: one on each line, further from the centre the stronger the pull, in the colour of the god it leans to. The strongest is ringed.
- **The result page** takes the lead god's colour in its header, with the emblem in a laurel wreath. Every block about a god (lead, second, neglected) is ruled, titled and tagged in that god's colour, and each polarity bar fills in the colour of the god it leans to.
- **Tag clouds** set a god's own images (tone `emblem`) in the display face and the god's colour, so the thunderbolt reads as Zeus's and the vine as Dionysus's.

A new god needs a line in `css/theme.css` and a drawing in `js/art/emblems.js`; without them the god gets the terracotta accent and a plain disc.

## How a result is worked out

1. **Polarity score.** Mean rating of the first god's statements minus the mean of the second god's, divided by the width of the scale. It runs from -1 to +1. With two statements per god on a 0 to 4 scale, one raw point is 0.125.
2. **Band.** The size of the score, whichever god it points to:

   | Band | From | Raw points out of 8 | Paragraph shown |
   | --- | --- | --- | --- |
   | balanced | 0 | 0 to 1 | no |
   | lean | 0.25 | 2 to 3 | yes |
   | clear | 0.5 | 4 to 5 | yes |
   | strong | 0.75 | 6 to 8 | yes |

3. **Type.** The strongest pole is the lead if it reaches `tiers.poleFrom` (0.5). The lead is clear if it beats the next pole by `tiers.clearLeadGap` (0.25) and shared otherwise. If no pole reaches 0.5 the result is Pantheios. The neglected god is the one opposite the lead. Ties go to the polarity listed first in `config/model.json`.
4. **Paragraphs.** An opening paragraph for the tier, one each for the lead, the second and the neglected god, then one for every other polarity outside the balanced band. If that comes to fewer than `result.minParagraphs`, the strongest remaining leanings are described with the `fallbackBand` paragraph. `tests/scoring.test.mjs` walks all 823,543 combinations of bands and confirms that none falls below the minimum.

In a simulation of 50,000 plausible answer sets (statements loading 0.7 on their polarity), 36% came out with a clear lead, 53% with a shared lead and 10% as Pantheios, and people saw between 3 and 10 paragraphs, most often 6 or 7. That is a property of the cut-offs under one assumed model, not a finding about real respondents.

## When there are norms

Once the test has been given to a sample, put each polarity's mean and standard deviation into `norms` in `config/scoring.json`:

```json
"norms": { "rule": { "mean": 0.04, "sd": 0.31 }, "range": { "mean": -0.02, "sd": 0.28 } }
```

Scores then become standard scores, so restate `bands` and `tiers` in SD units (the typology's own rule is a pole at 1 SD and a clear lead at 0.5 SD ahead) and set `displayMax` to the widest score the bars should show, for example `2.5`.

## Add a language

1. Copy `content/en/` to `content/<code>/` and translate the files. A file you leave out falls back to the default language.
2. Add the code to `locales` in `config/app.json`.
3. Open the site with `?lang=<code>`.

GFS Didot has no Latin Extended glyphs, so letters such as ğ, ş and İ in headings fall back to the next display face. Commissioner, the text face, covers them.

## Privacy

The page loads only its own files: no analytics, no third-party fonts, no cookies. Answers are kept in the browser's local storage so that a visit can be resumed, and are removed by "Retake the test". A result link carries the answers in its address, so anyone given the link can see them.

## Typefaces and licence

GFS Didot (Greek Font Society) and Commissioner (Kostas Bartsokas) are bundled under the SIL Open Font License; the licence texts are in `fonts/`. No licence has been chosen yet for the code and the content of this repository.
