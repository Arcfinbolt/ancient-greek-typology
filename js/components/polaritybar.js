// One polarity as a bar that grows from the centre toward the god who leads.
// The first god sits on the left, the second on the right. Each end wears its
// god's emblem and colour, and the bar fills in the colour of the god who leads.

import { h } from '../dom.js';
import { fill } from '../text.js';
import { emblem } from './emblem.js';

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
    'data-god': row.god,
    style: { width: `${reach}%` },
  });

  const end = (id, which) => {
    const leading = row.god === id;
    return h('div', { class: `pbar__end pbar__end--${which}${leading ? ' is-leading' : ''}`, 'data-god': id },
      emblem(id, { size: 34, hollow: !leading }),
      h('span', { class: 'pbar__names' },
        h('span', { class: 'pbar__god' }, content.gods[id].name),
        h('span', { class: 'pbar__pole' }, content.gods[id].pole),
      ),
    );
  };

  return h('div', {
    class: 'pbar',
    role: 'img',
    'aria-label': fill(ui.barSpoken, { first: first.name, second: second.name, reading }),
    title: row.score === null ? '' : `${reading} (${row.score > 0 ? '+' : ''}${row.score.toFixed(2)})`,
  },
    end(row.first, 'first'),
    h('div', { class: 'pbar__track' },
      h('span', { class: 'pbar__half pbar__half--first', 'data-god': row.first }),
      h('span', { class: 'pbar__half pbar__half--second', 'data-god': row.second }),
      ticks, h('span', { class: 'pbar__centre' }), bar),
    end(row.second, 'second'),
    h('div', { class: 'pbar__reading', 'data-god': (row.band !== scoring.bands[0].id && row.god) || null }, reading),
  );
}
