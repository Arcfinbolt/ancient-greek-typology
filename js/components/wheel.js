// The wheel: every polarity is a diameter with its two gods at the ends.
// A ring runs round the outside and carries the fourteen signs, one in each
// cell, like the signs on an astrolabe. It follows config/model.json, so it
// changes with the model.
//
// Given a report (js/report.js) it also plots the seven points of a result:
// one on each diameter, further from the centre the stronger the pull. The
// faint circles mark where the bands of config/scoring.json begin. The cell of
// the strongest god is filled and its point is ringed.

import { s } from '../dom.js';
import { signAt } from './emblem.js';

export function wheel(data, { label = '', report = null } = {}) {
  const { model, content, scoring } = data;
  const n = model.polarities.length;
  const cx = 340, cy = 330;
  const OUTER = 212, INNER = 168;     // the ring that carries the signs
  const MID = (OUTER + INNER) / 2;
  const REACH = INNER - 18;           // how far a point can travel
  const step = Math.PI / n;           // the angle between neighbouring gods
  const angle = (k) => -Math.PI / 2 + k * step;
  const at = (a, r) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  const f = (v) => v.toFixed(2);

  const svg = s('svg', { class: `wheel${report ? ' wheel--result' : ''}`, viewBox: '0 0 680 660', role: 'img', 'aria-label': label });

  const rows = report ? report.polarities : [];
  const max = scoring.displayMax || 1;
  const strongest = rows.reduce((best, row) => (row.god && (!best || row.strength > best.strength) ? row : best), null);
  const pulls = new Map(rows.filter((row) => row.god).map((row) => [row.god, row]));

  const cells = s('g', { class: 'wheel__cells' });
  const ring = s('g', { class: 'wheel__ring' });
  const field = s('g', { class: 'wheel__field' });
  const points = s('g', { class: 'wheel__points' });
  const signs = s('g', { class: 'wheel__signs' });
  const names = s('g', { class: 'wheel__names' });

  ring.append(s('circle', { cx, cy, r: OUTER }), s('circle', { cx, cy, r: INNER }));

  // Where each band begins, as a faint circle.
  for (const band of scoring.bands) {
    if (band.from > 0 && band.from < max) field.append(s('circle', { class: 'wheel__band', cx, cy, r: (band.from / max) * REACH }));
  }

  model.polarities.forEach((p, i) => {
    const j = i + n; // the opposite end of the same diameter
    const [x1, y1] = at(angle(i), INNER), [x2, y2] = at(angle(j), INNER);
    field.append(s('line', { class: 'wheel__line', x1, y1, x2, y2 }));

    [[i, p.first], [j, p.second]].forEach(([k, god]) => {
      const a = angle(k);
      const row = pulls.get(god);
      const marked = Boolean(row && row === strongest);
      const state = !report ? '' : marked ? ' is-marked' : row ? ' is-pulling' : ' is-quiet';

      // The cell: a slice of the ring, with a tick at its leading edge.
      const a0 = a - step / 2, a1 = a + step / 2;
      const [ox0, oy0] = at(a0, OUTER), [ox1, oy1] = at(a1, OUTER);
      const [ix0, iy0] = at(a0, INNER), [ix1, iy1] = at(a1, INNER);
      cells.append(s('path', {
        class: `wheel__cell${state}`, 'data-god': god,
        d: `M${f(ox0)} ${f(oy0)}A${OUTER} ${OUTER} 0 0 1 ${f(ox1)} ${f(oy1)}L${f(ix1)} ${f(iy1)}A${INNER} ${INNER} 0 0 0 ${f(ix0)} ${f(iy0)}z`,
      }));
      ring.append(s('line', { class: 'wheel__tick', x1: ix0, y1: iy0, x2: ox0, y2: oy0 }));

      const [sx, sy] = at(a, MID);
      signs.append(signAt(god, sx, sy, 27, { class: `wheel__sign${state}` }));

      // The name, outside the ring.
      const c = Math.cos(a), sn = Math.sin(a);
      const anchor = Math.abs(c) < 0.2 ? 'middle' : c > 0 ? 'start' : 'end';
      const [lx, ly] = at(a, OUTER + 16);
      const x = anchor === 'middle' ? cx : lx;
      const y = sn < -0.9 ? cy - OUTER - 32 : sn > 0.9 ? cy + OUTER + 32 : ly + 2 + sn * 8;
      names.append(
        s('text', { class: `wheel__god${state}`, x, y, 'text-anchor': anchor, 'data-god': god }, content.gods[god].name),
        s('text', { class: `wheel__pole${state}`, x, y: y + 15, 'text-anchor': anchor }, content.gods[god].pole),
      );

      if (row) {
        const [px, py] = at(a, Math.min(row.strength / max, 1) * REACH);
        const point = s('g', { class: `wheel__point${marked ? ' is-marked' : ''}`, 'data-god': god, style: { '--i': String(points.childNodes.length) } });
        point.append(s('line', { class: 'wheel__pull', x1: cx, y1: cy, x2: px, y2: py }));
        if (marked) point.append(s('circle', { class: 'wheel__halo', cx: px, cy: py, r: 13 }));
        point.append(s('circle', { class: 'wheel__mark', cx: px, cy: py, r: marked ? 7 : 5 }));
        // The strongest is drawn last so that nothing covers it.
        if (marked) points.append(point); else points.prepend(point);
      }
    });
  });

  svg.append(cells, ring, field, s('circle', { class: 'wheel__hub', cx, cy, r: 2.5 }), points, signs, names);
  return svg;
}
