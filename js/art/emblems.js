// One emblem per god, drawn the way a vase painter would mark a figure:
// a single flat sign on a disc. Each drawing fits a 48 by 48 box, is stroked
// in `currentColor` unless a shape says fill="currentColor", and is keyed by
// the god's id in config/model.json. A god without a drawing gets a plain disc.

const F = 'fill="currentColor" stroke="none"';

function grapes() {
  const rows = [[19, [13.5, 20.5, 27.5, 34.5]], [25.5, [17, 24, 31]], [32, [20.5, 27.5]], [38.5, [24]]];
  return rows.map(([y, xs]) => xs.map((x) => `<circle cx="${x}" cy="${y}" r="3.3" ${F}/>`).join('')).join('');
}

function wheat() {
  const grain = (y, side) => `<ellipse cx="${24 + side * 5.2}" cy="${y}" rx="2.5" ry="5.2" transform="rotate(${side * 32} ${24 + side * 5.2} ${y})" ${F}/>`;
  return [14, 21.5, 29].map((y) => grain(y, -1) + grain(y, 1)).join('')
    + `<ellipse cx="24" cy="7.5" rx="2.5" ry="5" ${F}/>`
    + '<path d="M24 12V45"/><path d="M24 40C19 39 16 36 15 33M24 40C29 39 32 36 33 33"/>';
}

function feather() {
  const barbs = [];
  for (let i = 0; i < 11; i++) {
    const a = (-200 + i * 22) * (Math.PI / 180);
    const x1 = 24 + 11.5 * Math.cos(a), y1 = 17 + 13.5 * Math.sin(a);
    const x2 = 24 + 15.5 * Math.cos(a), y2 = 17 + 17.5 * Math.sin(a);
    barbs.push(`M${x1.toFixed(1)} ${y1.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}`);
  }
  return `<path d="${barbs.join('')}" stroke-width="1.5"/>`
    + '<ellipse cx="24" cy="17" rx="8.5" ry="10.5"/>'
    + `<ellipse cx="24" cy="18.5" rx="4.6" ry="6" ${F}/>`
    + '<path d="M24 27.5C24 34 25 40 27 46"/>';
}

export const glyphs = {
  // The thunderbolt.
  zeus: `<path d="M28 3 11 26h10l-4 19 20-25H26z" ${F}/>`,

  // The bident, the two-pronged staff of the lord below.
  hades: '<path d="M24 45V23"/><path d="M15 4v10a9 9 0 0 0 18 0V4"/><path d="M19 30h10"/>'
    + `<path d="M15 2l-3 6h6zM33 2l-3 6h6z" ${F}/>`,

  // The herald's staff: two snakes and a pair of wings.
  hermes: '<path d="M24 12V45"/>'
    + `<circle cx="24" cy="8" r="3" ${F}/>`
    + `<path d="M24 14C19 9 12 8 6 11c4 1 6 3 8 6 4 1 7 0 10-1zM24 14c5-5 12-6 18-3-4 1-6 3-8 6-4 1-7 0-10-1z" ${F}/>`
    + '<path d="M24 22c9 2 9 8 0 10s-9 8 0 10M24 22c-9 2-9 8 0 10s9 8 0 10"/>',

  // The hearth fire on its round altar.
  hestia: `<path d="M24 4c1 7 10 11 10 20a10 10 0 0 1-20 0c0-5 3-7 4-12 2 3 5 1 6-8z" ${F}/>`
    + '<path d="M9 38h30"/><path d="M13 38l3 7h16l3-7"/>',

  // The lyre.
  apollo: '<path d="M17 33C7 26 9 12 15 5M31 33c10-7 8-21 2-28"/><path d="M12 11h24"/>'
    + '<path d="M20 11v21M24 11v21M28 11v21" stroke-width="1.4"/>'
    + `<path d="M13 33h22c0 6-5 11-11 11s-11-5-11-11z" ${F}/>`,

  // The grape cluster and its leaf.
  dionysus: `${grapes()}<path d="M24 15V7"/><path d="M24 9c4-6 11-6 14-1-4 4-10 4-14 1z" ${F}/>`
    + '<path d="M24 9c-3-3-7-3-10-1"/>',

  // The scallop shell that carried her ashore.
  aphrodite: '<path d="M24 42 6 22a18 18 0 0 1 36 0z"/>'
    + '<path d="M24 42 13 11M24 42 24 4.500M24 42 35 11M24 42 8 16M24 42 40 16" stroke-width="1.4"/>'
    + `<path d="M19 41h10v4H19z" ${F}/>`,

  // Spear and round shield.
  ares: '<circle cx="21" cy="28" r="13"/><circle cx="21" cy="28" r="8" stroke-width="1.4"/>'
    + `<circle cx="21" cy="28" r="2.6" ${F}/>`
    + '<path d="M5 46 37 9"/>'
    + `<path d="M43 2l-2 10-8-6z" ${F}/>`,

  // The little owl of Athens.
  athena: '<path d="M11 21c0-9 5-14 13-14s13 5 13 14v9c0 9-6 14-13 14s-13-5-13-14z"/>'
    + '<path d="M11 13 9 5l8 4M37 13l2-8-8 4"/>'
    + '<circle cx="18.5" cy="20" r="5"/><circle cx="29.5" cy="20" r="5"/>'
    + `<circle cx="18.5" cy="20" r="2" ${F}/><circle cx="29.5" cy="20" r="2" ${F}/>`
    + `<path d="M24 23l-2.2 4.500h4.400z" ${F}/>`
    + '<path d="M18 33l2 2 2-2M26 33l2 2 2-2M22 38l2 2 2-2" stroke-width="1.4"/>',

  // The trident.
  poseidon: '<path d="M24 45V8"/><path d="M11 9v8a13 10 0 0 0 26 0V9"/><path d="M19 33h10"/>'
    + `<path d="M24 2l-3.5 8h7zM11 3l-3.5 8h7zM37 3l-3.5 8h7z" ${F}/>`,

  // The eye of the peacock's feather.
  hera: feather(),

  // The drawn bow under a crescent moon.
  artemis: '<path d="M13 6c22 6 22 30 0 36"/><path d="M13 6v36" stroke-width="1.4"/>'
    + '<path d="M5 24h31"/>'
    + `<path d="M43 24l-8-4.500v9z" ${F}/>`
    + '<path d="M5 24l3-3M5 24l3 3" stroke-width="1.4"/>'
    + `<path d="M38 3a6.5 6.5 0 1 0 6 9 5.5 5.5 0 0 1-6-9z" ${F}/>`,

  // The ear of wheat.
  demeter: wheat(),

  // Hammer and anvil.
  hephaestus: `<path d="M6 27h28c4 0 6-2 8-4v9H31c-2 3-2 6 2 9v4H13v-4c4-3 4-6 2-9H6z" ${F}/>`
    + '<path d="M13 23 27 9" stroke-width="3"/>'
    + `<path d="M22.6 5.500l5-5 9.8 9.8-5 5z" ${F}/>`,
};
