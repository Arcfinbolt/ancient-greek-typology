// A plate: a photograph of a statue or a painting of a god, framed and
// captioned like a plate in a book. Which files exist is set in
// config/plates.json; the titles and captions are in content/<locale>/plates.json.
//
// There are two sets, `statues` and `paintings`, and two editions of the site:
// `marble` shows statues only, `paint` adds the paintings beside them.

import { h } from '../dom.js';

/** True when this edition shows paintings as well as statues. */
export const painted = (edition) => edition === 'paint';

/**
 * options.set: 'statues' | 'paintings'.
 * options.sizes: the `sizes` hint for the browser, i.e. how wide the plate is drawn.
 * options.caption: show the title and details underneath.
 * options.eager: load at once (for the first screen) instead of when scrolled to.
 */
export function plate(god, data, { set = 'statues', sizes = '(min-width: 56rem) 28rem, 92vw', caption = true, eager = false, extraClass = '' } = {}) {
  const file = data.plates[set] && data.plates[set][god];
  if (!file) return null;
  const words = (data.content.plates[set] || {})[god] || {};
  const name = data.content.gods[god].name;
  const [width, height] = file.size;

  const img = h('img', {
    class: 'plate__img',
    src: file.file,
    srcset: file.small ? `${file.small} ${Math.round(width / 2)}w, ${file.file} ${width}w` : null,
    sizes,
    width, height,
    alt: [name, words.title, words.detail].filter(Boolean).join('. '),
    loading: eager ? 'eager' : 'lazy',
    decoding: 'async',
  });

  return h('figure', { class: `plate plate--${set}${extraClass ? ` ${extraClass}` : ''}`, 'data-god': god },
    h('div', { class: 'plate__frame', style: { 'aspect-ratio': `${width} / ${height}` } }, img),
    caption && words.title && h('figcaption', { class: 'plate__caption' },
      h('span', { class: 'plate__title' }, words.title),
      words.detail && h('span', { class: 'plate__detail' }, words.detail),
    ),
  );
}

/** A tall, narrow slice of a plate, for the row of three on the opening page. */
export function slice(god, data, { set = 'statues', eager = true } = {}) {
  const file = data.plates[set] && data.plates[set][god];
  if (!file) return null;
  const words = (data.content.plates[set] || {})[god] || {};
  const [width, height] = file.size;
  return h('div', { class: `slice slice--${set}`, 'data-god': god },
    h('img', {
      class: 'slice__img', src: file.file, width, height,
      alt: [data.content.gods[god].name, words.title].filter(Boolean).join('. '),
      style: { 'object-position': file.focus || '50% 50%' },
      loading: eager ? 'eager' : 'lazy', decoding: 'async',
    }),
  );
}
