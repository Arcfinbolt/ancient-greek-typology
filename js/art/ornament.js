// Ornament drawn in code: the temple front and the meander (Greek key) bent
// round a circle. The straight meander used for borders is img/meander.svg,
// applied as a mask in css/app.css so that it takes any colour.

import { s } from '../dom.js';

/** A six-column temple front in silhouette against a low sun. */
export function temple({ label = '' } = {}) {
  const svg = s('svg', {
    class: 'temple', viewBox: '0 0 360 196',
    role: label ? 'img' : null, 'aria-label': label || null, 'aria-hidden': label ? null : 'true',
  });
  svg.append(s('circle', { class: 'temple__sun', cx: 180, cy: 104, r: 84 }));

  const solid = s('g', { class: 'temple__stone' });
  const cut = s('g', { class: 'temple__cut' });

  // Pediment, with a palmette at the peak and at each corner.
  solid.append(
    s('path', { d: 'M36 44 180 10 324 44z' }),
    s('circle', { cx: 180, cy: 8, r: 5 }), s('circle', { cx: 38, cy: 40, r: 4 }), s('circle', { cx: 322, cy: 40, r: 4 }),
  );
  cut.append(s('path', { d: 'M66 40 180 17 294 40z' }));

  // Cornice, frieze and architrave.
  solid.append(s('rect', { x: 36, y: 44, width: 288, height: 5 }), s('rect', { x: 44, y: 51, width: 272, height: 24 }));
  cut.append(s('path', { d: 'M44 63.5H316' }));
  for (let x = 50; x <= 310; x += 23.636) {
    cut.append(s('path', { d: `M${x - 2.5} 53.5v8M${x + 2.5} 53.5v8` }));
  }

  // Six columns: abacus, echinus and a tapering fluted shaft.
  for (let i = 0; i < 6; i++) {
    const x = 62 + i * 47.2;
    solid.append(
      s('rect', { x: x - 14, y: 77, width: 28, height: 5 }),
      s('path', { d: `M${x - 13} 82h26l-4 6h-18z` }),
      s('path', { d: `M${x - 9} 88h18l2.5 72h-23z` }),
    );
    cut.append(s('path', { d: `M${x - 3.5} 92l-1 66M${x + 3.5} 92l1 66` }));
  }

  // Three steps.
  solid.append(
    s('rect', { x: 40, y: 160, width: 280, height: 8 }),
    s('rect', { x: 28, y: 170, width: 304, height: 8 }),
    s('rect', { x: 16, y: 180, width: 328, height: 8 }),
  );
  svg.append(solid, cut, s('path', { class: 'temple__ground', d: 'M0 192H360' }));
  return svg;
}

/**
 * A meander running round a circle. inner and outer are the radii of the band;
 * the number of repeats is chosen so that each key comes out roughly square.
 */
export function meanderRing(cx, cy, inner, outer) {
  const depth = outer - inner;
  const tiles = Math.max(12, Math.round((2 * Math.PI * ((inner + outer) / 2)) / (depth * 1.3)));
  const turn = (2 * Math.PI) / tiles;
  // The straight tile is 16 wide and 12 deep: x runs along the band, y across it.
  const at = (k, x, y) => {
    const a = (k + x / 16) * turn - Math.PI / 2;
    const r = inner + (y / 12) * depth;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a), r];
  };
  const f = (n) => n.toFixed(2);
  let d = '';
  for (let k = 0; k < tiles; k++) {
    const line = (x, y) => { const [px, py] = at(k, x, y); d += `L${f(px)} ${f(py)}`; };
    const arc = (x, y, forward) => { const [px, py, r] = at(k, x, y); d += `A${f(r)} ${f(r)} 0 0 ${forward ? 1 : 0} ${f(px)} ${f(py)}`; };
    const [sx, sy] = at(k, 1, 0);
    d += `M${f(sx)} ${f(sy)}`;
    line(1, 12); arc(13, 12, true); line(13, 4); arc(5, 4, false); line(5, 8); arc(9, 8, true);
  }
  const g = s('g', { class: 'meander-ring' });
  g.append(s('circle', { cx, cy, r: inner }), s('path', { d }));
  return g;
}
