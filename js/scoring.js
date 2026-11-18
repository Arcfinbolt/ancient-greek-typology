// The numbers: statement order, polarity scores, bands, and the type.
// Pure functions only. Every cut-off comes from config/scoring.json.

const EPS = 1e-9;

// --- Statement order -------------------------------------------------------

/** Small seeded generator, so that an order is the same for every visitor. */
export function seededRandom(seed) {
  let a = (seed >>> 0) || 1;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(list, random) {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Order strategies, chosen by `itemOrder` in config/app.json.
 * Add a function here to offer a new one.
 */
export const orderStrategies = {
  fixed: (items) => items.slice(),

  shuffled: (items, model, seed) => shuffle(items, seededRandom(seed)),

  // Round r takes the r-th statement of every polarity, alternating the two
  // gods. With equal numbers per polarity, a page of `polarities.length`
  // statements then holds exactly one from each polarity.
  balanced: (items, model, seed) => {
    const random = seededRandom(seed);
    const queues = model.polarities.map((p, i) => {
      const a = items.filter((it) => it.god === p.first);
      const b = items.filter((it) => it.god === p.second);
      const [lead, other] = i % 2 === 0 ? [a, b] : [b, a];
      const queue = [];
      for (let k = 0; k < Math.max(lead.length, other.length); k++) {
        if (lead[k]) queue.push(lead[k]);
        if (other[k]) queue.push(other[k]);
      }
      return queue;
    });
    const out = [];
    const rounds = Math.max(0, ...queues.map((q) => q.length));
    for (let r = 0; r < rounds; r++) {
      let round = shuffle(queues.map((q) => q[r]).filter(Boolean), random);
      // Avoid the same polarity twice in a row across a round boundary.
      const last = out[out.length - 1];
      if (last && round.length > 1 && model.gods[round[0].god].polarity === model.gods[last.god].polarity) {
        round = [...round.slice(1), round[0]];
      }
      out.push(...round);
    }
    return out;
  },
};

export function orderItems(items, model, { strategy = 'balanced', seed = 1 } = {}) {
  const fn = orderStrategies[strategy] || orderStrategies.fixed;
  return fn(items, model, seed);
}

// --- Scores ----------------------------------------------------------------

/** The strongest band whose `from` the strength reaches. */
export function bandFor(strength, bands) {
  let hit = bands[0];
  for (const band of bands) {
    if (strength + EPS >= band.from) hit = band;
  }
  return hit;
}

/**
 * answers: { itemId: rating }. Returns one entry per polarity.
 * score runs from -1 (all second god) to +1 (all first god); see scoring.json.
 */
export function scoreProfile(answers, { items, model, scoring }) {
  const { min, max } = scoring.scale;
  const range = max - min;
  const sum = {};
  const weight = {};
  let answered = 0;

  for (const item of items) {
    const raw = answers[item.id];
    if (raw === undefined || raw === null) continue;
    answered++;
    const value = item.reverse ? max + min - raw : raw;
    const w = item.weight ?? 1;
    sum[item.god] = (sum[item.god] ?? 0) + value * w;
    weight[item.god] = (weight[item.god] ?? 0) + w;
  }
  const mean = (god) => (weight[god] ? sum[god] / weight[god] : null);

  const polarities = model.polarities.map((p) => {
    const a = mean(p.first);
    const b = mean(p.second);
    const base = { id: p.id, index: p.index, first: p.first, second: p.second };
    if (a === null || b === null) {
      return { ...base, score: null, strength: 0, god: null, band: scoring.bands[0] };
    }
    let score = (a - b) / range;
    const norm = scoring.norms && scoring.norms[p.id];
    if (norm) score = (score - norm.mean) / norm.sd;
    const strength = Math.abs(score);
    const god = score > EPS ? p.first : score < -EPS ? p.second : null;
    return { ...base, score, strength, god, band: bandFor(strength, scoring.bands) };
  });

  return { polarities, answered, total: items.length, complete: answered === items.length };
}

// --- Type ------------------------------------------------------------------

/**
 * Lead, second and neglected god, and the tier:
 *   clear     the lead reaches tiers.poleFrom and beats the next pole by tiers.clearLeadGap
 *   shared    the lead reaches tiers.poleFrom but the next pole is closer than that
 *   pantheios no pole reaches tiers.poleFrom
 */
export function classify(profile, { model, scoring }) {
  const t = scoring.tiers;
  const ranked = profile.polarities
    .filter((p) => p.god)
    .slice()
    .sort((x, y) => y.strength - x.strength || x.index - y.index);

  const top = ranked[0];
  if (!top || top.strength + EPS < t.poleFrom) {
    return { tier: 'pantheios', lead: null, second: null, neglected: null, ranked };
  }
  const next = ranked[1];
  const second = next && next.strength + EPS >= t.secondFrom ? next : null;
  const gap = top.strength - (next ? next.strength : 0);
  const tier = second && gap + EPS < t.clearLeadGap ? 'shared' : 'clear';
  return { tier, lead: top, second, neglected: model.gods[top.god].opposite, ranked };
}

// --- Result links ----------------------------------------------------------

/** Packs the answers into a short code, in the order of config/items.json. */
export function encodeAnswers(answers, itemsConfig, scale) {
  const chars = itemsConfig.items.map((item) => {
    const v = answers[item.id];
    return v === undefined || v === null ? '-' : (v - scale.min).toString(36);
  });
  return `${itemsConfig.version}.${chars.join('')}`;
}

/** Returns answers, or null when the code does not fit this set of statements. */
export function decodeAnswers(code, itemsConfig, scale) {
  if (typeof code !== 'string') return null;
  const dot = code.indexOf('.');
  if (dot < 0) return null;
  const version = code.slice(0, dot);
  const chars = code.slice(dot + 1);
  if (version !== String(itemsConfig.version) || chars.length !== itemsConfig.items.length) return null;
  const answers = {};
  for (let i = 0; i < chars.length; i++) {
    if (chars[i] === '-') continue;
    const v = parseInt(chars[i], 36);
    if (Number.isNaN(v) || v > scale.max - scale.min) return null;
    answers[itemsConfig.items[i].id] = v + scale.min;
  }
  return answers;
}
