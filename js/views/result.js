// The result page: scores the answers, builds the report, and stacks the
// sections named in config/app.json.

import { h } from '../dom.js';
import { scoreProfile, classify } from '../scoring.js';
import { buildReport } from '../report.js';
import { sections } from './result-sections.js';

export function resultView(ctx) {
  const { data } = ctx;
  const answers = ctx.shared || ctx.state.answers;
  const input = { items: data.items.items, model: data.model, scoring: data.scoring };

  const profile = scoreProfile(answers, input);
  if (!profile.complete) {
    return h('section', { class: 'notice' },
      h('h1', { tabindex: '-1' }, data.content.ui.result.incomplete),
      h('p', null, h('a', { class: 'button', href: '#test' }, data.content.ui.intro.resume)),
    );
  }

  const report = buildReport(profile, classify(profile, input), data);
  const page = h('article', { class: `result result--${report.tier}` });
  for (const name of data.app.resultSections) {
    const make = sections[name];
    if (!make) continue; // tools/validate.mjs reports unknown names
    const node = make({ data, report, ctx });
    if (node) page.append(node);
  }
  return page;
}
