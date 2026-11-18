// Checks that config and content agree with each other.
// Pure: returns a list of problems. Run by tools/validate.mjs and, in the
// browser, printed to the console when the test starts.

import { orderStrategies } from './scoring.js';

/** knownSections: the names js/views/result-sections.js defines, when the caller has them. */
export function validateData(data, { knownSections } = {}) {
  const problems = [];
  const say = (msg) => problems.push(msg);
  const { model, items, scoring, app, content, plates } = data;
  const godIds = model.godIds;

  // model
  if (new Set(godIds).size !== godIds.length) say('config/model.json: a god appears in more than one polarity.');
  if (new Set(model.polarities.map((p) => p.id)).size !== model.polarities.length) say('config/model.json: duplicate polarity id.');

  // items
  const seen = new Set();
  for (const item of items.items) {
    if (seen.has(item.id)) say(`config/items.json: duplicate item id "${item.id}".`);
    seen.add(item.id);
    if (!model.gods[item.god]) say(`config/items.json: item "${item.id}" counts toward unknown god "${item.god}".`);
    if (typeof content.items[item.id] !== 'string' || !content.items[item.id].trim()) say(`content items.json: no wording for item "${item.id}".`);
  }
  for (const id of Object.keys(content.items)) {
    if (!seen.has(id)) say(`content items.json: wording for "${id}", which config/items.json does not list.`);
  }
  for (const god of godIds) {
    if (!items.items.some((i) => i.god === god)) say(`config/items.json: no statement counts toward "${god}".`);
  }
  if (!items.version) say('config/items.json: `version` is missing.');

  // scoring
  const { scale, bands, tiers, result } = scoring;
  if (!(scale.max > scale.min)) say('config/scoring.json: scale.max must be greater than scale.min.');
  if (scale.max - scale.min > 35) say('config/scoring.json: scales wider than 36 points cannot be packed into result links.');
  if (!bands.length || bands[0].from !== 0) say('config/scoring.json: the first band must start at 0.');
  for (let i = 1; i < bands.length; i++) {
    if (!(bands[i].from > bands[i - 1].from)) say(`config/scoring.json: band "${bands[i].id}" must start above "${bands[i - 1].id}".`);
  }
  const described = bands.filter((b) => b.describe).map((b) => b.id);
  if (!described.length) say('config/scoring.json: no band has `describe: true`, so no paragraph can ever be shown.');
  if (!described.includes(result.fallbackBand)) say(`config/scoring.json: result.fallbackBand "${result.fallbackBand}" is not a described band.`);
  for (const key of ['poleFrom', 'clearLeadGap', 'secondFrom']) {
    if (typeof tiers[key] !== 'number') say(`config/scoring.json: tiers.${key} must be a number.`);
  }
  if (scoring.norms) {
    for (const p of model.polarities) {
      const n = scoring.norms[p.id];
      if (!n || typeof n.mean !== 'number' || !(n.sd > 0)) say(`config/scoring.json: norms need { mean, sd } for polarity "${p.id}".`);
    }
  }

  // content: gods, polarities, tags, snippets
  for (const god of godIds) {
    const g = content.gods[god];
    if (!g) { say(`content gods.json: no entry for "${god}".`); continue; }
    for (const key of ['name', 'pole']) if (!g[key]) say(`content gods.json: "${god}" has no ${key}.`);

    const tags = content.tags[god];
    if (!Array.isArray(tags) || !tags.length) say(`content tags.json: no tag cloud for "${god}".`);
    else for (const t of tags) {
      if (!t.tag || !(t.weight >= 1 && t.weight <= 5)) say(`content tags.json: "${god}" has a tag without text or with a weight outside 1-5.`);
      if (!['gift', 'wrath', 'emblem'].includes(t.tone)) say(`content tags.json: "${god}" tag "${t.tag}" has unknown tone "${t.tone}".`);
    }

    const texts = content.snippets.bands[god] || {};
    if (!texts[described[0]]) say(`content snippets.json: "${god}" has no paragraph for the weakest described band "${described[0]}".`);
    for (const key of Object.keys(texts)) if (!described.includes(key)) say(`content snippets.json: "${god}" has a paragraph for "${key}", which is not a described band.`);
    if (!content.snippets.neglected[god]) say(`content snippets.json: no neglected-god paragraph for "${god}".`);
  }
  for (const p of model.polarities) {
    if (!content.polarities[p.id] || !content.polarities[p.id].question) say(`content polarities.json: no question for polarity "${p.id}".`);
  }
  for (const key of ['clear', 'clearAlone', 'shared', 'pantheios']) {
    if (!content.snippets.tiers[key]) say(`content snippets.json: tiers.${key} is missing.`);
  }
  const pantheios = [].concat(content.snippets.tiers.pantheios || []);
  if (pantheios.length < result.minParagraphs) {
    say(`content snippets.json: tiers.pantheios has ${pantheios.length} paragraphs, fewer than result.minParagraphs (${result.minParagraphs}).`);
  }

  // interface strings
  const points = scale.max - scale.min + 1;
  for (const key of ['scale', 'scaleSpoken']) {
    if ((content.ui.quiz[key] || []).length !== points) say(`content ui.json: quiz.${key} needs ${points} labels, one per scale point.`);
  }
  for (const b of bands) if (!content.ui.result.band[b.id]) say(`content ui.json: result.band has no label for band "${b.id}".`);

  // plates: every god has a statue and a painting, each with a file, a size and a title
  for (const set of ['statues', 'paintings']) {
    for (const god of godIds) {
      const file = plates && plates[set] && plates[set][god];
      if (!file) { say(`config/plates.json: no ${set} entry for "${god}".`); continue; }
      if (!file.file || !Array.isArray(file.size) || file.size.length !== 2) say(`config/plates.json: ${set}.${god} needs a file and a [width, height] size.`);
      for (const key of ['author', 'licence', 'source']) if (!file[key]) say(`config/plates.json: ${set}.${god} has no ${key}, which the credits page needs.`);
      const words = content.plates && content.plates[set] && content.plates[set][god];
      if (!words || !words.title) say(`content plates.json: no title for ${set}.${god}.`);
    }
  }
  for (const [edition, gods] of Object.entries((plates && plates.hero) || {})) {
    for (const god of gods) if (!model.gods[god]) say(`config/plates.json: hero.${edition} names unknown god "${god}".`);
  }
  const editions = app.editions || [];
  if (!editions.includes(app.edition)) say('config/app.json: edition is not listed in editions.');
  for (const name of editions) {
    if (!['marble', 'paint'].includes(name)) say(`config/app.json: unknown edition "${name}"; the editions are marble and paint.`);
    if (!content.ui.app.editions || !content.ui.app.editions[name]) say(`content ui.json: app.editions has no label for "${name}".`);
  }

  // presentation
  if (!app.locales.includes(app.defaultLocale)) say('config/app.json: defaultLocale is not listed in locales.');
  if (!orderStrategies[app.itemOrder]) say(`config/app.json: itemOrder "${app.itemOrder}" is not one of ${Object.keys(orderStrategies).join(', ')}.`);
  if (knownSections) {
    for (const s of app.resultSections) {
      if (!knownSections.includes(s)) say(`config/app.json: resultSections names "${s}", which js/views/result-sections.js does not define.`);
    }
  }

  return problems;
}
