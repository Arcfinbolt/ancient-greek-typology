// The fourteen gods, two to a polarity, each with a plate and a tag cloud.

import { h } from '../dom.js';
import { fill, roman } from '../text.js';
import { tagCloud } from '../components/tagcloud.js';
import { emblem } from '../components/emblem.js';
import { plate, painted } from '../components/plate.js';

function godCard(god, ctx) {
  const { data } = ctx;
  const g = data.content.gods[god];
  const ui = data.content.ui.gods;
  return h('article', { class: 'god', id: `god-${god}`, 'data-god': god },
    plate(god, data, { set: 'statues', sizes: '(min-width: 52rem) 30rem, 92vw' }),
    h('header', { class: 'god__head' },
      emblem(god, { size: 44 }),
      h('div', null,
        h('p', { class: 'god__greek', lang: 'grc' }, g.greek),
        h('h3', { class: 'god__name' }, g.name),
        h('p', { class: 'god__line' },
          h('span', { class: 'god__pole' }, g.pole),
          g.epithet && h('span', { class: 'god__epithet' }, g.epithet),
        ),
      ),
    ),
    h('p', { class: 'god__does' }, g.does),
    tagCloud(god, data, { size: 'small', key: false }),
    h('dl', { class: 'god__facts' },
      g.symbols && h('div', null, h('dt', null, ui.symbols), h('dd', null, g.symbols)),
      h('div', null, h('dt', null, ui.gift), h('dd', null, g.gift)),
      h('div', null, h('dt', null, ui.wrath), h('dd', null, g.wrath)),
      g.read && h('div', null, h('dt', null, ui.read), h('dd', null, g.read)),
    ),
    painted(ctx.edition) && plate(god, data, { set: 'paintings', sizes: '(min-width: 52rem) 30rem, 92vw', extraClass: 'god__painting' }),
  );
}

export function godsView(ctx) {
  const { data } = ctx;
  const ui = data.content.ui.gods;
  const keyUi = data.content.ui.cloud.key;
  return h('section', { class: 'gods' },
    h('header', { class: 'gods__head' },
      h('p', { class: 'kicker' }, ui.kicker),
      h('h1', { tabindex: '-1' }, ui.title),
      h('p', { class: 'section-intro' }, ui.intro),
      h('p', { class: 'cloud__key' },
        ['gift', 'wrath', 'emblem'].map((tone) => h('span', { class: `cloud__key-item cloud__key-item--${tone}` }, keyUi[tone])),
      ),
    ),
    data.model.polarities.map((p, i) => h('section', { class: 'pair' },
      h('header', { class: 'pair__head' },
        h('span', { class: 'pair__number', 'aria-hidden': 'true' }, roman(i + 1)),
        h('h2', { class: 'pair__question' }, data.content.polarities[p.id].question),
        h('p', { class: 'pair__names kicker' }, fill(ui.against, {
          first: data.content.gods[p.first].name,
          second: data.content.gods[p.second].name,
        })),
      ),
      h('div', { class: 'pair__gods' }, godCard(p.first, ctx), godCard(p.second, ctx)),
    )),
  );
}
