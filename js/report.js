// The words: decides which paragraphs a result shows.
// Pure: takes scores and content, returns plain data for the views to draw.

import { fill } from './text.js';

/** The paragraph for a god at a band, falling back to the next weaker described band. */
export function bandText(god, bandId, { content, scoring }) {
  const texts = content.snippets.bands[god] || {};
  const described = scoring.bands.filter((b) => b.describe);
  let i = described.findIndex((b) => b.id === bandId);
  if (i < 0) i = described.length - 1;
  for (; i >= 0; i--) {
    const text = texts[described[i].id];
    if (text) return text;
  }
  return null;
}

/**
 * profile: from scoreProfile(). type: from classify().
 * Returns everything the result page prints, with the paragraph count that
 * `result.minParagraphs` in config/scoring.json guarantees.
 */
export function buildReport(profile, type, data) {
  const { content, scoring } = data;
  const ui = content.ui.result;
  const name = (god) => content.gods[god].name;
  const pole = (god) => content.gods[god].pole;

  const vars = {};
  if (type.lead) {
    vars.lead = name(type.lead.god);
    vars.leadPole = pole(type.lead.god).toLowerCase();
  }
  if (type.second) {
    vars.second = name(type.second.god);
    vars.secondPole = pole(type.second.god).toLowerCase();
  }

  let code;
  let tierParagraphs;
  if (type.tier === 'pantheios') {
    code = ui.code.pantheios;
    tierParagraphs = [].concat(content.snippets.tiers.pantheios);
  } else if (type.tier === 'shared') {
    code = fill(ui.code.shared, vars);
    tierParagraphs = [fill(content.snippets.tiers.shared, vars)];
  } else if (type.second) {
    code = fill(ui.code.clear, vars);
    tierParagraphs = [fill(content.snippets.tiers.clear, vars)];
  } else {
    code = fill(ui.code.alone, vars);
    tierParagraphs = [fill(content.snippets.tiers.clearAlone, vars)];
  }

  const describe = (entry) => ({
    god: entry.god,
    band: entry.band.id,
    text: bandText(entry.god, entry.band.id, data),
  });

  const lead = type.lead ? describe(type.lead) : null;
  const second = type.second ? describe(type.second) : null;
  const neglected = type.neglected
    ? { god: type.neglected, text: content.snippets.neglected[type.neglected] || null }
    : null;

  const polarities = profile.polarities.map((p) => {
    const row = {
      id: p.id, first: p.first, second: p.second,
      score: p.score, strength: p.strength, god: p.god, band: p.band.id,
      status: 'balanced', text: null,
    };
    if (type.lead && p.id === type.lead.id) row.status = 'lead';
    else if (type.second && p.id === type.second.id) row.status = 'second';
    else if (p.god && p.band.describe) {
      row.status = 'described';
      row.text = bandText(p.god, p.band.id, data);
    }
    return row;
  });

  const count = () =>
    tierParagraphs.length +
    [lead, second, neglected].filter((x) => x && x.text).length +
    polarities.filter((r) => r.text).length;

  // Top up from the strongest undescribed leanings until the minimum is met.
  const min = scoring.result.minParagraphs;
  const spare = polarities
    .filter((r) => r.status === 'balanced' && r.god)
    .sort((a, b) => b.strength - a.strength);
  for (const row of spare) {
    if (count() >= min) break;
    const text = bandText(row.god, scoring.result.fallbackBand, data);
    if (text) {
      row.status = 'leaning';
      row.text = text;
    }
  }

  return { tier: type.tier, code, tierParagraphs, lead, second, neglected, polarities, paragraphs: count() };
}
