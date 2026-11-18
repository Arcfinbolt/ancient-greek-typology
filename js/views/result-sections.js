// The blocks of the result page. `resultSections` in config/app.json lists
// which ones appear and in what order. To add a block, add a function here
// and its name there. A function may return null to show nothing.
//
// Each receives { data, report, ctx }: data is everything loaded from config/
// and content/, report comes from js/report.js, ctx offers go(), reset(),
// shareUrl() and the flags `shared` and `canShare`.

import { h } from '../dom.js';
import { fill } from '../text.js';
import { tagCloud } from '../components/tagcloud.js';
import { polarityBar } from '../components/polaritybar.js';

/** A facing-page block: the god's Greek name and tag cloud on the left, the reading on the right. */
function leaf({ god, title, band, paragraphs, cloudSize, data, extraClass = '' }) {
  const g = data.content.gods[god];
  const ui = data.content.ui.result;
  return h('section', { class: `leaf ${extraClass}` },
    h('div', { class: 'leaf__left' },
      h('p', { class: 'leaf__greek', lang: 'grc' }, g.greek),
      cloudSize && tagCloud(god, data, { size: cloudSize, key: cloudSize === 'large' }),
    ),
    h('div', { class: 'leaf__right' },
      h('h2', { class: 'leaf__title' }, title),
      h('p', { class: 'leaf__meta' },
        h('span', { class: 'leaf__pole' }, g.pole),
        band && h('span', { class: `chip chip--${band}` }, ui.band[band]),
      ),
      paragraphs.filter(Boolean).map((text) => h('p', { class: 'reading' }, text)),
    ),
  );
}

export const sections = {
  headline({ data, report, ctx }) {
    const ui = data.content.ui.result;
    return h('header', { class: 'verdict' },
      ctx.shared && h('p', { class: 'verdict__notice' }, ui.sharedNotice),
      h('p', { class: 'verdict__kicker' }, ui.kicker),
      h('h1', { class: 'verdict__code', tabindex: '-1' }, report.code),
      h('p', { class: 'verdict__tier' }, ui.tier[report.tier]),
      report.tierParagraphs.map((text) => h('p', { class: 'reading reading--wide' }, text)),
    );
  },

  lead({ data, report }) {
    if (!report.lead) return null;
    const name = data.content.gods[report.lead.god].name;
    return leaf({
      god: report.lead.god, data, cloudSize: 'large', band: report.lead.band,
      title: fill(data.content.ui.result.leadTitle, { god: name }),
      paragraphs: [report.lead.text],
      extraClass: 'leaf--lead',
    });
  },

  second({ data, report }) {
    if (!report.second) return null;
    const name = data.content.gods[report.second.god].name;
    return leaf({
      god: report.second.god, data, cloudSize: 'small', band: report.second.band,
      title: fill(data.content.ui.result.secondTitle, { god: name }),
      paragraphs: [report.second.text],
    });
  },

  neglected({ data, report }) {
    if (!report.neglected) return null;
    const ui = data.content.ui.result;
    const name = data.content.gods[report.neglected.god].name;
    return leaf({
      god: report.neglected.god, data, cloudSize: 'small', band: null,
      title: fill(ui.neglectedTitle, { god: name }),
      paragraphs: [report.neglected.text, ui.neglectedRule],
      extraClass: 'leaf--neglected',
    });
  },

  polarities({ data, report }) {
    const ui = data.content.ui.result;
    return h('section', { class: 'profile' },
      h('h2', { class: 'section-title' }, report.tier === 'pantheios' ? ui.leaningsTitle : ui.polaritiesTitle),
      h('p', { class: 'section-intro' }, ui.polaritiesIntro),
      h('ol', { class: 'profile__rows' },
        report.polarities.map((row) => {
          let note;
          if (row.text) note = h('p', { class: 'reading' }, row.text);
          else if (row.status === 'lead' || row.status === 'second') note = h('p', { class: 'profile__aside' }, ui.describedAbove);
          else note = h('p', { class: 'profile__aside' }, ui.balancedNote);
          return h('li', { class: `profile__row profile__row--${row.status}` },
            h('p', { class: 'profile__question' }, data.content.polarities[row.id].question),
            polarityBar(row, data),
            note,
          );
        }),
      ),
    );
  },

  method({ data }) {
    const count = data.items.items.length;
    const vars = { count, perGod: Math.round(count / data.model.godIds.length) };
    return h('section', { class: 'method' },
      h('h2', { class: 'section-title' }, data.content.ui.result.methodTitle),
      [].concat(data.content.snippets.method).map((text) => h('p', { class: 'reading' }, fill(text, vars))),
    );
  },

  actions({ data, ctx }) {
    const ui = data.content.ui.result;
    const status = h('span', { class: 'actions__status', role: 'status' });

    const retake = h('button', { class: 'button button--quiet', type: 'button' }, ctx.shared ? ui.takeYourself : ui.retake);
    let armed = false;
    retake.addEventListener('click', () => {
      if (ctx.shared || armed) {
        ctx.reset();
        return;
      }
      armed = true;
      retake.textContent = ui.retakeConfirm;
    });

    const copy = ctx.canShare && !ctx.shared && h('button', {
      class: 'button button--quiet', type: 'button',
      onClick: async () => {
        const url = ctx.shareUrl();
        try {
          await navigator.clipboard.writeText(url);
          status.textContent = ui.copied;
        } catch (error) {
          // Clipboard access can be refused; show the link so it can be copied by hand.
          status.replaceChildren(ui.copyManual, ' ', h('input', {
            class: 'actions__link', type: 'text', readonly: true, value: url,
            'aria-label': ui.copyManual, onFocus: (e) => e.target.select(),
          }));
        }
      },
    }, ui.copy);

    return h('footer', { class: 'actions' }, h('div', { class: 'actions__buttons' }, copy, retake), status);
  },
};

export const sectionNames = Object.keys(sections);
