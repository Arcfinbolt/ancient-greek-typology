// The opening page: what the test is, how long it takes, and the wheel.

import { h } from '../dom.js';
import { fill } from '../text.js';
import { wheel } from '../components/wheel.js';
import { emblem } from '../components/emblem.js';
import { temple } from '../art/ornament.js';

export function introView(ctx) {
  const { data, state } = ctx;
  const ui = data.content.ui.intro;
  const count = data.items.items.length;
  const perPage = data.app.itemsPerPage || count;
  const vars = { count, pages: Math.ceil(count / perPage) };

  const answered = Object.keys(state.answers).length;
  const action = answered >= count
    ? h('a', { class: 'button', href: '#result' }, ui.seeResult)
    : h('a', { class: 'button', href: '#test' }, answered ? ui.resume : ui.start);

  return h('section', { class: 'intro' },
    h('div', { class: 'intro__text' },
      temple(),
      h('h1', { class: 'intro__headline', tabindex: '-1' }, ui.headline),
      h('p', { class: 'intro__lede' }, fill(ui.lede, vars)),
      h('p', { class: 'intro__action' }, action),
    ),
    h('figure', { class: 'intro__wheel' },
      wheel(data, { label: ui.wheelCaption }),
      h('figcaption', null, ui.wheelCaption),
    ),
    data.app.features.godsPage && h('section', { class: 'frieze', 'aria-labelledby': 'frieze-title' },
      h('div', { class: 'meander', 'aria-hidden': 'true' }),
      h('div', { class: 'frieze__head' },
        h('h2', { class: 'frieze__title', id: 'frieze-title' }, ui.friezeTitle),
        h('a', { class: 'frieze__link', href: '#gods' }, ui.friezeLink),
      ),
      h('ul', { class: 'frieze__gods' },
        data.model.godIds.map((god) => h('li', { 'data-god': god },
          emblem(god, { size: 58 }),
          h('span', { class: 'frieze__name' }, data.content.gods[god].name),
          h('span', { class: 'frieze__pole' }, data.content.gods[god].pole),
        )),
      ),
      h('div', { class: 'meander meander--flip', 'aria-hidden': 'true' }),
    ),
    h('dl', { class: 'facts' },
      ui.facts.map((fact) => h('div', { class: 'facts__item' },
        h('dt', null, fill(fact.term, vars)),
        h('dd', null, fill(fact.detail, vars)),
      )),
    ),
  );
}
