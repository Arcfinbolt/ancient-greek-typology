// The statements, a page at a time. Order and page size come from config/app.json.

import { h } from '../dom.js';
import { fill } from '../text.js';
import { orderItems } from '../scoring.js';

export function quizView(ctx) {
  const { data, state } = ctx;
  const ui = data.content.ui.quiz;
  const { min, max } = data.scoring.scale;
  const points = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  const ordered = orderItems(data.items.items, data.model, {
    strategy: data.app.itemOrder,
    seed: data.app.orderSeed,
  });
  const count = ordered.length;
  const perPage = data.app.itemsPerPage || count;
  const pages = Math.ceil(count / perPage);
  state.page = Math.min(Math.max(state.page || 0, 0), pages - 1);

  const root = h('section', { class: 'quiz' });
  const answeredCount = () => ordered.filter((it) => state.answers[it.id] !== undefined).length;

  function draw({ focus = true } = {}) {
    const page = state.page;
    const pageItems = ordered.slice(page * perPage, (page + 1) * perPage);
    const missing = () => pageItems.filter((it) => state.answers[it.id] === undefined);

    const progressText = h('span', { class: 'quiz__count' });
    const progressBar = h('progress', { class: 'quiz__bar', max: count, value: 0 });
    const note = h('p', { class: 'quiz__note', role: 'status' });
    const updateProgress = () => {
      const n = answeredCount();
      progressBar.value = n;
      progressText.textContent = fill(ui.progress, { answered: n, count });
    };

    const list = h('ol', { class: 'items', start: page * perPage + 1 },
      pageItems.map((item, i) => {
        const number = page * perPage + i + 1;
        const row = h('li', { class: 'item', id: `item-${item.id}` });
        const options = points.map((value, k) => {
          const id = `${item.id}-${value}`;
          const input = h('input', {
            type: 'radio', name: item.id, id, value: String(value),
            checked: state.answers[item.id] === value,
            onChange: () => {
              state.answers[item.id] = value;
              row.classList.remove('is-missing');
              if (!missing().length) note.textContent = '';
              ctx.save();
              updateProgress();
            },
          });
          const edge = k === 0 || k === points.length - 1;
          return h('label', { class: 'scale__option', for: id },
            input,
            h('span', { class: 'scale__dot', 'aria-hidden': 'true' }),
            h('span', { class: edge ? 'scale__caption' : 'visually-hidden' }, edge ? ui.scale[k] : ui.scaleSpoken[k]),
          );
        });
        row.append(
          h('span', { class: 'item__number', 'aria-hidden': 'true' }, number),
          h('p', { class: 'item__statement', id: `statement-${item.id}` }, data.content.items[item.id]),
          h('div', { class: 'scale', role: 'radiogroup', 'aria-labelledby': `statement-${item.id}` }, options),
        );
        return row;
      }),
    );

    const go = (delta) => {
      if (delta > 0) {
        const gaps = missing();
        if (gaps.length) {
          note.textContent = gaps.length === 1 ? ui.missingOne : fill(ui.missingMany, { n: gaps.length });
          for (const it of gaps) root.querySelector(`#item-${CSS.escape(it.id)}`).classList.add('is-missing');
          const first = root.querySelector(`#item-${CSS.escape(gaps[0].id)} input`);
          if (first) first.focus();
          return;
        }
        if (page === pages - 1) {
          ctx.go('result');
          return;
        }
      }
      state.page = page + delta;
      ctx.save();
      draw();
    };

    root.replaceChildren(
      h('header', { class: 'quiz__head' },
        h('h1', { class: 'quiz__title', tabindex: '-1' }, ui.instruction),
        h('p', { class: 'quiz__help' }, ui.scaleHelp),
        h('div', { class: 'quiz__progress' },
          h('span', { class: 'quiz__page' }, fill(ui.page, { page: page + 1, pages })),
          progressBar,
          progressText,
        ),
      ),
      list,
      h('footer', { class: 'quiz__foot' },
        note,
        h('div', { class: 'quiz__buttons' },
          page > 0 && h('button', { class: 'button button--quiet', type: 'button', onClick: () => go(-1) }, ui.back),
          h('button', { class: 'button', type: 'button', onClick: () => go(1) }, page === pages - 1 ? ui.finish : ui.next),
        ),
      ),
    );
    updateProgress();
    if (focus) ctx.focusTop(root);
  }

  draw({ focus: false });
  return root;
}
