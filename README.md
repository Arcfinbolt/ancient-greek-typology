# Pantheon Sorter

A 28-statement test for the Pantheon Typology: fourteen Greek gods at the two ends of seven polarities. It names a lead god, a second god and the god you neglect, and shows a statue, a tag cloud and a few paragraphs for each.

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
  app.json           statement order, page size, result-page sections, edition, feature switches
  plates.json        the statue and the painting of each god: file, size, credit
content/en/        every word a visitor reads, one folder per language
  items.json         the statements
  gods.json          names, Greek names, pole words, gift, wrath, sources
  polarities.json    the question each polarity asks
  tags.json          the tag clouds
  snippets.json      the result paragraphs
  plates.json        the title and caption under each statue and painting
  ui.json            buttons, headings, labels
css/
  theme.css          colours, typefaces, measures, and one colour per god (the only file to edit for a new look)
  fonts.css          the self-hosted typefaces
  app.css            layout and components
img/
  statues/           one black-and-white plate per god, with a half-size copy (-s)
  paintings/         one painting per god, with a half-size copy (-s)
  meander.svg        one repeat of the Greek key, used as a small ornament
js/
  scoring.js         the numbers: order, scores, bands, type            (pure, tested)
  report.js          the words: which paragraphs a result shows         (pure, tested)
  validate.js        checks that config and content agree               (pure)
  model.js, data.js, text.js, store.js, dom.js    small helpers
  art/               emblems.js: one drawn sign per god
  components/        plate, emblem, tag cloud, polarity bar, wheel
  views/             the five pages; result-sections.js holds the result page's blocks
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
| A god's sign | its drawing in `js/art/emblems.js` (a 48 by 48 box, stroked in `currentColor`) |
| A god's statue or painting | replace the files in `img/statues/` or `img/paintings/`, then the entry in `config/plates.json` (size, credit) and the caption in `content/en/plates.json` |
| Statues only, or statues and paintings | `edition` in `config/app.json` (`marble` or `paint`); `editions` lists what the switch in the footer offers |
| A god's epithet and list of emblems | `epithet` and `symbols` in `content/en/gods.json` |
| The scoring method itself | `js/scoring.js`; the views only read its output |

After any change to `config/` or `content/`, run `npm run check`. The validator names the file and the entry that no longer lines up.

## How it looks

The look is a sculpture gallery: a page the colour of marble by day and of the unlit room by night, near-black type, hairline rules and one quiet bronze. The pictures carry the feeling, so everything else stays out of their way.

- **Plates.** Every god has a statue, shown in black and white and cropped to a head-and-shoulders plate, and a painting, shown in colour. Each has a title and a caption, and every source is listed on the credits page (`#credits`).
- **Two editions.** `marble` shows statues only. `paint` adds the painting of each god beside the reading and on the gods page, and puts two paintings among the three plates on the opening page. A visitor switches between them in the footer; `?plates=marble` or `?plates=paint` in the address sets it for a link.
- **Each god has a colour and a sign.** Any element with `data-god="<id>"` takes that god's colour through the `--god` token. It is used for thin rules, small labels and the points on the wheel, never for large areas. The sign is a fine line drawing in a ring: the thunderbolt for Zeus, the owl for Athena, the trident for Poseidon and so on.
- **The wheel.** A ring runs round the outside and carries the fourteen signs. On the result page it also carries the seven points of the result: one on each line, further from the centre the stronger the pull, in the colour of the god it leans to. The strongest god's cell is filled and its point is ringed; the dotted circles mark where the bands of `config/scoring.json` begin.
- **The result page** opens with the name of the result set very large beside the lead god's statue (both statues for a shared lead). Each god's chapter is ruled, titled and tagged in that god's colour, and each polarity bar fills in the colour of the god it leans to.
- **Tag clouds** set a god's own images (tone `emblem`) in the display face and the god's colour.

A new god needs a line in `css/theme.css`, a drawing in `js/art/emblems.js`, and a statue and a painting in `config/plates.json`.

### Where the pictures come from

All of them are from Wikimedia Commons. The statues are public domain or CC0 photographs. The paintings are in the public domain; two of the photographs of them carry a Creative Commons licence (CC BY 3.0 and CC BY-SA 4.0) and are credited, with a link to the licence, on the credits page. `config/plates.json` holds the photographer, licence and source link for every file.

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

The page loads only its own files: no analytics, no third-party fonts, no cookies. Answers are kept in the browser's local storage so that a visit can be resumed, and are removed by "Retake the test". The choice of edition is kept the same way. A result link carries the answers in its address, so anyone given the link can see them.

## Typefaces and licence

GFS Didot (Greek Font Society) and Commissioner (Kostas Bartsokas) are bundled under the SIL Open Font License; the licence texts are in `fonts/`. The pictures keep the licences listed in `config/plates.json`. No licence has been chosen yet for the code and the text of this repository.
