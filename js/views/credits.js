// Where every plate comes from: the work, who photographed it, and its licence.

import { h } from '../dom.js';

export function creditsView(ctx) {
  const { data } = ctx;
  const ui = data.content.ui.credits;
  const row = (set, god) => {
    const file = data.plates[set][god];
    const words = (data.content.plates[set] || {})[god] || {};
    if (!file) return null;
    return h('li', { class: 'credit', 'data-god': god },
      h('img', { class: 'credit__thumb', src: file.small || file.file, alt: '', width: 60, height: 60, loading: 'lazy', decoding: 'async' }),
      h('div', { class: 'credit__work' },
        h('span', { class: 'credit__god' }, data.content.gods[god].name),
        h('span', { class: 'credit__title' }, words.title),
        words.detail && h('span', { class: 'credit__detail' }, words.detail),
      ),
      h('div', { class: 'credit__source' },
        h('span', null, file.author),
        file.licenceUrl ? h('a', { href: file.licenceUrl, rel: 'license noopener' }, file.licence) : h('span', null, file.licence),
        h('a', { href: file.source, rel: 'noopener' }, ui.source),
      ),
    );
  };
  return h('section', { class: 'credits' },
    h('header', { class: 'credits__head' },
      h('p', { class: 'kicker' }, ui.kicker),
      h('h1', { tabindex: '-1' }, ui.title),
      h('p', { class: 'section-intro' }, ui.intro),
    ),
    ['statues', 'paintings'].filter((set) => data.plates[set]).map((set) => h('section', { class: 'credits__set' },
      h('h2', { class: 'section-title' }, ui.sets[set]),
      h('ul', { class: 'credits__list' }, data.model.godIds.map((god) => row(set, god))),
    )),
  );
}
