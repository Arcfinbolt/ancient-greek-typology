// The fourteen gods, two to a polarity, each with its tag cloud.

import { h } from '../dom.js';
import { fill } from '../text.js';
import { tagCloud } from '../components/tagcloud.js';

function godCard(god, data) {
  const g = data.content.gods[god];
  const ui = data.content.ui.gods;
  return h('article', { class: 'god', id: `god-${god}` },
    h('p', { class: 'god__greek', lang: 'grc' }, g.greek),
    h('h3', { class: 'god__name' }, g.name, h('span', { class: 'god__pole' }, g.pole)),
    h('p', { class: 'god__does' }, g.does),
    tagCloud(god, data, { size: 'small', key: false }),
    h('dl', { class: 'god__facts' },
      h('div', null, h('dt', null, ui.gift), h('dd', null, g.gift)),
      h('div', null, h('dt', null, ui.wrath), h('dd', null, g.wrath)),
      g.read && h('div', null, h('dt', null, ui.read), h('dd', null, g.read)),
    ),
  );
}

export function godsView(ctx) {
  const { data } = ctx;
  const ui = data.content.ui.gods;
  const keyUi = data.content.ui.cloud.key;
  return h('section', { class: 'gods' },
    h('header', { class: 'gods__head' },
      h('h1', { tabindex: '-1' }, ui.title),
      h('p', { class: 'section-intro' }, ui.intro),
      h('p', { class: 'cloud__key' },
        ['gift', 'wrath', 'emblem'].map((tone) => h('span', { class: `cloud__key-item cloud__key-item--${tone}` }, keyUi[tone])),
      ),
    ),
    data.model.polarities.map((p) => h('section', { class: 'pair' },
      h('header', { class: 'pair__head' },
        h('h2', { class: 'pair__question' }, data.content.polarities[p.id].question),
        h('p', { class: 'pair__names' }, fill(ui.against, {
          first: data.content.gods[p.first].name,
          second: data.content.gods[p.second].name,
        })),
      ),
      h('div', { class: 'pair__gods' }, godCard(p.first, data), godCard(p.second, data)),
    )),
  );
}
