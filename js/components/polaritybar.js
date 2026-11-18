// One polarity as a bar that grows from the centre toward the god who leads.
// The first god sits on the left, the second on the right.

import { h } from '../dom.js';
import { fill } from '../text.js';

/** row: an entry of report.polarities. */
export function polarityBar(row, data) {
  const { content, scoring } = data;
  const ui = content.ui.result;
  const first = content.gods[row.first];
  const second = content.gods[row.second];
  const max = scoring.displayMax || 1;
  const reach = Math.min(row.strength / max, 1) * 50; // percent of the track

  const reading = row.god && row.band !== scoring.bands[0].id
    ? fill(ui.barLabel, { band: ui.band[row.band], god: content.gods[row.god].name })
    : ui.barBalanced;

  const ticks = scoring.bands
    .filter((b) => b.from > 0 && b.from < max)
    .flatMap((b) => [50 - (b.from / max) * 50, 50 + (b.from / max) * 50])
    .map((left) => h('span', { class: 'pbar__tick', style: { left: `${left}%` } }));

  const side = row.god === row.first ? 'first' : 'second';
  const bar = row.god && h('span', {
    class: `pbar__fill pbar__fill--${side}`,
    style: { width: `${reach}%` },
  });

  const end = (god, which) => h('div', { class: `pbar__end pbar__end--${which}${row.god && content.gods[row.god] === god ? ' is-leading' : ''}` },
    h('span', { class: 'pbar__god' }, god.name),
    h('span', { class: 'pbar__pole' }, god.pole),
  );

  return h('div', {
    class: 'pbar',
    role: 'img',
    'aria-label': fill(ui.barSpoken, { first: first.name, second: second.name, reading }),
    title: row.score === null ? '' : `${reading} (${row.score > 0 ? '+' : ''}${row.score.toFixed(2)})`,
  },
    end(first, 'first'),
    h('div', { class: 'pbar__track' }, ticks, h('span', { class: 'pbar__centre' }), bar),
    end(second, 'second'),
    h('div', { class: 'pbar__reading' }, reading),
  );
}
