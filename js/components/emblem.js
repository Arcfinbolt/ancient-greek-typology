// A god's sign, drawn as a fine line inside a ring, the way a seal is cut.
// The drawings live in js/art/emblems.js; the colour comes from data-god and
// css/theme.css.

import { s } from '../dom.js';
import { glyphs } from '../art/emblems.js';

const STROKE = { fill: 'none', stroke: 'currentColor', 'stroke-width': 2.2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' };

/** The bare drawing as a <g>, centred on (cx, cy) and `size` units across. */
export function signAt(god, cx, cy, size, attrs = {}) {
  const k = size / 48;
  const g = s('g', { ...attrs, 'data-god': god, transform: `translate(${cx - 24 * k} ${cy - 24 * k}) scale(${k})`, ...STROKE });
  g.innerHTML = glyphs[god] || '';
  return g;
}

/**
 * options.size: pixel width. options.solid: fill the ring with the god's
 * colour (for the god who leads). options.label: accessible name; without one
 * the sign is decorative.
 */
export function emblem(god, { size = 40, solid = false, label = '' } = {}) {
  const svg = s('svg', {
    class: `emblem${solid ? ' emblem--solid' : ''}`,
    'data-god': god, viewBox: '0 0 64 64', width: size, height: size,
    role: label ? 'img' : null, 'aria-label': label || null, 'aria-hidden': label ? null : 'true',
  });
  svg.append(
    s('circle', { class: 'emblem__ring', cx: 32, cy: 32, r: 30.5 }),
    signAt(god, 32, 32, 40, { class: 'emblem__sign' }),
  );
  return svg;
}
