// A god's tag cloud, drawn from content/<locale>/tags.json.
// Size comes from `weight`, colour from `tone`; css/app.css holds the scale.
// Emblem words take the god's own colour (css/theme.css).

import { h } from '../dom.js';
import { fill } from '../text.js';

/** options.size: 'large' | 'small'. options.key: show the tone key underneath. */
export function tagCloud(god, data, { size = 'large', key = true } = {}) {
  const { content } = data;
  const tags = content.tags[god] || [];
  const ui = content.ui.cloud;

  const words = h('ul', { class: 'cloud__words', 'aria-label': fill(ui.label, { god: content.gods[god].name }) },
    tags.map((t) => h('li', {
      class: `cloud__word cloud__word--${t.tone} cloud__word--w${t.weight}`,
      title: ui.key[t.tone],
    }, t.tag)),
  );

  const tones = ['gift', 'wrath', 'emblem'].filter((tone) => tags.some((t) => t.tone === tone));
  const legend = key && h('figcaption', { class: 'cloud__key' },
    tones.map((tone) => h('span', { class: `cloud__key-item cloud__key-item--${tone}` }, ui.key[tone])),
  );

  return h('figure', { class: `cloud cloud--${size}`, 'data-god': god }, words, legend);
}
