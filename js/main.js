// Starts the app: loads the data, restores saved answers, and switches
// between the views named in the address bar (#home, #test, #result, #gods, #credits).

import { h } from './dom.js';
import { fill } from './text.js';
import { loadData } from './data.js';
import { validateData } from './validate.js';
import { createStore } from './store.js';
import { encodeAnswers, decodeAnswers } from './scoring.js';
import { introView } from './views/intro.js';
import { quizView } from './views/quiz.js';
import { resultView } from './views/result.js';
import { godsView } from './views/gods.js';
import { creditsView } from './views/credits.js';
import { sectionNames } from './views/result-sections.js';

const views = { home: introView, test: quizView, result: resultView, gods: godsView, credits: creditsView };

const mount = document.getElementById('app');
const nav = document.getElementById('nav');
const foot = document.getElementById('foot');

function showLoadError(error) {
  // The interface strings may be the very thing that failed to load, so this
  // one message is written here in English.
  mount.replaceChildren(h('section', { class: 'notice' },
    h('h1', null, 'The test could not load.'),
    h('p', null, `A data file is missing or broken: ${error.message}.`),
    h('p', null, 'If you opened index.html straight from disk, serve the folder instead. Run “python3 -m http.server” inside it, then open http://localhost:8000.'),
  ));
}

async function start() {
  let data;
  try {
    data = await loadData('.', location.search);
  } catch (error) {
    showLoadError(error);
    return;
  }

  const problems = validateData(data, { knownSections: sectionNames });
  if (problems.length) console.warn(`Pantheon: ${problems.length} problem(s) in config or content\n- ${problems.join('\n- ')}`);

  const ui = data.content.ui;
  document.title = ui.app.documentTitle;
  document.documentElement.lang = data.locale;

  const store = createStore(data.app.storageKey, data.app.features.saveProgress);
  const saved = store.read();
  const state = saved && saved.version === data.items.version
    ? { answers: saved.answers || {}, page: saved.page || 0 }
    : { answers: {}, page: 0 };

  // The edition decides which plates are shown: `marble` is statues only,
  // `paint` adds the paintings. ?plates= in the address wins, then the choice
  // made in the footer, then the default in config/app.json.
  const editions = data.app.editions || ['marble'];
  const editionStore = createStore(`${data.app.storageKey}-edition`, true);
  const asked = new URLSearchParams(location.search).get('plates');
  let edition = [asked, editionStore.read(), data.app.edition].find((name) => editions.includes(name)) || editions[0];

  // A result link carries its answers in ?r=. They are shown, never saved.
  const sharedCode = new URLSearchParams(location.search).get('r');
  let shared = sharedCode ? decodeAnswers(sharedCode, data.items, data.scoring.scale) : null;

  const ctx = {
    data,
    state,
    get shared() { return shared; },
    get edition() { return edition; },
    // A result link only works where the page owns its address, so not inside a frame.
    canShare: data.app.features.shareLink && window.parent === window,
    save: () => store.write({ version: data.items.version, answers: state.answers, page: state.page }),
    go: (name) => { location.hash = name; },
    focusTop(root) {
      window.scrollTo(0, 0);
      const heading = root.querySelector('h1');
      if (heading) heading.focus({ preventScroll: true });
    },
    reset() {
      if (shared) {
        shared = null;
        try {
          history.replaceState(null, '', location.pathname);
        } catch (error) {
          /* the address stays as it was; the shared answers are dropped all the same */
        }
      } else {
        state.answers = {};
        state.page = 0;
        store.clear();
      }
      if (location.hash === '#test') render(); else ctx.go('test');
    },
    shareUrl() {
      const code = encodeAnswers(state.answers, data.items, data.scoring.scale);
      const plates = edition === data.app.edition ? '' : `&plates=${edition}`;
      return `${location.origin}${location.pathname}?r=${encodeURIComponent(code)}${plates}#result`;
    },
  };

  function drawChrome(current) {
    const complete = Object.keys(state.answers).length >= data.items.items.length;
    const link = (name, label) => h('a', { href: `#${name}`, 'aria-current': current === name ? 'page' : null }, label);
    nav.replaceChildren(
      h('a', { class: 'brand', href: '#home' }, ui.nav.home),
      h('span', { class: 'nav__links' },
        data.app.features.godsPage && link('gods', ui.nav.gods),
        complete || shared ? link('result', ui.nav.result) : link('test', ui.nav.test),
      ),
    );
    // The footer: a line about the test, the switch between editions, the credits.
    const choose = (name) => {
      edition = name;
      editionStore.write(name);
      render({ keepScroll: true });
    };
    foot.replaceChildren(
      h('p', { class: 'site-foot__note' }, fill(ui.app.footer, {})),
      h('div', { class: 'site-foot__tools' },
        editions.length > 1 && h('div', { class: 'switch', role: 'group', 'aria-label': ui.app.editionLabel },
          h('span', { class: 'switch__label' }, ui.app.editionLabel),
          editions.map((name) => h('button', {
            class: 'switch__option', type: 'button', 'aria-pressed': name === edition ? 'true' : 'false',
            onClick: () => choose(name),
          }, ui.app.editions[name] || name)),
        ),
        h('a', { class: 'link', href: '#credits', 'aria-current': current === 'credits' ? 'page' : null }, ui.nav.credits),
      ),
    );
  }

  function render({ keepScroll = false } = {}) {
    let name = location.hash.replace(/^#/, '') || (shared ? 'result' : 'home');
    if (!views[name] || (name === 'gods' && !data.app.features.godsPage)) name = 'home';
    drawChrome(name);
    const view = views[name](ctx);
    mount.replaceChildren(view);
    mount.dataset.view = name;
    if (!keepScroll) ctx.focusTop(view);
  }

  window.addEventListener('hashchange', () => render());
  render();
}

start();
