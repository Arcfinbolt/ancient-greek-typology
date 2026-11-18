// The wheel: every polarity is a diameter with its two gods at the ends,
// drawn like the inside of a painted cup with a meander round the rim.
// It follows config/model.json, so it changes with the model.
//
// Given a report (js/report.js) it also plots the seven points of a result:
// one on each diameter, further from the centre the stronger the pull, with
// the strongest ringed.

import { s } from '../dom.js';
import { emblemAt } from './emblem.js';
import { meanderRing } from '../art/ornament.js';

export function wheel(data, { label = '', report = null } = {}) {
  const { model, content, scoring } = data;
  const n = model.polarities.length;
  const cx = 340, cy = 322;
  const R = 204;        // where the discs of the gods sit
  const FIELD = 162;    // the plain middle, inside the meander
  const DISC = 17;
  const angle = (i) => (-90 + (i * 180) / n) * (Math.PI / 180);
  const x = (i, r) => cx + r * Math.cos(angle(i));
  const y = (i, r) => cy + r * Math.sin(angle(i));

  const svg = s('svg', { class: `wheel${report ? ' wheel--result' : ''}`, viewBox: '0 0 680 644', role: 'img', 'aria-label': label });
  svg.append(
    s('circle', { class: 'wheel__plate', cx, cy, r: R }),
    meanderRing(cx, cy, FIELD + 8, R - 14),
    s('circle', { class: 'wheel__rim', cx, cy, r: R }),
    s('circle', { class: 'wheel__field', cx, cy, r: FIELD }),
  );

  const rows = report ? report.polarities : [];
  const max = scoring.displayMax || 1;
  const strongest = rows.reduce((best, row) => (row.god && (!best || row.strength > best.strength) ? row : best), null);
  const pulls = new Map(rows.filter((row) => row.god).map((row) => [row.god, row]));

  const lines = s('g', { class: 'wheel__lines' });
  const points = s('g', { class: 'wheel__points' });
  const gods = s('g', { class: 'wheel__gods' });

  model.polarities.forEach((p, i) => {
    const j = i + n; // the opposite end of the same diameter
    lines.append(s('line', { class: 'wheel__line', x1: x(i, FIELD), y1: y(i, FIELD), x2: x(j, FIELD), y2: y(j, FIELD) }));

    [[i, p.first], [j, p.second]].forEach(([k, god]) => {
      const row = pulls.get(god);
      const marked = Boolean(row && row === strongest);
      const c = Math.cos(angle(k));
      const anchor = Math.abs(c) < 0.2 ? 'middle' : c > 0 ? 'start' : 'end';
      const top = Math.sin(angle(k)) < -0.9;
      const bottom = Math.sin(angle(k)) > 0.9;
      const L = R + DISC + 12;
      const lx = anchor === 'middle' ? cx : x(k, L);
      const ly = top ? cy - L - 18 : bottom ? cy + L + 14 : y(k, L) - 2;
      const state = !report ? '' : marked ? ' is-marked' : row ? ' is-pulling' : ' is-quiet';
      gods.append(
        emblemAt(god, x(k, R), y(k, R), DISC, { hollow: Boolean(report) && !row, marked }),
        s('text', { class: `wheel__god${state}`, x: lx, y: ly, 'text-anchor': anchor, 'data-god': god }, content.gods[god].name),
        s('text', { class: `wheel__pole${state}`, x: lx, y: ly + 17, 'text-anchor': anchor }, content.gods[god].pole),
      );

      if (row) {
        const reach = Math.min(row.strength / max, 1) * (FIELD - 12);
        const px = x(k, reach), py = y(k, reach);
        const point = s('g', { class: `wheel__point${marked ? ' is-marked' : ''}`, 'data-god': god });
        point.append(s('line', { class: 'wheel__pull', x1: cx, y1: cy, x2: px, y2: py }));
        if (marked) point.append(s('circle', { class: 'wheel__halo', cx: px, cy: py, r: 15 }));
        point.append(s('circle', { class: 'wheel__mark', cx: px, cy: py, r: marked ? 9 : 6.5 }));
        // The strongest is drawn last so that nothing covers it.
        if (marked) points.append(point); else points.prepend(point);
      }
    });

    // A polarity that pulls neither way keeps its point at the centre.
    if (report && !rows.some((row) => row.id === p.id && row.god)) {
      points.prepend(s('circle', { class: 'wheel__mark wheel__mark--still', cx, cy, r: 5 }));
    }
  });

  svg.append(lines, s('circle', { class: 'wheel__hub', cx, cy, r: 3 }), points, gods);
  return svg;
}
