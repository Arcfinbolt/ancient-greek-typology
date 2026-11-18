// The wheel: every polarity is a diameter with its two gods at the ends.
// A ring runs round the outside and carries the fourteen signs, one in each
// cell. It follows config/model.json, so it changes with the model.
//
// Given a report (js/report.js) it also plots a result as seven dots, one on
// every diameter. A dot sits toward the god it leans to, further out the
// stronger the pull, and the strongest is ringed. A polarity that pulls
// neither way keeps a hollow dot beside the centre, so that all seven can
// always be seen.

import { s } from '../dom.js';
import { signAt } from './emblem.js';

export function wheel(data, { label = '', report = null } = {}) {
  const { model, content, scoring } = data;
  const n = model.polarities.length;
  const cx = 340, cy = 330;
  const OUTER = 212, INNER = 168;     // the ring that carries the signs
  const MID = (OUTER + INNER) / 2;
  const REST = 15;                    // hollow dots stand this far from the centre
  const NEAR = 36, FAR = INNER - 24;  // where the weakest and the strongest pull put a dot
  const step = Math.PI / n;           // the angle between neighbouring gods
  const angle = (k) => -Math.PI / 2 + k * step;
  const at = (a, r) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  const f = (v) => v.toFixed(2);

  const rows = report ? report.polarities : [];
  const max = scoring.displayMax || 1;
  const strongest = rows.reduce((best, row) => (row.god && (!best || row.strength > best.strength) ? row : best), null);
  const pulls = new Map(rows.filter((row) => row.god).map((row) => [row.god, row]));

  const svg = s('svg', { class: `wheel${report ? ' wheel--result' : ''}`, viewBox: '0 0 680 660', role: 'img', 'aria-label': label });
  const ring = s('g', { class: 'wheel__ring' });
  const field = s('g', { class: 'wheel__field' });
  const dots = s('g', { class: 'wheel__dots' });
  const signs = s('g', { class: 'wheel__signs' });
  const names = s('g', { class: 'wheel__names' });

  ring.append(s('circle', { cx, cy, r: OUTER }), s('circle', { cx, cy, r: INNER }));

  model.polarities.forEach((p, i) => {
    const j = i + n; // the opposite end of the same diameter
    const [x1, y1] = at(angle(i), INNER), [x2, y2] = at(angle(j), INNER);
    field.append(s('line', { class: 'wheel__line', x1, y1, x2, y2 }));

    [[i, p.first], [j, p.second]].forEach(([k, god]) => {
      const a = angle(k);
      const row = pulls.get(god);
      const state = !report ? '' : row && row === strongest ? ' is-marked' : row ? ' is-pulling' : ' is-quiet';

      // A tick at the edge of each cell of the ring, and the god's sign inside it.
      const [ix, iy] = at(a - step / 2, INNER), [ox, oy] = at(a - step / 2, OUTER);
      ring.append(s('line', { class: 'wheel__tick', x1: ix, y1: iy, x2: ox, y2: oy }));
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
    });
  });

  // The seven dots of a result: one on every diameter.
  rows.forEach((row, order) => {
    const p = model.polarityById[row.id];
    if (!row.god) {
      // No pull either way: a hollow dot beside the centre, on this polarity's
      // own line. Neighbouring lines take opposite sides so the dots never touch.
      const [hx, hy] = at(angle(p.index % 2 ? p.index + n : p.index), REST);
      dots.prepend(s('circle', { class: 'wheel__dot wheel__dot--rest', cx: hx, cy: hy, r: 5.5, style: { '--i': String(order) } }));
      return;
    }
    const marked = row === strongest;
    const a = angle(row.god === p.first ? p.index : p.index + n);
    const [px, py] = at(a, NEAR + Math.min(row.strength / max, 1) * (FAR - NEAR));
    const dot = s('g', { class: `wheel__dot${marked ? ' is-marked' : ''}`, 'data-god': row.god, style: { '--i': String(order) } });
    if (marked) dot.append(s('circle', { class: 'wheel__halo', cx: px, cy: py, r: 17.5 }));
    dot.append(s('circle', { class: 'wheel__mark', cx: px, cy: py, r: marked ? 10.5 : 9 }));
    // The strongest is drawn last so that nothing covers it.
    if (marked) dots.append(dot); else dots.prepend(dot);
  });

  if (!report) field.append(s('circle', { class: 'wheel__hub', cx, cy, r: 2.5 }));
  svg.append(ring, field, dots, signs, names);
  return svg;
}
