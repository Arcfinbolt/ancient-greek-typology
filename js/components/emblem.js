// A god's emblem on a disc of the god's colour, like the tondo of a painted cup.
// The drawings live in js/art/emblems.js; the colour comes from data-god and
// css/theme.css.

import { s } from '../dom.js';
import { glyphs } from '../art/emblems.js';

const STROKE = { fill: 'none', stroke: 'currentColor', 'stroke-width': 2.2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' };

/** The bare drawing as a <g>, centred on (cx, cy) and scaled to fit a circle of radius r. */
function glyph(god, cx, cy, r) {
  const k = (r * 1.36) / 48; // the 48-unit drawing fills about two thirds of the disc
  const g = s('g', { class: 'emblem__glyph', transform: `translate(${cx - 24 * k} ${cy - 24 * k}) scale(${k})`, ...STROKE });
  g.innerHTML = glyphs[god] || '';
  return g;
}

/** Two sprays of laurel that meet under the disc and stay open at the top. */
function laurel(c, r) {
  const g = s('g', { class: 'emblem__laurel' });
  const rad = (deg) => deg * (Math.PI / 180);
  const at = (deg) => [c + r * Math.cos(rad(deg)), c + r * Math.sin(rad(deg))];
  const leaf = (deg, turn, length) => {
    const [x, y] = at(deg);
    const d = `M0 0Q${length / 2} -4.6 ${length} 0Q${length / 2} 4.6 0 0z`;
    return s('path', { d, transform: `translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${turn.toFixed(1)})` });
  };
  for (const side of [-1, 1]) {
    const from = 90 + side * 6, to = 90 + side * 138; // from under the disc, up one side
    const [x0, y0] = at(from), [x1, y1] = at(to);
    g.append(s('path', {
      class: 'emblem__stem',
      d: `M${x0.toFixed(2)} ${y0.toFixed(2)}A${r} ${r} 0 0 ${side > 0 ? 1 : 0} ${x1.toFixed(2)} ${y1.toFixed(2)}`,
    }));
    // A pair of leaves at each node, one leaning out and one leaning in.
    for (let deg = 20; deg <= 128; deg += 18) {
      const here = 90 + side * deg;
      const along = here + side * 90;
      g.append(leaf(here, along - side * 36, 12.5), leaf(here, along + side * 30, 10.5));
    }
    g.append(leaf(to, to + side * 90, 11));
  }
  return g;
}

/**
 * options.size: pixel width. options.wreath: add a laurel wreath (for the lead).
 * options.hollow: draw the disc as an outline (for the neglected god).
 * options.label: accessible name; without one the emblem is decorative.
 */
export function emblem(god, { size = 56, wreath = false, hollow = false, label = '' } = {}) {
  const box = wreath ? 100 : 64;
  const c = box / 2;
  const svg = s('svg', {
    class: `emblem${hollow ? ' emblem--hollow' : ''}${wreath ? ' emblem--wreath' : ''}`,
    'data-god': god, viewBox: `0 0 ${box} ${box}`, width: size, height: size,
    role: label ? 'img' : null, 'aria-label': label || null, 'aria-hidden': label ? null : 'true',
  });
  if (wreath) svg.append(laurel(c, 40.5));
  svg.append(
    s('circle', { class: 'emblem__disc', cx: c, cy: c, r: 31 }),
    s('circle', { class: 'emblem__ring', cx: c, cy: c, r: 27.5 }),
    glyph(god, c, c, 31),
  );
  return svg;
}

/** The same disc as a <g>, for drawing inside another SVG such as the wheel. */
export function emblemAt(god, cx, cy, r, { hollow = false, marked = false } = {}) {
  const g = s('g', { class: `emblem emblem--placed${hollow ? ' emblem--hollow' : ''}${marked ? ' is-marked' : ''}`, 'data-god': god });
  if (marked) g.append(s('circle', { class: 'emblem__halo', cx, cy, r: r + 5 }));
  g.append(
    s('circle', { class: 'emblem__disc', cx, cy, r }),
    glyph(god, cx, cy, r),
  );
  return g;
}
