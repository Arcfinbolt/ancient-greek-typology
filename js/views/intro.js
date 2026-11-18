// The opening page: what the test is, three plates, the wheel, and the
// fourteen gods in a row.

import { h } from '../dom.js';
import { fill, roman } from '../text.js';
import { wheel } from '../components/wheel.js';
import { plate, slice, painted } from '../components/plate.js';

export function introView(ctx) {
  const { data, state } = ctx;
  const ui = data.content.ui.intro;
  const gods = data.content.gods;
  const count = data.items.items.length;
  const perPage = data.app.itemsPerPage || count;
  const vars = { count, pages: Math.ceil(count / perPage), gods: data.model.godIds.length, polarities: data.model.polarities.length };

  const answered = Object.keys(state.answers).length;
  const action = answered >= count
    ? h('a', { class: 'button', href: '#result' }, ui.seeResult)
    : h('a', { class: 'button', href: '#test' }, answered ? ui.resume : ui.start);

  // Three tall slices stand beside the headline. In the painted edition the
  // outer two are paintings and the middle one stays marble.
  const heroes = (data.plates.hero || {})[ctx.edition] || [];
  const sets = painted(ctx.edition) ? ['paintings', 'statues', 'paintings'] : ['statues', 'statues', 'statues'];

  return h('div', { class: 'home' },
    h('section', { class: 'hero' },
      h('div', { class: 'hero__text' },
        h('p', { class: 'kicker' }, fill(ui.kicker, vars)),
        h('h1', { class: 'hero__headline', tabindex: '-1' }, ui.headline),
        h('p', { class: 'hero__lede' }, fill(ui.lede, vars)),
        h('p', { class: 'hero__actions' },
          action,
          data.app.features.godsPage && h('a', { class: 'link', href: '#gods' }, ui.friezeLink),
        ),
      ),
      heroes.length > 0 && h('div', { class: 'hero__plates' },
        heroes.map((god, i) => slice(god, data, { set: sets[i % sets.length] })),
      ),
    ),

    ui.epigraph && h('figure', { class: 'epigraph' },
      h('blockquote', null,
        h('p', { class: 'epigraph__greek', lang: 'grc' }, ui.epigraph.greek),
        h('p', { class: 'epigraph__text' }, ui.epigraph.text),
      ),
      h('figcaption', { class: 'kicker' }, ui.epigraph.source),
    ),

    h('section', { class: 'model' },
      h('div', { class: 'model__text' },
        h('p', { class: 'kicker' }, ui.modelKicker),
        h('h2', { class: 'section-title' }, fill(ui.modelTitle, vars)),
        h('p', { class: 'section-intro' }, ui.modelIntro),
        h('ol', { class: 'questions' },
          data.model.polarities.map((p, i) => h('li', { class: 'questions__row' },
            h('span', { class: 'questions__number' }, roman(i + 1)),
            h('span', { class: 'questions__question' }, data.content.polarities[p.id].question),
            h('span', { class: 'questions__gods' },
              h('span', { 'data-god': p.first }, gods[p.first].name),
              h('span', { class: 'questions__versus', 'aria-hidden': 'true' }, '·'),
              h('span', { 'data-god': p.second }, gods[p.second].name),
            ),
          )),
        ),
      ),
      h('figure', { class: 'model__wheel' },
        wheel(data, { label: ui.wheelCaption }),
        h('figcaption', null, ui.wheelCaption),
      ),
    ),

    data.app.features.godsPage && h('section', { class: 'gallery', 'aria-labelledby': 'gallery-title' },
      h('header', { class: 'gallery__head' },
        h('div', null,
          h('p', { class: 'kicker' }, ui.galleryKicker),
          h('h2', { class: 'section-title', id: 'gallery-title' }, ui.friezeTitle),
        ),
        h('a', { class: 'link', href: '#gods' }, ui.friezeLink),
      ),
      // Each pair of opposites shares a column (or, on a phone, a row).
      h('ul', { class: 'gallery__gods' },
        data.model.godIds.map((god) => h('li', { class: 'gallery__god', 'data-god': god },
          h('a', { href: '#gods', 'aria-label': gods[god].name },
            plate(god, data, { set: 'statues', caption: false, sizes: '(min-width: 64rem) 9rem, (min-width: 40rem) 22vw, 45vw' }),
          ),
          h('span', { class: 'gallery__name' }, gods[god].name),
          h('span', { class: 'gallery__pole' }, gods[god].pole),
        )),
      ),
    ),

    h('dl', { class: 'facts' },
      ui.facts.map((fact) => h('div', { class: 'facts__item' },
        h('dt', null, fill(fact.term, vars)),
        h('dd', null, fill(fact.detail, vars)),
      )),
    ),
  );
}
