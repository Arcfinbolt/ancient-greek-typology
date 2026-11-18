// Run: npm test
// Checks the scoring rules against the shipped config, so a change to
// config/scoring.json that breaks an expectation here is a deliberate one.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadFromDisk } from '../tools/load.mjs';
import { validateData } from '../js/validate.js';
import { orderItems, scoreProfile, classify, bandFor, encodeAnswers, decodeAnswers } from '../js/scoring.js';
import { buildReport } from '../js/report.js';
import { sectionNames } from '../js/views/result-sections.js';

const data = loadFromDisk();
const input = { items: data.items.items, model: data.model, scoring: data.scoring };
const { min, max } = data.scoring.scale;
const mid = (min + max) / 2;

/** Answers that give each polarity the raw difference asked for (first god minus second). */
function answersFor(diffs) {
  const answers = {};
  for (const p of data.model.polarities) {
    const d = diffs[p.id] ?? 0;
    const spread = (god, total) => {
      const own = data.items.items.filter((i) => i.god === god);
      let left = total;
      for (const item of own) {
        const v = Math.min(max - min, left);
        answers[item.id] = min + v;
        left -= v;
      }
    };
    spread(p.first, Math.max(d, 0));
    spread(p.second, Math.max(-d, 0));
  }
  return answers;
}
const result = (diffs) => {
  const profile = scoreProfile(answersFor(diffs), input);
  const type = classify(profile, input);
  return { profile, type, report: buildReport(profile, type, data) };
};

test('shipped config and content agree', () => {
  assert.deepEqual(validateData(data, { knownSections: sectionNames }), []);
});

test('the model has fourteen gods in seven opposed pairs', () => {
  assert.equal(data.model.godIds.length, 14);
  for (const god of data.model.godIds) {
    assert.equal(data.model.gods[data.model.gods[god].opposite].opposite, god);
  }
});

test('balanced order puts one statement of every polarity on each page', () => {
  const ordered = orderItems(data.items.items, data.model, { strategy: 'balanced', seed: data.app.orderSeed });
  assert.equal(ordered.length, data.items.items.length);
  assert.equal(new Set(ordered.map((i) => i.id)).size, ordered.length);
  const perPage = data.model.polarities.length;
  for (let start = 0; start < ordered.length; start += perPage) {
    const page = ordered.slice(start, start + perPage).map((i) => data.model.gods[i.god].polarity);
    assert.equal(new Set(page).size, perPage, `page starting at ${start + 1}`);
  }
  const again = orderItems(data.items.items, data.model, { strategy: 'balanced', seed: data.app.orderSeed });
  assert.deepEqual(again.map((i) => i.id), ordered.map((i) => i.id), 'same seed, same order');
});

test('middle answers everywhere give Pantheios with enough to read', () => {
  const answers = Object.fromEntries(data.items.items.map((i) => [i.id, mid]));
  const profile = scoreProfile(answers, input);
  assert.ok(profile.complete);
  assert.ok(profile.polarities.every((p) => p.score === 0 && p.god === null));
  const type = classify(profile, input);
  assert.equal(type.tier, 'pantheios');
  const report = buildReport(profile, type, data);
  assert.ok(report.paragraphs >= data.scoring.result.minParagraphs);
});

test('raw differences fall into the documented bands', () => {
  // Two statements per god on a 0-4 scale: differences run 0-8.
  const expected = ['balanced', 'balanced', 'lean', 'lean', 'clear', 'clear', 'strong', 'strong', 'strong'];
  expected.forEach((band, d) => {
    assert.equal(bandFor(d / 8, data.scoring.bands).id, band, `difference ${d}`);
    const { profile } = result({ rule: d });
    assert.equal(profile.polarities[0].band.id, band);
    assert.equal(profile.polarities[0].god, d === 0 ? null : 'zeus');
    assert.equal(result({ rule: -d }).profile.polarities[0].god, d === 0 ? null : 'hades');
  });
});

test('clear lead, shared lead, lone lead and no lead', () => {
  let r = result({ temper: 7, range: 4 });
  assert.equal(r.type.tier, 'clear');
  assert.equal(r.type.lead.god, 'athena');
  assert.equal(r.type.second.god, 'hermes');
  assert.equal(r.type.neglected, 'poseidon');
  assert.equal(r.report.code, 'Athena–Hermes');

  r = result({ temper: 6, range: 5 });
  assert.equal(r.type.tier, 'shared');
  assert.equal(r.report.code, 'Athena / Hermes');

  r = result({ form: -6 });
  assert.equal(r.type.tier, 'clear');
  assert.equal(r.type.lead.god, 'dionysus');
  assert.equal(r.type.second, null);
  assert.equal(r.report.code, 'Dionysus');

  r = result({ form: 3, tie: -3, focus: 2 });
  assert.equal(r.type.tier, 'pantheios');
  assert.equal(r.report.code, 'Pantheios');
});

test('result links round-trip and reject other versions', () => {
  const answers = answersFor({ rule: 5, accord: -3, focus: 8 });
  const code = encodeAnswers(answers, data.items, data.scoring.scale);
  assert.deepEqual(decodeAnswers(code, data.items, data.scoring.scale), answers);
  assert.equal(decodeAnswers(`other.${code.split('.')[1]}`, data.items, data.scoring.scale), null);
  assert.equal(decodeAnswers('nonsense', data.items, data.scoring.scale), null);
});

test('every god has a paragraph for every described band', () => {
  const described = data.scoring.bands.filter((b) => b.describe).map((b) => b.id);
  for (const god of data.model.godIds) {
    for (const band of described) {
      assert.ok(data.content.snippets.bands[god][band], `${god} / ${band}`);
    }
  }
});

test('every reachable profile shows the minimum number of complete paragraphs', () => {
  // Each polarity takes a value from every band on both sides: 7^7 = 823,543 profiles.
  const steps = [-7, -4, -2, 0, 2, 4, 7];
  const ids = data.model.polarities.map((p) => p.id);
  const minimum = data.scoring.result.minParagraphs;
  const tiers = { clear: 0, shared: 0, pantheios: 0 };
  let fewest = Infinity;

  for (let n = 0; n < steps.length ** ids.length; n++) {
    let k = n;
    const diffs = {};
    for (let i = 0; i < ids.length; i++) { diffs[ids[i]] = steps[k % steps.length]; k = Math.floor(k / steps.length); }
    const { type, report } = result(diffs);
    tiers[type.tier]++;
    fewest = Math.min(fewest, report.paragraphs);

    if (report.paragraphs < minimum) assert.fail(`${JSON.stringify(diffs)} shows ${report.paragraphs} paragraphs`);
    const texts = [
      ...report.tierParagraphs,
      report.lead && report.lead.text, report.second && report.second.text, report.neglected && report.neglected.text,
      ...report.polarities.map((r) => r.text),
    ].filter((t) => t !== null && t !== false && t !== undefined);
    for (const text of texts) {
      if (typeof text !== 'string' || !text.trim() || /\{\w+\}/.test(text)) assert.fail(`${JSON.stringify(diffs)} has an empty or unfilled paragraph: ${text}`);
    }
    if (type.tier !== 'pantheios' && !(report.lead && report.lead.text && report.neglected && report.neglected.text)) {
      assert.fail(`${JSON.stringify(diffs)} lacks a lead or neglected paragraph`);
    }
  }
  assert.ok(fewest >= minimum);
  console.log(`  profiles by tier: ${JSON.stringify(tiers)}; fewest paragraphs shown: ${fewest}`);
});
