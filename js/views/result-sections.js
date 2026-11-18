// The blocks of the result page. `resultSections` in config/app.json lists
// which ones appear and in what order. To add a block, add a function here
// and its name there. A function may return null to show nothing.
//
// Each receives { data, report, ctx }: data is everything loaded from config/
// and content/, report comes from js/report.js, ctx offers go(), reset(),
// shareUrl(), the flags `shared` and `canShare`, and `edition` ('marble' or
// 'paint': whether paintings are shown beside the statues).

import { h } from '../dom.js';
import { fill, roman } from '../text.js';
import { tagCloud } from '../components/tagcloud.js';
import { polarityBar } from '../components/polaritybar.js';
import { emblem } from '../components/emblem.js';
import { wheel } from '../components/wheel.js';
import { plate, slice, painted } from '../components/plate.js';

/** The gods whose statues already stand in the header, so that no plate is shown twice. */
function inHeader(report) {
  if (!report.lead) return [];
  return report.tier === 'shared' && report.second ? [report.lead.god, report.second.god] : [report.lead.god];
}

/**
 * A facing-page block. Left leaf: the god's plate, Greek name and tag cloud.
 * Right leaf: the reading. data-god gives the whole block the god's colour.
 * role: 'lead', 'second' or 'neglected'.
 */
function leaf({ god, title, label, band, paragraphs, cloudSize, role, data, report, ctx }) {
  const g = data.content.gods[god];
  const ui = data.content.ui.result;
  // The painted edition gives every god a painting here. The marble edition
  // shows the statue, unless it already stands in the header.
  const picture = painted(ctx.edition)
    ? plate(god, data, { set: 'paintings' })
    : !inHeader(report).includes(god) && plate(god, data, { set: 'statues' });

  // The word-portrait sits under the reading when a picture fills the left
  // leaf, and takes the left leaf itself when there is none.
  const cloud = cloudSize && tagCloud(god, data, { size: cloudSize, key: cloudSize === 'large' });

  return h('section', { class: `leaf leaf--${role}${picture ? ' leaf--pictured' : ''}`, 'data-god': god },
    h('div', { class: 'leaf__left' },
      h('div', { class: 'leaf__sign' },
        emblem(god, { size: 52, solid: role === 'lead' }),
        h('div', { class: 'leaf__names' },
          h('p', { class: 'leaf__greek', lang: 'grc' }, g.greek),
          g.epithet && h('p', { class: 'leaf__epithet' }, fill(ui.epithet, { god: g.name, epithet: g.epithet })),
        ),
      ),
      picture || cloud,
    ),
    h('div', { class: 'leaf__right' },
      h('p', { class: 'kicker leaf__label' }, label),
      h('h2', { class: 'leaf__title' }, title),
      h('p', { class: 'leaf__meta' },
        h('span', { class: 'leaf__pole' }, g.pole),
        band && h('span', { class: `chip chip--${band}` }, ui.band[band]),
      ),
      paragraphs.filter(Boolean).map((text) => h('p', { class: 'reading' }, text)),
      picture && cloud,
      g.symbols && h('p', { class: 'leaf__symbols' }, fill(ui.symbols, { symbols: g.symbols })),
    ),
  );
}

