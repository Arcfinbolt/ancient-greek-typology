// The opening page: what the test is, how long it takes, and the wheel.

import { h } from '../dom.js';
import { fill } from '../text.js';
import { wheel } from '../components/wheel.js';

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
      h('h1', { class: 'intro__headline', tabindex: '-1' }, ui.headline),
      h('p', { class: 'intro__lede' }, fill(ui.lede, vars)),
      h('p', { class: 'intro__action' }, action),
    ),
    h('figure', { class: 'intro__wheel' },
      wheel(data, { label: ui.wheelCaption }),
      h('figcaption', null, ui.wheelCaption),
    ),
    h('dl', { class: 'facts' },
      ui.facts.map((fact) => h('div', { class: 'facts__item' },
        h('dt', null, fill(fact.term, vars)),
        h('dd', null, fill(fact.detail, vars)),
      )),
    ),
  );
}
