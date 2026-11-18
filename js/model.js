// Turns config/model.json into the lookup tables the rest of the code uses.
// Pure: no DOM, no network. Also imported by the Node tools and tests.

export function buildModel(cfg) {
  const polarities = cfg.polarities.map((p, index) => ({ ...p, index }));
  const gods = {};
  for (const p of polarities) {
    gods[p.first] = { id: p.first, polarity: p.id, side: 'first', opposite: p.second };
    gods[p.second] = { id: p.second, polarity: p.id, side: 'second', opposite: p.first };
  }
  return {
    polarities,
    gods,
    polarityById: Object.fromEntries(polarities.map((p) => [p.id, p])),
    godIds: polarities.flatMap((p) => [p.first, p.second]),
  };
}