export const sections = {
  headline({ data, report, ctx }) {
    const ui = data.content.ui.result;
    const gods = data.content.gods;
    const standing = inHeader(report);
    const epithets = standing.map((god) => gods[god].epithet).filter(Boolean);
    // The lead god gives the header its colour and stands in it. A shared lead
    // puts both gods there. With no lead, three of the pantheon stand instead.
    return h('header', { class: `verdict verdict--${report.tier}${standing.length > 1 ? ' verdict--pair' : ''}`, 'data-god': standing[0] || null },
      h('div', { class: 'verdict__text' },
        ctx.shared && h('p', { class: 'verdict__notice' }, ui.sharedNotice),
        h('p', { class: 'kicker' },
          ui.kicker, h('span', { class: 'kicker__sep', 'aria-hidden': 'true' }, ' · '), h('span', { class: 'verdict__tier' }, ui.tier[report.tier]),
        ),
        // A slash between two names stays with the first when the line breaks.
        h('h1', { class: 'verdict__code', tabindex: '-1' }, report.code.replace(' / ', '\u00a0/ ')),
        epithets.length > 0 && h('p', { class: 'verdict__epithet' }, epithets.join(' · ')),
        report.tierParagraphs.map((text) => h('p', { class: 'reading reading--wide' }, text)),
      ),
      standing.length > 0
        ? h('div', { class: 'verdict__plates' },
            standing.map((god, i) => plate(god, data, { set: 'statues', eager: true, sizes: '(min-width: 56rem) 24rem, 92vw', extraClass: i ? 'verdict__second' : 'verdict__lead' })),
          )
        : h('div', { class: 'verdict__plates verdict__plates--slices' },
            ((data.plates.hero || {}).marble || []).map((god) => slice(god, data, { set: 'statues' })),
          ),
    );
  },

  /** The wheel with the seven points of this result on it, the strongest ringed. */
  wheel({ data, report }) {
    const ui = data.content.ui.result;
    const gods = data.content.gods;
    // All seven, strongest first. A polarity with no pull either way is "at rest".
    const rows = [...report.polarities].sort((a, b) => b.strength - a.strength);
    const pulls = rows.filter((row) => row.god);
    const reading = pulls.length ? fill(ui.wheelStrongest, { god: gods[pulls[0].god].name }) : ui.wheelStill;
    return h('section', { class: 'compass' },
      h('div', { class: 'compass__text' },
        h('p', { class: 'kicker' }, ui.wheelKicker),
        h('h2', { class: 'section-title' }, ui.wheelTitle),
        h('p', { class: 'section-intro' }, ui.wheelIntro),
        h('ol', { class: 'compass__order', 'aria-label': ui.wheelOrder },
          rows.map((row, i) => (row.god
            ? h('li', { class: i === 0 ? 'is-marked' : null, 'data-god': row.god },
                emblem(row.god, { size: 30, solid: i === 0 }),
                h('span', { class: 'compass__god' }, gods[row.god].name),
                h('span', { class: 'compass__pole' }, gods[row.god].pole),
                h('span', { class: `chip chip--${row.band}` }, ui.band[row.band]),
              )
            : h('li', { class: 'is-resting' },
                h('span', { class: 'compass__rest', 'aria-hidden': 'true' }),
                h('span', { class: 'compass__god' }, fill(ui.wheelRest, { first: gods[row.first].name, second: gods[row.second].name })),
                h('span', { class: `chip chip--${row.band}` }, ui.band[row.band]),
              ))),
        ),
        h('p', { class: 'compass__strongest' }, reading),
      ),
      h('figure', { class: 'compass__wheel' },
        wheel(data, { report, label: fill(ui.wheelSpoken, { reading }) }),
      ),
    );
  },

  lead({ data, report, ctx }) {
    if (!report.lead) return null;
    const ui = data.content.ui.result;
    const name = data.content.gods[report.lead.god].name;
    return leaf({
      god: report.lead.god, data, report, ctx, cloudSize: 'large', band: report.lead.band,
      label: ui.leadLabel, title: fill(ui.leadTitle, { god: name }),
      paragraphs: [report.lead.text],
      role: 'lead',
    });
  },

  second({ data, report, ctx }) {
    if (!report.second) return null;
    const ui = data.content.ui.result;
    const name = data.content.gods[report.second.god].name;
    return leaf({
      god: report.second.god, data, report, ctx, cloudSize: 'small', band: report.second.band,
      label: ui.secondLabel, title: fill(ui.secondTitle, { god: name }),
      paragraphs: [report.second.text],
      role: 'second',
    });
  },

  neglected({ data, report, ctx }) {
    if (!report.neglected) return null;
    const ui = data.content.ui.result;
    const name = data.content.gods[report.neglected.god].name;
    return leaf({
      god: report.neglected.god, data, report, ctx, cloudSize: 'small', band: null,
      label: ui.neglectedLabel, title: fill(ui.neglectedTitle, { god: name }),
      paragraphs: [report.neglected.text, ui.neglectedRule],
      role: 'neglected',
    });
  },

  polarities({ data, report }) {
    const ui = data.content.ui.result;
    return h('section', { class: 'profile' },
      h('p', { class: 'kicker' }, ui.polaritiesKicker),
      h('h2', { class: 'section-title' }, report.tier === 'pantheios' ? ui.leaningsTitle : ui.polaritiesTitle),
      h('p', { class: 'section-intro' }, ui.polaritiesIntro),
      h('ol', { class: 'profile__rows' },
        report.polarities.map((row, i) => {
          let note;
          if (row.text) note = h('p', { class: 'reading' }, row.text);
          else if (row.status === 'lead' || row.status === 'second') note = h('p', { class: 'profile__aside' }, ui.describedAbove);
          else note = h('p', { class: 'profile__aside' }, ui.balancedNote);
          return h('li', { class: `profile__row profile__row--${row.status}` },
            h('p', { class: 'profile__question' },
              h('span', { class: 'profile__number', 'aria-hidden': 'true' }, roman(i + 1)),
              data.content.polarities[row.id].question,
            ),
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
      class: 'button', type: 'button',
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
