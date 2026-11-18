// The wheel: every polarity is a diameter with its two gods at the ends.
// Drawn from config/model.json, so it follows any change to the model.

import { s } from '../dom.js';

export function wheel(data, { label = '' } = {}) {
  const { model, content } = data;
  const n = model.polarities.length;
  const cx = 320, cy = 300, R = 196, L = 218;
  const angle = (i) => (-90 + (i * 180) / n) * (Math.PI / 180);
  const x = (i, r) => cx + r * Math.cos(angle(i));
  const y = (i, r) => cy + r * Math.sin(angle(i));

  const svg = s('svg', { class: 'wheel', viewBox: '0 0 640 600', role: 'img', 'aria-label': label });
  svg.append(s('circle', { class: 'wheel__rim', cx, cy, r: R }));

  model.polarities.forEach((p, i) => {
    const j = i + n; // the opposite end of the same diameter
    svg.append(s('line', { class: 'wheel__line', x1: x(i, R), y1: y(i, R), x2: x(j, R), y2: y(j, R) }));
    [[i, p.first], [j, p.second]].forEach(([k, god]) => {
      const c = Math.cos(angle(k));
      const anchor = Math.abs(c) < 0.2 ? 'middle' : c > 0 ? 'start' : 'end';
      const top = Math.sin(angle(k)) < -0.9;
      const bottom = Math.sin(angle(k)) > 0.9;
      const lx = anchor === 'middle' ? cx : x(k, L);
      const ly = top ? cy - R - 30 : bottom ? cy + R + 30 : y(k, L);
      svg.append(
        s('circle', { class: 'wheel__dot', cx: x(k, R), cy: y(k, R), r: 4 }),
        s('text', { class: 'wheel__god', x: lx, y: ly, 'text-anchor': anchor }, content.gods[god].name),
        s('text', { class: 'wheel__pole', x: lx, y: ly + 17, 'text-anchor': anchor }, content.gods[god].pole),
      );
    });
  });
  return svg;
}
